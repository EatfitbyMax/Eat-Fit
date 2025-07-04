
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Configurer uniquement pour les plateformes mobiles
config.resolver.platforms = ['ios', 'android', 'native'];

// Résoudre les conflits avec les modules natifs Stripe
config.resolver.resolverMainFields = ['react-native', 'main'];

// Bloquer complètement tous les modules Stripe
config.resolver.blockList = [
  // Bloquer tous les fichiers Stripe
  /.*node_modules\/@stripe\/stripe-react-native\/.*/,
  /.*node_modules\/expo-payments-stripe\/.*/,
  /.*node_modules\/stripe\/.*/,
];

// Alias pour rediriger Stripe vers notre wrapper
config.resolver.alias = {
  '@stripe/stripe-react-native': require.resolve('./utils/stripeWrapper.ts'),
};

// Optimiser le cache
config.resetCache = true;

module.exports = config;
