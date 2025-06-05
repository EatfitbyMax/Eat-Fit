
import { Client } from '@replit/object-storage';

const client = new Client();
const PROGRAMMES_FILE = 'programmes_coach.json';
const USERS_FILE = 'users.json';

export class PersistentStorage {
  // Programmes storage
  static async getProgrammes(): Promise<any[]> {
    try {
      const data = await client.downloadAsText(PROGRAMMES_FILE);
      return JSON.parse(data);
    } catch (error) {
      console.log('Aucun fichier programmes trouvé, initialisation avec tableau vide');
      return [];
    }
  }

  static async saveProgrammes(programmes: any[]): Promise<void> {
    try {
      await client.uploadFromText(PROGRAMMES_FILE, JSON.stringify(programmes, null, 2));
      console.log('Programmes sauvegardés dans Object Storage');
    } catch (error) {
      console.error('Erreur sauvegarde programmes:', error);
      throw error;
    }
  }

  // Users storage
  static async getUsers(): Promise<any[]> {
    try {
      const data = await client.downloadAsText(USERS_FILE);
      return JSON.parse(data);
    } catch (error) {
      console.log('Aucun fichier utilisateurs trouvé');
      return [];
    }
  }

  static async saveUsers(users: any[]): Promise<void> {
    try {
      await client.uploadFromText(USERS_FILE, JSON.stringify(users, null, 2));
      console.log('Utilisateurs sauvegardés dans Object Storage');
    } catch (error) {
      console.error('Erreur sauvegarde utilisateurs:', error);
      throw error;
    }
  }

  // Backup AsyncStorage data to Object Storage
  static async backupAsyncStorageData(): Promise<void> {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      
      // Backup programmes
      const programmesData = await AsyncStorage.getItem('programmes_coach');
      if (programmesData) {
        const programmes = JSON.parse(programmesData);
        await this.saveProgrammes(programmes);
        console.log(`${programmes.length} programmes sauvegardés vers Object Storage`);
      }

      // Backup users
      const usersData = await AsyncStorage.getItem('users');
      if (usersData) {
        const users = JSON.parse(usersData);
        await this.saveUsers(users);
        console.log(`${users.length} utilisateurs sauvegardés vers Object Storage`);
      }
    } catch (error) {
      console.error('Erreur backup AsyncStorage:', error);
    }
  }
}
