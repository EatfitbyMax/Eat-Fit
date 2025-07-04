const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Configurer uniquement pour les plateformes mobiles
config.resolver.platforms = ['ios', 'android', 'native'];

// Résoudre les conflits avec les modules natifs
config.resolver.resolverMainFields = ['react-native', 'main'];

// Optimiser le cache
config.resetCache = true;

module.exports = config;