
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

const BACKUP_DIR = path.join(__dirname, '..', 'backups');

async function listAvailableBackups() {
  if (!fs.existsSync(BACKUP_DIR)) {
    console.log('❌ Aucun répertoire de sauvegarde trouvé');
    return [];
  }
  
  const backups = fs.readdirSync(BACKUP_DIR)
    .filter(file => file.startsWith('eatfitbymax-backup-') && file.endsWith('.tar.gz'))
    .sort()
    .reverse();
  
  return backups;
}

async function restoreBackup(backupName) {
  console.log(`🔄 Restauration de la sauvegarde: ${backupName}`);
  
  const backupPath = path.join(BACKUP_DIR, backupName);
  const restoreDir = path.join(__dirname, '..', 'restored-backup');
  
  try {
    // Créer le répertoire de restauration
    if (fs.existsSync(restoreDir)) {
      await execAsync(`rm -rf "${restoreDir}"`);
    }
    fs.mkdirSync(restoreDir, { recursive: true });
    
    // Extraire l'archive
    console.log('📦 Extraction de l\'archive...');
    await execAsync(`tar -xzf "${backupPath}" -C "${restoreDir}"`);
    
    // Lire les informations de sauvegarde
    const extractedDir = fs.readdirSync(restoreDir)[0];
    const backupInfoPath = path.join(restoreDir, extractedDir, 'backup-info.json');
    
    if (fs.existsSync(backupInfoPath)) {
      const backupInfo = JSON.parse(fs.readFileSync(backupInfoPath, 'utf8'));
      console.log('📋 Informations de la sauvegarde:');
      console.log(`   - Date: ${new Date(backupInfo.timestamp).toLocaleString('fr-FR')}`);
      console.log(`   - Version: ${backupInfo.version}`);
      console.log(`   - Environment: ${backupInfo.environment}`);
    }
    
    console.log('✅ Sauvegarde extraite avec succès');
    console.log(`📁 Emplacement: ${path.join(restoreDir, extractedDir)}`);
    console.log('\n📝 Instructions de restauration:');
    console.log('1. Copier les fichiers nécessaires dans votre projet');
    console.log('2. Installer les dépendances: npm install');
    console.log('3. Configurer les variables d\'environnement');
    console.log('4. Démarrer l\'application: npx expo start');
    
  } catch (error) {
    console.error('❌ Erreur lors de la restauration:', error);
  }
}

async function main() {
  console.log('🔍 Recherche des sauvegardes disponibles...');
  
  const backups = await listAvailableBackups();
  
  if (backups.length === 0) {
    console.log('❌ Aucune sauvegarde trouvée');
    return;
  }
  
  console.log(`📋 Sauvegardes disponibles (${backups.length}):`);
  backups.forEach((backup, index) => {
    console.log(`   ${index + 1}. ${backup}`);
  });
  
  // Pour cet exemple, on restaure la sauvegarde la plus récente
  console.log(`\n🔄 Restauration de la sauvegarde la plus récente...`);
  await restoreBackup(backups[0]);
}

main();
