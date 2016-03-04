"use strict";

const _ = require('lodash');
const P = require('bluebird');
const config = require('./config');
const EventEmitter = require('events').EventEmitter;
const Container = require('./lib/foundation').Container;
const tinify = require('tinify');
const mysql = require('mysql');
const Daemon = require('./lib/daemon').Daemon;

module.exports = () => {

  let container = new Container();

  return container.set('config', config)

  .then(() => {
    console.log('initializing event bus');
    return container.set('eventbus', new EventEmitter());
  })

  .then(() => {
    console.log('initializing tinify client');
    tinify.key = config.tinify.key;
    return container.set('tinify', tinify);
  })

  .then(() => {
    console.log('initializing mysql connection');

    return container.set('db', () => {
      let db = mysql.createConnection(config.mysql);

      process.once('SIGTERM', () => {db.end()});

      return new P((resolve, reject) => {
        db.connect((err) => {
          err ? reject(err) : resolve(db); 
        });
      });
    });
  })

  .then(() => {
    console.log('initializing daemon');

    return container.set('daemon', () => {
      return new Daemon({
        container: container,
        plugins: _.map(plugins, (plugin_class) => {
          return new plugin_class(container);
        }),
      });
    });
  })

  // always resolve the container itself at the very end
  .then(() => container);
};
