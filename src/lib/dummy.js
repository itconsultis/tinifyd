"use strict";

const P = require('bluebird');
const tinify = require('tinify');

////////////////////////////////////////////////////////////////////////////

const tinifydummy = exports.tinify = {

  fromBuffer (buffer) {
    return {
      toBuffer: (done) => {
        let math = Math;
        let min = 500;
        let max = 5000;
        let range = max - min;
        let rand = math.random();
        let sleep = P.delay(math.ceil(min + (rand * range)));

        if (rand < 0.01) {
          return sleep.then(() => P.reject(new tinify.Error('random dummy error')));
        }

        return P.delay(sleep).then(() => buffer);
      }
    }
  },

};

