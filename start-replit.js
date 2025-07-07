
#!/usr/bin/env node

const { spawn } = require('child_process');

// Configuration pour Expo Go sur Replit
const env = {
  ...process.env,
  EXPO_DEVTOOLS_LISTEN_ADDRESS: '0.0.0.0',
  REACT_NATIVE_PACKAGER_HOSTNAME: process.env.REPLIT_DEV_DOMAIN || 'localhost'
};

console.log('🚀 Démarrage d\'Expo pour Expo Go...');
console.log(`📱 Domaine Replit: ${env.REPLIT_DEV_DOMAIN}`);
console.log('📋 Scannez le QR code avec l\'application Expo Go');

// Utiliser le mode tunnel pour Expo Go
const expo = spawn('npx', ['expo', 'start', '--host', 'tunnel'], {
  env,
  stdio: 'inherit'
});

expo.on('close', (code) => {
  console.log(`Expo terminé avec le code: ${code}`);
});

expo.on('error', (err) => {
  console.error('Erreur lors du démarrage d\'Expo:', err);
});
