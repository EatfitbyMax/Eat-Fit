import { PersistentStorage } from './storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

export class DataMigration {

  static async migrateToNewStorage(): Promise<void> {
    try {
      console.log('Début de la migration des données...');

      // Vérifier la connectivité au serveur VPS
      const isConnected = await PersistentStorage.testConnection();
      if (!isConnected) {
        console.log('⚠️ Serveur VPS indisponible, migration différée');
        return;
      }

      // Vérifier s'il y a des données existantes
      let existingProgrammes = [];
      let existingUsers = [];
      
      try {
        existingProgrammes = await PersistentStorage.getProgrammes();
        existingUsers = await PersistentStorage.getUsers();
      } catch (error) {
        console.warn('Erreur lors de la vérification des données existantes:', error);
        return;
      }

      if (existingProgrammes.length > 0 || existingUsers.length > 0) {
        console.log(`Migration: ${existingProgrammes.length} programmes et ${existingUsers.length} utilisateurs déjà présents`);
        return;
      }

      console.log('Migration terminée');

    } catch (error) {
      console.warn('Migration échouée - serveur VPS non accessible, données conservées localement');
      // Ne pas rethrow l'erreur pour permettre à l'app de continuer
    }
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