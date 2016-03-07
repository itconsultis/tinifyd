const _ = require('lodash');
const path = require('path');
const dotenv = require('dotenv');

///////////////////////////////////////////////////////////////////////////

const PROJECT_ROOT = path.dirname(__filename);
const ENV = process.env;

/**
 * Return the value of an environment variable
 * @param {String} key     the name of the environment variable
 * @return mixed
 */
const get = (key, fallback) => {
  if (!ENV.hasOwnProperty(key)) {
    if (arguments.length < 2) {
      throw new Error('environment variable not found: ' + key);
    }
    return fallback;
  }
  return ENV[key];
};

///////////////////////////////////////////////////////////////////////////

// parse .env file and merge into process.env
dotenv.config({path: ENV.TINIFYD_DOTENV_PATH ||  path.join(PROJECT_ROOT, '.env')});

module.exports = {
  debug: Boolean(get('TINIFYD_DEBUG', false)),

  semaphore: {
    ttl: 60000,
  },

  buffers: {
    count: get('TINIFYD_BUFFER_COUNT', 50),
    size: get('TINIFYD_BUFFER_SIZE', 5), 
    ttl: get('TINIFYD_BUFFER_TASK_TTL', 60000),
  },

  paths: {
    source: get('TINIFYD_SOURCE_PATH'),
    temp: get('TINIFYD_TEMP_PATH', '/tmp/tinifyd'),
  },

  tinify: {
    host: get('TINIFYD_API_HOST', 'api.tinify.com'),
    key: get('TINIFYD_API_KEY', '_secure_'),
  },

  mysql: {
    host: get('TINIFYD_DB_HOST', 'localhost'),
    port: get('TINIFYD_DB_PORT', '3306'),
    database: get('TINIFYD_DB_NAME', 'domain'),
    user: get('TINIFYD_DB_USER', 'root'),
    password: get('TINIFYD_DB_PASS', 'root'),
  },
};

