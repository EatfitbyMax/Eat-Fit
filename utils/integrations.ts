import AsyncStorage from '@react-native-async-storage/async-storage';
import { PersistentStorage } from './storage';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { Platform } from 'react-native';

// Apple Health désactivé en mode Expo Go pour éviter les crashes
const APPLE_HEALTH_DISABLED = true;
const FORCE_SIMULATION_MODE = true;

// Configuration flexible des intégrations natives sur iOS
if (Platform.OS === 'ios') {
  // Permettre Apple Health mais avec gestion d'erreurs robuste
  console.log('🍎 Intégrations iOS configurées avec gestion d\'erreurs');
}

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

// Configuration Strava API
const STRAVA_CONFIG = {
  CLIENT_ID: process.env.EXPO_PUBLIC_STRAVA_CLIENT_ID || 'YOUR_STRAVA_CLIENT_ID',
  CLIENT_SECRET: process.env.EXPO_PUBLIC_STRAVA_CLIENT_SECRET || 'YOUR_STRAVA_CLIENT_SECRET',
  REDIRECT_URI: 'myapp://auth', // Deep link pour Expo
  SCOPE: 'read,activity:read_all',
  API_BASE_URL: 'https://www.strava.com/api/v3'
};

// Import conditionnel sécurisé pour éviter les erreurs
let BarCodeScanner: any = null;
try {
  // Utiliser expo-camera pour le scan de codes-barres
  const cameraModule = require('expo-camera');
  if (cameraModule.Camera) {
    console.log('✅ Camera disponible pour le scan de codes-barres');
  }
} catch (error) {
  console.log('ℹ️ Module caméra non disponible:', error.message);
}

export const scanBarcode = async (): Promise<string | null> => {
  try {
    console.log('📱 Fonction scan de code-barres appelée');
    // Simulation pour développement - à remplacer par expo-camera
    const simulatedBarcode = 'SCAN_SIMULATION_' + Date.now();
    console.log('✅ Code-barres simulé:', simulatedBarcode);
    return simulatedBarcode;
  } catch (error) {
    console.error('❌ Erreur scan code-barres:', error);
    return null;
  }
};

export class IntegrationsManager {
  // Apple Health Integration
  static async connectAppleHealth(userId: string): Promise<boolean> {
    try {
      // TOUJOURS utiliser le mode simulation en développement pour éviter les crashes
      console.log('🍎 Apple Health - Mode simulation (Expo Go)');

      const integrationStatus = await this.getIntegrationStatus(userId);
      integrationStatus.appleHealth = {
        connected: true,
        lastSync: new Date().toISOString(),
        permissions: ['steps', 'calories', 'heartRate', 'weight', 'sleep']
      };

      await this.saveIntegrationStatus(userId, integrationStatus);
      console.log('✅ Apple Health connecté en mode simulation');
      return true;
    } catch (error) {
      console.warn('Erreur connexion Apple Health (ignorée):', error);
      return false;
    }
  }

  static async syncAppleHealthData(userId: string): Promise<HealthData[]> {
    try {
      const integrationStatus = await this.getIntegrationStatus(userId);
      if (!integrationStatus.appleHealth.connected) {
        throw new Error('Apple Health non connecté');
      }

      console.log('🍎 Synchronisation Apple Health - mode simulation');
      return await this.syncAppleHealthDataSimulated(userId);
    } catch (error) {
      console.error('Erreur sync Apple Health:', error);
      // Retourner des données vides plutôt que de faire planter l'app
      return [];
    }
  }



  // Fallback pour la simulation (Android/Web ou Apple Health non disponible)
  private static async syncAppleHealthDataSimulated(userId: string): Promise<HealthData[]> {
    const healthData: HealthData[] = [
      {
        steps: Math.floor(Math.random() * 10000) + 5000,
        calories: Math.floor(Math.random() * 500) + 1800,
        heartRate: Math.floor(Math.random() * 30) + 60,
        weight: 70 + Math.random() * 10,
        sleep: {
          duration: Math.floor(Math.random() * 120) + 360,
          quality: ['good', 'average', 'poor'][Math.floor(Math.random() * 3)] as any
        },
        date: new Date().toISOString().split('T')[0]
      }
    ];

    await AsyncStorage.setItem(`${HEALTH_DATA_KEY}_${userId}`, JSON.stringify(healthData));
    return healthData;
  }

  // Strava Integration
  static async connectStrava(userId: string): Promise<boolean> {
    try {
      console.log('🚀 Lancement de l\'authentification Strava...');

      // Configuration de la redirection pour Expo
      const redirectUri = AuthSession.makeRedirectUri({
        scheme: 'myapp', // Doit correspondre au scheme dans app.json
        path: 'auth'
      });

      console.log('Redirect URI:', redirectUri);

      // URL d'autorisation Strava
      const authUrl = `https://www.strava.com/oauth/authorize?client_id=${STRAVA_CONFIG.CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${STRAVA_CONFIG.SCOPE}&approval_prompt=force`;

      console.log('URL d\'autorisation Strava:', authUrl);

      // Ouvrir le navigateur pour l'authentification
      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

      console.log('Résultat authentification:', result);

      if (result.type === 'success' && result.url) {
        // Extraire le code d'autorisation de l'URL de retour
        const url = new URL(result.url);
        const code = url.searchParams.get('code');

        if (code) {
          console.log('Code d\'autorisation reçu:', code);

          // Échanger le code contre un token d'accès
          const success = await this.exchangeStravaCode(code, userId);
          if (success) {
            console.log('✅ Authentification Strava réussie');
            return true;
          } else {
            console.error('❌ Échec de l\'échange du code');
            return false;
          }
        } else {
          console.error('❌ Aucun code d\'autorisation reçu');
          return false;
        }
      } else if (result.type === 'cancel') {
        console.log('🚫 Authentification annulée par l\'utilisateur');
        return false;
      } else {
        console.error('❌ Erreur lors de l\'authentification:', result);
        return false;
      }
    } catch (error) {
      console.error('❌ Erreur connexion Strava:', error);
      return false;
    }
  }

