"use strict";

const _ = require('lodash');
const P = require('bluebird');
const hash = require('./hash');
const readfile = P.promisify(require('fs').readFile);
const Component = require('./foundation').Component;
const coerce = require('./lang').coerce;
const string = require('./string');
const mmm = require('mmmagic');
const Magic = mmm.Magic;
const mime = require('./mime');
const t = require('util').format;
const moment = require('moment');
const sql = require('./sql');
const e = require('./exceptions');
const fs = require('fs');
const is = require('is');

///////////////////////////////////////////////////////////////////////////

const NotImplemented = e.NotImplemented;
const InvalidType = e.InvalidType;
const InvalidState = e.InvalidState;
const AlreadyOptimized = e.AlreadyOptimized;
const Conflict = e.Conflict;
const NotFound = e.NotFound;

///////////////////////////////////////////////////////////////////////////

/**
 * Manager encapsulates various operations that can be performed on a
 * database table.
 */
const Manager = class Manager extends Component {

  /**
   * Return the database connection
   * @param void
   * @return {mysql2.Connection}
   */
  db () {
    return this.get('db') || Manager.db;
  }

  /**
   * Return the model constructor
   * @param void
   * @return {Function}
   */
  model () {
    return this.get('model');
  }

  /**
   * Return the database table corresponding to the model
   * @param void
   * @return {String}
   */
  table () {
    return this.model().prototype.table();
  }

  /**
   * Return model instances that exactly match the supplied parameters
   * @param {Object} params
   * @return {Array}
   */
  filter (params, options) {
    options = options || {};

    let db = this.db();
    let ModelClass = this.model();
    let table = this.table();
    let bindings = _.map(params, (value, col) => t('`%s` = :%s', col, col));
    let conditionals = bindings.join(' AND ');
    let stmt = t('SELECT * FROM `%s` WHERE %s', table, conditionals);

    if (options.limit) {
      stmt = t('%s %s', stmt, 'LIMIT :limit');
      params.limit = options.limit;
    }

    return new P((resolve, reject) => {
      return db.execute(stmt, params, (err, rows) => {
        err ? reject(err) : resolve(rows.map((row) => new ModelClass(row)));
      });
    });
  }

  /**
   * Count the number of persistent models matching the given parameters
   * @async
   * @param {Object} params
   * @param {Object} options
   * @return {Number}
   */
  count (params, options) {
    options = options || {};

    let db = this.db();
    let ModelClass = this.model();
    let table = ModelClass.prototype.table();
    let bindings = _.map(params, (value, col) => t('`%s` = :%s', col, col));
    let conditionals = bindings.join(' AND ');
    let sql = 'SELECT COUNT(1) as `aggregate` FROM `%s` WHERE %s';
    let stmt = t(sql, table, conditionals);

    if (options.limit) {
      stmt = t('%s %s', stmt, 'LIMIT :limit');
      params.limit = options.limit;
    }

    return new P((resolve, reject) => {
      return db.execute(stmt, params, (err, rows) => {
        err ? reject(err) : resolve(rows[0].aggregate);
      });
    });
  }

  /**
   * Return a single model instance that matches the given parameters
   * @param {Object} params
   * @param 
   */
  first (params, options) {
    let opts = _.defaults({limit: 1}, options || {});

    return this.filter(params, opts)
    
    .then((models) => {
      let model = models.shift() || null;

      if (!model && opts.fail) {
        throw new NotFound();
      }

      return model;
    });
  }

  /**
   * Return model instances that matches the given primary key
   * @async
   * @param {Object} params
   * @return {Model}
   */
  find (id, options) {
    let opts = _.defaults(options || {}, {fail: false});
    let model = this.model().prototype;
    let params = {};

    params[model.pk()] = id;

    return this.first(params, opts);
  }

  /**
   * Create a peristent model instance having the given attributes
   * @async
   * @param {Object} attrs
   * @return {Model}
   */
  create (attrs) {
    let ModelClass = this.model();
    let model = new ModelClass(attrs || {});

    return model.insert();
  }

}

