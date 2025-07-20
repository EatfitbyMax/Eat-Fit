
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Configuration pour l'export iOS
config.transformer.enableBabelRCLookup = false;
config.transformer.hermesParser = true;
config.transformer.minifierPath = 'metro-minify-terser';
config.transformer.minifierConfig = {
  ecma: 8,
  keep_fnames: true,
  mangle: {
    keep_fnames: true,
  },
};

// Résolution des extensions
config.resolver.sourceExts.push('cjs');

// Optimiser la sérialisation
config.serializer.getModulesRunBeforeMainModule = () => [];

// Exclure les fichiers volumineux du bundle
config.resolver.blockList = [
  /attached_assets\/.*/,
  /backup-.*\/.*/,
  /deploy-temp\/.*/,
  /logs\/.*/,
  /server\/logs\/.*/,
];

module.exports = withNativeWind(config, { input: './global.css' });
