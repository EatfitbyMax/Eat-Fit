import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SERVER_URL = process.env.EXPO_PUBLIC_VPS_URL || 'https://eatfitbymax.cloud';

export class PersistentStorage {
  // Users storage
  static async getUsers(): Promise<any[]> {
    const response = await fetch(`${SERVER_URL}/api/users`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      throw new Error('Erreur récupération utilisateurs');
    }

    return await response.json();
  }

  static async saveUsers(users: any[]): Promise<void> {
    const response = await fetch(`${SERVER_URL}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(users)
    });

    if (!response.ok) {
      throw new Error('Erreur sauvegarde utilisateurs');
    }
  }

  // User data
  static async getUserData(userId: string): Promise<any> {
    const response = await fetch(`${SERVER_URL}/api/user-data/${userId}`);

    if (!response.ok) {
      throw new Error('Utilisateur non trouvé');
    }

    return await response.json();
  }

  static async saveUserData(userId: string, userData: any): Promise<void> {
    const response = await fetch(`${SERVER_URL}/api/user-data/${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });

    if (!response.ok) {
      throw new Error('Erreur sauvegarde données utilisateur');
    }
  }

  static async deleteUserData(userId: string): Promise<void> {
    const response = await fetch(`${SERVER_URL}/api/user-data/${userId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error('Erreur suppression utilisateur');
    }
  }

  // Weight data
  static async getWeightData(userId: string): Promise<any> {
    const response = await fetch(`${SERVER_URL}/api/weight/${userId}`);

    if (!response.ok) {
      return {
        startWeight: 0,
        currentWeight: 0,
        targetWeight: 0,
        lastWeightUpdate: null,
        targetAsked: false,
        weightHistory: []
      };
    }

    return await response.json();
  }

  static async saveWeightData(userId: string, weightData: any): Promise<void> {
    const response = await fetch(`${SERVER_URL}/api/weight/${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(weightData)
    });

    if (!response.ok) {
      throw new Error('Erreur sauvegarde données poids');
    }
  }

  // Nutrition data
  static async getNutrition(userId: string): Promise<any[]> {
    const response = await fetch(`${SERVER_URL}/api/nutrition/${userId}`);
    return response.ok ? await response.json() : [];
  }

  static async saveNutrition(userId: string, nutritionData: any[]): Promise<void> {
    const response = await fetch(`${SERVER_URL}/api/nutrition/${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nutritionData)
    });

    if (!response.ok) {
      throw new Error('Erreur sauvegarde nutrition');
    }
  }

  // Workouts
  static async getWorkouts(userId: string): Promise<any[]> {
    try {
      const VPS_URL = process.env.EXPO_PUBLIC_VPS_URL || 'https://eatfitbymax.cloud';
      const response = await fetch(`${VPS_URL}/api/workouts/${userId}`);

      if (response.ok) {
        const workouts = await response.json();
        // Sauvegarder en cache local avec validation
        await AsyncStorage.setItem(`workouts_cache_${userId}`, JSON.stringify({
          data: Array.isArray(workouts) ? workouts : [],
          timestamp: Date.now()
        }));
        return Array.isArray(workouts) ? workouts : [];
      }
      throw new Error('Serveur indisponible');
    } catch (error) {
      console.error('Erreur getWorkouts:', error);
      // Fallback vers cache
      return await this.getWorkoutsFromCache(userId);
    }
  }

  static async getWorkoutsFromCache(userId: string): Promise<any[]> {
    try {
      const cached = await AsyncStorage.getItem(`workouts_cache_${userId}`);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        // Cache valide pendant 24h
        if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
          return Array.isArray(data) ? data : [];
        }
      }
      return [];
    } catch (error) {
      console.error('Erreur cache workouts:', error);
      return [];
    }
  }

  static async saveWorkouts(userId: string, workouts: any[]): Promise<void> {
    const response = await fetch(`${SERVER_URL}/api/workouts/${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(workouts)
    });

    if (!response.ok) {
      throw new Error('Erreur sauvegarde entraînements');
    }
  }

  // Health data
  static async getHealthData(userId: string): Promise<any[]> {
    const response = await fetch(`${SERVER_URL}/api/health/${userId}`);
    return response.ok ? await response.json() : [];
  }

  static async saveHealthData(userId: string, healthData: any[]): Promise<void> {
    const response = await fetch(`${SERVER_URL}/api/health/${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(healthData)
    });

    if (!response.ok) {
      throw new Error('Erreur sauvegarde données Apple Health');
    }
  }

  // Strava data
  static async getStravaData(userId: string): Promise<any[]> {
    const response = await fetch(`${SERVER_URL}/api/strava/${userId}`);
    return response.ok ? await response.json() : [];
  }

  static async saveStravaData(userId: string, stravaData: any[]): Promise<void> {
    const response = await fetch(`${SERVER_URL}/api/strava/${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(stravaData)
    });

    if (!response.ok) {
      throw new Error('Erreur sauvegarde données Strava');
    }
  }

