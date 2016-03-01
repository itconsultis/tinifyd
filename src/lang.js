export default function extend (subclass, superclass, augs) {
  subclass.prototype = Object.create(superclass.prototype);

  for (let p in augs || {}) {
    if (augs.hasOwnProperty(p)) {
      subclass.prototype[p] = augs[p];
    }
  }
};


export default function mapify (obj) {
  if (obj instanceof Map) {
    return obj;
  }

  let map = new Map();
  let key;

  for (key in obj) {
    if (obj.hasOwnProperty(key)) {
      map.set(key, obj[key]);
    }
  }

  return map;
};
