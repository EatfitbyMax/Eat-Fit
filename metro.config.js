
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Configuration pour iOS et web avec résolution Stripe
config.resolver.platforms = ['ios', 'native', 'web', 'android'];

// Ajout des extensions de fichier supportées
config.resolver.sourceExts.push('tsx', 'ts', 'jsx', 'js');

// Configuration du transformer
config.transformer = {
  ...config.transformer,
  babelTransformerPath: require.resolve('metro-react-native-babel-transformer'),
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: false,
    },
  }),
};

// Résolution personnalisée pour gérer Stripe et autres modules natifs
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Éviter la résolution personnalisée pendant le build de production
  if (process.env.NODE_ENV === 'production' && platform === 'ios') {
    // Modules Node.js problématiques sur iOS
    if (['fs', 'path', 'assert', 'util', 'url', 'node:fs', 'os', 'crypto'].includes(moduleName)) {
      return {
        filePath: path.resolve(__dirname, 'utils/empty-mock.js'),
        type: 'sourceFile',
      };
    }
    // Laisser Metro gérer le reste
    return context.resolveRequest(context, moduleName, platform);
  }

  try {
    // Mock Stripe pour web seulement
    if (platform === 'web' && moduleName.includes('@stripe/stripe-react-native')) {
      const mockPath = path.resolve(__dirname, 'utils/stripe-web-mock.js');
      return {
        filePath: mockPath,
        type: 'sourceFile',
      };
    }

    // Ignorer les modules Node.js sur iOS et Android
    if ((platform === 'ios' || platform === 'android') && 
        ['fs', 'path', 'assert', 'util', 'url', 'node:fs', 'os', 'crypto'].includes(moduleName)) {
      return {
        filePath: path.resolve(__dirname, 'utils/empty-mock.js'),
        type: 'sourceFile',
      };
    }

    // Résolution par défaut
    return context.resolveRequest(context, moduleName, platform);
  } catch (error) {
    // Fallback pour les modules problématiques sur mobile
    if ((platform === 'ios' || platform === 'android') && 
        ['fs', 'path', 'assert', 'util', 'url', 'node:fs', 'os', 'crypto'].includes(moduleName)) {
      return {
        filePath: path.resolve(__dirname, 'utils/empty-mock.js'),
        type: 'sourceFile',
      };
    }
    
    // Résolution par défaut
    try {
      return context.resolveRequest(context, moduleName, platform);
    } catch (fallbackError) {
      console.warn('Erreur de résolution pour module:', moduleName, 'sur plateforme:', platform);
      return null;
    }
  }
};

module.exports = config;
