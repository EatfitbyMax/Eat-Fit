const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname, {
  // [Web-only]: Enables CSS support in Metro.
  isCSSEnabled: true,
});

// Résolution des conflits de modules
config.resolver.blockList = [
  /.*\/node_modules\/.*\/node_modules\/react-native\/.*/
];

module.exports = config;