
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

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
