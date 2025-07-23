
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
