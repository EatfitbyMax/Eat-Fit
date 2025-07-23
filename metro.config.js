const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Configuration de base pour les assets
config.resolver.assetExts.push('db', 'json');

// Alias simples pour les modules Node.js problématiques
config.resolver.alias = {
  'fs': path.resolve(__dirname, 'empty-shim.js'),
  'path': path.resolve(__dirname, 'empty-shim.js'),
  'crypto': path.resolve(__dirname, 'empty-shim.js'),
  'util': path.resolve(__dirname, 'empty-shim.js'),
  'os': path.resolve(__dirname, 'empty-shim.js'),
  'stream': path.resolve(__dirname, 'empty-shim.js'),
  'buffer': path.resolve(__dirname, 'empty-shim.js'),
  'assert': path.resolve(__dirname, 'empty-shim.js'),
  'url': path.resolve(__dirname, 'empty-shim.js'),
  'querystring': path.resolve(__dirname, 'empty-shim.js'),
  'events': path.resolve(__dirname, 'empty-shim.js'),
};

// Configuration transformer simplifiée
config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: false,
    inlineRequires: false,
  },
});

// Éviter les erreurs de résolution
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

// Configuration serveur basique
config.server = {
  port: 8081,
};

module.exports = config;