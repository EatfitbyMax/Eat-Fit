
import { PersistentStorage } from './storage';
import { Platform } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configuration Strava sécurisée pour la production
const STRAVA_CLIENT_ID = process.env.EXPO_PUBLIC_STRAVA_CLIENT_ID || '';
const STRAVA_CLIENT_SECRET = process.env.EXPO_PUBLIC_STRAVA_CLIENT_SECRET || '';

// Configuration du redirect URI selon l'environnement  
const getStravaRedirectUri = (): string => {
  return `${process.env.EXPO_PUBLIC_VPS_URL || 'https://eatfitbymax.cloud'}/strava-callback`;
};

const STRAVA_REDIRECT_URI = getStravaRedirectUri();

export interface IntegrationConfig {
  appleHealth: {
    connected: boolean;
    permissions: string[];
    lastSync?: string;
  };
  strava: {
    connected: boolean;
    athlete?: any;
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
  };
}

interface StravaActivity {
  id: string;
  name: string;
  type: string;
  date: string;
  duration: number;
  distance: number;
  elevationGain: number;
  averageHeartrate: number | null;
  maxHeartrate: number | null;
  averageSpeed: number;
  maxSpeed: number;
  calories: number;
  kudosCount: number;
  achievementCount: number;
}

export class IntegrationsManager {
  // Méthodes pour Apple Health
  static async connectAppleHealth(userId: string, permissions?: string[]): Promise<boolean> {
    try {
      if (Platform.OS !== 'ios') {
        throw new Error('Apple Health est uniquement disponible sur iOS');
      }

      console.log('🍎 Début connexion Apple Health pour utilisateur:', userId);

      const HealthKitService = require('../utils/healthKit').default;

      console.log('🔍 Vérification disponibilité Apple Health...');
      const isAvailable = await HealthKitService.isAvailable();
      if (!isAvailable) {
        console.log('❌ Apple Health non disponible');
        throw new Error('Apple Health n\'est pas disponible sur cet appareil. Vérifiez que l\'application Santé est installée et que HealthKit est supporté.');
      }

      console.log('🔐 Demande des permissions Apple Health...');
      const granted = await HealthKitService.requestPermissions();

      if (granted) {
        const status = await this.getIntegrationStatus(userId);
        status.appleHealth = {
          connected: true,
          lastSync: new Date().toISOString(),
          permissions: permissions || [
            'Steps',
            'ActiveEnergyBurned',
            'HeartRate',
            'Weight',
            'DistanceWalkingRunning'
          ]
        };
        await PersistentStorage.saveIntegrationStatus(userId, status);
        console.log('✅ Apple Health connecté avec succès');
        return true;
      } else {
        console.log('❌ Permissions Apple Health refusées par l\'utilisateur');
        return false;
      }
    } catch (error) {
      console.error('❌ Erreur connexion Apple Health:', error);
      throw error;
    }
  }

  static async disconnectAppleHealth(userId: string): Promise<void> {
    try {
      const status = await this.getIntegrationStatus(userId);
      status.appleHealth = {
        connected: false,
        permissions: []
      };
      await PersistentStorage.saveIntegrationStatus(userId, status);
      console.log('✅ Apple Health déconnecté');
    } catch (error) {
      console.error('❌ Erreur déconnexion Apple Health:', error);
      throw new Error('Impossible de déconnecter Apple Health. Vérifiez votre connexion internet.');
    }
  }

