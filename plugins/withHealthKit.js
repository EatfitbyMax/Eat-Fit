
const { withInfoPlist, withEntitlementsPlist } = require('@expo/config-plugins');

module.exports = function withHealthKit(config) {
  // Configuration Info.plist
  config = withInfoPlist(config, (config) => {
    // Ajouter les capabilities HealthKit
    config.modResults.UIRequiredDeviceCapabilities = config.modResults.UIRequiredDeviceCapabilities || [];
    if (!config.modResults.UIRequiredDeviceCapabilities.includes('healthkit')) {
      config.modResults.UIRequiredDeviceCapabilities.push('healthkit');
    }

    // Descriptions d'usage pour rn-apple-healthkit
    config.modResults.NSHealthShareUsageDescription = 
      "EatFitBy Max utilise Apple Health pour synchroniser vos données de santé et fitness afin de vous fournir un suivi personnalisé de votre progression.";
    
    config.modResults.NSHealthUpdateUsageDescription = 
      "EatFitBy Max peut écrire des données dans Apple Health pour garder vos informations de santé à jour.";

    // Configuration HealthKit
    config.modResults['com.apple.developer.healthkit'] = true;
    config.modResults['com.apple.developer.healthkit.access'] = [];

    return config;
  });

  // Configuration Entitlements
  config = withEntitlementsPlist(config, (config) => {
    config.modResults['com.apple.developer.healthkit'] = true;
    config.modResults['com.apple.developer.healthkit.access'] = [];
    
    return config;
  });

  return config;
};
