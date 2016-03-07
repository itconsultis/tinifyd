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
      pipes: _.map(_.range(10), (i) => new async.Buffer({size: 10}),
      procedures: procedures,
    };
  }

  constructor (options) {
    this.options = _.merge(this.defaults(), options || {});
  }

  up () {
    let container = this.get('

    let procedures = this.get('procedures');
    let optimize

    procedures.
  }

  down () {

  }

}
