"use strict";

const _ = require('lodash');
const P = require('bluebird');
const coerce = require('./lang').coerce;
const async = require('./async');
const procedures = require('./procedures');
const Component = require('./foundation').Component;

const Daemon = exports.Daemon = class Daemon extends Component {

  defaults () {
    return {
      container: null,
      buffers: _.map(_.range(50), (i) => new async.Buffer({size: 5}),
    };
  }

  /**
   * Return a 
   *
   */
  bindings () {
    let container = this.get('container');
    let watcher = container.get('watcher');

    return [
      [watcher, 'add', procedures.optimize],
      [watcher, 'change', procedures.optimize],
      [watcher, 'delete', procedures.remove],
    ];
  }

  up () {
    _.each(this.bindings(), (binding) {
      let [subject, event, listener] = binding;
      subject.on(event, listener);
    });
  }

  down () {
    _.each(this.bindings(), (binding) {
      let [subject, event, listener] = binding;
      subject.removeListener(event, listener);
    });
  }

}
