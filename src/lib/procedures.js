"use strict";

const _ = require('lodash');
const P = require('bluebird');
const fs = require('fs');
const readfile = P.promisify(fs.readFile);
const hash = require('./hash');
const AlreadyOptimized = require('./exception').AlreadyOptimized;
const models = require('./models');
const exec = P.promisify(require('child_process').exec);
const glob = require('glob-all');

///////////////////////////////////////////////////////////////////////////

const Blob = models.Blob;
const BlobPath = models.BlobPath;

///////////////////////////////////////////////////////////////////////////

/**
 * Optimize a single image at the given filesystem path via tinify.
 * @param {String} fspath    filesystem path
 * @return {Promise}
 */
const optimize = exports.optimize = (filepath) => {

  return Blob.objects.blob(filepath)

  .then((blob) => {
    return blob.optimize().then(() => blob);
  })

  .then((blob) => {
    return BlobPath.objects.findByPath(filepath)
  })

  .then((blobpath) => {
    if (!blobpath) {
      let attrs = {blob_id: blob.get('id'), path: filepath};
      return BlobPath.create(attrs).catch((e) => {
        console.log(e);
        return P.resolve();
      })
    }
  })
};


const remove = exports.remove = (filepath) => {

  return BlobPath.objects.findByPath(filepath)

  .then((blobpath) => {
    return blobpath.blob()

    .then((blob) => {
      return blobpath.delete().then(() => blob);
    })
  })

  .then((blob) => {
    return blob.paths().then((blobpaths) => {
      if (blobpaths.length === 0) {
        return blob.delete();
      }
    })
  })

};

/**
 * Search the source filesystem directory for all PNG and JPG images
 *
 */
const search = exports.search = (source, globfn) => {
  let globs = _.flatten(_.map(Blob.objects.allowed(), (exts, type) => {
    return _.map(exts, (ext) => t('%s/**/*.%s', source, ext)); 
  }))

  console.log(globs);

  return (globfunc || glob)(globs, {nocase: true}) ;
};


