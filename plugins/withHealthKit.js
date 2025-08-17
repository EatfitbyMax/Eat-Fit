
const { withEntitlementsPlist, withInfoPlist } = require('@expo/config-plugins');

module.exports = function withHealthKit(config) {
  // Ajouter les entitlements HealthKit
  config = withEntitlementsPlist(config, (config) => {
    // Activer HealthKit de base
    config.modResults['com.apple.developer.healthkit'] = true;
    
    // S'assurer que les autres entitlements sont conservés
    if (!config.modResults['aps-environment']) {
      config.modResults['aps-environment'] = 'development';
    }
    
    return config;
  });

  // Ajouter les descriptions d'usage dans Info.plist
  config = withInfoPlist(config, (config) => {
    // Descriptions HealthKit détaillées
    config.modResults.NSHealthShareUsageDescription = 
      'EatFitBy Max accède à vos données Apple Health (pas, fréquence cardiaque, poids, calories brûlées, distance parcourue, analyse du sommeil) pour vous fournir un suivi personnalisé de votre progression fitness et nutritionnelle.';
    
    config.modResults.NSHealthUpdateUsageDescription = 
      'EatFitBy Max écrit des données dans Apple Health (poids, calories brûlées) pour synchroniser vos progrès avec vos activités et objectifs nutritionnels.';
    
    // Ajouter la capacité HealthKit requise
    if (!config.modResults.UIRequiredDeviceCapabilities) {
      config.modResults.UIRequiredDeviceCapabilities = [];
    }
    if (!config.modResults.UIRequiredDeviceCapabilities.includes('healthkit')) {
      config.modResults.UIRequiredDeviceCapabilities.push('healthkit');
    }
    
    // S'assurer que l'application supporte iOS 15.1+
    if (!config.modResults.MinimumOSVersion || config.modResults.MinimumOSVersion < '15.1') {
      config.modResults.MinimumOSVersion = '15.1';
    }
    
    // Configurer les capabilities en arrière-plan si nécessaire
    if (!config.modResults.UIBackgroundModes) {
      config.modResults.UIBackgroundModes = [];
    }
    
    return config;
  });

  return config;
};
