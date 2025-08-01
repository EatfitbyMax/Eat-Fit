
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

async function debugLoginIssue() {
  const email = 'm.pacullmarquie@gmail.com';
  const password = 'MaxMax200303!';
  
  console.log('🔍 DEBUG COMPLET - Problème de connexion');
  console.log('====================================');
  
  // 1. Trouver le fichier utilisateur
  const clientDir = path.join(__dirname, '../server/data/Client');
  const files = fs.readdirSync(clientDir);
  let userFile = null;
  let userData = null;
  
  for (const file of files) {
    const filePath = path.join(clientDir, file);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (data.email === email) {
      userFile = filePath;
      userData = data;
      break;
    }
  }
  
  if (!userData) {
    console.log('❌ Utilisateur non trouvé');
    return;
  }
  
  console.log('👤 Utilisateur trouvé dans:', path.basename(userFile));
  console.log('📧 Email:', userData.email);
  console.log('🔐 Hash actuel:', userData.hashedPassword);
  console.log('📏 Longueur du hash:', userData.hashedPassword?.length || 'undefined');
  
  // 2. Tester tous les systèmes de hash possibles
  console.log('\n🧪 Test de tous les systèmes de hash:');
  
  const saltedPassword = password.trim() + 'eatfitbymax_salt_2025';
  
  // Système actuel (SHA256-HEX avec salt)
  const currentHash = crypto.createHash('sha256').update(saltedPassword).digest('hex');
  console.log('🔐 SHA256-HEX avec salt:', currentHash);
  console.log('✅ Correspond:', currentHash === userData.hashedPassword);
  
  // SHA256-HEX sans salt
  const sha256NoSalt = crypto.createHash('sha256').update(password.trim()).digest('hex');
  console.log('🔐 SHA256-HEX sans salt:', sha256NoSalt);
  console.log('✅ Correspond:', sha256NoSalt === userData.hashedPassword);
  
  // SHA256-Base64 avec salt
  const base64Hash = crypto.createHash('sha256').update(saltedPassword).digest('base64');
  console.log('🔐 SHA256-Base64 avec salt:', base64Hash);
  console.log('✅ Correspond:', base64Hash === userData.hashedPassword);
  
  // MD5 avec salt
  const md5WithSalt = crypto.createHash('md5').update(saltedPassword).digest('hex');
  console.log('🔐 MD5 avec salt:', md5WithSalt);
  console.log('✅ Correspond:', md5WithSalt === userData.hashedPassword);
  
  // MD5 sans salt
  const md5NoSalt = crypto.createHash('md5').update(password.trim()).digest('hex');
  console.log('🔐 MD5 sans salt:', md5NoSalt);
  console.log('✅ Correspond:', md5NoSalt === userData.hashedPassword);
  
  // Mot de passe en clair
  console.log('🔓 Mot de passe en clair:', password.trim());
  console.log('✅ Correspond:', password.trim() === userData.hashedPassword);
  
  // 3. Forcer la mise à jour avec le bon hash
  console.log('\n🔧 Correction forcée du hash...');
  
  userData.hashedPassword = currentHash;
  userData.password = undefined; // Supprimer l'ancien champ
  
  fs.writeFileSync(userFile, JSON.stringify(userData, null, 2));
  console.log('✅ Hash corrigé et sauvegardé');
  console.log('🔐 Nouveau hash:', currentHash);
  
  // 4. Vérification finale
  console.log('\n✅ Vérification finale...');
  const updatedData = JSON.parse(fs.readFileSync(userFile, 'utf8'));
  console.log('📁 Hash dans le fichier:', updatedData.hashedPassword);
  console.log('🔐 Hash calculé:', currentHash);
  console.log('✅ Correspondance:', updatedData.hashedPassword === currentHash);
  
  console.log('\n🎉 Correction terminée ! Vous devriez maintenant pouvoir vous connecter.');
}

debugLoginIssue().catch(console.error);
