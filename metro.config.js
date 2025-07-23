const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Configuration de base minimale
config.resolver.assetExts.push('db', 'json');

// Supprimer complètement les alias problématiques
// et laisser Metro gérer les modules natifs
config.resolver.alias = {};

// Configuration transformer basique
config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: false,
    inlineRequires: false,
  },
});

// Configuration resolver simple
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

module.exports = config;