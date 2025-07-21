const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Configuration simplifiée pour iOS uniquement
config.resolver.platforms = ['ios', 'native'];

module.exports = config;