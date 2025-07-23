const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Résoudre le problème du module XML manquant
config.resolver.alias = {
  ...config.resolver.alias,
  './utils/XML': path.resolve(__dirname, 'utils/XML-fallback.js')
};

module.exports = withNativeWind(config, { input: './global.css' });