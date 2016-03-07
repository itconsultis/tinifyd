"use strict";

const _ = require('lodash');
const P = require('bluebird');
const crypto = require('crypto');

////////////////////////////////////////////////////////////////////////////

/**
 * Compute a binary SHA-1 hash of the supplied buffer
 *
 */
const digest = exports.digest  = (buffer, algo, encoding) => {
  let output = crypto.createHash(algo || 'sha1');

  output.update(buffer);

  return output.digest(encoding || 'binary');
};

