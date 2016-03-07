"use strict";

////////////////////////////////////////////////////////////////////////////

const tinify = exports.tinify = {

  fromBuffer (buffer) {
    return {
      toBuffer: (done) => {
        setImmediate(() => done(false, buffer));
      }
    }
  },

};

