"use strict";

const _ = require('lodash');
const P = require('bluebird');
const Component = require('./foundation').Component;

///////////////////////////////////////////////////////////////////////////

/**
 * Buffer executes asynchronous tasks concurrently.
 *
 */
const Buffer = exports.Buffer = class Buffer extends Component {

  defaults () {
    return {

      // max number of concurrent tasks
      size: 10,

      // max duration a single task can run before eviction from the buffer
      timeout: 10000,
    };
  }

  constructor (...args) {
    super(...args);
    this.tasks = [];
    this.buffer = [];
  }

  /**
   * @param {Function} task   a function that returns a promise
   * @return void
   */
  add (task) {
    let tasks = this.tasks
    let buffer = this.buffer;
    let ttl = this.get('timeout');

    let evict = (wrapper) => {
      let index = buffer.indexOf(wrapper);
      index > -1 && buffer.splice(index, 1);
    };

    let next = (wrapper) => {
      evict(wrapper);
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
    let tasks = this.tasks
    let buffer = this.buffer
    let size = this.get('size');

    while (buffer.length < size) {
      let wrapper = tasks.shift();

      wrapper && buffer.push(wrapper) && wrapper();
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