  static async syncAppleHealthData(userId: string): Promise<void> {
    try {
      const status = await this.getIntegrationStatus(userId);
      if (!status.appleHealth.connected) {
        throw new Error('Apple Health non connecté');
      }

      const AppleHealthKit = require('rn-apple-healthkit');

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 7);

      const stepData: any[] = [];
      for (let i = 0; i < 7; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);

        const stepsForDay = await new Promise<number>((resolve) => {
          const options = {
            startDate: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()).toISOString(),
            endDate: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 1).toISOString(),
          };

          AppleHealthKit.getStepCount(options, (callbackError: any, results: any) => {
            resolve(callbackError ? 0 : results?.value || 0);
          });
        });

        stepData.push({
          startDate: currentDate.toISOString(),
          value: stepsForDay
        });
      }

      const heartRateData = await new Promise<any[]>((resolve) => {
        const options = {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          limit: 100,
        };

        AppleHealthKit.getHeartRateSamples(options, (callbackError: any, results: any) => {
          resolve(callbackError ? [] : results || []);
        });
      });

      const sleepData: any[] = [];

      const healthDataByDate = {};

      stepData.forEach((entry: any) => {
        const date = new Date(entry.startDate).toISOString().split('T')[0];
        if (!healthDataByDate[date]) {
          healthDataByDate[date] = { date, steps: 0, heartRate: [], sleep: [] };
        }
        healthDataByDate[date].steps += entry.value || 0;
      });

      heartRateData.forEach((entry: any) => {
        const date = new Date(entry.startDate).toISOString().split('T')[0];
        if (!healthDataByDate[date]) {
          healthDataByDate[date] = { date, steps: 0, heartRate: [], sleep: [] };
        }
        healthDataByDate[date].heartRate.push(entry.value);
      });

      const processedData = Object.values(healthDataByDate).map((dayData: any) => ({
        date: dayData.date,
        steps: Math.round(dayData.steps),
        averageHeartRate: dayData.heartRate.length > 0 
          ? Math.round(dayData.heartRate.reduce((sum: number, hr: number) => sum + hr, 0) / dayData.heartRate.length)
          : 0,
        restingHeartRate: dayData.heartRate.length > 0 
          ? Math.min(...dayData.heartRate)
          : 0,
        sleepHours: dayData.sleep.reduce((total: number, sleep: any) => {
          const start = new Date(sleep.startDate);
          const end = new Date(sleep.endDate);
          return total + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        }, 0)
      }));

      await PersistentStorage.saveHealthData(userId, processedData);
      console.log('✅ Données Apple Health synchronisées sur le serveur');
    } catch (error) {
      console.error('❌ Erreur synchronisation Apple Health:', error);
      throw new Error('Impossible de synchroniser les données Apple Health. Vérifiez votre connexion internet.');
    }
  }

  // Méthodes pour Strava - Nouvelle implémentation
  static async connectStrava(userId: string): Promise<boolean> {
    try {
      const clientId = process.env.EXPO_PUBLIC_STRAVA_CLIENT_ID;
      const serverUrl = process.env.EXPO_PUBLIC_VPS_URL || 'https://eatfitbymax.cloud';

      console.log('🔍 Vérification configuration Strava...');
      console.log('Client ID:', clientId ? `${clientId.substring(0, 6)}...` : 'manquant');
      console.log('Serveur URL:', serverUrl);

      if (!clientId || clientId.includes('your_')) {
        console.error('❌ Configuration Strava manquante:', { clientId });
        throw new Error('Configuration Strava manquante. Veuillez contacter le support technique.');
      }

      // Tester la connexion au serveur
      try {
        const testResponse = await fetch(`${serverUrl}/api/health`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          timeout: 5000
        });

        if (!testResponse.ok) {
          throw new Error('Serveur non disponible');
        }
      } catch (error) {
        console.error('❌ Test serveur échoué:', error);
        throw new Error('Serveur indisponible. Vérifiez votre connexion internet.');
      }

      // Créer l'URL d'autorisation Strava
      const authUrl = `https://www.strava.com/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(serverUrl + '/strava-callback')}&approval_prompt=force&scope=read,activity:read_all&state=${userId}`;

      console.log('🔗 Ouverture de l\'autorisation Strava...');

      // Utiliser AuthSession pour un meilleur contrôle du flux OAuth
      const redirectUrl = AuthSession.makeRedirectUri({
        path: '/strava-callback',
        queryParams: { platform: 'mobile' }
      });

      console.log('📱 Redirect URL mobile:', redirectUrl);

      // Ouvrir l'autorisation Strava
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        redirectUrl,
        {
          showInRecents: false,
          presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
          controlsColor: '#FC4C02', // Couleur Strava
          toolbarColor: '#FFFFFF',
          secondaryToolbarColor: '#F5F5F5',
          showTitle: true,
          enableBarCollapsing: false,
          ephemeralWebSession: false
        }
      );

      console.log('🔄 Résultat WebBrowser:', result);

      if (result.type === 'success' && result.url) {
        console.log('✅ URL de retour reçue:', result.url);
        
        // Extraire le code de l'URL de retour
        const url = new URL(result.url);
        const code = url.searchParams.get('code');
        const error = url.searchParams.get('error');

        if (error) {
          console.error('❌ Erreur OAuth Strava:', error);
          throw new Error(`Erreur d'autorisation Strava: ${error}`);
        }

        if (code) {
          console.log('🔐 Code d\'autorisation reçu, échange en cours...');
          
          // Échanger le code contre un token via notre serveur
          const exchangeSuccess = await this.exchangeStravaCodeDirect(code, userId);
          
          if (exchangeSuccess) {
            console.log('✅ Connexion Strava réussie');
            return true;
          } else {
            console.error('❌ Échec de l\'échange de token');
            throw new Error('Impossible d\'échanger le code d\'autorisation');
          }
        } else {
          console.error('❌ Code d\'autorisation manquant dans l\'URL de retour');
          throw new Error('Code d\'autorisation manquant');
        }
      } else if (result.type === 'cancel') {
        console.log('ℹ️ Connexion Strava annulée par l\'utilisateur');
        return false;
      } else {
        console.error('❌ Résultat WebBrowser inattendu:', result);
        throw new Error('Processus d\'autorisation interrompu');
      }

    } catch (error) {
      console.error('❌ Erreur connexion Strava:', error);
      if (error.message.includes('Configuration') || error.message.includes('Serveur')) {
        throw error;
      }
      throw new Error('Impossible de connecter Strava. Vérifiez votre connexion internet et réessayez.');
    }
  }

  static async exchangeStravaCodeDirect(code: string, userId: string): Promise<boolean> {
    try {
      const serverUrl = process.env.EXPO_PUBLIC_VPS_URL || 'https://eatfitbymax.cloud';

      console.log('🔄 Échange direct du code Strava...');

      const response = await fetch(`${serverUrl}/api/strava/exchange-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: code,
          userId: userId
        }),
        timeout: 15000 // 15 secondes timeout
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erreur serveur échange token:', response.status, errorText);
        throw new Error(`Erreur serveur lors de l'authentification Strava (${response.status})`);
      }

      const result = await response.json();
      console.log('📋 Résultat échange token:', { success: result.success, hasAthlete: !!result.athlete });

      if (result.success && result.athlete) {
        // Mettre à jour le statut local avec les nouvelles données
        const status = await this.getIntegrationStatus(userId);
        status.strava = {
          connected: true,
          athlete: result.athlete,
          accessToken: result.access_token,
          refreshToken: result.refresh_token,
          expiresAt: result.expires_at
        };
        await PersistentStorage.saveIntegrationStatus(userId, status);

        console.log('✅ Token Strava échangé et sauvegardé avec succès');
        return true;
      } else {
        console.error('❌ Réponse serveur invalide:', result);
        return false;
      }

    } catch (error) {
      console.error('❌ Erreur échange code Strava:', error);
      throw new Error('Impossible d\'échanger le code d\'autorisation avec Strava. Vérifiez votre connexion internet.');
    }
  }

  static async disconnectStrava(userId: string): Promise<void> {
    try {
      // Révoquer le token côté serveur
      const serverUrl = process.env.EXPO_PUBLIC_VPS_URL || 'https://eatfitbymax.cloud';
      
      try {
        await fetch(`${serverUrl}/api/strava/disconnect/${userId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000
        });
      } catch (error) {
        console.warn('⚠️ Impossible de révoquer le token côté serveur:', error);
      }

      // Nettoyer le statut local
      const status = await this.getIntegrationStatus(userId);
      status.strava = {
        connected: false
      };
      await PersistentStorage.saveIntegrationStatus(userId, status);
      
      // Nettoyer les données locales
      await AsyncStorage.removeItem(`strava_activities_${userId}`);
      
      console.log('✅ Strava déconnecté');
    } catch (error) {
      console.error('❌ Erreur déconnexion Strava:', error);
      throw new Error('Impossible de déconnecter Strava. Vérifiez votre connexion internet.');
    }
  }

  static async refreshStravaToken(userId: string): Promise<string> {
    try {
      const status = await this.getIntegrationStatus(userId);

      if (!status.strava.connected || !status.strava.refreshToken) {
        throw new Error('Strava non connecté ou token de rafraîchissement manquant');
      }

      const serverUrl = process.env.EXPO_PUBLIC_VPS_URL || 'https://eatfitbymax.cloud';

      const response = await fetch(`${serverUrl}/api/strava/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          refreshToken: status.strava.refreshToken
        }),
        timeout: 10000
      });

      if (!response.ok) {
        console.error('❌ Erreur rafraîchissement token:', response.status);
        throw new Error('Erreur lors du rafraîchissement du token Strava');
      }

      const tokenData = await response.json();

      if (tokenData.success) {
        // Mettre à jour les tokens
        status.strava.accessToken = tokenData.access_token;
        status.strava.refreshToken = tokenData.refresh_token;
        status.strava.expiresAt = tokenData.expires_at;

        await PersistentStorage.saveIntegrationStatus(userId, status);
        return tokenData.access_token;
      } else {
        throw new Error('Token de rafraîchissement invalide');
      }

    } catch (error) {
      console.error('❌ Erreur rafraîchissement token Strava:', error);
      if (error.message.includes('invalide') || error.message.includes('rafraîchissement')) {
        console.log('Token de rafraîchissement invalide. Déconnexion de Strava.');
        await this.disconnectStrava(userId);
      }
      throw new Error('Impossible de rafraîchir le token Strava. Veuillez vous reconnecter.');
    }
  }

  static async getValidStravaToken(userId: string): Promise<string> {
    try {
      const status = await this.getIntegrationStatus(userId);

      if (!status.strava.connected) {
        throw new Error('Strava non connecté');
      }

      const now = Math.floor(Date.now() / 1000);
      if (!status.strava.expiresAt || now >= status.strava.expiresAt - 300) {
        console.log('🔄 Token Strava expire bientôt, rafraîchissement...');
        return await this.refreshStravaToken(userId);
      }

      if (!status.strava.accessToken) {
        throw new Error('Token d\'accès manquant');
      }

      console.log('✅ Utilisation du token Strava existant');
      return status.strava.accessToken;
    } catch (error) {
      console.error('❌ Erreur récupération token Strava:', error);
      throw error;
    }
  }

  static async syncStravaActivities(userId: string): Promise<void> {
    try {
      const accessToken = await this.getValidStravaToken(userId);

      const after = Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000);

      const response = await fetch(`https://www.strava.com/api/v3/athlete/activities?after=${after}&per_page=100`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        timeout: 15000
      });

      if (!response.ok) {
        console.error('❌ Erreur API Strava:', response.status, await response.text());
        throw new Error(`Erreur lors de la récupération des activités Strava (${response.status})`);
      }

      const activities = await response.json();

      const processedActivities: StravaActivity[] = activities.map((activity: any) => ({
        id: activity.id.toString(),
        name: activity.name || 'Sans nom',
        type: activity.type,
        date: new Date(activity.start_date).toISOString(),
        duration: activity.moving_time,
        distance: activity.distance,
        elevationGain: activity.total_elevation_gain,
        averageHeartrate: activity.average_heartrate || null,
        maxHeartrate: activity.max_heartrate || null,
        averageSpeed: activity.average_speed,
        maxSpeed: activity.max_speed,
        calories: activity.kilojoules ? Math.round(activity.kilojoules * 0.239) : 0,
        kudosCount: activity.kudos_count || 0,
        achievementCount: activity.achievement_count || 0
      }));

      // Sauvegarder localement
      await AsyncStorage.setItem(`strava_activities_${userId}`, JSON.stringify(processedActivities));

      // Sauvegarder sur le serveur
      const serverUrl = process.env.EXPO_PUBLIC_VPS_URL || 'https://eatfitbymax.cloud';
      const saveResponse = await fetch(`${serverUrl}/api/strava/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(processedActivities),
        timeout: 15000
      });

      if (!saveResponse.ok) {
        console.warn('⚠️ Erreur sauvegarde serveur:', saveResponse.status);
      }

      console.log(`✅ ${processedActivities.length} activités Strava synchronisées`);
    } catch (error) {
      console.error('❌ Erreur synchronisation Strava:', error);
      throw error;
    }
  }

  static async getStravaActivities(userId: string): Promise<StravaActivity[]> {
    try {
      const stored = await AsyncStorage.getItem(`strava_activities_${userId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed.filter(activity =>
            activity &&
            typeof activity === 'object' &&
            activity.id &&
            activity.name &&
            activity.date
          );
        }
      }
      return [];
    } catch (error) {
      console.error('❌ Erreur chargement activités Strava:', error);
      await AsyncStorage.removeItem(`strava_activities_${userId}`);
      return [];
    }
  }

  static async getHealthData(userId: string): Promise<any[]> {
    try {
      return await PersistentStorage.getHealthData(userId);
    } catch (error) {
      console.error('❌ Erreur récupération données Apple Health:', error);
      throw new Error('Impossible de récupérer les données Apple Health. Vérifiez votre connexion internet.');
    }
  }

  static async getStravaStatusFromServer(userId: string): Promise<any> {
    try {
      const serverUrl = process.env.EXPO_PUBLIC_VPS_URL || 'https://eatfitbymax.cloud';

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${serverUrl}/api/strava/status/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Statut Strava du serveur:', data);
        return data;
      } else if (response.status === 404) {
        console.log('📝 Statut Strava non trouvé pour:', userId);
        return { connected: false };
      } else {
        const errorText = await response.text().catch(() => 'Erreur inconnue');
        console.error(`❌ Erreur serveur statut Strava: ${response.status}, ${errorText}`);
        return { connected: false };
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error('⏰ Timeout statut Strava');
      } else {
        console.error('❌ Erreur récupération statut Strava:', error);
      }
      return { connected: false };
    }
  }

  // Méthodes générales
  static async getIntegrationStatus(userId: string): Promise<IntegrationConfig> {
    try {
      const status = await PersistentStorage.getUserIntegrationStatus(userId);
      status.appleHealth = status.appleHealth || { connected: false, permissions: [] };
      status.strava = status.strava || { connected: false };
      return status;
    } catch (error) {
      console.log('⚠️ Erreur récupération statuts intégrations:', error?.message || error);

      return {
        appleHealth: {
          connected: false,
          permissions: []
        },
        strava: {
          connected: false
        }
      };
    }
  }

  static async updateIntegrationStatus(userId: string, status: IntegrationConfig): Promise<void> {
    try {
      await PersistentStorage.saveIntegrationStatus(userId, status);
    } catch (error) {
      console.error('❌ Erreur mise à jour statuts intégrations:', error);
      throw new Error('Impossible de mettre à jour les statuts d\'intégrations. Vérifiez votre connexion internet.');
    }
  }
}

