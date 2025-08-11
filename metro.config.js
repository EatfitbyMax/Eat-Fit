
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ajouter la résolution pour les modules natifs non disponibles
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];
config.resolver.alias = {
  ...config.resolver.alias,
  'expo-in-app-purchases': require.resolve('./utils/expo-in-app-purchases-mock.ts'),
};

// Configuration de base minimale
config.resolver.assetExts.push('db', 'json');

// Configuration resolver simple
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

// Configuration transformer basique
config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: false,
    inlineRequires: false,
  },
});

module.exports = config;
