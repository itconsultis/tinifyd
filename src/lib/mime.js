"use strict";

const _ = require('lodash');
const P = require('bluebird');
const mmm = require('mmmagic');
const mime = new mmm.Magic(mmm.MAGIC_MIME_TYPE);

////////////////////////////////////////////////////////////////////////////

/**
 * Resolve the MIME type of the given blob
 * @param {Buffer} blob
 * @return {Promise}
 */
const type = exports.type = (blob) => {
  return new P((resolve, reject) => {
    mime.detect(blob, (err, result) => {
      err ? reject(err) : resolve(result);
    })
  });
};

