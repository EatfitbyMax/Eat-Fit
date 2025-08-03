
const { withInfoPlist, withEntitlementsPlist } = require('@expo/config-plugins');

module.exports = function withHealthKit(config) {
  // Configuration Info.plist
  config = withInfoPlist(config, (config) => {
    // Ajouter les capabilities HealthKit
    config.modResults.UIRequiredDeviceCapabilities = config.modResults.UIRequiredDeviceCapabilities || [];
    if (!config.modResults.UIRequiredDeviceCapabilities.includes('healthkit')) {
      config.modResults.UIRequiredDeviceCapabilities.push('healthkit');
    }

    // Descriptions d'usage pour rn-apple-healthkit (OBLIGATOIRES)
    config.modResults.NSHealthShareUsageDescription = 
      "EatFitBy Max utilise Apple Health pour synchroniser vos données de santé et fitness afin de vous fournir un suivi personnalisé de votre progression.";
    
    config.modResults.NSHealthUpdateUsageDescription = 
      "EatFitBy Max peut écrire des données dans Apple Health pour garder vos informations de santé à jour.";

    // Configuration pour rn-apple-healthkit
    config.modResults.NSHealthShareUsageDescription = config.modResults.NSHealthShareUsageDescription;
    config.modResults.NSHealthUpdateUsageDescription = config.modResults.NSHealthUpdateUsageDescription;

    return config;
  });

  // Configuration Entitlements (CRITIQUE POUR PRODUCTION)
  config = withEntitlementsPlist(config, (config) => {
    // S'assurer que les entitlements existent
    if (!config.modResults) {
      config.modResults = {};
    }
    
    // Entitlement HealthKit obligatoire
    config.modResults['com.apple.developer.healthkit'] = true;
    
    // Configuration access (vide pour autoriser tous les types)
    config.modResults['com.apple.developer.healthkit.access'] = [];
    
    // Entitlement pour les achats in-app (OBLIGATOIRE pour production)
    config.modResults['com.apple.developer.in-app-payments'] = [];
    
    console.log('✅ Plugin HealthKit: Entitlements configurés');
    return config;
  });

  return config;
};
