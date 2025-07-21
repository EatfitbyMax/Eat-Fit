
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Configuration simplifiée pour éviter les erreurs de résolution
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Liste des modules à ignorer ou mocker
const modulesToMock = [
  '@stripe/stripe-react-native',
  'expo-health-kit',
  '@react-native-masked-view/masked-view'
];

// Résolution conditionnelle améliorée
config.resolver.resolveRequest = (context, moduleName, platform) => {
  try {
    // Vérification de la validité des paramètres
    if (typeof moduleName !== 'string' || !moduleName) {
      console.warn('⚠️ Nom de module invalide:', moduleName);
      // Utiliser la résolution par défaut plutôt que de retourner null
      return context.resolveRequest(context, moduleName, platform);
    }

    // Mock spécifique pour Stripe sur web
    if (platform === 'web' && moduleName.includes('@stripe/stripe-react-native')) {
      try {
        const mockPath = require.resolve('./utils/stripe-web-mock.js');
        console.log('✅ Utilisation du mock Stripe pour web');
        return {
          filePath: mockPath,
          type: 'sourceFile',
        };
      } catch (error) {
        console.warn('⚠️ Mock Stripe non trouvé, utilisation résolution par défaut:', error.message);
        return context.resolveRequest(context, moduleName, platform);
      }
    }

    // Mock pour les modules problématiques sur web
    if (platform === 'web' && modulesToMock.some(mod => moduleName.includes(mod))) {
      try {
        const mockPath = require.resolve('./utils/stripe-web-mock.js');
        console.log(`✅ Utilisation du mock générique pour ${moduleName} sur web`);
        return {
          filePath: mockPath,
          type: 'sourceFile',
        };
      } catch (error) {
        console.warn(`⚠️ Mock générique non trouvé pour ${moduleName}, utilisation résolution par défaut:`, error.message);
        return context.resolveRequest(context, moduleName, platform);
      }
    }

    // Résolution par défaut
    return context.resolveRequest(context, moduleName, platform);
    
  } catch (error) {
    console.warn(`⚠️ Erreur de résolution pour ${moduleName}:`, error.message);
    // En cas d'erreur, essayer la résolution par défaut sans custom resolver
    try {
      return context.resolveRequest(context, moduleName, platform);
    } catch (fallbackError) {
      console.error(`❌ Résolution impossible pour ${moduleName}:`, fallbackError.message);
      // Si même la résolution par défaut échoue, re-throw l'erreur
      throw fallbackError;
    }
  }
};

module.exports = config;
