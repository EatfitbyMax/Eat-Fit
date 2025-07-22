
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Vérification pré-build EAS...');

// Vérifier les fichiers critiques
const criticalFiles = [
  'app.json',
  'eas.json',
  'metro.config.js',
  'babel.config.js',
  'package.json',
  '.env'
];

let hasErrors = false;

criticalFiles.forEach(file => {
  if (!fs.existsSync(file)) {
    console.error(`❌ Fichier manquant: ${file}`);
    hasErrors = true;
  } else {
    console.log(`✅ ${file}`);
  }
});

// Vérifier la structure app.json
try {
  const appConfig = JSON.parse(fs.readFileSync('app.json', 'utf8'));
  
  if (!appConfig.expo.name) {
    console.error('❌ expo.name manquant dans app.json');
    hasErrors = true;
  }
  
  if (!appConfig.expo.ios?.bundleIdentifier) {
    console.error('❌ ios.bundleIdentifier manquant dans app.json');
    hasErrors = true;
  }
  
  console.log('✅ Structure app.json valide');
} catch (error) {
  console.error('❌ Erreur parsing app.json:', error.message);
  hasErrors = true;
}

// Vérifier les variables d'environnement critiques
if (!process.env.EXPO_PUBLIC_API_URL) {
  console.warn('⚠️ EXPO_PUBLIC_API_URL non définie');
}

if (hasErrors) {
  console.error('❌ Des erreurs ont été détectées. Corrigez-les avant le build.');
  process.exit(1);
} else {
  console.log('✅ Toutes les vérifications sont passées!');
}
