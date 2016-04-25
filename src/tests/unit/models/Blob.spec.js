"use strict";

const models = lib.models;
const Model = models.Model;
const Blob = models.Blob;
const Magic = require('mmmagic').Magic;
const readfile = P.promisify(require('fs').readFile);
const assert = require('assert');
const crypto = require('crypto');

describe('models.Blob', () => {
  let blob;
  let image;
  let hash;
  let db;

  let before = (done) => {
    let buffer = fixture('umadbro.jpg')

    assert(buffer instanceof Buffer);
    hash = crypto.createHash('sha1');
    hash.update(buffer);

    blob = new Blob({buffer: buffer});
    done();
  };

  let after = (done) => {
    lib.models.Manager.db = null;
    done();
  };

  describe('buffer attribute access', () => {
    beforeEach(before);
    afterEach(after);

    it('set(buffer) automatically updates the hash attribute', () => {
      let expected = new Buffer(hash.digest('binary'), 'binary');
      let actual = blob.get('hash');

      expect(actual).to.be.an.instanceof(Buffer);
      expect(Buffer.compare(expected, actual)).to.equal(0);
    })

  });

  describe('#optimize', () => {
    beforeEach(before);
    afterEach(after);

    it('works as expected', (done) => {
      let buffer;
      let tinify = {fromBuffer: sinon.stub(), toBuffer: sinon.stub()};
      let optimized_buffer = blob.get('buffer');

      tinify.fromBuffer.returns(tinify);
      tinify.toBuffer.returns(P.resolve(optimized_buffer));

      blob.optimized = sinon.stub();
      blob.optimized.returns(new P((resolve, reject) => resolve(false)));

      blob.save = sinon.stub();
      blob.save.returns(P.resolve());

      return blob.optimize(tinify)

      .then((result) => {
        expect(result).to.eql(blob);
        expect(tinify.fromBuffer.calledOnce).to.be.ok;
      })

      .then(done);
    })
  });

});

