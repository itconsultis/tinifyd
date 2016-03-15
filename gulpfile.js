"use strict";

///////////////////////////////////////////////////////////////////////////

const _ = require('lodash');
const P = require('bluebird');
const path = require('path');
const gulp = require('gulp');
const fswatch = require('gulp-watch');
const concat = require('gulp-concat');
const subprocess = require('child_process');
const forever = new P((resolve, reject) => null);

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

  fswatch(globs, {usePolling: false}, (vinyl) => {
    clearTimeout(debounce);
    debounce = setTimeout(wrapper, 100);
  });
};

/**
 * Task decorator function that logs task execution time
 * @param {String} name    name of the task
 * @param {Function} fn    the task
 * @return {Function}
 */
const task = (name, fn) => {
  return () => {
    let start = Date.now();

    return fn().then(() => {
      console.log('%s task finished in %sms', name, Date.now() - start);
    })
  };
};

///////////////////////////////////////////////////////////////////////////

const tasks = {};

tasks.test = task('test', () => {
  let src = path.join(__dirname, 'src');
  let subproc = subprocess.spawn('bin/mocha', {stdio: 'inherit', cwd: src});
  let log = (loggable) => console.log(String(loggable));

  return new P((resolve, reject) => {
    subproc.on('error', reject); 
    subproc.on('end', resolve); 
  });
})


tasks.watch = task('watch', (done) => {
  watch([SRC + '/**/*.js'], tasks.test);
  return P.resolve();
});

///////////////////////////////////////////////////////////////////////////

gulp.task('test', tasks.test);
gulp.task('default', tasks.watch);

