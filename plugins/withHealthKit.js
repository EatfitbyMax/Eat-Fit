// plugins/withHealthKit.js
const { withEntitlementsPlist } = require("@expo/config-plugins");

module.exports = function withHealthKit(config) {
  return withEntitlementsPlist(config, (config) => {
    config.modResults["com.apple.developer.healthkit"] = true;
    return config;
  });
};
