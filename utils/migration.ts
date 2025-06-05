
import { PersistentStorage } from './storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

export class DataMigration {
  
  static async migrateToNewStorage(): Promise<void> {
    try {
      console.log('Début de la migration des données...');
      
      // Vérifier s'il y a des données existantes
      const existingProgrammes = await PersistentStorage.getProgrammes();
      const existingUsers = await PersistentStorage.getUsers();
      
      if (existingProgrammes.length > 0 || existingUsers.length > 0) {
        console.log(`Migration: ${existingProgrammes.length} programmes et ${existingUsers.length} utilisateurs déjà présents`);
        return;
      }
      
      console.log('Migration terminée');
      
    } catch (error) {
      console.error('Erreur lors de la migration:', error);
      throw error;
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