//////////////////
Manager.db = null;
//////////////////

exports.Manager = Manager;

///////////////////////////////////////////////////////////////////////////

/**
 * Model is like an active record object.
 * @class Model
 * @extends foundation:Component
 */
const Model = class Model extends Component {

  /**
   * Return the model manager instance
   * @param void
   * @return {Manager}
   */
  manager () {
    return this.constructor.objects;
  }

  /**
   * Return the mysql2.Connection instance
   * @param void
   * @return {mysql2.Connection}
   */
  db () {
    return this.get('db') || this.manager().db();
  }

  /**
   * Return a string that identifies the model's database table. Subclasses
   * *must* override this.
   * @param void
   * @return {String}
   */
  table () {
    throw new NotImplemented();
  }

  /**
   * Return a string that identifies the primary key.
   * @param void
   * @return {String}
   */
  pk () {
    return 'id';
  }

  /**
   * Return a list of attributes that identify columns in the db table
   * @param void
   * @return {Array}
   */
  columns () {
    return [this.pk()];
  }

  /**
   * Return true if the model has truthy a primary key value
   * @param void
   * @return {Boolean}
   */
  persistent () {
    return Boolean(this.get(this.pk()));
  }

  /**
   * Return a list of db column attributes that have changed since the
   * model was instantiated.
   * @async
   * @param void
   * @return {Array}
   */
  dirty () {
    throw new NotImplemented();
  }

  /**
   * Write model attributes to the database 
   * @async
   * @param void
   * @return {Model}
   */
  save () {
    return this.persistent() ? this.update() : this.insert();
  }

  /**
   * Enter a new row in the database table
   * @async
   * @param void
   * @return {Model}
   */
  insert () {
    let db = this.db();
    let table = this.table();
    let columns = this.columns();
    let pk = this.pk();
    let params = {};
    let bindings = []; 

    columns.forEach((col) => {
      params[col] = this.get(col); 
      bindings.push(t('`%s` = :%s', col, col));
    });

    if (!params[pk]) {
      params[pk] = null;
    }

    let stmt = t('INSERT INTO `%s` SET %s', table, bindings.join(', '));

    return new P((resolve, reject) => {
      db.execute(stmt, params, (err, result) => {
        err ? reject(err) : resolve(result);
      });
    })

    .then((result) => {
      result.insertId && this.set(this.pk(), result.insertId);
      return this;
    })

    .catch((e) => {
      if (e.message.match(/^Duplicate/)) {
        return P.reject(new Conflict(e.message));
      }
      throw e;
    });
  }

  /**
   * Save model attributes to the matching row in the database table
   * @async
   * @param void
   * @return {Model}
   */
  update () {
    throw new NotImplemented();
  }

  /**
   * Remove the matching row in the database table
   * @async
   * @param void
   * @return {}
   */
  delete () {
    if (!this.persistent()) {
      throw new InvalidState('model does not have a primary key');
    }

    let db = this.db();
    let table = this.table();
    let pk = this.pk();
    let stmt = t('DELETE FROM `%s` WHERE `%s` = :%s', table, pk, pk);
    let bindings = {};

    bindings[this.pk()] = this.get(this.pk());

    return new P((resolve, reject) => {
      db.execute(stmt, bindings, (err) => {
        err ? reject(err) : resolve();
      });
    });
  }

}

exports.Model = Model;

///////////////////////////////////////////////////////////////////////////

