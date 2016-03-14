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

///////////////////////////////////////////////////////////////////////////

const NotImplemented = e.NotImplemented;
const AlreadyOptimized = e.AlreadyOptimized;
const Conflict = e.Conflict;
const NotFound = e.NotFound;

///////////////////////////////////////////////////////////////////////////

/**
 * Manager encapsulates various operations that can be performed on a
 * database table.
 */
const Manager = class Manager extends Component {

  db () {
    return this.get('db') || Manager.db;
  }

  model () {
    return this.get('model');
  }

  table () {
    return this.model().prototype.table();
  }

  /**
   * Return model instances that exactly match the supplied parameters
   * @param {Object} params
   * @return {Promise}
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

  count (params, options) {
    options = options || {};

    let db = this.db();
    let ModelClass = this.model();
    let table = ModelClass.prototype.table();
    let bindings = _.map(params, (value, col) => t('`%s` = :%s', col, col));
    let conditionals = bindings.join(' AND ');
    let stmt = t('SELECT COUNT(1) as `aggregate` FROM `%s` WHERE %s', table, conditionals);

    if (options.limit) {
      stmt = t('%s %s', stmt, 'LIMIT :limit');
      params.limit = options.limit;
    }

    return new P((resolve, reject) => {
      return db.execute(stmt, params, (err, rows) => {
        if (err) {
          return reject(err);
        }
        resolve(rows[0].aggregate);
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

    return this.filter(params, opts).then((models) => {
      let model = models.shift() || null;

      if (!model && opts.fail) {
        throw new NotFound();
      }

      return model;
    });
  }

  /**
   * Return s model instances that exactly match the supplied parameters
   * @param {Object} params
   * @return {Promise}
   */
  find (id, options) {
    let opts = _.defaults({limit: 1}, options || {});

    let model = this.model().prototype;
    let params = {};

    params[model.pk()] = id;

    return this.first(params, opts);
  }

  create (attrs) {
    let ModelClass = this.model();
    let model = new ModelClass(attrs || {});

    return model.insert()

    .then((model) => {
      ModelClass === Blob && console.log(model.attributes());
      return model;
    })
  }

}

//////////////////
Manager.db = null;
//////////////////

exports.Manager = Manager;

///////////////////////////////////////////////////////////////////////////

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
   * @param void
   * @return {mysql2.Connection}
   */
  db () {
    return this.manager().db();
  }

  /**
   * Return a string that identifies the model's database table
   * @param void
   * @return {String}
   */
  table () {
    throw new NotImplemented();
  }

  /**
   * Return a string that identifies the primary key
   * @param void
   * @return {String}
   */
  pk () {
    return 'id';
  }

  /**
   * Return a list that identifies attributes that have a matching
   * column in the database table
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
   * @param void
   * @return {Array}
   */
  dirty () {
    throw new NotImplemented();
  }

  /**
   * @param void
   * @return {Promise}
   */
  save () {
    return this.persistent() ? this.update() : this.insert();
  }

  /**
   * @param void
   * @return {Promise}
   */
  insert () {
    let db = this.db();
    let table = this.table();
    let columns = this.columns();
    let pk = this.pk();
    let params = {};
    let bindings = []; 

    columns.forEach((col) => {
      if (col !== pk) {
        params[col] = this.get(col); 
        bindings.push(t('`%s` = :%s', col, col));
      }
    });

    let stmt = t('INSERT INTO `%s` SET %s', table, bindings.join(', '));

    return new P((resolve, reject) => {
      db.execute(stmt, params, (err, result) => {
        err ? reject(err) : resolve(result);
      });
    })

    .then((result) => {
      console.log(result);
      this.set(this.pk(), result.insertId);
      return this;
    })

    .catch((e) => {
      if (e.message.match(/duplicate/i)) {
        throw new Conflict();
      }
    });
  }

  /**
   * @param void
   * @return {Promise}
   */
  update () {
    throw new NotImplemented();
  }

  /**
   * @param void
   * @return {Promise}
   */
  delete () {
    let db = this.manager().db();
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

  defaults () {
    return {
      model: Semaphore,
    };
  }

  /**
   * Remove semaphores older than maxage (milliseconds)
   * @param {Number}   maxage
   * @param {Date}     now         - for testing
   * @return {Promise}
   */
  cleanup (maxage, now) {
    let db = this.db();
    let model = this.get('model').prototype;
    let table = model.table();
    let stmt = t('DELETE FROM `%s` WHERE `created_at` >= ?', table);
    let threshold = moment(now || new Date()).subtract(maxage, 'milliseconds');
    let sqltime = sql.format.datetime(threshold);

    return new P((resolve, reject) => {
      db.execute(stmt, [sqltime], (err, result) => {
        err ? reject(err) : resolve(result);
      });
    })
  }
}

