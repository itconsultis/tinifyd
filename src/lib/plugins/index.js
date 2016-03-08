"use strict";

const _ = require('lodash');
const plugins = module.exports = {};

_.each(['janitor'], (name) => {
  plugins[name] = require('./' + name);
});

