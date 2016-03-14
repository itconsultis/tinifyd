"use strict";

const _ = require('lodash');
const P = require('bluebird');
const fs = require('fs');
const Plugin = require('../daemon').Plugin;
const models = require('../models');
const Semaphore = models.Semaphore;
const Blob = models.Blob;
const BlobPath = models.BlobPath;
const path = require('path');
const e = require('../exceptions');
const mkdirp = require('mkdirp');
const mv = require('mv');

////////////////////////////////////////////////////////////////////////////

const AlreadyOptimized = e.AlreadyOptimized;
const Conflict = e.Conflict;
const UnexpectedValue = e.UnexpectedValue;

////////////////////////////////////////////////////////////////////////////


/**
 * @param {tinify} tinify
 * @param {models.Blob} blob
 * @param {String} temp_path     the output path of the optimized buffer
 * @param {String} filemode    file perms
 * @return {models.Blob}
 */
const optimize = (tinify, blob, temp_path, source_path, filemode, dirmode) => {
  filemode = filemode || '0644';
  dirmode = dirmode || '0755';

  // optimize the image with tinify
  return blob.optimize(tinify)

  // write the optimized image buffer to the temp path
  .then((blob) => {
    let optimized_buffer = blob.get('buffer');

    return new P((resolve, reject) => {
      fs.writeFile(temp_path, optimized_buffer, {mode: filemode, encoding: 'binary'}, (err) => {
        err ? reject(err) : resolve(blob);
      });
    }); 
  })

  // move the optimized image to the original source path
  .then((blob) => {
    return new P((resolve, reject) => {
      mv(temp_path, source_path, {clobber: true, mkdirp: true}, (err) => {
        err ? reject(err) : resolve(blob);
      })
    });
  })

  .catch(AlreadyOptimized, (e) => e.blob)

  .catch((e) => {
    console.log(e.message);
    console.log(e.stack);
    throw e;
  });
};

/**
 * 
 *
 *
 */
const record_path = (blob, relpath) => {
  let blob_id = blob.get('id');

  if (!blob_id) {
    throw new UnexpectedValue('blob does not have an id');
  }

  return BlobPath.objects.create({blob_id: blob_id, path: relpath})

  .catch(Conflict, (e) => blob)

  .catch((e) => {
    console.log(e.message);
    console.log(e.stack);
    throw e;
  });
};



module.exports = class Optimizer extends Plugin {

  bindings () {
    let watcher = this.app('watcher');
    let self = this;

    if (!this._bindings) {
      this._bindings = [
        {
          subject: watcher,
          event: 'add',
          listener: function(path) {
            return self.one(path);
          }
        },
        {subject: watcher, event: 'change', listener: (path) => this.one(path)},
        {subject: watcher, event: 'delete', listener: () => null},
      ];
    };

    return this._bindings;
  }

  up () {
    return super.up().then(() => {
      _.each(this.bindings(), (b) => {
        b.subject.on(b.event, b.listener);
      })
    })
  }

  down () {
    _.each(this.bindings(), (b) => {
      b.subject.removeListener(b.event, b.listener);
    })

    return super.down();
  }

  all () {
    return Blob.objects.glob(this.source())

    .then((filepaths) => {
      return P.all(filepaths.map((filepath) => {
        return this.one(filepath); 
      }));
    })
  }

  one (relpath) {
    let queue = this.get('queue');
    let log = this.app('log');
    let tinify = this.app('tinify');
    let filemode = this.get('filemode');
    let dirmode = this.get('dirmode');

    // the filesystem watcher emits paths relative to its cwd
    // here we are deriving absolute source and temp paths from relpath
    let abs = {
      source: this.source(relpath),
      temp: this.temp(relpath),
    };

    return Blob.objects.fromFile(abs.source)

    .then((blob) => {
      return new P((resolve, reject) => {
        queue.defer((done) => {

          return optimize(tinify, blob, abs.temp, abs.source, filemode, dirmode)

          .then((blob) => {
            return record_path(blob, relpath);
          })

          .then((blob) => {
            log.info('optimized ' + relpath);
            resolve();
            setImmediate(done); 
          })

          .catch((e) => {
            log.error(e.message);
            log.debug(e.stack);
            reject(e);
            setImmediate(() => done(e));
          });
        })
      })
    })
  }

}
