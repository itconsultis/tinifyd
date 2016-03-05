"use strict";

const _ = require('lodash');
const P = require('bluebird');
const fs = require('fs');
const readfile = P.promisify(fs.readFile);
const hash = require('./hash');
const AlreadyOptimized = require('./exception').AlreadyOptimized;

exports = (container) => {
  const db = container.get('db');
  const tinify = container.get('tinify');


  const query = (sql, params) => {
    return new P((resolve, reject) => {
      return db.execute(sql, params || {}, (err, rows) => {
        err ? reject(err) : resolve(rows);
      });
    });
  };


  const path_is_optimized = (filepath) => {
    let sql = 'SELECT COUNT(1) FROM `blob_path` where `hash` = :hash';
    let sum = hash.digest(filepath);

    return query(sql, {hash: sum}).then((rows) => {
      return rows.length > 0;
    });
  };


  const blob_is_optimized = (blob) => {
    let sql = 'SELECT COUNT(1) FROM `blob` where `hash` = :hash';
    let sum = hash.digest(blob);

    return query(sql, {hash: sum}).then((rows) => {
      return rows.length > 0;
    });
  };


  /**
   * Optimize a single image at the given filesystem path via tinify.
   * @param {String} fspath    filesystem path
   * @return {Promise}
   */
  const optimize = procedures.optimize = (filepath) => {
    return path_is_optimized(filepath)

    .then((path_optimized) => {
      if (path_optimized) {
        throw new AlreadyOptimized(filepath);
      }

      return blob_is_optimized(blob)

      return [filepath, readfile(filepath)];
    })

    .then((args) => {
      let [filepath, blob] = args;

      return blob_is_optimized(blob).then(

      return blob_is_optimized(blob)
      if (blob) {
        let blob_hash = hash.digest(blob);
      }
      return blob ? 
    })


    readfile(path)

    // check if a blob
    .then(

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


