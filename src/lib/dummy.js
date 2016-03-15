"use strict";

const P = require('bluebird');

////////////////////////////////////////////////////////////////////////////

const tinify = exports.tinify = {

  fromBuffer (buffer) {
    return {
      toBuffer: (done) => {
        let math = Math;
        let min = 500;
        let max = 5000;
        let range = max - min;
        let rand = math.random() * range;
        let sleep = math.ceil(min + rand);

        return P.delay(sleep).then(() => buffer);
      }
    }
  },

};

