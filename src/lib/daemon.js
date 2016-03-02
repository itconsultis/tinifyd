"use strict";

const _ = require('lodash');
const P = require('bluebird');
const coerce = require('./lang').coerce;

const Daemon = exports.Daemon = class Daemon {

  constructor (options) {
    this.options = _.merge(this.defaults(), options || {});
    this.plugins = coerce.set(this.options.plugins);
  }

  defaults () {
    return {
      plugins: new Set(),
    };
  }

  register (plugin) {
    this.plugins.add(plugin);
  }

  unregister (plugin) {
    this.plugins.delete(plugin);
  }

  up () {
    let plugins = this.plugins;
    let up = (plugin) => {return plugin.up()};

    return plugins.size ? P.all(_.map(plugins, up)) : P.resolve();
  }

  down () {
    let plugins = this.plugins;
    let down = (plugin) => {return plugin.down()};

    return plugins.size ? P.all(_.map(plugins, down)) : P.resolve();
  }

}
