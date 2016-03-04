"use strict";

const Buffer = exports.Buffer = class Buffer {

  defaults () {
    return {
      size: 10,
      task_timeout: 10000,
    };
  }

  constructor (options) {
    this.tasks = [];
    this.buffer = [];
    this.options = _.merge(this.defaults(), options || {});
  }

  /**
   * @param {Function} task   a function that returns a promise
   * @return void
   */
  add (task) {
    let opt = this.options
    let tasks = this.tasks
    let ttl = opt.task_timeout;
    let buffer = this.buffer;

    let next = (wrapper) => {
      let index = buffer.indexOf(wrapper);

      index > -1 && buffer.splice(index, 1);
      this.next();
    };

    let wrapper = function() {
      let expired = false;
      let expire = () => {expired=true; next(wrapper);};
      let timeout = setTimeout(expire, ttl);

      task().then(() => {
        clearTimeout(timeout);
        !expired && next(wrapper);
      });
    };

    tasks.push(wrapper);
    this.next();
  }

  /**
   * @param void
   * @return void
   */
  next () {
    let opt = this.options
    let tasks = this.tasks
    let buffer = this.buffer

    while (buffer.length < opt.size) {
      let wrapper = tasks.shift();

      if (!wrapper) {
          break;
      }

      buffer.push(wrapper);
      wrapper();
    }
  }

  /**
   * @param void
   * @return {Number}
   */
  size () {
    return this.tasks.length;
  }

}
