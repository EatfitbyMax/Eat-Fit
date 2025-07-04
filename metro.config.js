
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Configurer uniquement pour les plateformes mobiles
config.resolver.platforms = ['ios', 'android', 'native'];

// Résoudre les conflits avec les modules natifs Stripe
config.resolver.resolverMainFields = ['react-native', 'main'];

// Exclure complètement tous les modules Stripe sur web
config.resolver.blockList = [
  /.*\/node_modules\/@stripe\/stripe-react-native\/.*\.web\..*/,
  /.*\/node_modules\/@stripe\/stripe-react-native\/.*\/specs\/.*/,
  /.*\/node_modules\/@stripe\/stripe-react-native\/lib\/.*\/specs\/.*/,
  /.*\/node_modules\/@stripe\/stripe-react-native\/lib\/module\/specs\/.*/,
  /.*\/node_modules\/@stripe\/stripe-react-native\/lib\/commonjs\/specs\/.*/,
];

// Optimiser le cache
config.resetCache = true;

module.exports = config;
