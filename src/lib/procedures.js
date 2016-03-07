"use strict";

const _ = require('lodash');
const P = require('bluebird');
const fs = require('fs');
const readfile = P.promisify(fs.readFile);
const hash = require('./hash');
const AlreadyOptimized = require('./exception').AlreadyOptimized;
const models = require('./models');

///////////////////////////////////////////////////////////////////////////

const Blob = models.Blob;
const BlobPath = models.BlobPath;

///////////////////////////////////////////////////////////////////////////

exports = (container) => {

  /**
   * Optimize a single image at the given filesystem path via tinify.
   * @param {String} fspath    filesystem path
   * @return {Promise}
   */
  const optimize = (filepath) => {

    return Blob.instance(filepath)

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


  const remove = (filepath) => {

    return BlobPath.objects.findByPath(filepath)

    .then((blobpath) => {
      return blobpath.delete()

      .then(() => {
        return blobpath.blob()
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


  const batch_optimize = () => {

  };


  return {
    optimize: optimize,
  };



};


