
const { withEntitlementsPlist, withInfoPlist } = require("@expo/config-plugins");

module.exports = function withHealthKit(config) {
  // Ajouter l'entitlement HealthKit
  config = withEntitlementsPlist(config, (config) => {
    config.modResults["com.apple.developer.healthkit"] = true;
    return config;
  });

  // Ajouter les descriptions d'usage dans Info.plist
  config = withInfoPlist(config, (config) => {
    config.modResults.NSHealthShareUsageDescription = 
      "EatFit souhaite accéder à vos données de santé pour synchroniser vos activités et suivre vos progrès.";
    config.modResults.NSHealthUpdateUsageDescription = 
      "EatFit souhaite mettre à jour vos données de santé avec vos séances d'entraînement.";
    return config;
  });

  return config;
};
