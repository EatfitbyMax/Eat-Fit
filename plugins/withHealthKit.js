
const { withEntitlementsPlist, withInfoPlist, withXcodeProject } = require('@expo/config-plugins');

module.exports = function withHealthKit(config) {
  // Ajouter les entitlements HealthKit
  config = withEntitlementsPlist(config, (config) => {
    // Activer HealthKit de base - OBLIGATOIRE
    config.modResults['com.apple.developer.healthkit'] = true;
    
    // Entitlement pour accéder aux données cliniques (optionnel mais recommandé)
    config.modResults['com.apple.developer.healthkit.access'] = [];
    
    // S'assurer que l'environnement APS est configuré
    if (!config.modResults['aps-environment']) {
      config.modResults['aps-environment'] = 'production';
    }
    
    return config;
  });

  // Ajouter les descriptions d'usage dans Info.plist
  config = withInfoPlist(config, (config) => {
    // Descriptions HealthKit OBLIGATOIRES
    config.modResults.NSHealthShareUsageDescription = 
      'EatFitBy Max accède à vos données Apple Health (pas, fréquence cardiaque, poids, calories brûlées, distance parcourue, analyse du sommeil) pour vous fournir un suivi personnalisé de votre progression fitness et nutritionnelle.';
    
    config.modResults.NSHealthUpdateUsageDescription = 
      'EatFitBy Max écrit des données dans Apple Health (poids, calories brûlées) pour synchroniser vos progrès avec vos activités et objectifs nutritionnels.';
    
    // Ajouter la capacité HealthKit OBLIGATOIRE pour App Store
    if (!config.modResults.UIRequiredDeviceCapabilities) {
      config.modResults.UIRequiredDeviceCapabilities = [];
    }
    if (!config.modResults.UIRequiredDeviceCapabilities.includes('healthkit')) {
      config.modResults.UIRequiredDeviceCapabilities.push('healthkit');
    }
    
    // Version iOS minimale pour HealthKit
    config.modResults.MinimumOSVersion = '15.1';
    
    return config;
  });

  // Modifier le projet Xcode pour s'assurer que HealthKit est bien configuré
  config = withXcodeProject(config, (config) => {
    const project = config.modResults;
    
    // Ajouter HealthKit.framework si nécessaire
    if (project.hasFile('HealthKit.framework') === false) {
      project.addFramework('HealthKit.framework', { weak: false });
    }
    
    // S'assurer que les capabilities HealthKit sont dans le projet
    const healthKitCapability = 'com.apple.HealthKit';
    const capabilities = project.pbxProject.objects.PBXProject;
    for (const key in capabilities) {
      if (capabilities[key].attributes && capabilities[key].attributes.TargetAttributes) {
        for (const targetKey in capabilities[key].attributes.TargetAttributes) {
          const target = capabilities[key].attributes.TargetAttributes[targetKey];
          if (!target.SystemCapabilities) {
            target.SystemCapabilities = {};
          }
          if (!target.SystemCapabilities[healthKitCapability]) {
            target.SystemCapabilities[healthKitCapability] = { enabled: 1 };
          }
        }
      }
    }
    
    return config;
  });

  return config;
};
