
import { Client } from '@replit/object-storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

const client = new Client();
const PROGRAMMES_FILE = 'programmes_coach.json';
const USERS_FILE = 'users.json';

export class PersistentStorage {
  // Helper pour vérifier si Object Storage est disponible
  private static async isObjectStorageAvailable(): Promise<boolean> {
    try {
      // Test simple pour voir si Object Storage fonctionne
      await client.list();
      return true;
    } catch (error) {
      console.log('Object Storage non disponible, utilisation d\'AsyncStorage');
      return false;
    }
  }

  // Programmes storage
  static async getProgrammes(): Promise<any[]> {
    try {
      const useObjectStorage = await this.isObjectStorageAvailable();
      
      if (useObjectStorage) {
        const data = await client.downloadAsText(PROGRAMMES_FILE);
        return JSON.parse(data);
      } else {
        // Fallback vers AsyncStorage
        const data = await AsyncStorage.getItem('programmes_coach');
        return data ? JSON.parse(data) : [];
      }
    } catch (error) {
      console.log('Aucun fichier programmes trouvé, initialisation avec tableau vide');
      return [];
    }
  }

  static async saveProgrammes(programmes: any[]): Promise<void> {
    try {
      const useObjectStorage = await this.isObjectStorageAvailable();
      
      if (useObjectStorage) {
        await client.uploadFromText(PROGRAMMES_FILE, JSON.stringify(programmes, null, 2));
        console.log('Programmes sauvegardés dans Object Storage');
      } else {
        // Fallback vers AsyncStorage
        await AsyncStorage.setItem('programmes_coach', JSON.stringify(programmes));
        console.log('Programmes sauvegardés dans AsyncStorage');
      }
    } catch (error) {
      console.error('Erreur sauvegarde programmes:', error);
      // En cas d'erreur, essayer AsyncStorage comme dernier recours
      try {
        await AsyncStorage.setItem('programmes_coach', JSON.stringify(programmes));
        console.log('Programmes sauvegardés dans AsyncStorage (fallback)');
      } catch (fallbackError) {
        console.error('Erreur fallback AsyncStorage:', fallbackError);
        throw error;
      }
    }
  }

  // Users storage
  static async getUsers(): Promise<any[]> {
    try {
      const useObjectStorage = await this.isObjectStorageAvailable();
      
      if (useObjectStorage) {
        const data = await client.downloadAsText(USERS_FILE);
        return JSON.parse(data);
      } else {
        // Fallback vers AsyncStorage
        const data = await AsyncStorage.getItem('users');
        return data ? JSON.parse(data) : [];
      }
    } catch (error) {
      console.log('Aucun fichier utilisateurs trouvé');
      return [];
    }
  }

  static async saveUsers(users: any[]): Promise<void> {
    try {
      const useObjectStorage = await this.isObjectStorageAvailable();
      
      if (useObjectStorage) {
        await client.uploadFromText(USERS_FILE, JSON.stringify(users, null, 2));
        console.log('Utilisateurs sauvegardés dans Object Storage');
      } else {
        // Fallback vers AsyncStorage
        await AsyncStorage.setItem('users', JSON.stringify(users));
        console.log('Utilisateurs sauvegardés dans AsyncStorage');
      }
    } catch (error) {
      console.error('Erreur sauvegarde utilisateurs:', error);
      // En cas d'erreur, essayer AsyncStorage comme dernier recours
      try {
        await AsyncStorage.setItem('users', JSON.stringify(users));
        console.log('Utilisateurs sauvegardés dans AsyncStorage (fallback)');
      } catch (fallbackError) {
        console.error('Erreur fallback AsyncStorage:', fallbackError);
        throw error;
      }
    }
  }

  // Backup AsyncStorage data to Object Storage
  static async backupAsyncStorageData(): Promise<void> {
    try {
      const useObjectStorage = await this.isObjectStorageAvailable();
      
      if (!useObjectStorage) {
        console.log('Object Storage non disponible, skip backup');
        return;
      }
      
      // Backup programmes
      const programmesData = await AsyncStorage.getItem('programmes_coach');
      if (programmesData) {
        const programmes = JSON.parse(programmesData);
        await client.uploadFromText(PROGRAMMES_FILE, JSON.stringify(programmes, null, 2));
        console.log(`${programmes.length} programmes sauvegardés vers Object Storage`);
      }

      // Backup users
      const usersData = await AsyncStorage.getItem('users');
      if (usersData) {
        const users = JSON.parse(usersData);
        await client.uploadFromText(USERS_FILE, JSON.stringify(users, null, 2));
        console.log(`${users.length} utilisateurs sauvegardés vers Object Storage`);
      }
    } catch (error) {
      console.error('Erreur backup AsyncStorage:', error);
    }
  }
}
