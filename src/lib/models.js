"use strict";

const _ = require('lodash');
const P = require('bluebird');
const hash = require('./hash');
const readfile = P.promisify(require('fs').readFile);
const Component = require('./foundation').Component;
const coerce = require('./lang').coerce;
const tinify = require('tinify');
const mmm = require('mmmagic');
const Magic = mmm.Magic;
const mime = require('./mime');

///////////////////////////////////////////////////////////////////////////

const not_implemented = new Error('not implemented');
const fail = P.reject();

///////////////////////////////////////////////////////////////////////////

/**
 * Manager encapsulates various operations that can be performed on a
 * database table.
 */
const Manager = exports.Manager = class Manager extends Component {

  db () {
    return this.get('db') || Manager.db;
  }

  /**
   * Return model instances that exactly match the supplied parameters
   * @param {Object} params
   * @return {Promise}
   */
  filter (params, options) {
    options = options || {};

    let db = this.db();
    let model = this.get('model').prototype;
    let table = model.table();
    let bindings = _.map(params, (value, col) => t('`%s` = :%s', col, col));
    let conditionals = bindings.join(' AND ');
    let stmt = t('SELECT * FROM `%s` WHERE %s', table, conditionals);

    if (options.limit) {
      stmt += ' LIMIT :limit ';
      bindings.limit = limit;
    }

    console.log('%s <= %s', stmt, bindings);

    return new P((resolve, reject) => {
      return db.execute(stmt, params, (err, rows) => {
        err ? reject(err) : resolve(_.map(rows, (row) => {
          return new model(row);
        }));
      });
    });
  }

  first (params, options) {
    let opts = _.defaults({limit: 1}, options || {});

    return this.filter(params, opts).then((rows) => rows[0] || null);
  }

  /**
   * Return s model instances that exactly match the supplied parameters
   * @param {Object} params
   * @return {Promise}
   */
  find (id) {
    let model = this.get('model').prototype;
    let params = {};

    params[model.pk()] = id;

    return this.first(params);
  }

  create (attrs) {
    let Model = this.get('model');
    let model = new Model(params);

    return model.save();
  }

}

//////////////////
Manager.db = null;
//////////////////

///////////////////////////////////////////////////////////////////////////

const Model = exports.Model = class Model extends Component {

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
    return this.manager().db;
  }

  /**
   * Return a string that identifies the model's database table
   * @param void
   * @return {String}
   */
  table () {
    throw not_implemented;
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
   * Return a list that identifies non-primary-key attributes that appear in
   * the database table
   * @param void
   * @return {Array}
   */
  persistent () {
    return [];
  }

  /**
   * Return true if the model has truthy a primary key value
   * @param void
   * @return {Boolean}
   */
  durable () {
    return Boolean(this.get(this.pk()));
  }

  /**
   * @param void
   * @return {Promise}
   */
  save () {
    return this.durable() ? this.update() : this.insert();
  }

  /**
   * @param void
   * @return {Promise}
   */
  insert () {
    let table = this.table();
    let bindings = {};

    _.each(this.persistent(), (attr) => {
      bindings[attr] = this.get(attr);
    });
  }

  /**
   * @param void
   * @return {Promise}
   */
  update () {
    return fail;
  }

  delete () {
    return fail;
  }

}

///////////////////////////////////////////////////////////////////////////

const Semaphore = exports.Semaphore = class Semaphore extends Model {

  persistent () {
    return [
      'key',
    ];
  }

  defaults () {
    return {
      key: null,
    };
  }

  set key (value) {
    this.attrs.id = hash.digest(value);
    return value;
  }

}

Semaphore.objects = new Manager({model: Semaphore});

///////////////////////////////////////////////////////////////////////////

const BlobManager = exports.BlobManager = class BlobManager extends Manager {

  defaults () {
    return {
      model: Blob,
      mime: mime,
      tinify: tinify,
      allowed: new Set(['image/jpeg', 'image/png']),
    };
  }

  set allowed (value) {
    return coerce.set(value);
  }

  instance (arg) {
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
    let Model = this.get('model');
    let allowed = this.get('allowed');
    let mime = this.get('mime');
    let sum = hash.digest(buffer);

    return mime.type(buffer).then((type) => {
      if (!allowed.has(type)) {
        throw new Error('illegal mime type'); 
      }
    })

    .then(() => {
      return new Model({
        hash: hash.digest(buffer),
        buffer: buffer,
      });
    })
  }

}


const Blob = exports.Blob = class Blob extends Model {

  persistent () {
    return ['hash'];
  }

  defaults () {
    return {
      hash: null,
      buffer: null,
      optimized: false,
      semaphores: Semaphore.objects,
      paths: BlobPath.objects,
    };
  }

  optimize () {
    let tinify = this.manager().get('tinify');
    let buffer = this.get('buffer');
    let lock = () => this.lock;
    let unlock = () => this.unlock;

    return this.optimized()

    .then((optimized) => {
      if (optimized) {
        return buffer;
      }

      return lock().then(() => {
        return new P((resolve, reject) => {
          tinify.fromBuffer(buffer).toBuffer((err, result) => {
            err ? reject(err) : resolve(result);
          });
        })
        .then((optimized_buffer) => {
          return unlock().then(() => optimized_buffer);
        })
      })
    })

    .then((optimized_buffer) => {
      this.set('buffer', buffer);
    })
  }

  optimized () {
    let manager = this.manager();
    let sum = this.get('hash');

    return manager.filter({hash: sum}, {limit: 1}).then((models) => {
      return models.length > 0;
    });
  }

  locked () {
    let semaphores = this.get('semaphores');
  }

  lock () {
    return fail;
  }

  unlock () {
    return fail;
  }

  /**
   * Resolve a Set containing filesystem paths where the blob resides
   * @param void
   * @return {Promise}
   */
  paths () {
    let manager = this.get('paths');

    return manager.filter({blob_id: this.get('hash')})

    .then((paths) => _.map(paths, (path) => path.path));
  }

}


Blob.objects = new BlobManager({model: Blob, tinify: tinify});

///////////////////////////////////////////////////////////////////////////

const BlobPath = exports.BlobPath = class BlobPath extends Model {

  table () {
    return 'blob_path';
  }
}

BlobPath.objects = new Manager({model: BlobPath});


