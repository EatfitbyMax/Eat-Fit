
const fs = require('fs').promises;
const crypto = require('crypto');
const path = require('path');

// Fonction pour générer un hash unifié (même logique que l'app)
function generateUnifiedHash(password) {
  const passwordString = String(password).trim();
  const saltedPassword = passwordString + 'eatfitbymax_salt_2025';
  return crypto.createHash('sha256').update(saltedPassword).digest('hex');
}

async function migratePasswords() {
  try {
    console.log('🔄 Début de la migration des mots de passe...');

    const dataDir = path.join(__dirname, '../server/data');
    
    // Migrer les clients
    const usersPath = path.join(dataDir, 'users.json');
    try {
      const usersData = await fs.readFile(usersPath, 'utf8');
      const users = JSON.parse(usersData);
      let usersMigrated = 0;

      for (let user of users) {
        if (user.password && !user.hashedPassword) {
          // Migrer depuis mot de passe en clair
          user.hashedPassword = generateUnifiedHash(user.password);
          delete user.password;
          usersMigrated++;
          console.log(`✅ Client migré: ${user.email}`);
        } else if (user.hashedPassword && user.hashedPassword.length !== 64) {
          // Marquer pour re-hachage au prochain login
          console.log(`⚠️ Client nécessitera migration au login: ${user.email}`);
        }
      }

      if (usersMigrated > 0) {
        await fs.writeFile(usersPath, JSON.stringify(users, null, 2));
        console.log(`✅ ${usersMigrated} clients migrés`);
      }
    } catch (error) {
      console.log('📝 Aucun fichier users.json trouvé, création...');
      await fs.writeFile(usersPath, JSON.stringify([], null, 2));
    }

    // Migrer les coaches
    const coachesPath = path.join(dataDir, 'coaches.json');
    try {
      const coachesData = await fs.readFile(coachesPath, 'utf8');
      const coaches = JSON.parse(coachesData);
      let coachesMigrated = 0;

      for (let coach of coaches) {
        if (coach.password && !coach.hashedPassword) {
          // Migrer depuis mot de passe en clair
          coach.hashedPassword = generateUnifiedHash(coach.password);
          delete coach.password;
          coachesMigrated++;
          console.log(`✅ Coach migré: ${coach.email}`);
        } else if (coach.hashedPassword && coach.hashedPassword.length !== 64) {
          console.log(`⚠️ Coach nécessitera migration au login: ${coach.email}`);
        }
      }

      if (coachesMigrated > 0) {
        await fs.writeFile(coachesPath, JSON.stringify(coaches, null, 2));
        console.log(`✅ ${coachesMigrated} coaches migrés`);
      }
    } catch (error) {
      console.log('📝 Aucun fichier coaches.json trouvé, création...');
      await fs.writeFile(coachesPath, JSON.stringify([], null, 2));
    }

    console.log('✅ Migration des mots de passe terminée');
  } catch (error) {
    console.error('❌ Erreur migration:', error);
    process.exit(1);
  }
}

// Exécuter la migration si appelé directement
if (require.main === module) {
  migratePasswords();
}

module.exports = { migratePasswords, generateUnifiedHash };
