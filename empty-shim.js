
// Shim pour les modules Node.js non supportés dans React Native
const mockFunction = () => {};
const mockObject = {};

// Mock spécial pour le module path
const pathMock = {
  join: (...args) => args.filter(Boolean).join('/'),
  resolve: (...args) => args.filter(Boolean).join('/'),
  relative: (from, to) => {
    // Éviter l'erreur "to argument must be of type string"
    if (typeof from !== 'string') from = '';
    if (typeof to !== 'string') to = '';
    return to;
  },
  dirname: (p) => typeof p === 'string' ? p.split('/').slice(0, -1).join('/') : '',
  basename: (p) => typeof p === 'string' ? p.split('/').pop() : '',
  extname: (p) => typeof p === 'string' ? '.' + p.split('.').pop() : '',
  sep: '/',
  delimiter: ':',
  posix: {},
  win32: {}
};

// Mock pour crypto
const cryptoMock = {
  createHash: () => ({
    update: mockFunction,
    digest: () => 'mock-hash'
  }),
  randomBytes: (size) => Buffer.alloc(size, 0),
  pbkdf2: mockFunction,
  pbkdf2Sync: () => Buffer.alloc(32, 0)
};

// Mock pour fs
const fsMock = {
  readFileSync: () => '',
  writeFileSync: mockFunction,
  existsSync: () => false,
  mkdirSync: mockFunction,
  readdirSync: () => [],
  statSync: () => ({ isDirectory: () => false, isFile: () => false }),
  promises: {
    readFile: () => Promise.resolve(''),
    writeFile: () => Promise.resolve(),
    mkdir: () => Promise.resolve(),
    readdir: () => Promise.resolve([]),
    stat: () => Promise.resolve({ isDirectory: () => false, isFile: () => false })
  }
};

// Export conditionnel selon le module demandé
const moduleExports = {
  // Path module spécial
  ...pathMock,
  // Fallbacks génériques
  createHash: cryptoMock.createHash,
  randomBytes: cryptoMock.randomBytes,
  readFileSync: fsMock.readFileSync,
  existsSync: fsMock.existsSync,
  default: mockObject,
  __esModule: true
};

// Export pour compatibilité
module.exports = moduleExports;
module.exports.default = moduleExports;

// Export nommés pour path
module.exports.join = pathMock.join;
module.exports.resolve = pathMock.resolve;
module.exports.relative = pathMock.relative;
module.exports.dirname = pathMock.dirname;
module.exports.basename = pathMock.basename;
module.exports.extname = pathMock.extname;
module.exports.sep = pathMock.sep;
module.exports.delimiter = pathMock.delimiter;
