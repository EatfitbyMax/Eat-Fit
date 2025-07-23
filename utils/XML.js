
// Fichier XML.js pour résoudre l'erreur de module manquant
// Ce fichier est requis par @expo/config-plugins mais peut être absent

const xml2js = require('xml2js');

class XMLParser {
  static parseString(xmlString) {
    return new Promise((resolve, reject) => {
      xml2js.parseString(xmlString, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  static stringify(obj) {
    const builder = new xml2js.Builder();
    return builder.buildObject(obj);
  }
}

module.exports = {
  XMLParser,
  parseString: XMLParser.parseString,
  stringify: XMLParser.stringify
};
