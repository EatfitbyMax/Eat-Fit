const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Configuration pour iOS et web avec résolution Stripe
config.resolver.platforms = ['ios', 'native', 'web', 'android'];

// Résolution personnalisée pour gérer Stripe et autres modules natifs
config.resolver.resolveRequest = (context, moduleName, platform) => {
  try {
    // Mock Stripe pour web seulement
    if (platform === 'web' && moduleName.includes('@stripe/stripe-react-native')) {
      const mockPath = path.resolve(__dirname, 'utils/stripe-web-mock.js');
      return {
        filePath: mockPath,
        type: 'sourceFile',
      };
    }

    // Résolution par défaut pour iOS et native
    return context.resolveRequest(context, moduleName, platform);
  } catch (error) {
    console.warn('Erreur de résolution pour module:', moduleName, 'sur plateforme:', platform);
    // Fallback vers résolution par défaut
    try {
      return context.resolveRequest(context, moduleName, platform);
    } catch (fallbackError) {
      console.warn('Erreur de fallback:', fallbackError.message);
      return null;
    }
  }
};

module.exports = config;