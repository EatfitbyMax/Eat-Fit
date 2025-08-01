
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

// Fonction pour corriger le hash d'un utilisateur spécifique
async function fixUserPasswordHash(email, password) {
  try {
    console.log('🔧 Correction du hash pour:', email);
    
    const clientDir = path.join(__dirname, '../server/data/Client');
    const files = await fs.readdir(clientDir);
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = path.join(clientDir, file);
        const userData = JSON.parse(await fs.readFile(filePath, 'utf8'));
        
        if (userData.email === email) {
          console.log('👤 Utilisateur trouvé dans:', file);
          console.log('🔐 Hash actuel:', userData.hashedPassword);
          
          // Générer le nouveau hash compatible avec Expo Crypto
          const saltedPassword = password.trim() + 'eatfitbymax_salt_2025';
          const newHash = crypto.createHash('sha256').update(saltedPassword).digest('hex');
          
          console.log('🔐 Nouveau hash:', newHash);
          
          // Mettre à jour l'utilisateur
          userData.hashedPassword = newHash;
          userData.password = undefined; // Supprimer l'ancien champ password si il existe
          
          // Sauvegarder
          await fs.writeFile(filePath, JSON.stringify(userData, null, 2));
          console.log('✅ Hash corrigé et sauvegardé');
          return true;
        }
      }
    }
    
    console.log('❌ Utilisateur non trouvé');
    return false;
    
  } catch (error) {
    console.error('❌ Erreur correction hash:', error);
    return false;
  }
}

// Script principal
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('Usage: node scripts/fix-password-hash.js <email> <password>');
    console.log('Exemple: node scripts/fix-password-hash.js m.pacullmarquie@gmail.com monmotdepasse');
    return;
  }
  
  const [email, password] = args;
  await fixUserPasswordHash(email, password);
}

if (require.main === module) {
  main();
}

module.exports = { fixUserPasswordHash };
