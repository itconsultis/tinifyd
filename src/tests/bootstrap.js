"use strict";

const _ = global._ = require('lodash');
const P = global.P = require('bluebird');
const expect = global.expect = require('chai').expect;
const sinon = global.sinon = require('sinon');
const lib = global.lib = require('../lib');

const path = require('path');
const fs = require('fs');

const fixture = global.fixture = (relpath, pathonly) => {
  let filepath = path.normalize(__dirname + '/fixtures/' + relpath);
  return pathonly ? filepath : fs.readFileSync(filepath);
};

