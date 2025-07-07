
#!/usr/bin/env node

const { spawn } = require('child_process');

// Configuration pour Replit
const env = {
  ...process.env,
  EXPO_DEVTOOLS_LISTEN_ADDRESS: '0.0.0.0',
  EXPO_PACKAGER_PROXY_URL: `https://${process.env.REPLIT_DEV_DOMAIN}`,
  REACT_NATIVE_PACKAGER_HOSTNAME: process.env.REPLIT_DEV_DOMAIN || '0.0.0.0',
  WEB_HOST: '0.0.0.0',
  WEB_PORT: '8082'
};

console.log('🚀 Démarrage d\'Expo pour Replit...');
console.log(`📱 Domaine Replit: ${env.REPLIT_DEV_DOMAIN}`);

const expo = spawn('npx', ['expo', 'start', '--web-only', '--port', '8082', '--host', '0.0.0.0'], {
  env,
  stdio: 'inherit'
});

expo.on('close', (code) => {
  console.log(`Expo terminé avec le code: ${code}`);
});

expo.on('error', (err) => {
  console.error('Erreur lors du démarrage d\'Expo:', err);
});
