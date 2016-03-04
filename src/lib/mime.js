"use strict";

const _ = require('lodash');
const P = require('bluebird');
const mmm = require('mmmagic');
const magic = new mmm.Magic(mmm.MAGIC_MIME_TYPE);

////////////////////////////////////////////////////////////////////////////

/**
 * Resolve the MIME type of the given blob
 * @param {Buffer} blob
 */
const type = exports.type = (blob) => {
  return new P((resolve, reject) => {
    magic.detect(blob, (err, result) => {
      err ? reject(err) : resolve(result);
    })
  });
};

