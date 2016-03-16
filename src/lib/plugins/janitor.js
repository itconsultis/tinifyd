"use strict";

const _ = require('lodash');
const P = require('bluebird');
const Plugin = require('../daemon').Plugin;
const Semaphore = require('../models').Semaphore;

////////////////////////////////////////////////////////////////////////////

const ONE_MINUTE = 60 * 1000;

module.exports = class Janitor extends Plugin {
  
  /**
   * Lifecycle moment
   * @async
   * @param void
   * @return void
   */
  up () {
    let iterate = () => this.iterate();
    this.interval = setInterval(iterate, this.get('frequency') || ONE_MINUTE);

    setImmediate(iterate);

    return P.resolve();
  }

  /**
   * Lifecycle moment
   * @async
   * @param void
   * @return void
   */
  down () {
    clearInterval(this.interval);
    return P.resolve();
  }

  /**
   * Delete expired Semaphore models, then raise the "cleanup:locks" event
   * on the global event bus.
   * @async
   * @param void
   * @return void
   */
  iterate () {
    let config = this.app('config');
    let log = this.app('log');
    let eventbus = this.app('eventbus');

    return Semaphore.objects.cleanup(config.opt.lockttl)

    .then((ids) => {
      if (ids.length) {
        log.info('cleaned up %s stale locks', ids.length);
        eventbus.emit('locks:cleared', ids);
      }
    });
  }

}
