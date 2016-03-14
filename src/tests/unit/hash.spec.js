"use strict";

const hash = lib.hash;
const crypto = require('crypto');

const create_hash = (input, encoding) => {
  encoding = encoding || 'binary';

  let h = crypto.createHash('sha1');
  h.update(input);

  return new Buffer(h.digest(encoding), encoding);
};

describe('hash', () => {

  describe('.digest()', () => {

    it('generates a SHA-1 binary digest of a String at arity 1', () => {
      let input = 'hello world';
      let expected = create_hash(input);
      let actual = hash.digest(input);

      expect(actual).to.be.an.instanceof(Buffer);
      expect(Buffer.compare(expected, actual)).to.equal(0);
    });

    it('generates a SHA-1 binary digest of a Buffer at arity 1', () => {
      let input = new Buffer('hello world');
      let expected = create_hash(input);
      let actual = hash.digest(input);

      expect(actual).to.be.an.instanceof(Buffer);
      expect(Buffer.compare(expected, actual)).to.equal(0);
    });

  });

});

