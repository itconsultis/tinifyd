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
const glob = P.promisify(require('glob-all'));

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
        {
          subject: watcher,
          event: 'change',
          listener: function(relpath) {
            return self.optimizePath(relpath);
          },
        },
        {
          subject: eventbus,
          event: 'locks:cleared',
          listener: function(semaphores) {
            return self.retryPaths(semaphores);
          },
        },
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
    return super.up()

    .then(() => {
      this.bindings().forEach((b) => {
        b.subject.on(b.event, b.listener);
      })

      let iterate = () => this.optimizeAllPaths();
      this.interval = setInterval(iterate, this.get('frequency') || 900000);

      return iterate();
    })
  }

  /**
   * Lifecycle moment
   * @async
   * @param void
   * @return void
   */
  down () {
    clearInterval(this.interval);

    this.bindings().forEach((b) => {
      b.subject.removeListener(b.event, b.listener);
    });

    return super.down();
  }

  /**
   * Optimize all images in the source directory
   * @param void
   * @return void
   */
  optimizeAllPaths () {
    let queue = this.get('queue');
    let relativize = (abspath) => this.normalizeSourcePath(abspath);
    let optimize = (relpath) => this.optimizePath(relpath);
    let globs = Blob.objects.globs(this.source());
    let noop = (done) => done();

    glob(globs).then((abspaths) => {
      abspaths.map(relativize).forEach(optimize);
    });
  }

  /**
   * Optimize the image at the supplied relative path
   * @param {String} relpath
   * @return void
   */
  optimizePath (relpath) {
    let log = this.app('log');

    return Blob.objects.fromFile(this.source(relpath))

    .then(blob => {
      return blob.optimized()
      .then(optimized => {
        if (optimized) {
          log.info('[SKIP] ' + relpath);
          return;
        }

        log.info('[BACKUP] ' + relpath);

        return this.backupOriginal(blob, relpath)

        .then(() => this.optimizeBlob(blob, relpath))
      })
    })

    .catch(InvalidType, (e) => {
      log.warn('[INVALID] ' + relpath);
    })
  }

  optimizeBlob (blob, relpath) {
    let queue = this.get('queue');
    let log = this.app('log');
    let tinify = this.app('tinify');
    let filemode = this.get('filemode');
    let dirmode = this.get('dirmode');
    let temp_path = this.temp(relpath);
    let source_path = this.source(relpath);

    let pathsum = hash.digest(relpath);
    let lock;

    let cleanup = (done) => {
      lock && lock.delete().then(() => {
        log.info('[RELEASE] ' + relpath);
        lock.destroy();
      });

      blob.destroy();
      done && done();
    };

    queue.defer((done) => {

      // acquire a lock on the blob path
      return Semaphore.objects.create({id: pathsum, path: relpath})

      .then((semaphore) => {
        lock = semaphore;
        log.info('[LOCK] ' + lock.get('path'));

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
          console.log(e.message);
          return Blob.objects.first({hash: blob.get('hash')}, {fail: true})
        })

        //.catch((e) => {
        //  log.info('[FAILED] ' + relpath);
        //  log.error(e.message);
        //  log.debug(e.stack);
        //  throw e;
        //})
      })

      .then((blob) => {
        return this.recordBlobPath(blob, relpath);
      })

      .catch(Conflict, (e) => {
        log.warn('[RACE] ' + relpath);
      })

      .catch((e) => {
        log.warn('[FAILED] ' + relpath);
        log.error(e.message);
        log.debug(e.stack);
      })

      .finally(() => {
        cleanup(done);
        return P.resolve();
      })

    }); // queue.defer();
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

  retryPaths (semaphores) {
    return P.all(semaphores.map((semaphore) => {
      return this.optimizePath(semaphore.get('path'));
    }));
  }

  normalizeSourcePath (filepath) {
    let output = filepath.split(this.source()).pop();
    return output.slice(1);
  }

  backupOriginal (blob, relpath) {
    let backup_path = path.join(this.get('backups'), relpath);
    let filemode = this.get('filemode');

    return mkdirp(path.dirname(backup_path))

    .then(() => write(backup_path, blob.get('buffer'), {
      mode: filemode,
      encoding: 'binary',
    }))
  }

}
