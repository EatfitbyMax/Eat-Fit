
import AsyncStorage from '@react-native-async-storage/async-storage';

const SERVER_URL = 'http://51.178.29.220:5000';

export class PersistentStorage {
  // Test de connexion au serveur
  static async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${SERVER_URL}/api/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 5000,
      });
      return response.ok;
    } catch (error) {
      console.log('Serveur VPS non disponible, utilisation du stockage local');
      return false;
    }
  }

  // Programmes storage
  static async getProgrammes(): Promise<any[]> {
    try {
      const isServerAvailable = await this.testConnection();
      
      if (isServerAvailable) {
        const response = await fetch(`${SERVER_URL}/api/programmes`);
        if (response.ok) {
          const data = await response.json();
          console.log('Programmes récupérés depuis le serveur VPS');
          return data;
        }
      }
      
      // Fallback vers AsyncStorage
      const data = await AsyncStorage.getItem('programmes_coach');
      console.log('Programmes récupérés depuis le stockage local');
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.log('Erreur récupération programmes, utilisation du stockage local');
      const data = await AsyncStorage.getItem('programmes_coach');
      return data ? JSON.parse(data) : [];
    }
  }

  static async saveProgrammes(programmes: any[]): Promise<void> {
    try {
      const isServerAvailable = await this.testConnection();
      
      if (isServerAvailable) {
        const response = await fetch(`${SERVER_URL}/api/programmes`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(programmes),
        });
        
        if (response.ok) {
          console.log('Programmes sauvegardés sur le serveur VPS');
          // Sauvegarder aussi localement comme backup
          await AsyncStorage.setItem('programmes_coach', JSON.stringify(programmes));
          return;
        }
      }
      
      // Fallback vers AsyncStorage
      await AsyncStorage.setItem('programmes_coach', JSON.stringify(programmes));
      console.log('Programmes sauvegardés dans le stockage local');
    } catch (error) {
      console.error('Erreur sauvegarde programmes:', error);
      // Fallback vers AsyncStorage
      await AsyncStorage.setItem('programmes_coach', JSON.stringify(programmes));
    }
  }

  // Users storage
  static async getUsers(): Promise<any[]> {
    try {
      const isServerAvailable = await this.testConnection();
      
      if (isServerAvailable) {
        const response = await fetch(`${SERVER_URL}/api/users`);
        if (response.ok) {
          const data = await response.json();
          console.log('Utilisateurs récupérés depuis le serveur VPS');
          return data;
        }
      }
      
      // Fallback vers AsyncStorage
      const data = await AsyncStorage.getItem('users');
      console.log('Utilisateurs récupérés depuis le stockage local');
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.log('Erreur récupération utilisateurs, utilisation du stockage local');
      const data = await AsyncStorage.getItem('users');
      return data ? JSON.parse(data) : [];
    }
  }

  static async saveUsers(users: any[]): Promise<void> {
    try {
      const isServerAvailable = await this.testConnection();
      
      if (isServerAvailable) {
        const response = await fetch(`${SERVER_URL}/api/users`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(users),
        });
        
        if (response.ok) {
          console.log('Utilisateurs sauvegardés sur le serveur VPS');
          // Sauvegarder aussi localement comme backup
          await AsyncStorage.setItem('users', JSON.stringify(users));
          return;
        }
      }
      
      // Fallback vers AsyncStorage
      await AsyncStorage.setItem('users', JSON.stringify(users));
      console.log('Utilisateurs sauvegardés dans le stockage local');
    } catch (error) {
      console.error('Erreur sauvegarde utilisateurs:', error);
      // Fallback vers AsyncStorage
      await AsyncStorage.setItem('users', JSON.stringify(users));
    }
  }

  // Messages storage
  static async getMessages(userId: string): Promise<any[]> {
    try {
      const isServerAvailable = await this.testConnection();
      
      if (isServerAvailable) {
        const response = await fetch(`${SERVER_URL}/api/messages/${userId}`);
        if (response.ok) {
          const data = await response.json();
          console.log('Messages récupérés depuis le serveur VPS');
          return data;
        }
      }
      
      // Fallback vers AsyncStorage
      const data = await AsyncStorage.getItem(`messages_${userId}`);
      console.log('Messages récupérés depuis le stockage local');
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.log('Erreur récupération messages, utilisation du stockage local');
      const data = await AsyncStorage.getItem(`messages_${userId}`);
      return data ? JSON.parse(data) : [];
    }
  }

  static async saveMessages(userId: string, messages: any[]): Promise<void> {
    try {
      const isServerAvailable = await this.testConnection();
      
      if (isServerAvailable) {
        const response = await fetch(`${SERVER_URL}/api/messages/${userId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(messages),
        });
        
        if (response.ok) {
          console.log('Messages sauvegardés sur le serveur VPS');
          // Sauvegarder aussi localement comme backup
          await AsyncStorage.setItem(`messages_${userId}`, JSON.stringify(messages));
          return;
        }
      }
      
      // Fallback vers AsyncStorage
      await AsyncStorage.setItem(`messages_${userId}`, JSON.stringify(messages));
      console.log('Messages sauvegardés dans le stockage local');
    } catch (error) {
      console.error('Erreur sauvegarde messages:', error);
      // Fallback vers AsyncStorage
      await AsyncStorage.setItem(`messages_${userId}`, JSON.stringify(messages));
    }
  }

  // Méthodes utilitaires
  static async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove(['programmes_coach', 'users', 'current_user']);
      console.log('Toutes les données locales ont été supprimées');
    } catch (error) {
      console.error('Erreur lors de la suppression des données:', error);
      throw error;
    }
  }

  static async exportData(): Promise<{programmes: any[], users: any[]}> {
    try {
      const programmes = await this.getProgrammes();
      const users = await this.getUsers();
      return { programmes, users };
    } catch (error) {
      console.error('Erreur lors de l\'export des données:', error);
      throw error;
    }
  }

  static async importData(data: {programmes: any[], users: any[]}): Promise<void> {
    try {
      await this.saveProgrammes(data.programmes || []);
      await this.saveUsers(data.users || []);
      console.log('Données importées avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'import des données:', error);
      throw error;
    }
  }

  // Synchronisation entre local et serveur
  static async syncData(): Promise<void> {
    try {
      const isServerAvailable = await this.testConnection();
      
      if (isServerAvailable) {
        console.log('Synchronisation des données avec le serveur VPS...');
        
        // Récupérer les données du serveur
        const serverProgrammes = await fetch(`${SERVER_URL}/api/programmes`).then(r => r.json());
        const serverUsers = await fetch(`${SERVER_URL}/api/users`).then(r => r.json());
        
        // Sauvegarder localement
        await AsyncStorage.setItem('programmes_coach', JSON.stringify(serverProgrammes));
        await AsyncStorage.setItem('users', JSON.stringify(serverUsers));
        
        console.log('Synchronisation terminée');
      }
    } catch (error) {
      console.error('Erreur lors de la synchronisation:', error);
    }
  }
}

// Fonctions utilitaires pour l'export
export const getAllUsers = async () => {
  return await PersistentStorage.getUsers();
};

export const getAllProgrammes = async () => {
  return await PersistentStorage.getProgrammes();
};

export const saveUser = async (user: any) => {
  const users = await PersistentStorage.getUsers();
  const existingIndex = users.findIndex(u => u.id === user.id || u.email === user.email);
  
  if (existingIndex !== -1) {
    users[existingIndex] = user;
  } else {
    users.push(user);
  }
  
  await PersistentStorage.saveUsers(users);
};

export const saveProgramme = async (programme: any) => {
  const programmes = await PersistentStorage.getProgrammes();
  const existingIndex = programmes.findIndex(p => p.id === programme.id);
  
  if (existingIndex !== -1) {
    programmes[existingIndex] = programme;
  } else {
    programmes.push(programme);
  }
  
  await PersistentStorage.saveProgrammes(programmes);
};
