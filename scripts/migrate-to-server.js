
const AsyncStorage = require('@react-native-async-storage/async-storage');

const SERVER_URL = 'http://51.178.29.220:5000';

async function testConnection() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(`${SERVER_URL}/api/health-check`, {
      method: 'GET',
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.error('Erreur de connexion au serveur:', error.message);
    return false;
  }
}

async function migrateToServer() {
  try {
    console.log('🔄 Début de la migration vers le serveur...');
    
    // Tester la connexion
    const isConnected = await testConnection();
    if (!isConnected) {
      console.log('❌ Serveur VPS non disponible - migration impossible');
      return;
    }
    
    console.log('✅ Serveur VPS connecté');
    
    // Récupérer les données locales si elles existent
    const localUsers = JSON.parse(await AsyncStorage.getItem('users') || '[]');
    const localProgrammes = JSON.parse(await AsyncStorage.getItem('programmes_coach') || '[]');
    
    console.log(`📦 Données locales trouvées: ${localUsers.length} utilisateurs, ${localProgrammes.length} programmes`);
    
    if (localUsers.length > 0) {
      // Migrer les utilisateurs
      const response = await fetch(`${SERVER_URL}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(localUsers),
      });
      
      if (response.ok) {
        console.log('✅ Utilisateurs migrés vers le serveur');
      } else {
        console.log('❌ Erreur migration utilisateurs');
      }
    }
    
    if (localProgrammes.length > 0) {
      // Migrer les programmes
      const response = await fetch(`${SERVER_URL}/api/programmes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(localProgrammes),
      });
      
      if (response.ok) {
        console.log('✅ Programmes migrés vers le serveur');
      } else {
        console.log('❌ Erreur migration programmes');
      }
    }
    
    console.log('✅ Migration terminée avec succès');
    
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
  }
}

migrateToServer();