  // Méthode pour échanger le code d'autorisation contre un token d'accès
  static async exchangeStravaCode(code: string, userId: string): Promise<boolean> {
    try {
      console.log('🔄 Échange du code d\'autorisation contre un token...');

      const response = await fetch('https://www.strava.com/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: STRAVA_CONFIG.CLIENT_ID,
          client_secret: STRAVA_CONFIG.CLIENT_SECRET,
          code: code,
          grant_type: 'authorization_code'
        })
      });

      const data = await response.json();
      console.log('Réponse Strava OAuth:', data);

      if (data.access_token) {
        const integrationStatus = await this.getIntegrationStatus(userId);
        integrationStatus.strava = {
          connected: true,
          lastSync: new Date().toISOString(),
          accessToken: data.access_token,
          athleteId: data.athlete.id.toString()
        };

        await this.saveIntegrationStatus(userId, integrationStatus);
        console.log('✅ Token Strava sauvegardé pour l\'utilisateur:', userId);
        return true;
      } else {
        console.error('❌ Pas de token d\'accès dans la réponse:', data);
        return false;
      }
    } catch (error) {
      console.error('❌ Erreur échange code Strava:', error);
      return false;
    }
  }

  static async syncStravaActivities(userId: string): Promise<StravaActivity[]> {
    try {
      const integrationStatus = await this.getIntegrationStatus(userId);
      if (!integrationStatus.strava.connected) {
        throw new Error('Strava non connecté');
      }

      // Tentative de récupération des vraies données Strava
      let activities: StravaActivity[] = [];

      if (integrationStatus.strava.accessToken && !integrationStatus.strava.accessToken.includes('mock')) {
        try {
          const response = await fetch(`${STRAVA_CONFIG.API_BASE_URL}/athlete/activities?per_page=10`, {
            headers: {
              'Authorization': `Bearer ${integrationStatus.strava.accessToken}`
            }
          });

          if (response.ok) {
            const stravaData = await response.json();
            activities = stravaData.map((activity: any) => ({
              id: activity.id.toString(),
              name: activity.name,
              type: activity.type,
              distance: activity.distance,
              duration: activity.moving_time,
              calories: activity.calories || 0,
              avgHeartRate: activity.average_heartrate,
              maxHeartRate: activity.max_heartrate,
              date: activity.start_date
            }));
            console.log('Données Strava réelles récupérées:', activities.length);
          }
        } catch (apiError) {
          console.warn('Impossible de récupérer les données Strava réelles, utilisation des données simulées');
        }
      }

      // Si pas de données réelles, utiliser les données simulées
      if (activities.length === 0) {
        console.log('🔄 Mode simulation - génération d\'activités Strava factices');
        activities = [
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
      }

      // Sauvegarder les données localement d'abord
      await AsyncStorage.setItem(`${STRAVA_DATA_KEY}_${userId}`, JSON.stringify(activities));

      try {
        // Tentative de synchronisation avec le serveur VPS
        try {
          await PersistentStorage.saveStravaActivities(userId, activities);
          console.log('Activités Strava sauvegardées sur le serveur VPS');
        } catch (vpsError) {
          console.warn('Serveur VPS non accessible, données conservées localement uniquement');
        }
      } catch (serverError) {
        console.warn('Serveur VPS non disponible, données conservées localement uniquement');
        // Continuer même si le serveur échoue - c'est normal en développement
      }

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
      return await PersistentStorage.getIntegrationStatus(userId);
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
      await PersistentStorage.saveIntegrationStatus(userId, status);
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
      const results = { appleHealth: false, strava: false };

      if (integrationStatus.appleHealth.connected) {
        try {
          await this.syncAppleHealthData(userId);
          results.appleHealth = true;
          console.log('✅ Apple Health synchronisé avec succès');
        } catch (error) {
          console.error('❌ Erreur sync Apple Health:', error);
        }
      }

      if (integrationStatus.strava.connected) {
        try {
          await this.syncStravaActivities(userId);
          results.strava = true;
          console.log('✅ Strava synchronisé avec succès');
        } catch (error) {
          console.error('❌ Erreur sync Strava:', error);
        }
      }

      console.log('Synchronisation complète terminée pour utilisateur:', userId, results);

      if (!results.appleHealth && integrationStatus.appleHealth.connected) {
        console.warn('Apple Health connecté mais synchronisation échouée');
      }
      if (!results.strava && integrationStatus.strava.connected) {
        console.warn('Strava connecté mais synchronisation échouée');
      }
    } catch (error) {
      console.error('Erreur synchronisation complète:', error);
      throw error;
    }
  }
}

export const testServerConnection = async (serverUrl: string): Promise<boolean> => {
  try {
    console.log(`Test de connexion au serveur Replit: ${serverUrl}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${serverUrl}/health`, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.log(`⚠️ Erreur de connexion au serveur ${serverUrl}:`, error);
    return false;
  }
};

// Fonction pour gérer les promesses rejetées globalement
export const setupGlobalErrorHandling = () => {
  if (typeof window !== 'undefined') {
    window.addEventListener('unhandledrejection', (event) => {
      console.warn('Promesse non capturée:', event.reason);
      event.preventDefault(); // Empêche le crash de l'app
    });
  }
};