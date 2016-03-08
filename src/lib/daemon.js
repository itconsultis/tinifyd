"use strict";

const _ = require('lodash');
const P = require('bluebird');
const coerce = require('./lang').coerce;
const Component = require('./foundation').Component;
const d3 = require('d3-queue');

const not_implemented = new Error('not implemented');

////////////////////////////////////////////////////////////////////////////

const Daemon = exports.Daemon = class Daemon extends Component {

  defaults () {
    return {
      app: null,
      source: '/path/to/images',
      temp: '/path/to/writable/directory',
      buffer: d3.queue(64),

      // list of enabled plugin names
      plugins: [],
    };
  }

  constructor (attrs) {
    super(attrs);

    this.plugins = {};

    let plugins_available = require('./plugins');

    _.each(this.get('plugins'), (name) => {
      let Plugin = plugins_available[name];
      this.plugins[name] = new Plugin(this.attrs);
    });
  }

  up () {
    return P.all(_.map(this.plugins, (plugin) => plugin.up()));
  }

  down () {
    return P.all(_.map(this.plugins, (plugin) => plugin.down()));
  }

}

////////////////////////////////////////////////////////////////////////////

const Plugin = exports.Plugin = class Plugin extends Component {

  defaults () {
    return {
      app: null,
      source: '/path/to/images',
      temp: '/path/to/writable/directory',
      buffer: d3.queue(64),
    };
  }

  up () {
    throw not_implemented;
  }

  down () {
    throw not_implemented;
  }

}
