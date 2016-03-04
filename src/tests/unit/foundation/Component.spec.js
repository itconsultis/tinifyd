"use strict";

const Component = lib.foundation.Component;
const EventEmitter = require('events').EventEmitter;

describe('foundation.Component', () => {

  const TestComponent = class TestComponent extends Component {
    defaults () {
      return {
        abc: 123,
        blah: 'world',
      };
    }

    set blah (value) {
      return 'hello ' + value;
    }

    get blah () {
      let raw = this.attrs.blah;

      return 'goodbye cruel ' + raw.split(/\s+/).pop();
    }

    get baz () {
      return baz;
    }
  }

  let component;

  beforeEach(() => {
    component = new TestComponent(); 
  })

  afterEach((done) => {
    component.destroy().then(done);
  })

  describe('attribute access', () => {

    describe('#attributes()', () => {
      it ('returns all attributes', () => {
        let attrs = component.attributes();

        expect(attrs).to.be.an('object');
        expect(attrs.abc).to.equal(TestComponent.prototype.defaults().abc);
      })
    })

    describe('#set()', () => {

      it('single attribute assignment', () => {
        component.set('foo', 1);
        expect(component.attrs.foo).to.equal(1);
        expect(component.get('foo')).to.equal(1);
      })

      it('batch attribute assignment', () => {
        component.set({foo: 1, bar: 2});
        expect(component.get('foo')).to.equal(1);
        expect(component.get('bar')).to.equal(2);
      })

      it('emits "changed" event on attribute change', (done) => {
        let listener = () => done();

        component.on('changed', listener);
        component.set('foo', 1);
      })

      it('emits "changed:attribute" event on attribute change', (done) => {
        component.on('changed:foo', (value) => {
          expect(value).to.equal(123);
          done();
        });

        component.set('foo', 123);
      })

      it('filters a value through matching property setter', () => {
        component.set('blah', 'world');
        expect(component.attributes().blah).to.equal('hello world');
      })

    });

    describe('#get()', () => {

      it('filters a value through matching property getter', () => {
        expect(component.get('blah')).to.equal('goodbye cruel world');
      });
    })


  });

  describe('events', () => {

    it('is an EventEmitter', () => {
      expect(component instanceof EventEmitter).to.be.ok;
    });

    describe('#off()', () => {
      let fail = () => {
        throw new Error('listener is still registered');
      };

      it('removes a single listener at arity 2', () => {
        component.on('event', fail);
        component.off('event', fail);
        component.emit('event');
      });

      it('removes all listeners matching an event at arity 1', () => {
        component.on('event', fail);
        component.on('event', fail);
        component.off('event');
        component.emit('event');
      });

      it('removes all listeners at arity 0', () => {
        component.on('event', fail);
        component.on('event', fail);
        component.on('another-event', fail);

        component.off();

        component.emit('event');
        component.emit('another-event');

      });

    });

  });
});
