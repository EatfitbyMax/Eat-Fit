
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Résoudre les problèmes de chargement des modules
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Résoudre les conflits avec les modules natifs Stripe
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

// Exclure complètement Stripe sur web et les specs problématiques
config.resolver.blockList = [
  /node_modules\/@stripe\/stripe-react-native\/lib\/.*\/specs\/.*/,
  /node_modules\/@stripe\/stripe-react-native\/lib\/module\/specs\/.*/,
  /node_modules\/@stripe\/stripe-react-native\/lib\/commonjs\/specs\/.*/,
];

// Résolution conditionnelle pour éviter les imports natifs sur web
config.resolver.alias = {
  '@stripe/stripe-react-native': require.resolve('./utils/stripeWrapper.ts'),
};

// Optimiser le cache
config.resetCache = true;

module.exports = config;
