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
      const existingProgrammes = await PersistentStorage.getProgrammes();
      const existingUsers = await PersistentStorage.getUsers();

      if (existingProgrammes.length > 0 || existingUsers.length > 0) {
        console.log(`Migration: ${existingProgrammes.length} programmes et ${existingUsers.length} utilisateurs déjà présents`);
        return;
      }

      console.log('Migration terminée');

    } catch (error) {
      console.warn('Migration échouée - serveur VPS non accessible, données conservées localement:', error);
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

const migrateToVPS = async (): Promise<void> => {
  try {
    console.log('Début de la migration des données...');

    const vpsUrl = process.env.EXPO_PUBLIC_VPS_URL || 'http://51.178.29.220:5000';
    const isVPSAvailable = await testServerConnection(vpsUrl);

    if (!isVPSAvailable) {
      console.log('⚠️ Serveur VPS indisponible, migration différée');
      return;
    }

    // Migration logic here...

  } catch (error) {
    console.error('Erreur lors de la migration:', error);
    // Ne pas faire planter l'app pour une erreur de migration
    return;
  }
};