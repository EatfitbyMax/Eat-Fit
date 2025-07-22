
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
  'util': require.resolve('./utils/empty-mock.js'),
  'os': require.resolve('./utils/empty-mock.js'),
  'stream': require.resolve('./utils/empty-mock.js'),
  'buffer': require.resolve('./utils/empty-mock.js'),
  'assert': require.resolve('./utils/empty-mock.js'),
  'url': require.resolve('./utils/empty-mock.js'),
  'querystring': require.resolve('./utils/empty-mock.js'),
  'events': require.resolve('./utils/empty-mock.js'),
};

// Exclure complètement les packages problématiques pour Expo Go
config.resolver.blockList = [
  /node_modules\/@expo\/config-plugins\/.*\/XML\.js$/,
  /node_modules\/@expo\/config-plugins\/.*\/utils\/XML$/,
  /node_modules\/@expo\/config-plugins\/build\/utils\/XML/,
  /node_modules\/@expo\/config-plugins\/build\/index\.js$/,
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
