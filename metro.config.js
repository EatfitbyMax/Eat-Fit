
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Configuration pour supporter tous les packages Expo
config.resolver.platforms = ['ios', 'android', 'native', 'web'];
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

// Résolution conditionnelle pour exclure certains modules sur web
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Exclure Stripe sur web
  if (platform === 'web' && moduleName.includes('@stripe/stripe-react-native')) {
    return {
      filePath: require.resolve('./utils/stripe-web-mock.js'),
      type: 'sourceFile',
    };
  }

  // Exclure expo-barcode-scanner sur web mais permettre sur mobile
  if (platform === 'web' && moduleName.includes('expo-barcode-scanner')) {
    return {
      filePath: require.resolve('./utils/barcode-scanner-web-mock.js'),
      type: 'sourceFile',
    };
  }

  // Utiliser la résolution par défaut pour les autres cas
  return context.resolveRequest(context, moduleName, platform);
};

// Configuration pour éviter les erreurs de modules manquants
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];
config.resolver.sourceExts = [...config.resolver.sourceExts, 'mjs'];

module.exports = config;
