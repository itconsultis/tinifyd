"use strict";

const boot = require('./bootstrap');
const P = require('bluebird');

P.config({
  longStackTraces: true,
});

boot().then((app) => {
  app.get('log').info('daemon up');
})

