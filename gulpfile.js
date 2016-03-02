"use strict";

///////////////////////////////////////////////////////////////////////////

const _ = require('lodash');
const P = require('bluebird');
const path = require('path');
const gulp = require('gulp');
const babel = require('gulp-babel')
const fswatch = require('gulp-watch');
const concat = require('gulp-concat');
const hangforever = new P((resolve, reject) => null);

///////////////////////////////////////////////////////////////////////////

const PROJECT_ROOT = __dirname;
const PROJECT = path.basename(PROJECT_ROOT);
const SRC = path.join(PROJECT_ROOT, 'src');
const BUILD = path.join(PROJECT_ROOT, 'build');

///////////////////////////////////////////////////////////////////////////

/**
 * Register a filesystem watcher
 * @param {Array} globs
 * @param {Function} task
 * @return void
 */
const watch = (globs, task) => {
  let debounce = null;

  let wrapper = () => {
    try {
      task();
    }
    catch (e) {
      console.log(e);
    }
  };

  fswatch(globs, {usePolling: true}, (vinyl) => {
    clearTimeout(debounce);
    debounce = setTimeout(wrapper, 100);
  });
};

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
    watch([SRC + '/**/*.js'], tasks.transpile);
  }

  return this.watching;
};

///////////////////////////////////////////////////////////////////////////

gulp.task('transpile', tasks.transpile);
gulp.task('watch', tasks.watch);
gulp.task('default', ['transpile'], tasks.watch);

