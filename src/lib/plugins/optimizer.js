"use strict";

const _ = require('lodash');
const P = require('bluebird');
const Plugin = require('../daemon').Plugin;
const models = require('../models');
const Semaphore = models.Semaphore;
const Blob = models.Blob;
const path = require('path');

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
      return filepaths.reduce((promise, filepath) => {
        return promise.then(() => this.one(filepath))
      }, P.resolve());
    })
  }

  one (relpath) {
    let queue = this.app('queue');
    let log = this.app('log');
    let tinify = this.app('tinify');
    let config = this.app('config')

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
            fs.writeFile(abs.temp, optimized_buffer, (err) => {
              log.info('optimized ' + relpath); 
              done(err);
            });
          })
          .catch(done);
        })
      })
    })

    .then(() => {
      log.debug('[ok] ' + filepath);
    })

    .catch((e) => {
      log.error(e.message);
      log.error(e.stack);
    })

  }

}
