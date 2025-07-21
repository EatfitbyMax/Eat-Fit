
<old_str>const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Configuration simplifiée pour iOS uniquement
config.resolver.platforms = ['ios', 'native'];

module.exports = config;</old_str>
<new_str>const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Configuration pour iOS et web avec résolution Stripe
config.resolver.platforms = ['ios', 'native', 'web'];

// Résolution personnalisée pour gérer Stripe et autres modules natifs
config.resolver.resolveRequest = (context, moduleName, platform) => {
  try {
    // Mock Stripe pour web seulement
    if (platform === 'web' && moduleName.includes('@stripe/stripe-react-native')) {
      const mockPath = require.resolve('./utils/stripe-web-mock.js');
      return {
        filePath: mockPath,
        type: 'sourceFile',
      };
    }

    // Résolution par défaut pour iOS et native
    return context.resolveRequest(context, moduleName, platform);
  } catch (error) {
    // Fallback vers résolution par défaut
    return context.resolveRequest(context, moduleName, platform);
  }
};

module.exports = config;</new_str>
