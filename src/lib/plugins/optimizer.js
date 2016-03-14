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

////////////////////////////////////////////////////////////////////////////

const AlreadyOptimized = e.AlreadyOptimized;
const Conflict = e.Conflict;
const UnexpectedValue = e.UnexpectedValue;

////////////////////////////////////////////////////////////////////////////

module.exports = class Optimizer extends Plugin {

  bindings () {
    let watcher = this.app('watcher');
    let self = this;

    if (!this._bindings) {
      this._bindings = [
        {
          subject: watcher,
          event: 'add',
          listener: function(relpath) {
            return self.one(relpath);
          }
        },
        {subject: watcher, event: 'change', listener: (path) => this.one(path)},
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
  all () {
    return Blob.objects.glob(this.source())

    .then((filepaths) => {
      return P.all(filepaths.map((filepath) => {
        return this.one(filepath).then(() => filepath);
      }));
    })
  }

  /**
   * Optimize a single image at the given relative path
   * @async
   * @param {String} relpath
   * @return {Blob}
   */
  one (relpath) {
    let queue = this.get('queue');
    let log = this.app('log');
    let lock;

    return Blob.objects.fromFile(this.source(relpath))

    .then((blob) => {
      return new P((resolve, reject) => {
        queue.defer((done) => {

          log.info('[lock] ' + relpath);

          // acquire a lock on the unoptimized blob
          return Semaphore.objects.create({id: blob.get('hash')})

          .then((semaphore) => {
            lock = semaphore;
            return this.optimize(blob, relpath)
          })

          .then((blob) => {
            return this.recordBlobPath(blob, relpath);
          })

          .then((blob) => {
            log.info('[rels] ' + relpath);
            lock && lock.delete();
            resolve();
            setImmediate(done); 
          })

          .catch((e) => {
            lock && lock.delete();
            log.error(e.message);
            log.debug(e.stack);
            reject(e);
            setImmediate(() => done(e));
          });
        })
      })
    })
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

  optimize (blob, relpath) {
    let tinify = this.app('tinify');
    let filemode = this.get('filemode');
    let dirmode = this.get('dirmode');
    let temp_path = this.deriveTempPath(blob);
    let source_path = this.source(relpath);
    let log = this.app('log');
    let hexsum = blob.get('hash').toString('hex');
    let lock;

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
        log.info('[chgd] ' + relpath);
        return blob;
      });
    })

    .catch(Conflict, (e) => {
      return blob;
    })

    .catch(AlreadyOptimized, (e) => {
      log.info('[skip] ' + relpath);
      return e.blob;
    })

    .catch((e) => {
      lock && lock.delete();
      log.error(e.message);
      log.debug(e.stack);
      throw e;
    })

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
