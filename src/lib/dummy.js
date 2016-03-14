"use strict";

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
        let duration = math.ceil(min + rand);

        setTimeout(() => done(false, buffer), duration);
      }
    }
  },

};

