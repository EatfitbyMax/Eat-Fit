#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, '..', 'server', 'data');

// Fonction pour détecter le type de hash
function detectHashType(hash) {
  if (!hash) return 'none';
  if (hash.length === 32) return 'md5';
  if (hash.length === 44 && hash.includes('=')) return 'base64';
  if (hash.length === 64) return 'sha256';
  return 'unknown';
}

// Fonction pour migrer un mot de passe vers le système unifié
function migratePassword(user, password, currentHash) {
  const passwordString = String(password || '').trim();

  if (!passwordString) {
    console.warn(`⚠️ Mot de passe vide pour ${user.email}`);
    return null;
  }

  // Nouveau système unifié : SHA256 avec salt
  const saltedPassword = passwordString + 'eatfitbymax_salt_2025';
  return crypto.createHash('sha256').update(saltedPassword).digest('hex');
}

async function migratePasswords() {
  console.log('🔄 Début de la migration des mots de passe...');

  try {
    // Migrer les utilisateurs (clients)
    const usersPath = path.join(DATA_DIR, 'users.json');
    if (fs.existsSync(usersPath)) {
      const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
      let usersMigrated = 0;

      console.log(`\n👥 Analyse de ${users.length} utilisateurs...`);

      for (let user of users) {
        const hashType = detectHashType(user.hashedPassword);

        console.log(`📧 ${user.email}: ${hashType} ${user.password ? '+ mot de passe clair' : ''}`);

        let needsMigration = false;
        let passwordToMigrate = null;

        // Cas 1: Mot de passe en clair
        if (user.password && !user.hashedPassword) {
          passwordToMigrate = user.password;
          needsMigration = true;
          console.log(`  → Migration depuis mot de passe clair`);
        }
        // Cas 2: Hash ancien (MD5, Base64, etc.)
        else if (user.hashedPassword && hashType !== 'sha256') {
          // On ne peut pas migrer automatiquement les hashs anciens
          // sans connaître le mot de passe original
          console.log(`  → Hash ancien détecté (${hashType}), migration manuelle nécessaire`);
        }
        // Cas 3: Déjà au bon format
        else if (hashType === 'sha256') {
          console.log(`  → Déjà migré (SHA256)`);
        }

        // Effectuer la migration si nécessaire
        if (needsMigration && passwordToMigrate) {
          const newHash = migratePassword(user, passwordToMigrate, user.hashedPassword);
          if (newHash) {
            user.hashedPassword = newHash;
            delete user.password; // Supprimer le mot de passe en clair
            usersMigrated++;
            console.log(`  ✅ Migré vers SHA256`);
          }
        }
      }

      if (usersMigrated > 0) {
        fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
        console.log(`\n✅ ${usersMigrated} utilisateurs migrés et sauvegardés`);
      }
    }

    // Migrer les coaches
    const coachesPath = path.join(DATA_DIR, 'coaches.json');
    if (fs.existsSync(coachesPath)) {
      const coaches = JSON.parse(fs.readFileSync(coachesPath, 'utf8'));
      let coachesMigrated = 0;

      console.log(`\n👨‍💼 Analyse de ${coaches.length} coaches...`);

      for (let coach of coaches) {
        const hashType = detectHashType(coach.hashedPassword);

        console.log(`📧 ${coach.email}: ${hashType} ${coach.password ? '+ mot de passe clair' : ''}`);

        let needsMigration = false;
        let passwordToMigrate = null;

        // Cas 1: Mot de passe en clair
        if (coach.password && !coach.hashedPassword) {
          passwordToMigrate = coach.password;
          needsMigration = true;
          console.log(`  → Migration depuis mot de passe clair`);
        }
        // Cas 2: Hash ancien
        else if (coach.hashedPassword && hashType !== 'sha256') {
          console.log(`  → Hash ancien détecté (${hashType}), migration manuelle nécessaire`);
        }
        // Cas 3: Déjà au bon format
        else if (hashType === 'sha256') {
          console.log(`  → Déjà migré (SHA256)`);
        }

        // Effectuer la migration si nécessaire
        if (needsMigration && passwordToMigrate) {
          const newHash = migratePassword(coach, passwordToMigrate, coach.hashedPassword);
          if (newHash) {
            coach.hashedPassword = newHash;
            delete coach.password; // Supprimer le mot de passe en clair
            coachesMigrated++;
            console.log(`  ✅ Migré vers SHA256`);
          }
        }
      }

      if (coachesMigrated > 0) {
        fs.writeFileSync(coachesPath, JSON.stringify(coaches, null, 2));
        console.log(`\n✅ ${coachesMigrated} coaches migrés et sauvegardés`);
      }
    }

    console.log('\n✅ Migration des mots de passe terminée');
    console.log('\n💡 Pour les hashs anciens, les utilisateurs devront utiliser "Mot de passe oublié"');

  } catch (error) {
    console.error('❌ Erreur migration:', error);
  }
}

migratePasswords();