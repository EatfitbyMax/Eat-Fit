const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Configuration simple pour éviter les conflits
config.resolver.sourceExts.push('tsx', 'ts', 'jsx', 'js');

module.exports = config;