
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Réduire les avertissements de dépréciation
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Gestion d'erreur améliorée
config.transformer.minifierConfig = {
  keep_fnames: true,
  mangle: {
    keep_fnames: true,
  },
};

// Configuration NativeWind avec gestion d'erreur
try {
  const { withNativeWind } = require('nativewind/metro');
  module.exports = withNativeWind(config, { input: './global.css' });
} catch (error) {
  console.warn('NativeWind non disponible, utilisation de la configuration Metro standard');
  module.exports = config;
}
