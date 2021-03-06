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

    return Semaphore.objects.cleanup(config.opt.lockttl)

    .then((semaphores) => {
      let n = semaphores.length;

      if (n > 0) {

        log.info('deleted %s stale locks', n);

        semaphores.forEach((semaphore) => {
          log.info('[RELEASE] ' + semaphore.get('path'));
        });

        this.app('eventbus').emit('locks:cleared', semaphores);
      }
    });
  }

}
