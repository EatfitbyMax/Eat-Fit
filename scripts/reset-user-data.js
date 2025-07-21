#!/usr/bin/env node

/**
 * Script de réinitialisation complète des données utilisateurs
 * Supprime tous les comptes et données pour repartir à zéro
 */

const fs = require('fs');
const path = require('path');

const SERVER_DATA_DIR = path.join(__dirname, '..', 'server', 'data');

console.log('🧹 Réinitialisation des données utilisateurs...');

// Nettoyer les fichiers serveur
const serverFiles = [
  'users.json',
  'subscription_2.json', 
  'subscription_3.json'
];

serverFiles.forEach(file => {
  const filePath = path.join(SERVER_DATA_DIR, file);
  if (fs.existsSync(filePath)) {
    if (file === 'users.json') {
      fs.writeFileSync(filePath, '[]');
    } else {
      fs.writeFileSync(filePath, '{}');
    }
    console.log(`✅ ${file} réinitialisé`);
  }
});

console.log('✅ Réinitialisation terminée!');
console.log('📱 Redémarrez l\'application pour appliquer les changements');