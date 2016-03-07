"use strict";

const _ = require('lodash');
const P = require('bluebird');
const config = require('./config');
const EventEmitter = require('events').EventEmitter;
const Container = require('./lib/foundation').Container;
const tinify = require('tinify');
const mysql = require('mysql2');
const Daemon = require('./lib/daemon').Daemon;
const models = require('./lib/models');
const chokidar = require('chokidar');
const t = require('util').format;
const procedures = require('./lib/procedures');

///////////////////////////////////////////////////////////////////////////

module.exports = () => {

  let container = new Container();

  return container.set('config', config)

  .then(() => {
    console.log('initializing event bus');
    return container.set('eventbus', new EventEmitter());
  })

  .then(() => {
    let watcher = chokidar.watch(Blob.objects.globs(), {
      cwd: config.paths.source,
      persistent: true,
    });

    process.on('SIGTERM', () => watcher.close());

    return container.set('watcher', watcher);
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

      ///////////////////////
      models.Manager.db = db;
      ///////////////////////

      return new P((resolve, reject) => {
        db.connect((err) => {
          process.once('SIGTERM', () => {db.end()});
          err ? reject(err) : resolve(db); 
        });
      });
    });
  })

  .then(() => {
    console.log('initializing daemon');

    return container.set('daemon', () => {
      let daemon = new Daemon({procedures: procedures});
      return daemon.start().then(() => daemon);
    });
  })

  // always resolve the container itself at the very end
  .then(() => container);
};
