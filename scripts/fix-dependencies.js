
#!/usr/bin/env node

/**
 * Script de résolution des problèmes de dépendances
 * Nettoie et réinstalle les dépendances avec les bonnes versions
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = process.cwd();

console.log('🔧 Démarrage de la résolution des problèmes de dépendances...\n');

// Étape 1: Sauvegarde
console.log('📦 Sauvegarde des fichiers existants...');
try {
  if (fs.existsSync('package-lock.json')) {
    fs.copyFileSync('package-lock.json', 'package-lock.json.backup');
    console.log('✅ package-lock.json sauvegardé');
  }
} catch (error) {
  console.log('⚠️ Erreur lors de la sauvegarde:', error.message);
}

// Étape 2: Nettoyage
console.log('\n🧹 Nettoyage des modules existants...');
try {
  if (fs.existsSync('node_modules')) {
    execSync('rm -rf node_modules', { stdio: 'inherit' });
    console.log('✅ node_modules supprimé');
  }
  
  if (fs.existsSync('package-lock.json')) {
    fs.unlinkSync('package-lock.json');
    console.log('✅ package-lock.json supprimé');
  }
} catch (error) {
  console.log('⚠️ Erreur lors du nettoyage:', error.message);
}

// Étape 3: Réinstallation
console.log('\n📦 Réinstallation des dépendances...');
try {
  execSync('npm install', { stdio: 'inherit' });
  console.log('✅ Dépendances installées');
} catch (error) {
  console.error('❌ Erreur lors de l\'installation:', error.message);
  process.exit(1);
}

// Étape 4: Vérification
console.log('\n🔍 Vérification de l\'installation...');
try {
  execSync('npx expo doctor', { stdio: 'inherit' });
  console.log('✅ Vérification Expo réussie');
} catch (error) {
  console.log('⚠️ Avertissements détectés par expo doctor');
}

// Étape 5: Tests TypeScript
console.log('\n📝 Vérification TypeScript...');
try {
  execSync('npx tsc --noEmit', { stdio: 'inherit' });
  console.log('✅ TypeScript OK');
} catch (error) {
  console.log('⚠️ Erreurs TypeScript détectées');
}

console.log('\n🎉 Résolution des dépendances terminée!');
console.log('\n📋 Prochaines étapes:');
console.log('1. Vérifiez le fichier Instructions.md pour plus de détails');
console.log('2. Testez votre application avec: npx expo start --clear');
console.log('3. Signalez tout problème persistant');
