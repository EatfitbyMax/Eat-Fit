
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const crypto = require('crypto');

const VPS_HOST = "ubuntu@vps-68f3d9a8.ovh.net";
const VPS_PATH = "/home/ubuntu/Eat-Fit/server/data";
const LOCAL_DATA_DIR = path.join(__dirname, '..', 'server', 'data');

console.log('🔄 Synchronisation des données depuis le VPS...');

// Fonction pour exécuter une commande SSH
function sshCommand(command) {
  return new Promise((resolve, reject) => {
    exec(`ssh ${VPS_HOST} "${command}"`, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      resolve({ stdout, stderr });
    });
  });
}

// Fonction pour copier un fichier depuis le VPS
function scpFile(remoteFile, localFile) {
  return new Promise((resolve, reject) => {
    exec(`scp ${VPS_HOST}:${remoteFile} ${localFile}`, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      resolve({ stdout, stderr });
    });
  });
}

async function syncFromVPS() {
  try {
    // Créer le dossier local s'il n'existe pas
    if (!fs.existsSync(LOCAL_DATA_DIR)) {
      fs.mkdirSync(LOCAL_DATA_DIR, { recursive: true });
    }

    console.log('📋 Liste des fichiers sur le VPS...');
    const { stdout } = await sshCommand(`ls -la ${VPS_PATH}`);
    console.log(stdout);

    // Récupérer les fichiers principaux
    const mainFiles = ['users.json', 'coaches.json'];
    
    for (const file of mainFiles) {
      try {
        console.log(`📥 Téléchargement de ${file}...`);
        await scpFile(`${VPS_PATH}/${file}`, path.join(LOCAL_DATA_DIR, file));
        console.log(`✅ ${file} synchronisé`);
      } catch (error) {
        console.error(`❌ Erreur synchronisation ${file}:`, error.message);
      }
    }

    // Analyser les données utilisateur
    console.log('\n🔍 Analyse des données utilisateur...');
    
    if (fs.existsSync(path.join(LOCAL_DATA_DIR, 'users.json'))) {
      const users = JSON.parse(fs.readFileSync(path.join(LOCAL_DATA_DIR, 'users.json'), 'utf8'));
      console.log(`👥 ${users.length} utilisateurs trouvés`);
      
      users.forEach(user => {
        console.log(`📧 ${user.email} - Type: ${user.userType || 'client'} - Mot de passe: ${user.hashedPassword ? 'chiffré' : user.password ? 'clair' : 'manquant'}`);
      });
    }

    if (fs.existsSync(path.join(LOCAL_DATA_DIR, 'coaches.json'))) {
      const coaches = JSON.parse(fs.readFileSync(path.join(LOCAL_DATA_DIR, 'coaches.json'), 'utf8'));
      console.log(`👨‍💼 ${coaches.length} coaches trouvés`);
      
      coaches.forEach(coach => {
        console.log(`📧 ${coach.email} - Mot de passe: ${coach.hashedPassword ? 'chiffré' : coach.password ? 'clair' : 'manquant'}`);
      });
    }

    console.log('\n✅ Synchronisation terminée!');
    console.log('🔧 Exécutez maintenant le script de migration des mots de passe si nécessaire.');

  } catch (error) {
    console.error('❌ Erreur lors de la synchronisation:', error);
  }
}

syncFromVPS();
