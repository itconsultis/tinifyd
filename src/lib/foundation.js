import _ from 'lodash';
import P from 'bluebird';
import EventEmitter from 'events';
import is from 'is';


/**
 * Container is component that:
 * - has an asynchronous set() method that binds a value to a key
 * - has a synchronous get() method that retrieves a value by key
 * @constructor
 */
export class Container {

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
    let bindings = this.bindings
    let bind = (value) => {bindings.set(key, value)}
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

