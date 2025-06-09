
const { PersistentStorage } = require('../utils/storage');

async function syncAllData() {
  try {
    console.log('🔄 Début de la synchronisation...');
    
    // Tester la connexion
    const isConnected = await PersistentStorage.testConnection();
    if (!isConnected) {
      console.log('❌ Serveur VPS non disponible');
      return;
    }
    
    console.log('✅ Serveur VPS connecté');
    
    // Synchroniser les données
    await PersistentStorage.syncData();
    
    // Vérifier les données synchronisées
    const users = await PersistentStorage.getUsers();
    const programmes = await PersistentStorage.getProgrammes();
    
    console.log(`📊 Données synchronisées:`);
    console.log(`   - ${users.length} utilisateurs`);
    console.log(`   - ${programmes.length} programmes`);
    
    console.log('✅ Synchronisation terminée avec succès');
    
  } catch (error) {
    console.error('❌ Erreur lors de la synchronisation:', error);
  }
}

syncAllData();
