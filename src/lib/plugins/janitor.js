"use strict";

const _ = require('lodash');
const P = require('bluebird');
const Plugin = require('../daemon').Plugin;
const Semaphore = require('../models').Semaphore;

console.log(require('../daemon'));

////////////////////////////////////////////////////////////////////////////

const EVERY_HOUR = 3600 * 1000;

module.exports = class Janitor extends Plugin {

  up () {
    this._iterate = () => this.iterate();
    this.interval = setInterval(this._iterate, 3600 * 1000);

    setImmediate(this._iterate);

    return P.resolve();
  }

  down () {
    clearInterval(this.interval);
    this._iterate = null;
    return P.resolve();
  }

  iterate () {
    let app = this.get('app');
    let config = app.get('config');
    let log = app.get('log');

    log.info('cleaning up stale locks');

    return Semaphore.objects.cleanup(config.lock_ttl);
  }

}