  // Messages
  static async getMessages(userId: string): Promise<any[]> {
    const response = await fetch(`${SERVER_URL}/api/messages/${userId}`);
    return response.ok ? await response.json() : [];
  }

  static async saveMessages(userId: string, messages: any[]): Promise<void> {
    const response = await fetch(`${SERVER_URL}/api/messages/${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(messages)
    });

    if (!response.ok) {
      throw new Error('Erreur sauvegarde messages');
    }
  }

  // Notifications
  static async getNotificationSettings(userId: string): Promise<any> {
    const response = await fetch(`${SERVER_URL}/api/notifications/${userId}`);

    if (!response.ok) {
      return {
        pushNotifications: true,
        mealReminders: true,
        workoutReminders: true,
        progressUpdates: true,
        coachMessages: true,
        weeklyReports: true,
        soundEnabled: true,
        vibrationEnabled: true,
      };
    }

    return await response.json();
  }

  static async saveNotificationSettings(userId: string, settings: any): Promise<void> {
    const response = await fetch(`${SERVER_URL}/api/notifications/${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });

    if (!response.ok) {
      throw new Error('Erreur sauvegarde paramètres notifications');
    }
  }

  // Integration status
  static async getUserIntegrationStatus(userId: string): Promise<any> {
    const response = await fetch(`${SERVER_URL}/api/integrations/${userId}`);

    if (!response.ok) {
      return {
        appleHealth: { connected: false, permissions: [] },
        strava: { connected: false }
      };
    }

    return await response.json();
  }

  static async saveIntegrationStatus(userId: string, status: any): Promise<void> {
    const response = await fetch(`${SERVER_URL}/api/integrations/${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(status)
    });

    if (!response.ok) {
      throw new Error('Erreur sauvegarde intégrations');
    }
  }

  // Programs
  static async getPrograms(): Promise<any[]> {
    const response = await fetch(`${SERVER_URL}/api/programmes`);
    return response.ok ? await response.json() : [];
  }

  static async savePrograms(programs: any[]): Promise<void> {
    const response = await fetch(`${SERVER_URL}/api/programmes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(programs)
    });

