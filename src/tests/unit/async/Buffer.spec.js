"use strict";

const async = lib.async;

describe('async.Buffer', () => {

  let buffer;

  beforeEach(() => {
    buffer = new async.Buffer({size: 2, timeout: 1000});
  })

  describe('#add()', () => {

    it('adds a task to the buffer', (done) => {
      let state = {task1: false, task2: false, task3: false};

      let taskdone = (key) => {
        state[key] = true;
        _.every(state, (truthy) => truthy) && done();
      };

      let task1 = () => {
        return P.delay(0).then(() => {
          expect(state.task1).not.to.be.ok;
          expect(state.task2).not.to.be.ok;
          expect(state.task3).not.to.be.ok;
          taskdone('task1');
        });
      };

      let task2 = () => {
        return P.delay(100).then(() => {
          expect(state.task1).to.be.ok;
          expect(state.task2).not.to.be.ok;
          expect(state.task3).not.to.be.ok;
          taskdone('task2');
        });
      };

      let task3 = () => {
        return P.delay(200).then(() => {
          expect(state.task1).to.be.ok;
          expect(state.task2).to.be.ok;
          expect(state.task3).not.to.be.ok;
          taskdone('task3');
        });
      };

      _.each([task3, task2, task1], (task) => {
        buffer.add(task);
      });

    });

  });

});

