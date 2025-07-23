
const { withInfoPlist } = require('@expo/config-plugins');

module.exports = function withHealthKit(config) {
  return withInfoPlist(config, (config) => {
    // Ajouter les capabilities HealthKit
    config.modResults.UIRequiredDeviceCapabilities = config.modResults.UIRequiredDeviceCapabilities || [];
    if (!config.modResults.UIRequiredDeviceCapabilities.includes('healthkit')) {
      config.modResults.UIRequiredDeviceCapabilities.push('healthkit');
    }

    // S'assurer que les descriptions d'usage sont présentes pour rn-apple-healthkit
    config.modResults.NSHealthShareUsageDescription = 
      config.modResults.NSHealthShareUsageDescription || 
      "EatFitBy Max utilise Apple Health pour synchroniser vos données de santé et fitness afin de vous fournir un suivi personnalisé de votre progression.";
    
    config.modResults.NSHealthUpdateUsageDescription = 
      config.modResults.NSHealthUpdateUsageDescription || 
      "EatFitBy Max peut écrire des données dans Apple Health pour garder vos informations de santé à jour.";

    // Ajouter les entitlements HealthKit si nécessaire
    config.modResults['com.apple.developer.healthkit'] = true;
    config.modResults['com.apple.developer.healthkit.access'] = [];

    return config;
  });
};
