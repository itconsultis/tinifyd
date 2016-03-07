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

  constructor (attrs) {
    super(attrs);
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
    let evicted = false;
    let wrapper, evict, next;
    let timeout = setTimeout(() => next(), ttl);

    evict = (wrapper) => {
      if (!evicted) {
        let index = buffer.indexOf(wrapper);
        index > -1 && buffer.splice(index, 1);
        evicted = true;
      }
    };

    next = () => {
      clearTimeout(timeout);
      evict(wrapper);
      this.drain();
    };

    wrapper = () => {
      if (typeof task === 'function') {
        return task().then(() => next());
      }
      return task.then(() => next());
    };

    tasks.push(wrapper);

    this.drain();
  }

  /**
   * @param void
   * @return void
   */
  drain() {
    let tasks = this.tasks
    let buffer = this.buffer
    let size = this.get('size');

    while (buffer.length <= size) {
      let wrapper = tasks.shift();

      if (!wrapper) {
        break;
      }

      buffer.push(wrapper) && wrapper();
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


const Coordinator = exports.Coordinator = class Coordinator extends Component {

  defaults () {
    return {
      buffers: [],
    }
  }

  /**
   * Add a task to a buffer
   * @param {mixed} task    Promise or a Function that returns one
   * @return void
   */
  add (task) {
    this.smallest().add(task);
  }

  /**
   * Return the smallest buffer
   * @param void
   * @return {async.Buffer}
   */
  smallest () {
    let buffers = this.get('buffers');
    let length = buffers.length;
    let smallest = null;

    for (let i = 0; i < length; i++) {
      let buffer = buffers[i];

      if (!smallest || buffer.size() < smallest.size()) {
        smallest = buffer;
      }
    }

    return smallest;
  }

}

