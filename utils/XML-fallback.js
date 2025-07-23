
// Fichier de fallback pour le module XML manquant
module.exports = {
  parseStringToXml: function(xmlString, options = {}) {
    return Promise.resolve({});
  },
  
  parseString: function(xmlString, options = {}) {
    return Promise.resolve({});
  },
  
  buildObject: function(obj, options = {}) {
    return '';
  },
  
  stringify: function(obj, options = {}) {
    return '';
  }
};
// Fallback pour le module XML manquant dans @expo/config-plugins
module.exports = {
  format: () => '',
  parse: () => ({}),
  parseString: () => ({}),
  Builder: function() {
    return {
      buildObject: () => ''
    };
  }
};
