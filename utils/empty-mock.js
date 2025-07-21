
// Mock vide pour les modules Node.js non supportés sur iOS/Android
const mockFunction = () => {};
const mockObject = {};

// Mock pour différents modules Node.js
const mock = {
  // fs
  readFile: mockFunction,
  writeFile: mockFunction,
  readFileSync: mockFunction,
  writeFileSync: mockFunction,
  existsSync: () => false,
  
  // path
  join: (...args) => args.join('/'),
  resolve: (...args) => args.join('/'),
  dirname: (path) => path,
  basename: (path) => path,
  extname: (path) => '',
  
  // util
  promisify: (fn) => fn,
  inspect: (obj) => JSON.stringify(obj),
  
  // crypto
  createHash: () => ({ update: mockFunction, digest: () => '' }),
  randomBytes: (size) => Buffer.alloc(size, 0),
  
  // os
  platform: () => 'ios',
  type: () => 'Darwin',
  release: () => '1.0.0',
  
  // Propriétés par défaut
  default: mockObject,
  __esModule: true,
};

// Exporter le mock
module.exports = mock;
module.exports.default = mock;
