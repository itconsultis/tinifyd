"use strict";

const boot = require('./bootstrap');

boot().then((app) => {
  app.get('log').info('daemon up');
})

