
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Configuration pour supporter les extensions TypeScript et JavaScript
config.resolver.sourceExts.push('cjs');

// Assurer que les transformations sont correctes pour l'export
config.transformer.enableBabelRCLookup = false;
config.transformer.hermesParser = true;

// Configuration pour l'export embed
config.serializer.getModulesRunBeforeMainModule = () => [];

module.exports = config;
