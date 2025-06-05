
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PersistentStorage } from './storage';

export async function migrateExistingData(): Promise<void> {
  console.log('🔄 Vérification des données existantes...');
  
  try {
    // Vérifier s'il y a des données à migrer
    const programmesData = await AsyncStorage.getItem('programmes_coach');
    const usersData = await AsyncStorage.getItem('users');
    
    if (programmesData || usersData) {
      console.log('📦 Données trouvées, tentative de backup vers Object Storage...');
      
      // Essayer de sauvegarder vers Object Storage si disponible
      await PersistentStorage.backupAsyncStorageData();
    } else {
      console.log('✅ Aucune donnée à migrer');
    }

    console.log('🎉 Vérification terminée !');
  } catch (error) {
    console.error('⚠️ Erreur lors de la vérification (non critique):', error);
    // Ne pas faire échouer l'app pour une erreur de migration
  }
}
