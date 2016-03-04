"use strict";

const _ = require('lodash');
const P = require('bluebird');
const crypto = require('crypto');

const digest = exports.digest  = (blob, algo, encoding) => {
  let output = crypto.createHash(algo || 'sha1');

  output.update(blob);

  return output.digest(encoding || 'binary');
};
