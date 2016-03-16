"use strict";

const _ = require('lodash');
const P = require('bluebird');
const path = require('path');
const coerce = require('./lang').coerce;
const Component = require('./foundation').Component;
const d3 = require('d3-queue');
const requiredir = require('require-dir');
const not_implemented = new Error('not implemented');

////////////////////////////////////////////////////////////////////////////

/**
 * Daemon is an application-aware context that manages the lifecycle of
 * a collection of "plugins" (see daemon.Plugin).
 * @extends foundation:Component
 */
const Daemon = exports.Daemon = class Daemon extends Component {

  /**
   * @inheritdoc
   */
  defaults () {
    return {
      app: null,
      source: '/path/to/images',
      temp: '/path/to/writable/directory',
      queue: d3.queue(64),
    };
  }

  /**
   * @inheritdoc
   */
  constructor (attrs) {
    super(attrs);

    let app = this.get('app');
    let config = app.get('config');
    let plugins_available = requiredir('./plugins')

    this.plugins = {};

    _.each(config.plugins, (pconfig, name) => {
      pconfig = _.defaults(pconfig || {}, this.attrs);

      if (pconfig.enabled) {
        let PluginClass = plugins_available[name];
        let plugin = new PluginClass(pconfig);
        this.plugins[name] = plugin;
      }
    });
  }

  /**
   * Lifecycle moment
   * @async
   * @param void
   * @return void
   */
  up () {
    let log = this.get('app').get('log');

    return P.all(_.map(this.plugins, (plugin, name) => {
      return plugin.up().then(() => log.info('%s plugin ready', name));
    }))

    .catch((e) => {
      console.log(e);
      return P.reject(e);  
    })
  }

  /**
   * Lifecycle moment
   * @async
   * @param void
   * @return void
   */
  down () {
    return P.all(_.map(this.plugins, (plugin) => plugin.down()));
  }

}

////////////////////////////////////////////////////////////////////////////

/**
 * @classdesc Plugin is an application-aware context that does something.
 */
const Plugin = exports.Plugin = class Plugin extends Component {

  /**
   * @inheritdoc
   */
  defaults () {
    return {
      app: null,
      source: '/path/to/images',
      temp: '/path/to/writable/directory',
      queue: d3.queue(64),
    };
  }

  /**
   * Return a container binding if called with one argument. Return
   * the container itself if called with no arguments.
   * @param {String} binding - optional container binding
   * @return {mixed}
   */
  app (binding) {
    let app = this.get('app');
    return binding ? app.get(binding) : app;
  }

  /**
   * Lifecycle moment
   * @async
   * @param void
   * @return void
   */
  up () {
    return P.resolve();
  }

  /**
   * Lifecycle moment
   * @async
   * @param void
   * @return void
   */
  down () {
    return P.resolve();
  }

  /**
   * Derive a fully qualified 
   * @param {String} relpath
   * @return {String}
   */
  source (relpath) {
    let prefix = this.get('source');
    return relpath ? path.normalize(path.join(prefix, relpath)) : prefix;
  }

  /**
   * @param {String} relpath
   * @return {String}
   */
  temp (relpath) {
    let prefix = this.get('temp');
    return relpath ? path.normalize(path.join(prefix, relpath)) : prefix;
  }

}
