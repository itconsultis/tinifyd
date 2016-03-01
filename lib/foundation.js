import _ from 'lodash';
import Promise as P from 'bluebird';
import EventEmitter from 'events';
import is from 'is';

/**
 * Component is an event-emitting, attrsurable object that has a lifecycle.
 * @constructor
 */
export default class Component extends EventEmitter {

  constructor (attrs) {
    super();
    this.set(attrs);
  }

  /**
   * Return default attribute values
   * @param void
   * @return {Object|Map}
   */
  defaults () {
    // override me
    return {};
  }

  /**
   * Remove event
   * @param void
   * @return {Promise}
   */
  destroy () {
    this.emit('destroying');
    return P.resolve();  
  }

  /**
   * @param {Object} attrs
   * @return void
   */
  set: function(attrs) {
    let args = _.toArray(arguments);

    if (!this._attrs) {
      this._attrs = this.defaults(); 
    }

    let set = (attr, value) => {
      let computable = this.computed[attr];
      let mutator = computable ? computable.set : () => value;
      let mutated = mutator(value);

      this._attrs[attr] = mutated;
    };

    if (args.length > 1) {
      let [attr, value, ...n] = args;
      set(attr, value);
    }
    else {
      _.each(attrs, (value, attr) => {
        set(attr, value);
      })
    }
  }

  /**
   * @param {String} key
   * @param mixed fallback
   * @return mixed
   */
  get: function(attr, fallback) {
    let attrs = this._attrs;
    let computable = this.computed[attr];

    let mutator = computable ? computable.get : () => {
      return 
    };

    if (!attrs.hasOwnProperty(attr)) {
      if (arguments.length < 2) {
        throw new Error('attr not found: ' + attr);
      }
      return fallback; 
    }
    return attrs[attr];
  },

};

/**
 * Copies the supplied properties to the component prototype.
 * @param {Object} augments
 * @return void
 */
Component.mixin = (augments) => {
  _.merge(this.prototype, augments || {});
};

/**
 * Container is component that:
 * - has an asynchronous set() method that binds a value to a key
 * - has a synchronous get() method that retrieves a value by key
 * @constructor
 */
export class Container extends Component {

  constructor () {
    super();
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

