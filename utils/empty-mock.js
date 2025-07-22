// Mock complet pour les modules Node.js non supportés dans Expo Go
const mockFunction = () => {};
const mockObject = {};
const mockStream = {
  readable: true,
  writable: true,
  on: mockFunction,
  emit: mockFunction,
  write: mockFunction,
  end: mockFunction,
  pipe: mockFunction,
};

const mock = {
  // fs
  readFile: mockFunction,
  writeFile: mockFunction,
  readFileSync: () => '',
  writeFileSync: mockFunction,
  existsSync: () => false,
  statSync: () => ({ isDirectory: () => false, isFile: () => true }),
  mkdirSync: mockFunction,
  readdirSync: () => [],
  
  // path
  join: (...args) => args.filter(Boolean).join('/'),
  resolve: (...args) => args.filter(Boolean).join('/'),
  dirname: (path) => path.split('/').slice(0, -1).join('/') || '/',
  basename: (path, ext) => {
    const name = path.split('/').pop() || '';
    return ext ? name.replace(ext, '') : name;
  },
  extname: (path) => {
    const match = path.match(/\.[^.]*$/);
    return match ? match[0] : '';
  },
  sep: '/',
  delimiter: ':',
  
  // util
  promisify: (fn) => (...args) => Promise.resolve(fn(...args)),
  inspect: (obj) => JSON.stringify(obj, null, 2),
  format: (f, ...args) => f,
  inherits: mockFunction,
  
  // crypto
  createHash: () => ({ 
    update: mockFunction, 
    digest: () => 'mock-hash',
    copy: mockFunction 
  }),
  randomBytes: (size) => Buffer.alloc ? Buffer.alloc(size, 0) : new Array(size).fill(0),
  createCipher: () => mockStream,
  createDecipher: () => mockStream,
  
  // os
  platform: () => 'ios',
  type: () => 'Darwin',
  release: () => '1.0.0',
  arch: () => 'arm64',
  tmpdir: () => '/tmp',
  hostname: () => 'localhost',
  
  // stream
  Readable: class { constructor() { Object.assign(this, mockStream); } },
  Writable: class { constructor() { Object.assign(this, mockStream); } },
  Transform: class { constructor() { Object.assign(this, mockStream); } },
  PassThrough: class { constructor() { Object.assign(this, mockStream); } },
  
  // buffer
  Buffer: typeof Buffer !== 'undefined' ? Buffer : {
    from: (str) => str,
    alloc: (size) => new Array(size).fill(0),
    isBuffer: () => false,
  },
  
  // events
  EventEmitter: class {
    on() { return this; }
    off() { return this; }
    emit() { return true; }
    removeListener() { return this; }
    addListener() { return this; }
  },
  
  // url
  parse: (url) => ({ protocol: 'https:', host: 'localhost', pathname: '/' }),
  format: () => 'https://localhost/',
  resolve: (base, relative) => base + relative,
  
  // querystring
  parse: () => ({}),
  stringify: () => '',
  
  // assert
  ok: mockFunction,
  equal: mockFunction,
  strictEqual: mockFunction,
  deepEqual: mockFunction,
  
  // Propriétés par défaut
  default: mockObject,
  __esModule: true,
};

// Exporter le mock avec toutes les propriétés
Object.keys(mock).forEach(key => {
  module.exports[key] = mock[key];
});

// Compatibilité ESM
module.exports.default = mock;