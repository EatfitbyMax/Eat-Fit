
const { withEntitlementsPlist, withInfoPlist } = require('@expo/config-plugins');

module.exports = function withHealthKit(config) {
  // Ajouter les entitlements HealthKit
  config = withEntitlementsPlist(config, (config) => {
    // Activer HealthKit de base
    config.modResults['com.apple.developer.healthkit'] = true;
    
    // Ne PAS ajouter l'accès aux health-records (cause des rejets App Store)
    // Cette ligne est supprimée volontairement
    
    return config;
  });

  // Ajouter les descriptions d'usage dans Info.plist
  config = withInfoPlist(config, (config) => {
    config.modResults.NSHealthShareUsageDescription = 
      'EatFitBy Max a besoin d\'accéder à vos données Apple Health (pas, fréquence cardiaque, poids, calories brûlées, distance parcourue, analyse du sommeil) pour vous fournir un suivi personnalisé de votre progression fitness et nutritionnelle.';
    
    config.modResults.NSHealthUpdateUsageDescription = 
      'EatFitBy Max souhaite écrire des données dans Apple Health (poids, calories brûlées) pour synchroniser vos progrès avec vos activités et objectifs nutritionnels.';
    
    // Ajouter la capacité HealthKit requise
    if (!config.modResults.UIRequiredDeviceCapabilities) {
      config.modResults.UIRequiredDeviceCapabilities = [];
    }
    if (!config.modResults.UIRequiredDeviceCapabilities.includes('healthkit')) {
      config.modResults.UIRequiredDeviceCapabilities.push('healthkit');
    }
    
    return config;
  });

  return config;
};
