"use strict";

const hash = lib.hash;
const models = lib.models;
const Model = models.Model;
const Blob = models.Blob;
const BlobManager = models.BlobManager;
const Magic = require('mmmagic').Magic;
const crypto = require('crypto');

describe('models.BlobManager', () => {

  let manager;

  beforeEach(() => {
    manager = new BlobManager();
  });

  describe('.instance()', () => {
    it('accepts a Buffer', (done) => {
      let buffer = new Buffer(fixture('umadbro.png'));

      manager.instance(buffer).then((blob) => {
        expect(blob).to.be.an.instanceof(Blob);
        done();
      })
    });

    it('accepts a filepath', (done) => {
      let filepath = fixture('umadbro.png', true);

      manager.instance(filepath).then((blob) => {
        expect(blob).to.be.an.instanceof(Blob);
        done();
      });
    });

  })

  describe('.fromBuffer()', () => {

    it('raises an exception on invalid mime type', (done) => {
      let buffer = new Buffer(fixture('umadbro.txt'));

      manager.fromBuffer(buffer).then((blob) => {
        expect.fail();
      })
      .catch((e) => {
        done();
      })
    });

    it('does not raise an exception on valid mime types', (done) => {
      let valid = ['jpg', 'png'];

      return P.all(_.map(valid, (extension) => {
        let buffer = fixture('umadbro.' + extension);
        return manager.fromBuffer(buffer);
      }))

      .then((blobs) => {
        expect(blobs.length).to.equal(valid.length);

        _.each(blobs, (blob) => {
          expect(blob).to.be.an.instanceof(Blob);
        });

        done();
      })
    });

    it('assigns hash and buffer attributes', (done) => {
      let buffer = fixture('umadbro.png');

      manager.fromBuffer(buffer).then((blob) => {
        expect(blob).to.be.an.instanceof(Blob);
        expect(blob.get('hash')).to.be.ok;
        expect(blob.get('buffer')).to.be.an.instanceof(Buffer);
        done();
      })
    });
  });

  describe('.fromFile()', () => {

    it('raises an exception on invalid mime type', (done) => {
      let filepath = fixture('umadbro.txt', true);

      manager.fromFile(filepath).then((blob) => {
        expect.fail();
      })
      .catch((e) => {
        done();
      })
    });

    it('does not raise an exception on valid mime types', (done) => {
      let valid = ['jpg', 'png'];

      return P.all(_.map(valid, (extension) => {
        let filepath = fixture('umadbro.' + extension, true);
        return manager.fromFile(filepath);
      }))

      .then((blobs) => {
        expect(blobs.length).to.equal(valid.length);
        done();
      })

    });

    it('assigns hash and buffer attributes', (done) => {
      let filepath = fixture('umadbro.png', true);

      manager.fromFile(filepath).then((blob) => {
        expect(blob).to.be.an.instanceof(Blob);
        expect(blob.get('hash')).to.be.ok;
        expect(blob.get('buffer')).to.be.an.instanceof(Buffer);
        done();
      })
    });
  }); 

});
