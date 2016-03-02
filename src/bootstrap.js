"use strict";

const _ = require('lodash');
const P = require('bluebird');
const config = require('./config');
const Container = require('./lib/foundation').Container;
const tinify = require('tinify');

module.exports = () => {

  let app = new Container();

  return app.set('config', config)

  .then(() => {
    tinify.key = config.tinify.key;
    return app.set('tinify', tinify);
  })

  .then(() => app);
};
