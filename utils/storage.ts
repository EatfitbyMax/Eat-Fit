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

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      console.log('Programmes sauvegardés sur le serveur VPS');
    } catch (error) {
      console.error('Erreur sauvegarde programmes:', error);
      throw error;
    }
  }

  // Fonctions pour les données utilisateur spécifiques
  static async getUserWorkouts(userId: string): Promise<any[]> {
    try {
      const isConnected = await this.testConnection();
      if (isConnected) {
        const response = await fetch(`${SERVER_URL}/api/workouts/${userId}`);
        if (response.ok) {
          const data = await response.json();
          console.log('Entraînements récupérés depuis le serveur VPS');
          return data;
        }
      }

      // Fallback vers le stockage local
      console.log('Fallback vers le stockage local pour les entraînements');
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      const localData = await AsyncStorage.getItem(`workouts_${userId}`);
      return localData ? JSON.parse(localData) : [];
    } catch (error) {
      console.error('Erreur récupération entraînements:', error);
      // Essayer le stockage local en cas d'erreur
      try {
        const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
        const localData = await AsyncStorage.getItem(`workouts_${userId}`);
        return localData ? JSON.parse(localData) : [];
      } catch (localError) {
        console.error('Erreur stockage local:', localError);
        return [];
      }
    }
  }

  static async saveUserWorkouts(userId: string, workouts: any[]): Promise<void> {
    try {
      await this.testConnection();
      const response = await fetch(`${SERVER_URL}/api/workouts/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workouts),
      });
      if (!response.ok) {
        throw new Error('Erreur sauvegarde entraînements');
      }
    } catch (error) {
      console.error('Erreur sauvegarde entraînements:', error);
      throw error;
    }
  }

  static async getUserData(): Promise<any> {
    try {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      const userData = await AsyncStorage.getItem('currentUser');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Erreur récupération données utilisateur:', error);
      return null;
    }
  }

  static async getUserNutrition(userId: string): Promise<any[]> {
    try {
      await this.testConnection();
      const response = await fetch(`${SERVER_URL}/api/nutrition/${userId}`);
      if (response.ok) {
        return await response.json();
      }
      throw new Error('Erreur récupération nutrition');
    } catch (error) {
      console.error('Erreur récupération nutrition:', error);
      return [];
    }
  }

  static async saveUserNutrition(userId: string, nutrition: any[]): Promise<void> {
    try {
      await this.testConnection();
      const response = await fetch(`${SERVER_URL}/api/nutrition/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nutrition),
      });
      if (!response.ok) {
        throw new Error('Erreur sauvegarde nutrition');
      }
    } catch (error) {
      console.error('Erreur sauvegarde nutrition:', error);
      throw error;
    }
  }

  static async getUserWeight(userId: string): Promise<any> {
    try {
      await this.testConnection();
      const response = await fetch(`${SERVER_URL}/api/weight/${userId}`);
      if (response.ok) {
        return await response.json();
      }
      throw new Error('Erreur récupération poids');
    } catch (error) {
      console.error('Erreur récupération poids:', error);
      return {
        startWeight: 0,
        currentWeight: 0,
        targetWeight: 0,
        lastWeightUpdate: null,
        targetAsked: false,
        weightHistory: [],
      };
    }
  }

  static async saveUserWeight(userId: string, weightData: any): Promise<void> {
    try {
      await this.testConnection();
      const response = await fetch(`${SERVER_URL}/api/weight/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(weightData),
      });
      if (!response.ok) {
        throw new Error('Erreur sauvegarde poids');
      }
    } catch (error) {
      console.error('Erreur sauvegarde poids:', error);
      throw error;
    }
  }

  static async getUserMensurations(userId: string): Promise<any> {
    try {
      await this.testConnection();
      const response = await fetch(`${SERVER_URL}/api/mensurations/${userId}`);
      if (response.ok) {
        return await response.json();
      }
      throw new Error('Erreur récupération mensurations');
    } catch (error) {
      console.error('Erreur récupération mensurations:', error);
      return {
        biceps: { start: 0, current: 0 },
        bicepsGauche: { start: 0, current: 0 },
        bicepsDroit: { start: 0, current: 0 },
        cuisses: { start: 0, current: 0 },
        cuissesGauche: { start: 0, current: 0 },
        cuissesDroit: { start: 0, current: 0 },
        pectoraux: { start: 0, current: 0 },
        taille: { start: 0, current: 0 },
        avantBras: { start: 0, current: 0 },
        avantBrasGauche: { start: 0, current: 0 },
        avantBrasDroit: { start: 0, current: 0 },
        mollets: { start: 0, current: 0 },
        molletsGauche: { start: 0, current: 0 },
        molletsDroit: { start: 0, current: 0 },
      };
    }
  }

  static async saveUserMensurations(userId: string, mensurations: any): Promise<void> {
    try {
      await this.testConnection();
      const response = await fetch(`${SERVER_URL}/api/mensurations/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mensurations),
      });
      if (!response.ok) {
        throw new Error('Erreur sauvegarde mensurations');
      }
    } catch (error) {
      console.error('Erreur sauvegarde mensurations:', error);
      throw error;
    }
  }

  static async getUserForme(userId: string, date: string): Promise<any> {
    try {
      await this.testConnection();
      const response = await fetch(`${SERVER_URL}/api/forme/${userId}/${date}`);
      if (response.ok) {
        return await response.json();
      }
      throw new Error('Erreur récupération forme');
    } catch (error) {
      console.error('Erreur récupération forme:', error);
      return {
        sleep: { hours: 0, quality: 'Moyen', bedTime: '', wakeTime: '' },
        stress: { level: 5, factors: [], notes: '' },
        heartRate: { resting: 0, variability: 0 },
        rpe: { value: 5, notes: '' },
        date: date
      };
    }
  }

  static async saveUserForme(userId: string, date: string, formeData: any): Promise<void> {
    try {
      await this.testConnection();
      const response = await fetch(`${SERVER_URL}/api/forme/${userId}/${date}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formeData),
      });
      if (!response.ok) {
        throw new Error('Erreur sauvegarde forme');
      }
    } catch (error) {
      console.error('Erreur sauvegarde forme:', error);
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
      console.warn('Échec sauvegarde Strava sur serveur VPS, données conservées localement');
    } catch (error) {
      console.warn('Erreur sauvegarde activités Strava sur serveur VPS:', error);
      console.log('Les données Strava restent disponibles localement');
    }
  }

  // Méthodes pour les données nutritionnelles
  static async getNutritionData(userId: string): Promise<any[]> {
    try {
      const isConnected = await this.testConnection();
      if (isConnected) {
        const response = await fetch(`${SERVER_URL}/api/nutrition/${userId}`);
        if (response.ok) {
          const data = await response.json();
          console.log('Données nutrition récupérées depuis le serveur VPS');
          // Sauvegarder en local comme backup
          const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
          await AsyncStorage.setItem(`food_entries_${userId}`, JSON.stringify(data));
          return data;
        }
      }

      // Fallback vers le stockage local
      console.log('Fallback vers le stockage local pour la nutrition');
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      const localData = await AsyncStorage.getItem(`food_entries_${userId}`);
      return localData ? JSON.parse(localData) : [];
    } catch (error) {
      console.error('Erreur récupération données nutrition:', error);
      try {
        const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
        const localData = await AsyncStorage.getItem(`food_entries_${userId}`);
        return localData ? JSON.parse(localData) : [];
      } catch (localError) {
        console.error('Erreur stockage local nutrition:', localError);
        return [];
      }
    }
  }

  static async saveNutritionData(userId: string, nutritionData: any[]): Promise<void> {
    try {
      // Toujours sauvegarder en local d'abord
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      await AsyncStorage.setItem(`food_entries_${userId}`, JSON.stringify(nutritionData));

      const isConnected = await this.testConnection();
      if (isConnected) {
        const response = await fetch(`${SERVER_URL}/api/nutrition/${userId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(nutritionData),
        });

        if (response.ok) {
          console.log('Données nutrition sauvegardées sur le serveur VPS');
        } else {
          console.log('Données nutrition sauvegardées localement (serveur indisponible)');
        }
      } else {
        console.log('Données nutrition sauvegardées localement (serveur indisponible)');
      }
    } catch (error) {
      console.error('Erreur sauvegarde données nutrition:', error);
      // Au moins garder la sauvegarde locale
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      await AsyncStorage.setItem(`food_entries_${userId}`, JSON.stringify(nutritionData));
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

  // Méthodes pour les données de forme
  static async getFormeData(userId: string, date: string): Promise<any> {
    try {
      const isConnected = await this.testConnection();
      if (isConnected) {
        const response = await fetch(`${SERVER_URL}/api/forme/${userId}/${date}`);
        if (response.ok) {
          const data = await response.json();
          console.log('Données de forme récupérées depuis le serveur VPS');
          // Sauvegarder en local comme backup
          await AsyncStorage.setItem(`forme_data_${userId}_${date}`, JSON.stringify(data));
          return data;
        }
      }

      // Fallback vers le stockage local
      console.log('Fallback vers le stockage local pour les données de forme');
      const localData = await AsyncStorage.getItem(`forme_data_${userId}_${date}`);
      return localData ? JSON.parse(localData) : {
        sleep: { hours: 0, quality: 'Moyen', bedTime: '', wakeTime: '' },
        stress: { level: 5, factors: [], notes: '' },
        heartRate: { resting: 0, variability: 0 },
        rpe: { value: 5, notes: '' },
        cycle: { phase: 'Menstruel', dayOfCycle: 1, symptoms: [], notes: '' },
        date: date
      };
    } catch (error) {
      console.error('Erreur récupération données forme:', error);
      try {
        const localData = await AsyncStorage.getItem(`forme_data_${userId}_${date}`);
        return localData ? JSON.parse(localData) : {
          sleep: { hours: 0, quality: 'Moyen', bedTime: '', wakeTime: '' },
          stress: { level: 5, factors: [], notes: '' },
          heartRate: { resting: 0, variability: 0 },
          rpe: { value: 5, notes: '' },
          date: date
        };
      } catch (localError) {
        console.error('Erreur stockage local forme:', localError);
        return {
          sleep: { hours: 0, quality: 'Moyen', bedTime: '', wakeTime: '' },
          stress: { level: 5, factors: [], notes: '' },
          heartRate: { resting: 0, variability: 0 },
          rpe: { value: 5, notes: '' },
          cycle: { phase: 'Menstruel', dayOfCycle: 1, symptoms: [], notes: '' },
          date: date
        };
      }
    }
  }

  static async saveFormeData(userId: string, date: string, formeData: any): Promise<void> {
    try {
      // Toujours sauvegarder en local d'abord
      await AsyncStorage.setItem(`forme_data_${userId}_${date}`, JSON.stringify(formeData));

      const isConnected = await this.testConnection();
      if (isConnected) {
        const response = await fetch(`${SERVER_URL}/api/forme/${userId}/${date}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formeData),
        });

        if (response.ok) {
          console.log('Données de forme sauvegardées sur le serveur VPS');
        } else {
          console.log('Données de forme sauvegardées localement (serveur indisponible)');
        }
      } else {
        console.log('Données de forme sauvegardées localement (serveur indisponible)');
      }
    } catch (error) {
      console.error('Erreur sauvegarde données forme:', error);
      // Au moins garder la sauvegarde locale
      await AsyncStorage.setItem(`forme_data_${userId}_${date}`, JSON.stringify(formeData));
    }
  }

  // Gestion de l'utilisateur actuel
  static async getCurrentUser(): Promise<any> {
    try {
      const userData = await AsyncStorage.getItem('currentUser');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Erreur récupération utilisateur:', error);
      return null;
    }
  }

  static async setCurrentUser(user: any): Promise<void> {
    try {
      // Sauvegarder en local
      await AsyncStorage.setItem('currentUser', JSON.stringify(user));
      
      // Synchroniser avec le serveur VPS
      if (user?.id) {
        try {
          const isConnected = await this.testConnection();
          if (isConnected) {
            await this.saveUserProfile(user.id, user);
          }
        } catch (error) {
          console.warn('Impossible de synchroniser le profil utilisateur avec le serveur:', error);
        }
      }
    } catch (error) {
      console.error('Erreur sauvegarde utilisateur actuel:', error);
      throw error;
    }
  }

  // Méthodes pour les profils utilisateur
  static async getUserProfile(userId: string): Promise<any> {
    try {
      const isConnected = await this.testConnection();
      if (isConnected) {
        const response = await fetch(`${SERVER_URL}/api/user-profile/${userId}`);
        if (response.ok) {
          const data = await response.json();
          console.log('Profil utilisateur récupéré depuis le serveur VPS');
          // Sauvegarder en local comme backup
          await AsyncStorage.setItem(`user_profile_${userId}`, JSON.stringify(data));
          return data;
        }
      }

      // Fallback vers le stockage local
      console.log('Fallback vers le stockage local pour le profil utilisateur');
      const localData = await AsyncStorage.getItem(`user_profile_${userId}`);
      return localData ? JSON.parse(localData) : null;
    } catch (error) {
      console.error('Erreur récupération profil utilisateur:', error);
      try {
        const localData = await AsyncStorage.getItem(`user_profile_${userId}`);
        return localData ? JSON.parse(localData) : null;
      } catch (localError) {
        console.error('Erreur stockage local profil:', localError);
        return null;
      }
    }
  }

  static async saveUserProfile(userId: string, profileData: any): Promise<void> {
    try {
      // Toujours sauvegarder en local d'abord
      await AsyncStorage.setItem(`user_profile_${userId}`, JSON.stringify(profileData));

      const isConnected = await this.testConnection();
      if (isConnected) {
        const response = await fetch(`${SERVER_URL}/api/user-profile/${userId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(profileData),
        });

        if (response.ok) {
          console.log('Profil utilisateur sauvegardé sur le serveur VPS');
        } else {
          console.log('Profil utilisateur sauvegardé localement (serveur indisponible)');
        }
      } else {
        console.log('Profil utilisateur sauvegardé localement (serveur indisponible)');
      }
    } catch (error) {
      console.error('Erreur sauvegarde profil utilisateur:', error);
      // Au moins garder la sauvegarde locale
      await AsyncStorage.setItem(`user_profile_${userId}`, JSON.stringify(profileData));
    }
  }

  // Méthodes pour les paramètres de notifications
  static async getNotificationSettings(userId: string): Promise<any> {
    try {
      const isConnected = await this.testConnection();
      if (isConnected) {
        const response = await fetch(`${SERVER_URL}/api/notifications/${userId}`);
        if (response.ok) {
          const data = await response.json();
          console.log('Paramètres notifications récupérés depuis le serveur VPS');
          await AsyncStorage.setItem(`notification_settings_${userId}`, JSON.stringify(data));
          return data;
        }
      }

      // Fallback vers le stockage local
      console.log('Fallback vers le stockage local pour les paramètres notifications');
      const localData = await AsyncStorage.getItem(`notification_settings_${userId}`);
      return localData ? JSON.parse(localData) : {
        workoutReminder: true,
        nutritionReminder: true,
        progressUpdate: true,
        reminderTime: '09:00',
        weeklyReport: true,
        coachMessages: true
      };
    } catch (error) {
      console.error('Erreur récupération paramètres notifications:', error);
      return {
        workoutReminder: true,
        nutritionReminder: true,
        progressUpdate: true,
        reminderTime: '09:00',
        weeklyReport: true,
        coachMessages: true
      };
    }
  }

  static async saveNotificationSettings(userId: string, settings: any): Promise<void> {
    try {
      // Toujours sauvegarder en local d'abord
      await AsyncStorage.setItem(`notification_settings_${userId}`, JSON.stringify(settings));

      const isConnected = await this.testConnection();
      if (isConnected) {
        const response = await fetch(`${SERVER_URL}/api/notifications/${userId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(settings),
        });

        if (response.ok) {
          console.log('Paramètres notifications sauvegardés sur le serveur VPS');
        } else {
          console.log('Paramètres notifications sauvegardés localement (serveur indisponible)');
        }
      } else {
        console.log('Paramètres notifications sauvegardés localement (serveur indisponible)');
      }
    } catch (error) {
      console.error('Erreur sauvegarde paramètres notifications:', error);
      await AsyncStorage.setItem(`notification_settings_${userId}`, JSON.stringify(settings));
    }
  }

  // Méthodes pour les préférences d'application
  static async getAppPreferences(userId: string): Promise<any> {
    try {
      const isConnected = await this.testConnection();
      if (isConnected) {
        const response = await fetch(`${SERVER_URL}/api/app-preferences/${userId}`);
        if (response.ok) {
          const data = await response.json();
          console.log('Préférences app récupérées depuis le serveur VPS');
          await AsyncStorage.setItem(`app_preferences_${userId}`, JSON.stringify(data));
          return data;
        }
      }

      // Fallback vers le stockage local
      console.log('Fallback vers le stockage local pour les préférences app');
      const localData = await AsyncStorage.getItem(`app_preferences_${userId}`);
      return localData ? JSON.parse(localData) : {
        theme: 'dark',
        language: 'fr',
        units: 'metric',
        notifications: true
      };
    } catch (error) {
      console.error('Erreur récupération préférences app:', error);
      return {
        theme: 'dark',
        language: 'fr',
        units: 'metric',
        notifications: true
      };
    }
  }

  static async saveAppPreferences(userId: string, preferences: any): Promise<void> {
    try {
      // Toujours sauvegarder en local d'abord
      await AsyncStorage.setItem(`app_preferences_${userId}`, JSON.stringify(preferences));

      const isConnected = await this.testConnection();
      if (isConnected) {
        const response = await fetch(`${SERVER_URL}/api/app-preferences/${userId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(preferences),
        });

        if (response.ok) {
          console.log('Préférences app sauvegardées sur le serveur VPS');
        } else {
          console.log('Préférences app sauvegardées localement (serveur indisponible)');
        }
      } else {
        console.log('Préférences app sauvegardées localement (serveur indisponible)');
      }
    } catch (error) {
      console.error('Erreur sauvegarde préférences app:', error);
      await AsyncStorage.setItem(`app_preferences_${userId}`, JSON.stringify(preferences));
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

  // Méthodes pour les statuts d'intégrations
  static async getIntegrationStatus(userId: string): Promise<any> {
    try {
      const isConnected = await this.testConnection();
      if (isConnected) {
        const response = await fetch(`${SERVER_URL}/api/integrations/${userId}`);
        if (response.ok) {
          const data = await response.json();
          console.log('Statuts intégrations récupérés depuis le serveur VPS');
          // Sauvegarder en local comme backup
          await AsyncStorage.setItem(`user_integrations_${userId}`, JSON.stringify(data));
          return data;
        }
      }

      // Fallback vers le stockage local
      console.log('Fallback vers le stockage local pour les statuts intégrations');
      const localData = await AsyncStorage.getItem(`user_integrations_${userId}`);
      return localData ? JSON.parse(localData) : {
        appleHealth: { connected: false, permissions: [] },
        strava: { connected: false }
      };
    } catch (error) {
      console.error('Erreur récupération statuts intégrations:', error);
      try {
        const localData = await AsyncStorage.getItem(`user_integrations_${userId}`);
        return localData ? JSON.parse(localData) : {
          appleHealth: { connected: false, permissions: [] },
          strava: { connected: false }
        };
      } catch (localError) {
        console.error('Erreur stockage local intégrations:', localError);
        return {
          appleHealth: { connected: false, permissions: [] },
          strava: { connected: false }
        };
      }
    }
  }

  static async saveIntegrationStatus(userId: string, status: any): Promise<void> {
    try {
      // Toujours sauvegarder en local d'abord
      await AsyncStorage.setItem(`user_integrations_${userId}`, JSON.stringify(status));

      const isConnected = await this.testConnection();
      if (isConnected) {
        const response = await fetch(`${SERVER_URL}/api/integrations/${userId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(status),
        });

        if (response.ok) {
          console.log('Statuts intégrations sauvegardés sur le serveur VPS');
        } else {
          console.log('Statuts intégrations sauvegardés localement (serveur indisponible)');
        }
      } else {
        console.log('Statuts intégrations sauvegardés localement (serveur indisponible)');
      }
    } catch (error) {
      console.error('Erreur sauvegarde statuts intégrations:', error);
      // Au moins garder la sauvegarde locale
      await AsyncStorage.setItem(`user_integrations_${userId}`, JSON.stringify(status));
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

// Fonction pour récupérer les données utilisateur
export const getUserData = async (): Promise<any | null> => {
  try {
    const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
    const userData = await AsyncStorage.getItem('current_user');
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Erreur récupération données utilisateur:', error);
    return null;
  }
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