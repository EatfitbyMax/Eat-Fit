import AsyncStorage from '@react-native-async-storage/async-storage';

const SERVER_URL = process.env.EXPO_PUBLIC_VPS_URL || 'https://92639832-db54-4e84-9c74-32f38f762c1a-00-15y7a3x17pid7.kirk.replit.dev:5001';

export class PersistentStorage {
  // Test de connexion au serveur
  static async testConnection(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${SERVER_URL}/api/health-check`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      console.error('Erreur connexion serveur VPS:', error);
      return false; // Ne pas jeter d'erreur, retourner false
    }
  }

  // Programmes storage
  static async getProgrammes(): Promise<any[]> {
    try {
      await this.testConnection();
      const response = await fetch(`${SERVER_URL}/api/programmes`);
      if (response.ok) {
        const data = await response.json();
        console.log('Programmes récupérés depuis le serveur VPS');
        return data;
      }
      throw new Error('Erreur récupération programmes depuis le serveur');
    } catch (error) {
      console.error('Erreur récupération programmes:', error);
      throw error;
    }
  }

  static async saveProgrammes(programmes: any[]): Promise<void> {
    try {
      await this.testConnection();
      const response = await fetch(`${SERVER_URL}/api/programmes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(programmes),
      });

      if (response.ok) {
        console.log('Programmes sauvegardés sur le serveur VPS');
        return;
      }
      throw new Error('Erreur sauvegarde programmes sur le serveur');
    } catch (error) {
      console.error('Erreur sauvegarde programmes:', error);
      throw error;
    }
  }

  // Users storage
  static async getUsers(): Promise<any[]> {
    try {
      await this.testConnection();
      const response = await fetch(`${SERVER_URL}/api/users`);
      if (response.ok) {
        const data = await response.json();
        console.log('Utilisateurs récupérés depuis le serveur VPS');
        return data;
      }
      throw new Error('Erreur récupération utilisateurs depuis le serveur');
    } catch (error) {
      console.error('Erreur récupération utilisateurs:', error);
      throw error;
    }
  }

  static async saveUsers(users: any[]): Promise<void> {
    try {
      await this.testConnection();
      const response = await fetch(`${SERVER_URL}/api/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(users),
      });

      if (response.ok) {
        console.log('Utilisateurs sauvegardés sur le serveur VPS');
        return;
      }
      throw new Error('Erreur sauvegarde utilisateurs sur le serveur');
    } catch (error) {
      console.error('Erreur sauvegarde utilisateurs:', error);
      throw error;
    }
  }

  // Messages storage
  static async getMessages(userId: string): Promise<any[]> {
    try {
      await this.testConnection();
      const response = await fetch(`${SERVER_URL}/api/messages/${userId}`);
      if (response.ok) {
        const data = await response.json();
        console.log('Messages récupérés depuis le serveur VPS');
        return data;
      }
      throw new Error('Erreur récupération messages depuis le serveur');
    } catch (error) {
      console.error('Erreur récupération messages:', error);
      throw error;
    }
  }

  // Sauvegarde des messages
  static async saveMessages(userId: string, messages: any[]): Promise<void> {
    try {
      const response = await fetch(`${SERVER_URL}/api/messages/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messages),
      });

      if (!response.ok) {
        throw new Error('Erreur sauvegarde messages sur le serveur');
      }

      console.log('Messages sauvegardés sur le serveur VPS');
    } catch (error) {
      console.error('Erreur sauvegarde messages:', error);
      throw error;
    }
  }

  // Méthodes pour Apple Health
  static async saveHealthData(userId: string, healthData: any[]): Promise<void> {
    try {
      await this.testConnection();
      const response = await fetch(`${SERVER_URL}/api/health/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(healthData),
      });

      if (response.ok) {
        console.log('Données Apple Health sauvegardées sur le serveur VPS');
        return;
      }
      throw new Error('Erreur sauvegarde données Apple Health sur le serveur');
    } catch (error) {
      console.error('Erreur sauvegarde données Apple Health:', error);
      throw error;
    }
  }

  static async getHealthData(userId: string): Promise<any[]> {
    try {
      await this.testConnection();
      const response = await fetch(`${SERVER_URL}/api/health/${userId}`);

      if (response.ok) {
        const data = await response.json();
        console.log('Données Apple Health récupérées du serveur VPS');
        return data;
      }
      throw new Error('Erreur récupération données Apple Health du serveur');
    } catch (error) {
      console.error('Erreur récupération données Apple Health:', error);
      return [];
    }
  }

  // Méthodes pour Strava
  static async saveStravaActivities(userId: string, activities: any[]): Promise<void> {
    try {
      await this.testConnection();
      const response = await fetch(`${SERVER_URL}/api/strava/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(activities),
      });

      if (response.ok) {
        console.log('Activités Strava sauvegardées sur le serveur VPS');
        return;
      }
      throw new Error('Erreur sauvegarde activités Strava sur le serveur');
    } catch (error) {
      console.error('Erreur sauvegarde activités Strava:', error);
      throw error;
    }
  }

  // Méthodes pour les entraînements (workouts)
  static async getWorkouts(userId: string): Promise<any[]> {
    try {
      const isConnected = await this.testConnection();
      if (isConnected) {
        const response = await fetch(`${SERVER_URL}/api/workouts/${userId}`);
        if (response.ok) {
          const data = await response.json();
          console.log('Entraînements récupérés depuis le serveur VPS');
          // Sauvegarder en local comme backup
          await AsyncStorage.setItem(`workouts_${userId}`, JSON.stringify(data));
          return data;
        }
      }
      
      // Fallback vers le stockage local
      console.log('Fallback vers le stockage local pour les entraînements');
      const localData = await AsyncStorage.getItem(`workouts_${userId}`);
      return localData ? JSON.parse(localData) : [];
    } catch (error) {
      console.error('Erreur récupération entraînements:', error);
      // Essayer le stockage local en cas d'erreur
      try {
        const localData = await AsyncStorage.getItem(`workouts_${userId}`);
        return localData ? JSON.parse(localData) : [];
      } catch (localError) {
        console.error('Erreur stockage local:', localError);
        return [];
      }
    }
  }

  static async saveWorkouts(userId: string, workouts: any[]): Promise<void> {
    try {
      // Toujours sauvegarder en local d'abord
      await AsyncStorage.setItem(`workouts_${userId}`, JSON.stringify(workouts));
      
      const isConnected = await this.testConnection();
      if (isConnected) {
        const response = await fetch(`${SERVER_URL}/api/workouts/${userId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(workouts),
        });

        if (response.ok) {
          console.log('Entraînements sauvegardés sur le serveur VPS');
        } else {
          console.log('Entraînements sauvegardés localement (serveur indisponible)');
        }
      } else {
        console.log('Entraînements sauvegardés localement (serveur indisponible)');
      }
    } catch (error) {
      console.error('Erreur sauvegarde entraînements:', error);
      // Au moins garder la sauvegarde locale
      await AsyncStorage.setItem(`workouts_${userId}`, JSON.stringify(workouts));
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

  static async getStravaActivities(userId: string): Promise<any[]> {
    try {
      await this.testConnection();
      const response = await fetch(`${SERVER_URL}/api/strava/${userId}`);

      if (response.ok) {
        const data = await response.json();
        console.log('Activités Strava récupérées du serveur VPS');
        return data;
      }
      throw new Error('Erreur récupération activités Strava du serveur');
    } catch (error) {
      console.error('Erreur récupération activités Strava:', error);
      return [];
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

  // Vérification de l'état du serveur
  static async syncData(): Promise<void> {
    try {
      await this.testConnection();
      console.log('Serveur VPS opérationnel - toutes les données sont sur le serveur');
    } catch (error) {
      console.error('Erreur connexion serveur VPS:', error);
      throw error;
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

// Adding missing getClients function here
export const getClients = async (): Promise<any[]> => {
  const users = await PersistentStorage.getUsers();
  return users.filter(user => user.userType === 'client');
};

// Adding message management functions here
export const getMessages = async (userId: string): Promise<any[]> => {
  try {
    const response = await fetch(`${SERVER_URL}/api/messages/${userId}`);
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    const messages = await response.json();
    return messages || [];
  } catch (error) {
    console.error('Erreur lors de la récupération des messages:', error);
    return [];
  }
};

export const saveMessages = async (userId: string, messages: any[]): Promise<boolean> => {
  try {
    const response = await fetch(`${SERVER_URL}/api/messages/${userId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    return true;
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des messages:', error);
    return false;
  }
};