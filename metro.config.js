
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Configuration optimisée pour la production
config.resolver.assetExts.push('bin');
config.transformer.minifierConfig = {
  mangle: {
    keep_fnames: true,
  },
};

module.exports = config;