const SemaphoreManager = class SemaphoreManager extends Manager {

  /**
   * @inheritdoc
   */
  defaults () {
    return {
      model: Semaphore,
    };
  }

  /**
   * Delete semaphores older than maxage (milliseconds). Return the deleted
   * models.
   * @async
   * @param {Number}   maxage
   * @param {Date}     now         - for testing
   * @return {Array}
   */
  cleanup (maxage, now) {
    return this.stale(maxage, now)

    .then((models) => {
      if (!models.length) {
        return [];
      }

      let db = this.db();
      let table = this.table();
      let bindings = [];

      let ids = models.map((model) => {
        bindings.push('?');
        return model.get('id');
      });

      let sql = 'DELETE FROM `%s` WHERE `id` in (%s)';
      let stmt = t(sql, table, bindings.join(','));

      return new P((resolve, reject) => {
        db.execute(stmt, ids, (err, result) => {
          err ? reject(err) : resolve(models);
        });
      })
    });
  }

  /**
   * Return expired Semaphore instances
   * @async
   * @param {Number} maxage
   * @param {Date} now
   * @param {Boolean} ids  return ids only
   * @return {Array}
   */
  stale (maxage, now) {
    let db = this.db();
    let ModelClass = this.model();
    let table = this.table();
    let stmt = t('SELECT * FROM `%s` WHERE `created_at` <= ?', table);
    let threshold = moment(now || new Date()).subtract(maxage, 'milliseconds');
    let sqltime = sql.format.datetime(threshold);

    return new P((resolve, reject) => {
      db.execute(stmt, [sqltime], (err, rows) => {
        err ? reject(err) : resolve(rows.map((row) => new ModelClass(row)));
      });
    })
  }

}

const Semaphore = class Semaphore extends Model {

  /**
   * @inheritdoc
   */
  table () {
    return 'semaphore';
  }

  /**
   * @inheritdoc
   */
  defaults () {
    return {
      id: null,
      path: null,
    };
  }

  columns () {
    return ['id', 'path'];
  }

  set id (value) {
    let kosher = value instanceof Buffer;
    return kosher ? value : new Buffer(value, 'binary');  
  }

}

Semaphore.objects = new SemaphoreManager({model: Semaphore});

exports.Semaphore = Semaphore;

///////////////////////////////////////////////////////////////////////////

const BlobManager = exports.BlobManager = class BlobManager extends Manager {

  /**
   * @inheritdoc
   */
  defaults () {
    return {
      model: Blob,
      mime: mime,
      hasher: hash,
      allowed: {
        'image/jpeg': ['jpeg', 'jpg'],
        'image/png': ['png'],
      }
    };
  }

  /**
   * Return an array of JPEG and PNG file glob patterns 
   * @param {String} source   optional source directory
   * @return {Array}
   */
  globs (prefix) {
    return _.flatten(_.map(this.get('allowed'), (exts, type) => {
      return _.map(exts, (ext) => t('%s/**/*.%s', prefix || '.', ext));
    }))
  }

  /**
   * Return a Blob instance representing the given image path or buffer
   * @async
   * @param {String} source   optional source directory
   * @return {Blob}
   */
  blob (arg) {
    if (arg instanceof Buffer) {
      return this.fromBuffer(arg);
    }
    return this.fromFile(arg);
  }

  /**
   * Return a non-persistent Blob instance representing the given image path 
   * @async
   * @param {String} filepath
   * @return {Blob}
   */
  fromFile (filepath) {
    return readfile(filepath).then((buffer) => {
      return this.fromBuffer(buffer);  
    });
  }

  /**
   * Return a non-persistent Blob instance representing the given buffer
   * @async
   * @param {Buffer} buffer
   * @return {Blob}
   */
  fromBuffer (buffer) {
    let ModelClass = this.model();
    let allowed = this.get('allowed');
    let mime = this.get('mime');

    return mime.type(buffer).then((type) => {
      if (!allowed.hasOwnProperty(type)) {
        throw new InvalidType('invalid mime type'); 
      }
    })

    .then(() => {
      return new ModelClass({buffer: buffer});
    })
  }

}

exports.BlobManager = BlobManager;


