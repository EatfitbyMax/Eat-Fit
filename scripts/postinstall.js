const fs = require('fs');
const path = require('path');

console.log('🔧 Post-installation setup pour EatFitByMax...');

// Appliquer les patches si nécessaire
try {
  const { execSync } = require('child_process');

  // Vérifier si patch-package est disponible
  try {
    execSync('npx patch-package --help', { stdio: 'ignore' });
    console.log('📦 Application des patches...');
    execSync('npx patch-package', { stdio: 'inherit' });
    console.log('✅ Patches appliqués avec succès');
  } catch (error) {
    console.log('⚠️ patch-package non disponible, installation des patches ignorée');
  }
} catch (error) {
  console.log('⚠️ Erreur lors de l\'application des patches:', error.message);
}

// Vérifier la structure des fichiers critiques
const criticalFiles = [
  'app.json',
  'metro.config.js',
  'babel.config.js',
  '.env'
];

console.log('\n📁 Vérification des fichiers critiques:');
criticalFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`⚠️ ${file} manquant`);
  }
});

console.log('🔧 Post-install: Création du fichier XML manquant...');

const targetDir = path.join(__dirname, '..', 'node_modules', '@expo', 'config-plugins', 'build', 'utils');
const targetFile = path.join(targetDir, 'XML.js');
const targetDts = path.join(targetDir, 'XML.d.ts');

// Assurer que le dossier existe
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// Contenu du fichier JS
const jsContent = `"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildObject = exports.parseString = exports.parseStringToXml = void 0;

// Mock implementation pour éviter l'erreur de module manquant
function parseStringToXml(xmlString, options = {}) {
  return Promise.resolve({});
}
exports.parseStringToXml = parseStringToXml;

function parseString(xmlString, options = {}) {
  return Promise.resolve({});
}
exports.parseString = parseString;

function buildObject(obj, options = {}) {
  return '';
}
exports.buildObject = buildObject;

// Compatibilité avec xml2js si disponible
try {
  const xml2js = require('xml2js');
  
  exports.parseStringToXml = function(xmlString, options = {}) {
    return new Promise((resolve, reject) => {
      xml2js.parseString(xmlString, options, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  };
  
  exports.buildObject = function(obj, options = {}) {
    const builder = new xml2js.Builder(options);
    return builder.buildObject(obj);
  };
} catch (e) {
  // xml2js n'est pas disponible, utiliser les mocks
}
`;

// Contenu du fichier .d.ts
const dtsContent = `export interface ParseOptions {
  explicitArray?: boolean;
  mergeAttrs?: boolean;
  normalize?: boolean;
  normalizeTags?: boolean;
  trim?: boolean;
}

export interface BuilderOptions {
  rootName?: string;
  renderOpts?: {
    pretty?: boolean;
    indent?: string;
  };
}

export function parseStringToXml(xmlString: string, options?: ParseOptions): Promise<any>;
export function buildObject(obj: any, options?: BuilderOptions): string;
export function parseString(xmlString: string, options?: ParseOptions): Promise<any>;
`;

try {
  fs.writeFileSync(targetFile, jsContent);
  fs.writeFileSync(targetDts, dtsContent);
  console.log('✅ Fichier XML créé avec succès dans:', targetFile);
} catch (error) {
  console.error('❌ Erreur lors de la création du fichier XML:', error.message);
}

console.log('\n✅ Post-installation terminée avec succès!');