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
const dummy = require('./lib/dummy');
const procedures = require('./lib/procedures');
const d3 = require('d3-queue');
const winston = require('winston');

///////////////////////////////////////////////////////////////////////////

module.exports = () => {

  let app = new Container();

  return app.set('config', config)

  /////////////////////////////////////////////////////////////////////////

  .then(() => {
    return app.set('log', new (winston.Logger)({
      transports: [
        new (winston.transports.Console)(),
      ]
    }));
  })

  /////////////////////////////////////////////////////////////////////////

  .then(() => {
    app.get('log').info('initializing eventbus');
    return app.set('eventbus', new EventEmitter());
  })

  /////////////////////////////////////////////////////////////////////////

  .then(() => {
    app.get('log').info('initializing watcher');

    let watcher = chokidar.watch(models.Blob.objects.globs(), {
      cwd: config.paths.source,
      persistent: true,
    });

    process.on('SIGTERM', () => watcher.close());

    return app.set('watcher', watcher);
  })

  /////////////////////////////////////////////////////////////////////////

  .then(() => {
    app.get('log').info('initializing db');

    return app.set('db', () => {
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

  /////////////////////////////////////////////////////////////////////////

  .then(() => {
    app.get('log').info('initializing tinify');

    let tinify = dummy.tinify;
    tinify.key = config.tinify.key;

    console.log(tinify);
    return app.set('tinify', tinify);
  })

  /////////////////////////////////////////////////////////////////////////

  .then(() => {
    app.get('log').info('starting tinifyd');

    return app.set('daemon', () => {

      let daemon = new Daemon({
        app: app,
        source: config.paths.source,
        temp: config.paths.temp,
        buffer: d3.queue(config.concurrency),
        plugins: config.plugins.split(',').map((name) => name.trim()),
      });

      return daemon.up().then(() => daemon);
    });
  })

  /////////////////////////////////////////////////////////////////////////

  // always resolve the app itself at the very end
  .then(() => app);
};
