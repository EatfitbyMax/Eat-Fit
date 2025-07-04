
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Configuration pour Replit
config.server = {
  port: 8085,
  host: '0.0.0.0',
};

// Résoudre les problèmes de chargement des modules
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Configuration pour éviter les erreurs de modules natifs sur web
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];
config.resolver.platformExtensions = ['web.js', 'js', 'ts', 'tsx', 'json'];

// Exclure les modules natifs problématiques sur web
config.resolver.blockList = [
  /node_modules\/.*\/android\/.*/,
  /node_modules\/.*\/ios\/.*/,
];

// Optimiser le cache
config.resetCache = true;

module.exports = config;
