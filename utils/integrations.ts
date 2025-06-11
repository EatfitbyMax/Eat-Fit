
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PersistentStorage } from './storage';

export interface HealthData {
  steps: number;
  calories: number;
  heartRate?: number;
  weight?: number;
  sleep?: {
    duration: number; // en minutes
    quality: 'good' | 'average' | 'poor';
  };
  date: string;
}

export interface StravaActivity {
  id: string;
  name: string;
  type: string; // 'Run', 'Ride', 'Swim', etc.
  distance: number; // en mètres
  duration: number; // en secondes
  calories: number;
  avgHeartRate?: number;
  maxHeartRate?: number;
  date: string;
}

export interface IntegrationStatus {
  appleHealth: {
    connected: boolean;
    lastSync?: string;
    permissions: string[];
  };
  strava: {
    connected: boolean;
    lastSync?: string;
    accessToken?: string;
    athleteId?: string;
  };
}

const INTEGRATION_KEY = 'user_integrations';
const HEALTH_DATA_KEY = 'health_data';
const STRAVA_DATA_KEY = 'strava_activities';

export class IntegrationsManager {
  // Apple Health Integration
  static async connectAppleHealth(userId: string): Promise<boolean> {
    try {
      // Simuler la connexion Apple Health
      // Dans une vraie app, vous utiliseriez react-native-health ou expo-health
      const permissions = [
        'steps',
        'calories',
        'heartRate',
        'weight',
        'sleep'
      ];

      const integrationStatus = await this.getIntegrationStatus(userId);
      integrationStatus.appleHealth = {
        connected: true,
        lastSync: new Date().toISOString(),
        permissions
      };

      await this.saveIntegrationStatus(userId, integrationStatus);
      console.log('Apple Health connecté pour utilisateur:', userId);
      return true;
    } catch (error) {
      console.error('Erreur connexion Apple Health:', error);
      return false;
    }
  }

  static async syncAppleHealthData(userId: string): Promise<HealthData[]> {
    try {
      const integrationStatus = await this.getIntegrationStatus(userId);
      if (!integrationStatus.appleHealth.connected) {
        throw new Error('Apple Health non connecté');
      }

      // Simuler la récupération des données Apple Health
      const healthData: HealthData[] = [
        {
          steps: Math.floor(Math.random() * 10000) + 5000,
          calories: Math.floor(Math.random() * 500) + 1800,
          heartRate: Math.floor(Math.random() * 30) + 60,
          weight: 70 + Math.random() * 10,
          sleep: {
            duration: Math.floor(Math.random() * 120) + 360, // 6-8h
            quality: ['good', 'average', 'poor'][Math.floor(Math.random() * 3)] as any
          },
          date: new Date().toISOString().split('T')[0]
        }
      ];

      // Sauvegarder les données localement
      await AsyncStorage.setItem(`${HEALTH_DATA_KEY}_${userId}`, JSON.stringify(healthData));
      
      // Synchroniser avec le serveur VPS
      await PersistentStorage.saveHealthData(userId, healthData);

      // Mettre à jour la date de dernière sync
      integrationStatus.appleHealth.lastSync = new Date().toISOString();
      await this.saveIntegrationStatus(userId, integrationStatus);

      console.log('Données Apple Health synchronisées:', healthData.length);
      return healthData;
    } catch (error) {
      console.error('Erreur sync Apple Health:', error);
      throw error;
    }
  }

  // Strava Integration
  static async connectStrava(userId: string): Promise<boolean> {
    try {
      // Simuler l'authentification OAuth Strava
      // Dans une vraie app, vous utiliseriez l'API Strava OAuth
      const mockAccessToken = `strava_token_${userId}_${Date.now()}`;
      const mockAthleteId = `24854648`; // ID d'athlète simulé

      const integrationStatus = await this.getIntegrationStatus(userId);
      integrationStatus.strava = {
        connected: true,
        lastSync: new Date().toISOString(),
        accessToken: mockAccessToken,
        athleteId: mockAthleteId
      };

      await this.saveIntegrationStatus(userId, integrationStatus);
      console.log('Strava connecté pour utilisateur:', userId);
      return true;
    } catch (error) {
      console.error('Erreur connexion Strava:', error);
      return false;
    }
  }

