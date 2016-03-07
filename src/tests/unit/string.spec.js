"use strict";

const string = lib.string;

describe('string', () => {

  describe('.slug()', () => {

    it('generates a slug', () => {
      let input = 'goodbye cruel world   !!!';
      let expected = 'goodbye-cruel-world';
      let actual = string.slug(input);

      expect(actual).to.equal(expected);
    });
  });
});

