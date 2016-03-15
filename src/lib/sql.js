"use strict";

const moment = require('moment');

////////////////////////////////////////////////////////////////////////////

const format = exports.format = {};

/**
 * @param {Moment}
 * @return {String}
 */
format.datetime = (input) => {
  return input.format('YYYY-MM-DD HH:mm:ss');
};

