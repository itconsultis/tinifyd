"use strict";

const _ = require('lodash');
const P = require('bluebird');
const Plugin = require('../daemon').Plugin;
const Semaphore = require('../models').Semaphore;

////////////////////////////////////////////////////////////////////////////

const ONE_MINUTE = 60 * 1000;

module.exports = class Janitor extends Plugin {

  up () {
    let iterate = () => this.iterate();
    this.interval = setInterval(iterate, this.get('frequency') || ONE_MINUTE);

    setImmediate(iterate);

    return P.resolve();
  }

  down () {
    clearInterval(this.interval);
    return P.resolve();
  }

  iterate () {
    let config = this.app('config');
    let log = this.app('log');

    return Semaphore.objects.cleanup(config.opt.lockttl)

    .then((result) => {
      log.info('cleaned up %s stale locks', result.affectedRows);
    });
  }

}
