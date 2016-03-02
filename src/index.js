"use strict";

const boot = require('./bootstrap');

boot().then((app) => {
  let config = app.get('config');

  config.debug && console.log(config);
  console.log('tinifyd is running');
})

