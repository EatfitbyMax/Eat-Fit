const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Configuration pour les assets et resolver
config.resolver.platforms = ['ios', 'android', 'native', 'web'];
config.resolver.assetExts.push('db', 'json');

// Configuration pour Hermes
config.transformer.minifierConfig = {
  keep_classnames: true,
  keep_fnames: true,
  mangle: {
    keep_classnames: true,
    keep_fnames: true,
  },
};

module.exports = config;