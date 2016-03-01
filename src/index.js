import _ from 'lodash';
import { Promise as P } from 'bluebird';
import { EventEmitter } from 'events';
import { mappify } from './lang';
import is from 'is';

/**
 * Component is an event-emitting, attrsurable object that has a lifecycle.
 * @constructor
 */
export default class Component extends EventEmitter {

  computed: {},

  constructor (attrs) {
    super();
    this.set(attrs);
    this.initialize();
  }

  initialize () {
    // override me
  }

  /**
   * Return default attribute values
   * @param void
   * @return {Object|Map}
   */
  defaults () {
    // override me
    return 
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
    if (!this._attrs) {
      this._attrs = this.defaults(); 
    }

    let args = _.toArray(arguments);

    let set = (attr, value) => {
      let computable = this.computed[attr];
      let mutator = computable ? computable.set : () => value;
      let mutated = mutator(value);

      this._attributes[attr] = mutated;
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
    let value = this._attributes.get(value) || undefined;

    let get = computable ? computable.get : () => {
      return computable.get(value);
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

lang.extend(Component, EventEmitter, {

  /**
   * @param void
   * @return {Object|Map}
   */
  defaults: function() {
    return {};
  },

  /**
   * @param void
   * @return void
   */
  initialize: function(self, attrs) {
    // no-op; override me
  },

});

/**
 * Copies the supplied properties to the component prototype.
 * @param {Object} augments
 * @return void
 */
Component.mixin = function(augments) {
  _.extend(this.prototype, augments || {});
};

/**
 * @param {Object} augments
 * @return {Function}
 */
Component.extend = function(augments) {
  var superclass = this
  ,   subclass = function(attrs) {superclass.call(this, attrs)}

  lang.extend(subclass, superclass, augments);

  subclass.extend = superclass.extend;
  subclass.mixin = superclass.mixin;

  return subclass;
};

/**
 * Container is component that:
 * - has an asynchronous set() method that binds a value to a key
 * - has a synchronous get() method that retrieves a value by key
 * @constructor
 */
var Container = exports.Container = Component.extend({

  /**
   * @param {Container} self
   * @param {Object} config
   */
  initialize: function(self, config) {
    Component.prototype.initialize.apply(this, arguments);
    this.bindings = {};
  },

  /**
   * Register a container binding
   * @param {String} key     the binding key
   * @param {Function}       a function that returns a value or a Promise
   * @return {Promise}                
   */
  set: function(key, resolve_value) {
    var bindings = this.bindings
    ,   bind = function(value) {bindings[key] = value}
    ,   value = resolve_value()

    if (typeof value.then === 'function') {
      value.then(bind);
      return value;
    }

    bind(value);

    return P.resolve();
  },

  /**
   * @param {String} key
   * @return mixed
   */
  get: function(key) {
    var bindings = this.bindings;

    if (!bindings.hasOwnProperty(key)) {
      throw new Error('binding resolution error on key ' + key);
    }

    return bindings[key];
  },

});

