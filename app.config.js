
const { getDefaultConfig } = require('expo/metro-config');

module.exports = {
  ...require('./app.json').expo,
  extra: {
    eas: {
      projectId: "your-project-id-here"
    }
  },
  hooks: {
    postPublish: []
  }
};
