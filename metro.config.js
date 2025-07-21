
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
  console.log(`🔍 Résolution: ${moduleName} pour ${platform}`);
  
  try {
    // Vérification de la validité des paramètres
    if (typeof moduleName !== 'string' || !moduleName) {
      console.warn('⚠️ Nom de module invalide:', moduleName);
      return null;
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
        console.warn('⚠️ Mock Stripe non trouvé:', error.message);
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
        console.warn(`⚠️ Mock générique non trouvé pour ${moduleName}:`, error.message);
      }
    }

    // Résolution par défaut avec vérification
    const result = context.resolveRequest(context, moduleName, platform);
    
    // Vérifier que le résultat est valide
    if (result && result.filePath && typeof result.filePath === 'string') {
      return result;
    } else {
      console.warn('⚠️ Résolution invalide pour:', moduleName, result);
      return null;
    }
    
  } catch (error) {
    console.warn(`⚠️ Erreur de résolution pour ${moduleName}:`, error.message);
    // Retourner null au lieu d'undefined pour éviter l'erreur path.relative
    return null;
  }
};

module.exports = config;
