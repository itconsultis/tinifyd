"use strict";

const mime = lib.mime;

describe('mime', () => {

  describe('.type()', () => {

    it('detects the mime type of a JPG image', (done) => {
      let input = fixture('umadbro.jpg');
      let expected = 'image/jpeg';

      mime.type(input).then((actual) => {
        expect(actual).to.equal(expected);
        done();
      })
    });

    it('detects the mime type of a PNG image', (done) => {
      let input = fixture('umadbro.png');
      let expected = 'image/png';

      mime.type(input).then((actual) => {
        expect(actual).to.equal(expected);
        done();
      })
    });

  });
});

