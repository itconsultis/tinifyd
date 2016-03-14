"use strict";

const _ = require('lodash');
const P = require('bluebird');
const crypto = require('crypto');

////////////////////////////////////////////////////////////////////////////

/**
 * Compute a binary SHA-1 hash of the supplied buffer
 * @param {mixed} input
 * @param {String} algo
 * @param {String} encoding
 * @return {Buffer}
 */
const digest = exports.digest = (input, algo, encoding) => {
  algo = algo || 'sha1';
  encoding = encoding || 'binary';

  let output = crypto.createHash(algo);

  output.update(input);

  return new Buffer(output.digest(encoding), encoding);
};

