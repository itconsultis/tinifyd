"use strict";

const coerce = lib.lang.coerce;

describe('lang.coerce', () => {

  describe('.object()', () => {

    it('coerces a falsy value', () => {
      let inputs = [0, false, null, undefined];

      let test = (value) => {
        let output = coerce.object(value);
        expect(output).to.be.ok;
        expect(output).to.be.an('object');
      };

      _.each(inputs, test); 
    });

    it('coerces an array', () => {
      let output = coerce.object(['foo', 'bar']);
      expect(output).to.be.ok;
      expect(output).to.be.an('object');
      expect(output['0']).to.equal('foo');
      expect(output['1']).to.equal('bar');
    });

    it('coerces a Map', () => {
      let output = coerce.object(new Map([['foo', 1], ['bar', 2]]));
      expect(output).to.be.ok;
      expect(output).to.be.an('object');
      expect(output.foo).to.equal(1);
      expect(output.bar).to.equal(2);
    });

    it('coerces a Set', () => {
      let output = coerce.object(new Set(['foo', 'bar']));
      expect(output).to.be.ok;
      expect(output).to.be.an('object');
      expect(output['0']).to.equal('foo');
      expect(output['1']).to.equal('bar');
    });

  });

});
