"use strict";

///////////////////////////////////////////////////////////////////////////

const _ = require('lodash');
const P = require('bluebird');
const path = require('path');
const gulp = require('gulp');
const babel = require('gulp-babel')
const watch = require('gulp-watch');
const concat = require('gulp-concat');
const hangforever = new P((resolve, reject) => null);

///////////////////////////////////////////////////////////////////////////

const PROJECT_ROOT = __dirname;
const PROJECT = path.basename(PROJECT_ROOT);
const SRC = path.join(PROJECT_ROOT, 'src');
const BUILD = path.join(PROJECT_ROOT, 'build');

///////////////////////////////////////////////////////////////////////////

const tasks = {};


tasks.transpile = () => {
  return new P((resolve, reject) => {
    gulp.src(['src/**/*.js'])
      .pipe(babel({presets: ['es2015']}))
      .pipe(concat('bundle.js'))
      .pipe(gulp.dest('build'))
      .on('end', resolve)
  });
};


tasks.watch = () => {
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
      });
    };

    register([SRC + '/**/*.js'], tasks.transpile);
  }

  return this.watching;
};

///////////////////////////////////////////////////////////////////////////

gulp.task('transpile', tasks.transpile);
gulp.task('watch', tasks.watch);
gulp.task('default', ['transpile'], tasks.watch);

