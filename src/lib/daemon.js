"use strict";

const _ = require('lodash');
const P = require('bluebird');
const coerce = require('./lang').coerce;
const Component = require('./foundation').Component;
const d3 = require('d3-queue');
const requiredir = require('require-dir');
const not_implemented = new Error('not implemented');

////////////////////////////////////////////////////////////////////////////

/**
 * Daemon is an application-aware context that manages the lifecycle of
 * a collection of "plugins" (see daemon.Plugin).
 */
const Daemon = exports.Daemon = class Daemon extends Component {

  defaults () {
    return {
      app: null,
      source: '/path/to/images',
      temp: '/path/to/writable/directory',
      buffer: d3.queue(64),
    };
  }

  constructor (attrs) {
    super(attrs);

    let app = this.get('app');
    let config = app.get('config');
    let plugins_available = requiredir('./plugins')

    this.plugins = {};

    _.each(config.plugins, (plugin_config, name) => {
      plugin_config = _.defaults(plugin_config[name] || {}, this.attrs);

      if (plugin_config.enabled) {
        let PluginClass = plugins_available[name];
        let plugin = new PluginClass(plugin_config);
        this.plugins[name] = plugin;
      }
    });
  }

  /**
   * Lifecycle moment
   * @param void
   * @return {Promise}
   */
  up () {
    return P.all(_.map(this.plugins, (plugin) => plugin.up()));
  }

  /**
   * Lifecycle moment
   * @param void
   * @return {Promise}
   */
  down () {
    return P.all(_.map(this.plugins, (plugin) => plugin.down()));
  }

}

////////////////////////////////////////////////////////////////////////////

/**
 * Plugin is an application-aware context that does something.
 */
const Plugin = exports.Plugin = class Plugin extends Component {

  defaults () {
    return {
      app: null,
      source: '/path/to/images',
      temp: '/path/to/writable/directory',
      buffer: d3.queue(64),
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
   * @param void
   * @return {Promise}
   */
  up () {
    return P.resolve();
  }

  /**
   * Lifecycle moment
   * @param void
   * @return {Promise}
   */
  down () {
    return P.resolve();
  }

  /**
   * @param {String} relpath
   * @return {String}
   */
  source (relpath) {
    let prefix = this.get('source');
    return relpath ? path.join(prefix, relpath) : prefix;
  }

  /**
   * @param {String} relpath
   * @return {String}
   */
  temp (relpath) {
    let prefix = this.get('temp');
    return relpath ? path.join(prefix, relpath) : prefix;
  }

}