// Fonction principale pour synchroniser toutes les données
export async function syncWithExternalApps(userId: string): Promise<void> {
  try {
    console.log('🔄 Début synchronisation complète pour:', userId);

    const integrationStatus = await IntegrationsManager.getIntegrationStatus(userId);
    const results = {
      appleHealth: false,
      strava: false
    };

    if (integrationStatus.appleHealth.connected) {
      try {
        await IntegrationsManager.syncAppleHealthData(userId);
        results.appleHealth = true;
        console.log('✅ Apple Health synchronisé');
      } catch (error) {
        console.error('❌ Erreur sync Apple Health:', error);
      }
    }

    if (integrationStatus.strava.connected) {
      try {
        await IntegrationsManager.syncStravaActivities(userId);
        results.strava = true;
        console.log('✅ Strava synchronisé');
      } catch (error) {
        console.error('❌ Erreur sync Strava:', error);
      }
    }

    console.log('🔄 Synchronisation terminée:', results);
  } catch (error) {
    console.error('❌ Erreur synchronisation complète:', error);
    throw error;
  }
}

export const testServerConnection = async (serverUrl: string): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${serverUrl}/api/health`, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.log(`⚠️ Test connexion serveur ${serverUrl} échoué:`, error);
    return false;
  }
};

export interface IntegrationStatus {
  id: string;
  name: string;
  description: string;
  isConnected: boolean;
  icon: string;
  lastSync: Date | null;
}

export const getIntegrationStatuses = async (userId: string): Promise<IntegrationStatus[]> => {
  try {
    const integrationStatus = await IntegrationsManager.getIntegrationStatus(userId);
    
    return [
      {
        id: 'strava',
        name: 'Strava',
        description: 'Synchronisation des activités sportives',
        isConnected: integrationStatus.strava.connected,
        icon: '🏃‍♂️',
        lastSync: null
      },
      {
        id: 'apple-health',
        name: 'Apple Health',
        description: 'Données de santé et fitness',
        isConnected: integrationStatus.appleHealth.connected,
        icon: '❤️',
        lastSync: integrationStatus.appleHealth.lastSync ? new Date(integrationStatus.appleHealth.lastSync) : null
      },
      {
        id: 'google-fit',
        name: 'Google Fit',
        description: 'Suivi d\'activité Google',
        isConnected: false,
        icon: '📊',
        lastSync: null
      }
    ];
  } catch (error) {
    console.log('⚠️ Erreur récupération statuts intégrations:', error?.message || error);
    return [
      {
        id: 'strava',
        name: 'Strava',
        description: 'Synchronisation des activités sportives',
        isConnected: false,
        icon: '🏃‍♂️',
        lastSync: null
      },
      {
        id: 'apple-health',
        name: 'Apple Health',
        description: 'Données de santé et fitness',
        isConnected: false,
        icon: '❤️',
        lastSync: null
      },
      {
        id: 'google-fit',
        name: 'Google Fit',
        description: 'Suivi d\'activité Google',
        isConnected: false,
        icon: '📊',
        lastSync: null
      }
    ];
  }
};
