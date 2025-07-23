
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Configuration pour les assets et resolver
config.resolver.platforms = ['ios', 'android', 'native', 'web'];
config.resolver.assetExts.push('db', 'json');

// Configuration spéciale pour EAS Build - alias pour les modules problématiques
config.resolver.alias = {
  // Shims pour les modules Node.js
  'fs': require.resolve('./empty-shim.js'),
  'path': require.resolve('./empty-shim.js'),
  'crypto': require.resolve('./empty-shim.js'),
  'util': require.resolve('./empty-shim.js'),
  'os': require.resolve('./empty-shim.js'),
  'stream': require.resolve('./empty-shim.js'),
  'buffer': require.resolve('./empty-shim.js'),
  'assert': require.resolve('./empty-shim.js'),
  'url': require.resolve('./empty-shim.js'),
  'querystring': require.resolve('./empty-shim.js'),
  'events': require.resolve('./empty-shim.js'),
  
  // Fix spécifique pour le module XML problématique
  '@expo/config-plugins/build/utils/XML': require.resolve('./utils/XML-fallback.js'),
  '@expo/config-plugins/build/utils/XML.js': require.resolve('./utils/XML-fallback.js'),
};

// Bloquer les modules problématiques de manière plus précise
config.resolver.blockList = [
  // Bloquer les anciens chemins XML
  /node_modules\/@expo\/config-plugins\/.*\/XML\.js$/,
  /node_modules\/@expo\/config-plugins\/.*\/utils\/XML$/,
  /node_modules\/@expo\/config-plugins\/build\/utils\/XML\.js$/,
  
  // Éviter les conflits avec d'autres modules
  /node_modules\/.*\/node_modules\/@expo\/config-plugins\/build\/utils\/.*\.js$/,
];

// Configuration pour résoudre les chemins relatifs
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

// Configuration pour éviter les erreurs de résolution de chemin
config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: false,
    inlineRequires: true,
  },
});

// Configuration pour Hermes
config.transformer.minifierConfig = {
  keep_classnames: true,
  keep_fnames: true,
  mangle: {
    keep_classnames: true,
    keep_fnames: true,
  },
};

// Configuration serveur
config.server = {
  port: 8081,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      // Fix pour éviter les erreurs de chemin undefined
      if (req.url && req.url.includes('undefined')) {
        console.warn('Requête avec URL undefined détectée:', req.url);
        return res.status(404).end();
      }
      return middleware(req, res, next);
    };
  },
};

// Configuration watchFolders pour éviter les conflits
config.watchFolders = [__dirname];

module.exports = config;
