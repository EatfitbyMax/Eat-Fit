
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Résoudre les problèmes de chargement des modules
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Optimiser le cache
config.resetCache = true;

module.exports = config;
