
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const VPS_CONFIG = {
  host: '51.178.29.220',
  user: 'ubuntu',
  appPath: '/home/ubuntu/eatfitbymax-server',
  port: 22
};

async function deployToVPS() {
  console.log('🚀 Début du déploiement sur le VPS Ubuntu...');
  
  try {
    // 1. Préparer les fichiers pour le déploiement
    console.log('📦 Préparation des fichiers...');
    
    // Copier les fichiers du serveur vers un dossier temporaire
    const deployDir = path.join(__dirname, '../deploy-temp');
    
    // Créer le dossier de déploiement
    if (fs.existsSync(deployDir)) {
      await execCommand(`rm -rf ${deployDir}`);
    }
    await execCommand(`mkdir -p ${deployDir}`);
    
    // Copier les fichiers essentiels
    await execCommand(`cp -r server/* ${deployDir}/`);
    await execCommand(`cp .env ${deployDir}/.env`);
    
    console.log('✅ Fichiers préparés');
    
    // 2. Synchroniser avec le VPS
    console.log('🔄 Synchronisation avec le VPS...');
    
    const rsyncCommand = `rsync -avz --delete ${deployDir}/ ${VPS_CONFIG.user}@${VPS_CONFIG.host}:${VPS_CONFIG.appPath}/`;
    await execCommand(rsyncCommand);
    
    console.log('✅ Fichiers synchronisés');
    
    // 3. Installer les dépendances et redémarrer le service sur le VPS
    console.log('🔧 Installation des dépendances sur le VPS...');
    
    const sshCommands = [
      `cd ${VPS_CONFIG.appPath}`,
      'npm install --production',
      'pm2 stop eatfitbymax-server || true',
      'pm2 delete eatfitbymax-server || true',
      'pm2 start server.js --name "eatfitbymax-server" --env production',
      'pm2 save'
    ];
    
    const sshCommand = `ssh ${VPS_CONFIG.user}@${VPS_CONFIG.host} "${sshCommands.join(' && ')}"`;
    await execCommand(sshCommand);
    
    console.log('✅ Application déployée et redémarrée');
    
    // 4. Nettoyer les fichiers temporaires
    await execCommand(`rm -rf ${deployDir}`);
    
    console.log('🎉 Déploiement terminé avec succès !');
    console.log(`🌐 Application accessible sur : http://${VPS_CONFIG.host}:5000`);
    
  } catch (error) {
    console.error('❌ Erreur lors du déploiement:', error.message);
    process.exit(1);
  }
}

function execCommand(command) {
  return new Promise((resolve, reject) => {
    console.log(`Exécution: ${command}`);
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      if (stdout) console.log(stdout);
      if (stderr) console.warn(stderr);
      resolve(stdout);
    });
  });
}

// Lancer le déploiement si le script est exécuté directement
if (require.main === module) {
  deployToVPS();
}

module.exports = { deployToVPS };