const Semaphore = class Semaphore extends Model {

  table () {
    return 'semaphore';
  }

  defaults () {
    return {
      id: null,
    };
  }

  set key (value) {
    this.attrs.id = hash.digest(value);
    return string.slug(value);
  }

}

Semaphore.objects = new SemaphoreManager({model: Semaphore});

exports.Semaphore = Semaphore;

///////////////////////////////////////////////////////////////////////////

const BlobManager = exports.BlobManager = class BlobManager extends Manager {

  defaults () {
    return {
      model: Blob,
      mime: mime,
      allowed: {
        'image/jpeg': ['jpeg', 'jpg'],
        'image/png': ['png'],
      }
    };
  }

  globs (source) {
    return _.flatten(_.map(this.get('allowed'), (exts, type) => {
      return _.map(exts, (ext) => t('%s/**/*.%s', source || '.', ext));
    }))
  }

  blob (arg) {
    if (arg instanceof Buffer) {
      return this.fromBuffer(arg);
    }
    return this.fromFile(arg);
  }

  fromFile (filepath) {
    return readfile(filepath).then((buffer) => {
      return this.fromBuffer(buffer);  
    });
  }

  fromBuffer (buffer) {
    let ModelClass = this.model();
    let allowed = this.get('allowed');
    let mime = this.get('mime');
    let sum = hash.digest(buffer);

    return mime.type(buffer).then((type) => {
      if (!allowed.hasOwnProperty(type)) {
        throw new Error('illegal mime type'); 
      }
    })

    .then(() => {
      return new ModelClass({
        hash: hash.digest(buffer),
        buffer: buffer,
      });
    })
  }

}

exports.BlobManager = BlobManager;


const Blob = exports.Blob = class Blob extends Model {

  columns () {
    return [this.pk(), 'hash'];
  }

  defaults () {
    return {
      id: null,
      hash: null,
      buffer: null,
      semaphores: Semaphore.objects,
      paths: BlobPath.objects,
    };
  }

  table () {
    return 'blob';
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

    return this.optimized()

    .then((optimized) => {
      if (optimized) {
        let e = new AlreadyOptimized();
        e.blob = optimized;
console.log(optimized.attributes());
        throw e;
      }
    })

    .then(() => this.lock())

    .then(() => {
      return new P((resolve, reject) => {
        tinify.fromBuffer(buffer).toBuffer((err, optimized_buffer) => {
          err ? reject(err) : resolve(optimized_buffer);
        });
      })
    })

    .then((optimized_buffer) => {
      return this.unlock().then(() => optimized_buffer)
    })

    .then((optimized_buffer) => {
      this.set('buffer', buffer);
      this.set('hash', hash.digest(buffer));

      return this.save().then(() => {
        return this;
      });
    })
  }

  optimized () {
    let sum = this.get('hash');

    return this.manager().first({hash: sum}).then((model) => {
      return model; 
    });
  }

  /**
   * Resolve a Boolean that indicates whether or not the blob is locked
   * @param void
   * @return {Promise}
   */
  locked () {
    return P.resolve(Boolean(this._lock));
  }

  /**
   * Insert a row into the semaphore table. A rejection error means the blob
   * is already locked.
   * @param void
   * @return {Promise}
   */
  lock () {
    let sum = this.get('hash');

    return this.get('semaphores').create({id: sum})

    .then((semaphore) => {
      this._lock = semaphore; 
    })

    .catch((e) => {
      if (e.message.match(/Duplicate/)) {
        throw new Conflict('lock conflict on blob ' + sum);
      }
      throw e;
    })
  }

  unlock () {
    return this._lock ? this._lock.delete() : P.resolve();
  }

  /**
   * Resolve a list of filesystem paths where the blob resides
   * @param void
   * @return {Promise}
   */
  paths (options) {
    let opts = _.defaults(options || {}, {strings: true});

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

  defaults () {
    return {
      id: null,
      blob_id: null,
      hash: null,
      path: null,
    };
  }

  columns () {
    return [this.pk(), 'blob_id', 'hash', 'path'];
  }

  table () {
    return 'blob_path';
  }

  set path (value) {
    this.set('hash', hash.digest(value));
    return value;
  }

}

BlobPath.objects = new Manager({model: BlobPath});

exports.BlobPath = BlobPath;

///////////////////////////////////////////////////////////////////////////


