
const fs = require('fs').promises;
const path = require('path');

async function cleanEmptyAccount() {
  try {
    const dataPath = path.join(__dirname, '../server/data/Client');
    
    // Lire tous les fichiers dans le dossier Client
    const files = await fs.readdir(dataPath);
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = path.join(dataPath, file);
        const content = await fs.readFile(filePath, 'utf8');
        const userData = JSON.parse(content);
        
        // Vérifier si c'est le compte "bonjour champion" vide
        if (userData.firstName === 'bonjour' || 
            userData.lastName === 'champion' ||
            (userData.firstName === '' && userData.lastName === '' && !userData.email)) {
          console.log(`Suppression du compte vide: ${file}`);
          await fs.unlink(filePath);
        }
      }
    }
    
    console.log('✅ Nettoyage terminé');
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error);
  }
}

cleanEmptyAccount();
