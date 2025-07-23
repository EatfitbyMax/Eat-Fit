
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Configuration pour les assets et resolver
config.resolver.platforms = ['ios', 'android', 'native', 'web'];
config.resolver.assetExts.push('db', 'json');

// Configuration spéciale pour EAS Build
config.resolver.alias = {
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
  '@expo/config-plugins/build/utils/XML': require.resolve('./utils/XML-fallback.js'),
};

// Bloquer les modules problématiques
config.resolver.blockList = [
  /node_modules\/@expo\/config-plugins\/.*\/XML\.js$/,
  /node_modules\/@expo\/config-plugins\/.*\/utils\/XML$/,
  /node_modules\/@expo\/config-plugins\/build\/utils\/XML/,
  /node_modules\/@expo\/config-plugins\/build\/utils\/.*\.js$/,
];

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
};

module.exports = config;
