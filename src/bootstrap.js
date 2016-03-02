"use strict";

const _ = require('lodash');
const P = require('bluebird');
const config = require('./config');
const Container = require('./lib/foundation').Container;
const tinify = require('tinify');
const mysql = require('mysql');

module.exports = () => {

  let app = new Container();

  return app.set('config', config)

  .then(() => {
    console.log('initializing tinify client');
    tinify.key = config.tinify.key;
    return app.set('tinify', tinify);
  })

  .then(() => {
    console.log('initializing mysql connection');

    return app.set('db', () => {
      let db = mysql.createConnection(config.mysql);

      return new P((resolve, reject) => {
        db.connect((err) => {
          err ? reject(err) : resolve(db); 
        });
      });
    });
  })

  .then(() => {
    process.once('SIGTERM', () => {
      app.get('db').end();
    })
  })

  .then(() => app);
};
