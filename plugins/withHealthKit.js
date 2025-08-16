
const { withEntitlementsPlist, withInfoPlist } = require('@expo/config-plugins');

module.exports = function withHealthKit(config) {
  // Ajouter les entitlements HealthKit
  config = withEntitlementsPlist(config, (config) => {
    config.modResults['com.apple.developer.healthkit'] = true;
    config.modResults['com.apple.developer.healthkit.access'] = ['health-records'];
    return config;
  });

  // Ajouter les descriptions d'usage dans Info.plist
  config = withInfoPlist(config, (config) => {
    config.modResults.NSHealthShareUsageDescription = 
      'EatFitBy Max accède à vos données Apple Health (pas, fréquence cardiaque, poids, calories brûlées, distance parcourue, analyse du sommeil) pour vous fournir un suivi personnalisé de votre progression fitness et nutritionnelle. Ces données sont utilisées localement pour calculer vos objectifs et suivre vos progrès.';
    
    config.modResults.NSHealthUpdateUsageDescription = 
      'EatFitBy Max écrit des données dans Apple Health (poids, calories brûlées) pour maintenir vos informations de santé synchronisées avec vos activités et objectifs nutritionnels enregistrés dans l\'application.';
    
    return config;
  });

  return config;
};
