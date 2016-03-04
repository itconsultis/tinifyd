"use strict";

const _ = require('lodash');
const P = require('bluebird');
const fs = require('fs');
const readfile = P.promisify(fs.readFile);
const hash = require('./hash');

exports = (container) => {
  const db = container.get('db');
  const tinify = container.get('tinify');

  /**
   * Optimize a single image at the given filesystem path via tinify.
   * @param {String} path    filesystem path
   * @return {Promise}
   */
  const optimize = procedures.optimize = (path) => {
    readfile(path)

    .then((buffer) => {
      let checksum = hash.digest(buffer);
      let sql = t('SELECT COUNT(1) FROM `blob` WHERE `hash` = "%s"', checksum);

      return new P((resolve, reject) => {
        db.query(sql, (err, rows) => {
          err ? reject(err) : resolve(Boolean(rows[0]));
        });
      });
    })

    .then((exists) => {
      if (!exists) {
        return new P((resolve, reject) {

        })
      }
    })


  };

  return {
    optimize: optimize,
  };



};


