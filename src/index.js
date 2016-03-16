"use strict";

const boot = require('./bootstrap');
const P = require('bluebird');
const config = require('./config');

if (config.debug) {
  P.config({longStackTraces: true});
  console.log(config);
}

boot(config).then((app) => {
  app.get('log').info('daemon ready');
});