    if (!response.ok) {
      throw new Error('Erreur sauvegarde programmes');
    }
  }

  // Coaches
  static async getCoaches(): Promise<any[]> {
    const response = await fetch(`${SERVER_URL}/api/coaches`);
    return response.ok ? await response.json() : [];
  }

  static async saveCoaches(coaches: any[]): Promise<void> {
    const response = await fetch(`${SERVER_URL}/api/coaches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(coaches)
    });

    if (!response.ok) {
      throw new Error('Erreur sauvegarde coaches');
    }
  }

  // Water intake
  static async getWaterIntake(userId: string, date: string): Promise<number> {
    const response = await fetch(`${SERVER_URL}/api/water/${userId}/${date}`);
    return response.ok ? await response.json() : 0;
  }

  static async saveWaterIntake(userId: string, date: string, amount: number): Promise<void> {
    try {
      const response = await fetch(`${SERVER_URL}/api/water/${userId}/${date}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Erreur HTTP ${response.status}:`, errorText);
        throw new Error(`Erreur HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Réponse serveur hydratation:', result);
    } catch (error) {
      console.error('❌ Erreur complète saveWaterIntake:', error);
      throw error;
    }
  }

  // Mensuration data
  static async getMensurationData(userId: string): Promise<any> {
    const response = await fetch(`${SERVER_URL}/api/mensurations/${userId}`);
    return response.ok ? await response.json() : null;
  }

  static async saveMensurationData(userId: string, data: any): Promise<void> {
    const response = await fetch(`${SERVER_URL}/api/mensurations/${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error('Erreur sauvegarde mensurations');
    }
  }

  // Activity ratings  
  static async getActivityRatings(userId: string): Promise<any> {
    const response = await fetch(`${SERVER_URL}/api/activity-ratings/${userId}`);
    return response.ok ? await response.json() : {};
  }

  static async saveActivityRatings(userId: string, ratings: any): Promise<void> {
    const response = await fetch(`${SERVER_URL}/api/activity-ratings/${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ratings)
    });

    if (!response.ok) {
      throw new Error('Erreur sauvegarde notes RPE');
    }
  }

  // Forme data
  static async getFormeData(userId: string, date: string): Promise<any> {
    const response = await fetch(`${SERVER_URL}/api/forme/${userId}/${date}`);
    return response.ok ? await response.json() : null;
  }

  static async saveFormeData(userId: string, date: string, data: any): Promise<void> {
    const response = await fetch(`${SERVER_URL}/api/forme/${userId}/${date}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error('Erreur sauvegarde données forme');
    }
  }

  // Recent sports
  static async getRecentSports(userId: string): Promise<string[]> {
    const response = await fetch(`${SERVER_URL}/api/recent-sports/${userId}`);
    return response.ok ? await response.json() : [];
  }

  static async saveRecentSports(userId: string, sports: string[]): Promise<void> {
    const response = await fetch(`${SERVER_URL}/api/recent-sports/${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sports)
    });

    if (!response.ok) {
      throw new Error('Erreur sauvegarde sports récents');
    }
  }

  // Forme data (duplicate, keeping one instance)
  // static async getFormeData(userId: string, date: string): Promise<any> {
  //   const response = await fetch(`${SERVER_URL}/api/forme/${userId}/${date}`);

  //   if (!response.ok) {
  //     throw new Error('Données de forme non trouvées');
  //   }

  //   return await response.json();
  // }

  // static async saveFormeData(userId: string, date: string, data: any): Promise<void> {
  //   const response = await fetch(`${SERVER_URL}/api/forme/${userId}/${date}`, {
  //     method: 'POST',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify(data)
  //   });

  //   if (!response.ok) {
  //     throw new Error('Erreur sauvegarde données forme');
  //   }
  // }

  // Activity ratings (duplicate, keeping one instance)
  // static async getActivityRatings(userId: string): Promise<any> {
  //   const response = await fetch(`${SERVER_URL}/api/activity-ratings/${userId}`);
  //   return response.ok ? await response.json() : {};
  // }

  // static async saveActivityRatings(userId: string, ratings: any): Promise<void> {
  //   const response = await fetch(`${SERVER_URL}/api/activity-ratings/${userId}`, {
  //     method: 'POST',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify(ratings)
  //   });

  //   if (!response.ok) {
  //     throw new Error('Erreur sauvegarde notes RPE');
  //   }
  // }

  // Water intake (duplicate, keeping one instance)
  // static async getWaterIntake(userId: string, date: string): Promise<number> {
  //   const response = await fetch(`${SERVER_URL}/api/water/${userId}/${date}`);
  //   return response.ok ? await response.json() : 0;
  // }

  // static async saveWaterIntake(userId: string, date: string, amount: number): Promise<void> {
  //   const response = await fetch(`${SERVER_URL}/api/water/${userId}/${date}`, {
  //     method: 'POST',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify({ amount })
  //   });

  //   if (!response.ok) {
  //     throw new Error('Erreur sauvegarde hydratation');
  //   }
  // }

  // App preferences
  static async getAppPreferences(userId: string): Promise<any> {
    const response = await fetch(`${SERVER_URL}/api/app-preferences/${userId}`);

    if (!response.ok) {
      return {
        theme: 'system',
        language: 'fr',
        units: 'metric',
        notifications: true
      };
    }

    return await response.json();
  }

  static async saveAppPreferences(userId: string, preferences: any): Promise<void> {
    try {
      const VPS_URL = process.env.EXPO_PUBLIC_VPS_URL || 'https://eatfitbymax.cloud';

      const response = await fetch(`${VPS_URL}/api/app-preferences/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences)
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      console.log('✅ Préférences app sauvegardées sur le serveur VPS');
    } catch (error) {
      console.error('❌ Erreur sauvegarde préférences app sur VPS:', error);
      throw error;
    }
  }

  // Fonction getItem pour la compatibilité avec le code existant (notamment Strava)
  static async getItem(key: string): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        return localStorage.getItem(key);
      } else {
        return await AsyncStorage.getItem(key);
      }
    } catch (error) {
      console.error(`❌ Erreur récupération ${key}:`, error);
      return null;
    }
  }

  // Alias methods pour compatibilité
  static async getIntegrationStatus(userId: string): Promise<any> {
    return await this.getUserIntegrationStatus(userId);
  }

  static async getUserWorkouts(userId: string): Promise<any[]> {
    return await this.getWorkouts(userId);
  }

  static async saveUserWorkouts(userId: string, workouts: any[]): Promise<void> {
    return await this.saveWorkouts(userId, workouts);
  }

  static async getUserNutrition(userId: string): Promise<any[]> {
    return await this.getNutrition(userId);
  }

  static async saveUserNutrition(userId: string, nutritionData: any[]): Promise<void> {
    return await this.saveNutrition(userId, nutritionData);
  }

  static async getUserWeight(userId: string): Promise<any> {
    return await this.getWeightData(userId);
  }
}