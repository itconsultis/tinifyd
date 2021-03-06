"use strict";

const _ = require('lodash');
const is = require('is');
const notcoercable = new Error('got non-coercable input type');
const coerce = exports.coerce = {};


/**
 * Convert the input value to an Object
 * @param {Object|Map|Set|Array} input
 * @return {Object}
 */
coerce.object = (input) => {
  if (is.object(input)) {
    return input;
  }

  let output = {};

  if (!input) {
    return output;
  }

  if (input instanceof Map) {
    input.forEach((value, key) => {
      output[key] = value;
    });
    return output;
  }

  if (is.array(input)) {
    return _.assign(output, input);
  }

  if (input instanceof Set) {
    let i = 0;

    for (let value of input.values()) {
      output[i++] = value; 
    }
    return output;
  }

  throw notcoercable;
};

/**
 * Convert the supplied input to a Set
 * @param {Object|Array|Map|Set} input
 * @return {Set}
 */
coerce.set = (input) => {
  if (input instanceof Set) {
    return input;
  }

  let output = new Set();
  let add = (value) => {output.add(value)};

  if (is.array(input) || is.object(input)) {
    _.each(input, add);
  }
  else if (input instanceof Map) {
    _.each(input.values(), add);
  }
  else {
    throw notcoercable;
  }

  return output;
};


coerce.array = (input) => {
  if (is.array(input)) {
    return input;
  }

  let output = [];

  if (input instanceof Set) {
    output = input.entries(); 
  }
  else if (is.object(input)) {
    _.each(input, (value, key) => {
      output.push([key, value]);
    })
  }

};

