
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PersistentStorage } from './storage';

export async function migrateExistingData(): Promise<void> {
  console.log('🔄 Démarrage de la migration des données...');
  
  try {
    // Migrer les programmes
    const programmesData = await AsyncStorage.getItem('programmes_coach');
    if (programmesData) {
      const programmes = JSON.parse(programmesData);
      await PersistentStorage.saveProgrammes(programmes);
      console.log(`✅ ${programmes.length} programmes migrés vers Object Storage`);
    }

    // Migrer les utilisateurs
    const usersData = await AsyncStorage.getItem('users');
    if (usersData) {
      const users = JSON.parse(usersData);
      await PersistentStorage.saveUsers(users);
      console.log(`✅ ${users.length} utilisateurs migrés vers Object Storage`);
    }

    // Migrer l'utilisateur actuel
    const currentUserData = await AsyncStorage.getItem('currentUser');
    if (currentUserData) {
      console.log('✅ Utilisateur actuel préservé');
    }

    console.log('🎉 Migration terminée avec succès !');
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
  }
}
