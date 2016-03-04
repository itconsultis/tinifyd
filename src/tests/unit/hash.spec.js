"use strict";

const hash = lib.hash;
const crypto = require('crypto');

describe('hash', () => {

  describe('.digest()', () => {

    it('generates a SHA-1 binary digest at arity 1', () => {
      let input = 'hello world';
      let h = crypto.createHash('sha1');

      h.update(input);

      let expected = h.digest('binary');
      let actual = hash.digest('hello world');

      expect(actual).to.equal(expected);
    });

    it('generates a different kind of binary digest at arity 2', () => {
      let input = 'hello world';
      let h = crypto.createHash('md5');

      h.update(input);

      let expected = h.digest('binary');
      let actual = hash.digest('hello world', 'md5');

      expect(actual).to.equal(expected);
    });
  });
});

