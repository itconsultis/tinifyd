"use strict";

/**
 * Slugify a string
 * Attribution: https://gist.github.com/mathewbyrne/1280286
 * @param {String} value
 * @return {String}
 */
const slug = exports.slug = (value) => {
  return String(value)
    .trim()                         // strip leading and trailing whitespace
    .toLowerCase()                  // convert to lowercase
    .replace(/\s+/g, '-')           // replace spaces with -
    .replace(/[^\w\-]+/g, '')       // remove all non-word chars
    .replace(/\-\-+/g, '-')         // replace multiple - with single -
    .replace(/^\-+/, '')            // strip leading -
    .replace(/\-$/, '')             // strip trailing -
};
