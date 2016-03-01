"use strict";

///////////////////////////////////////////////////////////////////////////

const _ = require('lodash');
const P = require('bluebird');
const path = require('path');
const gulp = require('gulp');
const babel = require('babel-core')
const watch = require('gulp-watch');
const concat = require('gulp-concat');
const hangforever = new P((resolve, reject) => {});

///////////////////////////////////////////////////////////////////////////

const PROJECT_ROOT = __dirname;
const PROJECT = path.basename(PROJECT_ROOT);
const SRC = path.join(PROJECT_ROOT, 'src');
const DIST = path.join(PROJECT_ROOT, 'dist');
const BUILD = path.join(PROJECT_ROOT, 'build');

///////////////////////////////////////////////////////////////////////////

const tasks = {};

tasks.babelify = () => {

  return new P((resolve, reject) => {
    gulp.src('src/**/*.js')
      .pipe(babel({presets: ['es2015']}))
      .pipe(concat('build.js'))
      .pipe(sourcemaps.write('.'))
      .pipe(gulp.dest('dist'))
      .on('end', resolve)
  });
};

tasks.watch = () => {
  console.log(watch);
  console.log('executing watch');

  if (!this.watching) {
    this.watching = hangforever;

    /**
     * Register a filesystem watcher
     * @param {Array} globs
     * @param {Function} task
     */
    let register = (globs, task) => {
      let debounce = null;

      watch(globs, (vinyl) => {
        clearTimeout(debounce);
        debounce = setTimeout(task, 100);
        console.log(debounce);
      });
    };

    register([SRC + '/**/*.js'], tasks.babelify);
  }

  return this.watching;
};

///////////////////////////////////////////////////////////////////////////

gulp.task('babelify', tasks.babelify);
gulp.task('default', ['babelify'], tasks.watch);

