
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Configuration pour les assets et resolver
config.resolver.platforms = ['ios', 'android', 'native', 'web'];
config.resolver.assetExts.push('db', 'json');

// Configuration pour résoudre les modules Node.js non supportés par Expo Go
config.resolver.alias = {
  'fs': require.resolve('./utils/empty-mock.js'),
  'path': require.resolve('./utils/empty-mock.js'),
  'crypto': require.resolve('./utils/empty-mock.js'),
};

// Exclure les packages problématiques pour Expo Go
config.resolver.blockList = [
  /node_modules\/@expo\/config-plugins\/.*\/XML\.js$/,
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

// Configuration pour autoriser les connexions externes sur Replit
config.server = {
  port: 8081,
};

module.exports = config;