const Blob = exports.Blob = class Blob extends Model {

  /**
   * @inheritdoc
   */
  columns () {
    return [this.pk(), 'hash'];
  }

  /**
   * @inheritdoc
   */
  defaults () {
    return {
      id: null,
      hash: null,
      buffer: null,
      paths: BlobPath.objects,
    };
  }

  /**
   * @inheritdoc
   */
  table () {
    return 'blob';
  }

  /**
   * Magic setter for the "buffer" attribute. Generate a binary SHA-1 hash digest
   * and assign it to the "hash" attribute.
   * @param {Buffer} value
   * @return {Buffer}
   */
  set buffer (value) {
    let kosher = value instanceof Buffer;

    if (!kosher) {
      throw new InvalidType('expected Buffer instance');
    }

    let hasher = this.manager().get('hasher');

    this.set('hash', hasher.digest(value));

    return value;
  }

  /**
   * Optimize the blob and resolve a Buffer instance that contains the raw
   * optimized image.
   * @async
   * @param {tinify} 
   * @return {Blob}
   */
  optimize (tinify) {
    let manager = this.manager();
    let buffer = this.get('buffer');
    let attrs = this.attrs;

    return tinify.fromBuffer(buffer).toBuffer()

    .then((optimized) => {
      this.set('buffer', optimized);

      return this.save().then(() => this)

      // recover from a race condition
      .catch(Conflict, (e) => {
        return manager.first({hash: this.get('hash')})

        .then((blob) => {
          this.set('id', blob.get('id'));
          return this;
        })

      });
    })
  }

  /**
   * Check whether the blob is already optimized. A blob is considered
   * optimized if its hash exists in the "blob" table. Return the matching
   * blob instance if there is a match on the hash.
   * @async
   * @param void
   * @return {models.Blob}
   */
  optimized () {
    let sum = this.get('hash');

    return this.manager().first({hash: sum}).then((model) => {
      return Boolean(model); 
    });
  }

  /**
   * Return a list of BlobPath objects related to the Blob
   * @async
   * @param {Object} options 
   * @return {Promise}
   */
  paths (options) {
    let opts = _.defaults(options || {}, {strings: false});
    let params = {blob_id: this.get('id')};

    return this.get('paths').filter(params).then((blobpaths) => {
      if (opts.strings) {
        return blobpaths.map((blobpath) => blobpath.get('path'));
      }
      return blobpaths;
    });
  }

}

Blob.objects = new BlobManager({model: Blob});

exports.Blob = Blob;

///////////////////////////////////////////////////////////////////////////

const BlobPath = exports.BlobPath = class BlobPath extends Model {

  /**
   * @inheritdoc
   */
  defaults () {
    return {
      id: null,
      blob_id: null,
      hash: null,
      path: null,
    };
  }

  /**
   * @inheritdoc
   */
  columns () {
    return [this.pk(), 'blob_id', 'hash', 'path'];
  }

  /**
   * @inheritdoc
   */
  table () {
    return 'blob_path';
  }

  /**
   * Magic setter for the "path" attribute. Generate a binary SHA-1 sum of the
   * blob path and assign it to the "hash" attribute. 
   * @param {String} value
   * @return {String}
   */
  set path (value) {
    this.set('hash', hash.digest(value));
    return value;
  }

  /**
   * Read the contents of the BlobPath into a Buffer. You need to supply the
   * prefix argument since we are storing paths relative to the source
   * directory
   * @async
   * @param {String} prefix  path prefix
   * @param {Object} filesystem   optional filesystem 
   * @return {Buffer}
   */
  read (prefix, filesystem) {
    filesystem = filesystem || fs;

    let abspath = path.join(prefix, this.get('path'));

    return new P((resolve, reject) => {
      filesystem.readFile(abspath, 'binary', (err, buffer) => {
        err ? reject(err) : resolve(buffer);
      })
    });
  }

}

BlobPath.objects = new Manager({model: BlobPath});

exports.BlobPath = BlobPath;

///////////////////////////////////////////////////////////////////////////


