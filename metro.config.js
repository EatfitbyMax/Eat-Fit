const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Configuration pour Replit
if (process.env.REPLIT_DEV_DOMAIN) {
  config.server = {
    ...config.server,
    hostname: '0.0.0.0'
  };
}

// Exclure Stripe sur web pour éviter les erreurs d'import
config.resolver.platforms = ['ios', 'android', 'native', 'web'];
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

// Résolution conditionnelle pour exclure Stripe sur web
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Si on est sur web et qu'on essaie d'importer Stripe, retourner un module vide
  if (platform === 'web' && moduleName.includes('@stripe/stripe-react-native')) {
    return {
      filePath: require.resolve('./utils/stripe-web-mock.js'),
      type: 'sourceFile',
    };
  }

  // Utiliser la résolution par défaut pour les autres cas
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;