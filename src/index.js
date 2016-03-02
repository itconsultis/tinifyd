"use strict";

const boot = require('./bootstrap');

boot().then((container) => {
  let config = container.get('config');

  config.debug && console.log(config);
  console.log('tinifyd is running');
})