  static async syncStravaActivities(userId: string): Promise<StravaActivity[]> {
    try {
      const integrationStatus = await this.getIntegrationStatus(userId);
      if (!integrationStatus.strava.connected) {
        throw new Error('Strava non connecté');
      }

      // Simuler la récupération des activités Strava
      const activities: StravaActivity[] = [
        {
          id: `strava_${Date.now()}_1`,
          name: 'Course matinale',
          type: 'Run',
          distance: 5000 + Math.random() * 3000,
          duration: 1800 + Math.random() * 1200,
          calories: 300 + Math.random() * 200,
          avgHeartRate: 140 + Math.random() * 20,
          maxHeartRate: 160 + Math.random() * 20,
          date: new Date().toISOString()
        },
        {
          id: `strava_${Date.now()}_2`,
          name: 'Vélo du weekend',
          type: 'Ride',
          distance: 20000 + Math.random() * 10000,
          duration: 3600 + Math.random() * 1800,
          calories: 600 + Math.random() * 300,
          avgHeartRate: 130 + Math.random() * 15,
          maxHeartRate: 150 + Math.random() * 15,
          date: new Date(Date.now() - 86400000).toISOString() // hier
        }
      ];

      // Sauvegarder les données localement
      await AsyncStorage.setItem(`${STRAVA_DATA_KEY}_${userId}`, JSON.stringify(activities));
      
      // Synchroniser avec le serveur VPS
      await PersistentStorage.saveStravaActivities(userId, activities);

      // Mettre à jour la date de dernière sync
      integrationStatus.strava.lastSync = new Date().toISOString();
      await this.saveIntegrationStatus(userId, integrationStatus);

      console.log('Activités Strava synchronisées:', activities.length);
      return activities;
    } catch (error) {
      console.error('Erreur sync Strava:', error);
      throw error;
    }
  }

  // Méthodes utilitaires
  static async getIntegrationStatus(userId: string): Promise<IntegrationStatus> {
    try {
      const data = await AsyncStorage.getItem(`${INTEGRATION_KEY}_${userId}`);
      if (data) {
        return JSON.parse(data);
      }
      return {
        appleHealth: { connected: false, permissions: [] },
        strava: { connected: false }
      };
    } catch (error) {
      console.error('Erreur récupération statut intégrations:', error);
      return {
        appleHealth: { connected: false, permissions: [] },
        strava: { connected: false }
      };
    }
  }

  static async saveIntegrationStatus(userId: string, status: IntegrationStatus): Promise<void> {
    try {
      await AsyncStorage.setItem(`${INTEGRATION_KEY}_${userId}`, JSON.stringify(status));
    } catch (error) {
      console.error('Erreur sauvegarde statut intégrations:', error);
    }
  }

  static async disconnectAppleHealth(userId: string): Promise<void> {
    try {
      const integrationStatus = await this.getIntegrationStatus(userId);
      integrationStatus.appleHealth = { connected: false, permissions: [] };
      await this.saveIntegrationStatus(userId, integrationStatus);
      
      // Supprimer les données locales
      await AsyncStorage.removeItem(`${HEALTH_DATA_KEY}_${userId}`);
      console.log('Apple Health déconnecté pour utilisateur:', userId);
    } catch (error) {
      console.error('Erreur déconnexion Apple Health:', error);
    }
  }

  static async disconnectStrava(userId: string): Promise<void> {
    try {
      const integrationStatus = await this.getIntegrationStatus(userId);
      integrationStatus.strava = { connected: false };
      await this.saveIntegrationStatus(userId, integrationStatus);
      
      // Supprimer les données locales
      await AsyncStorage.removeItem(`${STRAVA_DATA_KEY}_${userId}`);
      console.log('Strava déconnecté pour utilisateur:', userId);
    } catch (error) {
      console.error('Erreur déconnexion Strava:', error);
    }
  }

  static async getHealthData(userId: string): Promise<HealthData[]> {
    try {
      const data = await AsyncStorage.getItem(`${HEALTH_DATA_KEY}_${userId}`);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Erreur récupération données santé:', error);
      return [];
    }
  }

  static async getStravaActivities(userId: string): Promise<StravaActivity[]> {
    try {
      const data = await AsyncStorage.getItem(`${STRAVA_DATA_KEY}_${userId}`);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Erreur récupération activités Strava:', error);
      return [];
    }
  }

  static async syncAllData(userId: string): Promise<void> {
    try {
      const integrationStatus = await this.getIntegrationStatus(userId);
      
      if (integrationStatus.appleHealth.connected) {
        await this.syncAppleHealthData(userId);
      }
      
      if (integrationStatus.strava.connected) {
        await this.syncStravaActivities(userId);
      }
      
      console.log('Synchronisation complète terminée pour utilisateur:', userId);
    } catch (error) {
      console.error('Erreur synchronisation complète:', error);
      throw error;
    }
  }
}
