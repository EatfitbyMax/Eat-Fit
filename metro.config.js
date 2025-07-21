
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Configuration simplifiée pour éviter les erreurs de résolution
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Résolution conditionnelle simplifiée pour Stripe sur web
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Si on est sur web et qu'on essaie d'importer Stripe, retourner un module vide
  if (platform === 'web' && moduleName.includes('@stripe/stripe-react-native')) {
    try {
      const mockPath = require.resolve('./utils/stripe-web-mock.js');
      if (mockPath) {
        return {
          filePath: mockPath,
          type: 'sourceFile',
        };
      }
    } catch (error) {
      console.warn('⚠️ Fallback Stripe non trouvé:', error.message);
    }
  }

  // Utiliser la résolution par défaut pour les autres cas
  try {
    return context.resolveRequest(context, moduleName, platform);
  } catch (error) {
    // Si la résolution échoue, retourner null plutôt qu'undefined
    console.warn('⚠️ Erreur de résolution pour:', moduleName, error.message);
    return null;
  }
};

module.exports = config;
