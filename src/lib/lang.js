const _ = require('lodash');
const is = require('is');

const coerce = exports.coerce = {};

/**
 * @param {Object|Array|Map|Set} input
 * @return {Set}
 */
coerce.set = (input) => {
  if (input instanceof Set) {
    return input;
  }

  let set = new Set();
  let add = (value) => {set.add(value)};

  if (is.array(input) || is.object(input)) {
    _.each(input, add);
  }
  else if (input instanceof Map) {
    _.each(input.values(), add);
  }
  else {
    throw new Error('unexpected input type');
  }

  return set;
};

