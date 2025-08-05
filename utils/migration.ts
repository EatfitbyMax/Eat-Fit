import { PersistentStorage } from './storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

export class DataMigration {

  static async migrateToNewStorage(): Promise<void> {
    console.log('✅ Migration non nécessaire - Données déjà sur VPS');
  }

  static async initializeDefaultData(): Promise<void> {
    try {
      // Vérifier si des données existent déjà
      const programmes = await PersistentStorage.getProgrammes();
      const users = await PersistentStorage.getUsers();

      if (programmes.length === 0) {
        console.log('Initialisation des programmes par défaut...');
        await PersistentStorage.saveProgrammes([]);
      }

      if (users.length === 0) {
        console.log('Initialisation des utilisateurs par défaut...');
        await PersistentStorage.saveUsers([]);
      }

    } catch (error) {
      console.error('Erreur lors de l\'initialisation:', error);
      throw error;
    }
  }
}

// Exporter la fonction pour l'utiliser dans _layout.tsx
export const migrateExistingData = DataMigration.migrateToNewStorage;