const _ = require('lodash');
const path = require('path');

///////////////////////////////////////////////////////////////////////////

const APP_ROOT = path.dirname(__filename);
const ENV = process.env;
console.log(ENV);

/**
 * Return the value of an environment variable
 * @param {String} key     the name of the environment variable
 * @return mixed
 */
const get = (key, fallback=undefined) => {
  if (!ENV.hasOwnProperty(key)) {
    if (fallback === undefined) {
      throw new Error('environment variable not found: ' + key);
    }
    return fallback;
  }
  return ENV[key];
};

const DEBUG = Boolean(Number(get('TINIFYD_DEBUG', false)));

///////////////////////////////////////////////////////////////////////////

module.exports = {

  debug: DEBUG,

  log: {
    level: DEBUG ? 'debug' : get('TINIFYD_LOG_LEVEL', 'info'),
  },

  opt: {
    concurrency: Number(get('TINIFYD_CONCURRENCY', 64)),
    lockttl: Number(get('TINIFYD_LOCK_TIMEOUT', 300000)),
    source: '/var/lib/tinifyd/images',
    temp: '/tmp/tinifyd',
  },

  tinify: {
    dummy: Boolean(Number(get('TINIFYD_API_DUMMY', 0))),
    host: get('TINIFYD_API_HOST', 'api.tinify.com'),
    key: get('TINIFYD_API_KEY', '--secure--'),
  },

  mysql: {
    host: get('TINIFYD_DB_HOST', 'localhost'),
    port: get('TINIFYD_DB_PORT', '3306'),
    database: get('TINIFYD_DB_NAME', 'domain'),
    user: get('TINIFYD_DB_USER', 'root'),
    password: get('TINIFYD_DB_PASS', 'root'),
    namedPlaceholders: true,
  },

  plugins: {

    janitor: {
      enabled: true,
      frequency: 60 * 1000,
    },

    optimizer: {
      enabled: true,
      frequency: Number(get('TINIFYD_OPTIMIZER_FREQUENCY', 900000)),
      filemode: '0644',
      dirmode: '0755',
      backups: '/var/lib/tinifyd/originals',
    },

  },

};

