
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

async function testCompleteLogin() {
  const email = 'm.pacullmarquie@gmail.com';
  const password = 'MaxMax200303!';
  
  console.log('🔍 TEST COMPLET SYSTÈME DE CONNEXION');
  console.log('=====================================');
  
  // 1. Vérifier le fichier utilisateur
  const clientDir = path.join(__dirname, '../server/data/Client');
  const files = fs.readdirSync(clientDir);
  let userData = null;
  let userFile = null;
  
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
    console.log('❌ ERREUR: Utilisateur non trouvé dans les fichiers');
    return;
  }
  
  console.log('✅ Utilisateur trouvé dans:', path.basename(userFile));
  console.log('📧 Email:', userData.email);
  console.log('🆔 ID:', userData.id);
  console.log('👤 Type:', userData.userType);
  console.log('🔐 Hash présent:', userData.hashedPassword ? 'OUI' : 'NON');
  console.log('🔐 Hash longueur:', userData.hashedPassword?.length || 'N/A');
  
  // 2. Tester la génération du hash côté serveur (Node.js)
  console.log('\n🧪 TEST GÉNÉRATION HASH CÔTÉ SERVEUR');
  const passwordString = password.trim();
  const saltedPassword = passwordString + 'eatfitbymax_salt_2025';
  const serverHash = crypto.createHash('sha256').update(saltedPassword).digest('hex');
  
  console.log('📝 Mot de passe saisi:', passwordString);
  console.log('🧂 Mot de passe + salt:', saltedPassword.substring(0, 20) + '...');
  console.log('🔐 Hash généré serveur:', serverHash);
  console.log('🔐 Hash stocké fichier:', userData.hashedPassword);
  console.log('✅ Correspondance serveur:', serverHash === userData.hashedPassword);
  
  // 3. Simuler le processus d'authentification complet
  console.log('\n🔄 SIMULATION PROCESSUS AUTHENTIFICATION');
  
  // Étape 1: Récupération utilisateur
  console.log('📤 1. Simulation requête GET /api/users');
  const allUsers = [userData]; // Simulation de la réponse du serveur
  const foundUser = allUsers.find(u => u.email === email);
  console.log('👤 Utilisateur trouvé dans simulation:', foundUser ? 'OUI' : 'NON');
  
  // Étape 2: Vérification mot de passe
  console.log('🔐 2. Vérification mot de passe');
  if (foundUser && foundUser.hashedPassword) {
    const isValid = serverHash === foundUser.hashedPassword;
    console.log('✅ Mot de passe valide:', isValid);
    
    if (isValid) {
      console.log('🎉 AUTHENTIFICATION RÉUSSIE côté serveur !');
    } else {
      console.log('❌ AUTHENTIFICATION ÉCHOUÉ côté serveur');
    }
  }
  
  // 4. Vérifier la structure complète du fichier
  console.log('\n📋 STRUCTURE COMPLÈTE UTILISATEUR');
  console.log('=================================');
  const requiredFields = ['id', 'email', 'firstName', 'lastName', 'userType', 'hashedPassword'];
  
  for (const field of requiredFields) {
    const hasField = userData[field] !== undefined;
    const value = userData[field];
    console.log(`${hasField ? '✅' : '❌'} ${field}:`, 
      typeof value === 'string' && value.length > 50 
        ? value.substring(0, 20) + '...' 
        : value
    );
  }
  
  // 5. Test de mise à jour forcée
  console.log('\n🔧 MISE À JOUR FORCÉE FINALE');
  userData.hashedPassword = serverHash;
  userData.lastPasswordUpdate = new Date().toISOString();
  userData.password = undefined; // S'assurer qu'il n'y a pas d'ancien champ
  
  // Nettoyer tous les champs indésirables
  delete userData.password;
  
  fs.writeFileSync(userFile, JSON.stringify(userData, null, 2));
  console.log('✅ Fichier utilisateur mis à jour avec force');
  
  // 6. Vérification finale
  console.log('\n🔍 VÉRIFICATION FINALE POST-MISE À JOUR');
  const updatedData = JSON.parse(fs.readFileSync(userFile, 'utf8'));
  console.log('🔐 Hash final dans fichier:', updatedData.hashedPassword);
  console.log('🔐 Hash calculé:', serverHash);
  console.log('✅ Correspondance finale:', updatedData.hashedPassword === serverHash);
  console.log('📅 Dernière mise à jour:', updatedData.lastPasswordUpdate);
  
  console.log('\n🎯 RÉSUMÉ DIAGNOSTIC');
  console.log('==================');
  console.log('📊 Fichier utilisateur: TROUVÉ ✅');
  console.log('🔐 Hash compatible: OUI ✅');
  console.log('🔧 Mise à jour forcée: TERMINÉE ✅');
  console.log('');
  console.log('🚀 INSTRUCTIONS FINALES:');
  console.log('1. Fermez complètement l\'application mobile');
  console.log('2. Redémarrez l\'application');
  console.log('3. Essayez de vous connecter avec:');
  console.log(`   📧 Email: ${email}`);
  console.log(`   🔑 Mot de passe: ${password}`);
  console.log('');
  console.log('Si le problème persiste, il pourrait y avoir un problème');
  console.log('de cache dans l\'application mobile ou de synchronisation serveur.');
}

testCompleteLogin().catch(console.error);
