
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Configuration pour Replit
config.server = {
  port: 8085,
  host: '0.0.0.0',
};

// Résoudre les problèmes de chargement des modules
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Optimiser le cache
config.resetCache = true;

module.exports = config;
