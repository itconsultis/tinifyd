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
const mkdirp = P.promisify(require('mkdirp'));
const mv = P.promisify(require('mv'));
const write = P.promisify(fs.writeFile);
const hash = require('../hash');
const tinify = require('tinify');

////////////////////////////////////////////////////////////////////////////

const AlreadyOptimized = e.AlreadyOptimized;
const InvalidType = e.InvalidType;
const Conflict = e.Conflict;
const UnexpectedValue = e.UnexpectedValue;

////////////////////////////////////////////////////////////////////////////

module.exports = class Optimizer extends Plugin {

  bindings () {
    let watcher = this.app('watcher');
    let eventbus = this.app('eventbus');
    let self = this;

    if (!this._bindings) {
      this._bindings = [
        {
          subject: watcher,
          event: 'add',
          listener: function(relpath) {
            return self.optimizePath(relpath);
          }
        },
        {subject: watcher, event: 'change', listener: (path) => this.optimizePath(path)},
        {subject: watcher, event: 'delete', listener: () => null},
      ];
    };

    return this._bindings;
  }

  /**
   * Lifecycle moment
   * @async
   * @param void
   * @return void
   */
  up () {
    return super.up().then(() => {
      _.each(this.bindings(), (b) => {
        b.subject.on(b.event, b.listener);
      })
    })
  }

  /**
   * Lifecycle moment
   * @async
   * @param void
   * @return void
   */
  down () {
    _.each(this.bindings(), (b) => {
      b.subject.removeListener(b.event, b.listener);
    })

    return super.down();
  }

  /**
   * Optimize all images in the source directory. Return a list of file paths
   * that were optimized;
   * @async
   * @param void
   * @return {Array}
   */
  optimizeSourceDirectory () {
    return Blob.objects.glob(this.source())

    .then((filepaths) => {
      return P.all(filepaths.map((filepath) => {
        return this.optimizePath(filepath).then(() => filepath);
      }));
    })
  }

  optimizePath (relpath) {
    let queue = this.get('queue');
    let log = this.app('log');

    return Blob.objects.fromFile(this.source(relpath))

    .then((blob) => {
      return this.optimizeBlob(blob, relpath)
    })

    .catch(InvalidType, (e) => {
      log.warn('[INVALID] ' + relpath);
    })
  }

  optimizeBlob (blob, relpath) {
    let queue = this.get('queue');
    let log = this.app('log');

    return new P((resolve, reject) => {
      queue.defer((done) => {
        let tinify = this.app('tinify');
        let filemode = this.get('filemode');
        let dirmode = this.get('dirmode');
        let temp_path = this.deriveTempPath(blob);
        let source_path = this.source(relpath);
        let log = this.app('log');
        let pathsum = hash.digest(relpath);
        let lock;

        // acquire a lock on the blob path
        return Semaphore.objects.create({id: pathsum})

        .then((semaphore) => {
          log.info('[LOCK] ' + relpath);
          lock = semaphore;

          // scaffold out the target temp directory
          return mkdirp(path.dirname(temp_path))

          // optimize the image with tinify
          .then(() => {
            return blob.optimize(tinify)
          })

          // write the optimized image buffer to the temp path
          .then((blob) => {
            return write(temp_path, blob.get('buffer'), {mode: filemode, encoding: 'binary'})
            .then(() => blob);
          })

          // move the optimized image from the temp path to the original source path
          .then((blob) => {
            return mv(temp_path, source_path, {clobber: true, mkdirp: true})
            .then(() => {
              log.info('[CHANGED] ' + relpath);
              return blob;
            });
          })

          .catch(Conflict, (e) => {
            return Blob.objects.first({hash: blob.get('hash')}, {fail: true})
          })

          .catch(AlreadyOptimized, (e) => {
            log.info('[SKIP] ' + relpath);
            return e.blob;
          })

          .catch((e) => {
            log.info('[FAIL] ' + relpath);
            log.error(e.message);
            log.debug(e.stack);
          })
        })

        .then((blob) => {
          return this.recordBlobPath(blob, relpath);
        })

        .then((blob) => {
          lock && lock.delete().then(() => {
            log.info('[RELEASE] ' + relpath);
          })

          done(); 
          setImmediate(resolve);
        })

        .catch(Conflict, (e) => {
          log.warn('[RACE] ' + relpath);
          done();
        })

        .catch((e) => {
          log.warn('[FAIL] ' + relpath);
          lock && lock.delete();
          log.error(e.message);
          log.debug(e.stack);
          reject(e);
          setImmediate(() => done(e));
        });

      }); // queue.defer();
    }) // new P()
  }

  /**
   * Return a fully qualified temp path for a blob based on the blob's hash
   * @param {String} tempdir
   * @param {models.Blob} blob
   * @return {String}
   */
  deriveTempPath (blob) {
    let temp_dir = this.temp('blobs');
    let hexsum = blob.get('hash').toString('hex');
    let subdir = hexsum.slice(0, 2);
    let filepath = path.join(temp_dir, subdir, hexsum);

    return filepath;
  }

  /**
   * 
   *
   *
   */
  recordBlobPath (blob, relpath) {
    let blob_id = blob.get('id');
    let log = this.app('log');

    if (!blob_id) {
      throw new UnexpectedValue('blob does not have an id');
    }

    return BlobPath.objects.create({blob_id: blob_id, path: relpath})
    .catch(Conflict, (e) => blob);
  }
}
