"use strict";

const _ = require('lodash');
const P = require('bluebird');
const EventEmitter = require('events');
const is = require('is');
const coerce = require('./lang').coerce;

/**
 * Component is an object that contains attributes and emits events.
 * @class
 */
const Component = exports.Component = class Component extends EventEmitter {

  /**
   * Return default attributes
   */
  defaults () {
    return {};
  }

  /**
   * @param {Object} attrs   attr
   */
  constructor (attrs) {
    super();
    this.attrs = this.defaults();
    this.set(attrs);
  }

  /**
   * Assign a value to a single attribute, or batch-assign multiple attribute
   * values. Raise these events when any attribute changes:
   *
   *   changed
   *   changed:$attr    where "$attr" is the attribute name 
   *
   * @param {String} attr
   * @return mixed
   */
  set (attr, value) {
    let args = arguments;

    if (args.length === 0) {
      throw new Error('expected at least one argument');
    }

    if (args.length === 1) {
      let attrs = args[0] ? coerce.object(args[0]) : {};

      return _.each(attrs, (value, attr) => {
        this.set(attr, value);
      });
    }

    let current = this.attrs[attr];
    let next = this.mutate(attr, 'set', value);
    let different = current !== next;

    let emit = () => {
      this.emit('changed:' + attr, next);
      this.emit('changed');
    };

    this.attrs[attr] = next;

    different && setImmediate(emit);
  }

  /**
   * Get the value of an attribute
   * @param {String} attr
   * @return mixed
   */
  get (attr) {
    return this.mutate(attr, 'get', this.attrs[attr]);
  }

  /**
   * Return a reference to all attributes
   * @param void
   * @return {Object}
   */
  attributes () {
    return this.attrs;
  }

  /**
   * Filter an attribute value through its getter or setter
   * @param {String} attr
   * @param {String} type    "get" or "set"
   * @param mixed    value
   * @return mixed
   */
  mutate (attr, type, value) {
    return this.mutator(attr, type).call(this, value);
  }

  /**
   * Resolve an attribute getter or setter
   * @param {String} attr
   * @param {String} type    "get" or "set"
   * @return {Function}
   */
  mutator (attr, type) {
    let desc = Object.getOwnPropertyDescriptor(this.constructor.prototype, attr);
    return desc && desc[type] ? desc[type] : (value) => value;
  }

  /**
   * Remove one or more event listeners
   * @param {String}   event
   * @param {Function} listener
   * @return void
   */
  off (event, listener) {
    let args = arguments;
    let arity = args.length;

    if (arity === 0) {
      this.removeAllListeners();
    }
    else if (arity === 1) {
      _.each(this.listeners(event), (listener) => {
        this.removeListener(event, listener); 
      })
    }
    else if (arity >= 2) {
      this.removeListener(event, listener);
    }
  }

  /**
   * Lifecycle moment
   * @param void
   * @return {Promise}
   */
  destroy () {
    this.emit('destroying');

    return new P((resolve) => {
      setImmediate(() => {
        this.off();
        resolve();
      })
    });
  }

}


/**
 * Container is component that:
 * - has an asynchronous set() method that binds a value to a key
 * - has a synchronous get() method that retrieves a value by key
 * @constructor
 */
const Container = exports.Container = class Container {

  constructor () {
    this.bindings = new Map();
  }

  /**
   * Register a container binding
   * @param {String} key           the binding key
   * @param {Function} resolver    a function that resolves a value
   * @return {Promise}                
   */
  set (key, resolver) {
    let bindings = this.bindings;
    let bind = (value) => {bindings.set(key, value)};

    if (typeof resolver !== 'function') {
      bind(resolver);
      return P.resolve();
    }

    let value = resolver();

    if (typeof value.then === 'function') {
      value.then(bind);
      return value;
    }

    bind(value);

    return P.resolve();
  }

  /**
   * @param {String} key
   * @return mixed
   */
  get (key) {
    let bindings = this.bindings;

    if (!bindings.has(key)) {
      throw new Error('binding resolution error on key ' + key);
    }

    return bindings.get(key);
  }

}

