
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Résoudre les problèmes de chargement des modules
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Résoudre les conflits avec les modules natifs Stripe
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

// Exclure les modules Stripe problématiques pour le web/Expo Go
config.resolver.blockList = [
  /node_modules\/@stripe\/stripe-react-native\/lib\/.*\/specs\/.*/,
];

// Optimiser le cache
config.resetCache = true;

module.exports = config;
