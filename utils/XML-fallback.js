
// Fichier de fallback pour le module XML manquant
// Évite les erreurs lors du bundling Metro

const mockXMLParser = {
  parseStringToXml: function(xmlString, options = {}) {
    console.log('Mock XML parseStringToXml called');
    return Promise.resolve({});
  },
  
  parseString: function(xmlString, callback) {
    console.log('Mock XML parseString called');
    if (typeof callback === 'function') {
      callback(null, {});
    }
    return Promise.resolve({});
  },
  
  buildObject: function(obj, options = {}) {
    console.log('Mock XML buildObject called');
    return '<xml></xml>';
  },
  
  stringify: function(obj, options = {}) {
    console.log('Mock XML stringify called');
    return '<xml></xml>';
  }
};

// Export par défaut et nommés pour compatibilité
module.exports = mockXMLParser;
module.exports.default = mockXMLParser;
module.exports.parseStringToXml = mockXMLParser.parseStringToXml;
module.exports.parseString = mockXMLParser.parseString;
module.exports.buildObject = mockXMLParser.buildObject;
module.exports.stringify = mockXMLParser.stringify;
