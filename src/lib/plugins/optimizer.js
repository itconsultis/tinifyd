"use strict";

const _ = require('lodash');
const P = require('bluebird');
const Plugin = require('../daemon').Plugin;
const models = require('../models');
const Semaphore = models.Semaphore;
const Blob = models.Blob;
const path = require('path');
const e = require('../exceptions');

////////////////////////////////////////////////////////////////////////////

const AlreadyOptimized = e.AlreadyOptimized;
const Conflict = e.Conflict;

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

    // the filesystem watcher emits paths relative to its cwd
    // here we are deriving absolute source and temp paths from relpath
    let abs = {
      source: this.source(relpath),
      temp: this.temp(relpath),
    };

    log.info('optimizing: ' + abs.source);

    return Blob.objects.fromFile(abs.source)

    .then((blob) => {
      return new P((resolve, reject) => {
        queue.defer((done) => {
          return blob.optimize(tinify).then((optimized_buffer) => {
            fs.writeFile(abs.temp, {mode: filemode}, optimized_buffer, (err) => {
              err ? reject(err) : resolve(optimized_buffer);
            }); 
          })
          .catch(AlreadyOptimized, Conflict, (e) => {
            log.info('%s is already optimized', relpath);
            return blob;
          })
          .catch((e) => {
            log.error(e.message);
            log.error(e.stack);
            return P.reject(e);
          })
        })
      })
    })

    .then((blob) => {
      return BlobPath.objects.create({
        blob_id: blob.get('id'),
        path: relpath,
      })

      .catch(Conflict, (e) => {
        log.debug('BlobPath already exists: %s', relpath);
      })

      .catch((e) => {
        log.error(e.message);
        log.error(e.stack);
        return P.reject(e);
      })

    })

    .then(() => blob);
  }

}
