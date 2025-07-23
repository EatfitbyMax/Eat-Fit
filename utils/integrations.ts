import { PersistentStorage } from './storage';
import { Platform } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

// Configuration Strava sécurisée pour la production
const STRAVA_CLIENT_ID = process.env.EXPO_PUBLIC_STRAVA_CLIENT_ID || '';
const STRAVA_CLIENT_SECRET = process.env.EXPO_PUBLIC_STRAVA_CLIENT_SECRET || '';

// Configuration du redirect URI selon l'environnement  
const getStravaRedirectUri = (): string => {
  // Utiliser le domaine personnalisé pour la production
  return 'https://api.eatfitbymax.com/strava-callback';
};

const STRAVA_REDIRECT_URI = getStravaRedirectUri();

export interface IntegrationConfig {
  appleHealth: {
    connected: boolean;
    permissions: string[];
  };
  strava: {
    connected: boolean;
  };
}

export class IntegrationsManager {
  // Méthodes pour Apple Health
  static async connectAppleHealth(userId: string, permissions: string[]): Promise<boolean> {
    try {
      // Vérifier la disponibilité d'Apple Health (via expo-health-connect)
      const HealthConnect = await import('expo-health-connect');
      const available = await HealthConnect.isAvailable();

      if (!available) {
        console.log('Apple Health non disponible');
        return false;
      }

      // Demander les permissions
      const granted = await HealthConnect.requestPermissions(permissions);

      if (granted) {
        // Sauvegarder le statut de connexion sur le serveur uniquement
        const status = await this.getIntegrationStatus(userId);
        status.appleHealth = {
          connected: true,
          permissions: permissions
        };
        await PersistentStorage.saveIntegrationStatus(userId, status);
        console.log('✅ Apple Health connecté');
        return true;
      } else {
        console.log('❌ Permissions Apple Health refusées');
        return false;
      }
    } catch (error) {
      console.error('❌ Erreur connexion Apple Health:', error);
      throw new Error('Impossible de se connecter à Apple Health. Vérifiez votre connexion internet.');
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

      const HealthConnect = await import('expo-health-connect');

      // Obtenir les données des 7 derniers jours
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 7);

      // Récupérer différents types de données
      const stepData = await HealthConnect.getHealthData({
        type: 'steps',
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });

      const heartRateData = await HealthConnect.getHealthData({
        type: 'heartRate',
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });

      const sleepData = await HealthConnect.getHealthData({
        type: 'sleepAnalysis',
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });

      // Organiser les données par date
      const healthDataByDate = {};

      // Traiter les pas
      stepData.forEach((entry: any) => {
        const date = new Date(entry.startDate).toISOString().split('T')[0];
        if (!healthDataByDate[date]) {
          healthDataByDate[date] = { date, steps: 0, heartRate: [], sleep: [] };
        }
        healthDataByDate[date].steps += entry.value || 0;
      });

      // Traiter la fréquence cardiaque
      heartRateData.forEach((entry: any) => {
        const date = new Date(entry.startDate).toISOString().split('T')[0];
        if (!healthDataByDate[date]) {
          healthDataByDate[date] = { date, steps: 0, heartRate: [], sleep: [] };
        }
        healthDataByDate[date].heartRate.push(entry.value);
      });

      // Traiter les données de sommeil
      sleepData.forEach((entry: any) => {
        const date = new Date(entry.startDate).toISOString().split('T')[0];
        if (!healthDataByDate[date]) {
          healthDataByDate[date] = { date, steps: 0, heartRate: [], sleep: [] };
        }
        healthDataByDate[date].sleep.push({
          startDate: entry.startDate,
          endDate: entry.endDate,
          value: entry.value
        });
      });

      // Convertir en tableau et calculer les moyennes
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

      // Sauvegarder sur le serveur uniquement
      await PersistentStorage.saveHealthData(userId, processedData);
      console.log('✅ Données Apple Health synchronisées sur le serveur');
    } catch (error) {
      console.error('❌ Erreur synchronisation Apple Health:', error);
      throw new Error('Impossible de synchroniser les données Apple Health. Vérifiez votre connexion internet.');
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

  // Méthodes pour Strava
  static async connectStrava(userId: string): Promise<boolean> {
    try {
      const clientId = process.env.EXPO_PUBLIC_STRAVA_CLIENT_ID;

      if (!clientId) {
        throw new Error('Configuration Strava manquante');
      }

      // Créer l'URL d'autorisation Strava
      const authUrl = `https://www.strava.com/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${STRAVA_REDIRECT_URI}&approval_prompt=force&scope=read,activity:read_all`;

      console.log('🔗 Ouverture de l\'autorisation Strava:', authUrl);

      // Ouvrir l'autorisation Strava
      const result = await WebBrowser.openAuthSessionAsync(authUrl, STRAVA_REDIRECT_URI);

      if (result.type === 'success' && result.url) {
        const url = new URL(result.url);
        const code = url.searchParams.get('code');

        if (code) {
          return await this.exchangeStravaCode(code, userId);
        }
      }

      return false;
    } catch (error) {
      console.error('❌ Erreur connexion Strava:', error);
      throw new Error('Impossible de se connecter à Strava. Vérifiez votre connexion internet.');
    }
  }

  static async exchangeStravaCode(code: string, userId: string): Promise<boolean> {
    try {
      const serverUrl = process.env.EXPO_PUBLIC_VPS_URL || 'http://51.178.29.220:5000';

      // Utiliser le serveur VPS pour l'échange du token
      const response = await fetch(`${serverUrl}/api/strava/exchange-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: code,
          userId: userId
        })
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'authentification Strava');
      }

      const result = await response.json();

      if (result.success) {
        // Mettre à jour le statut local
        const status = await this.getIntegrationStatus(userId);
        status.strava = {
          connected: true,
          athlete: result.athlete
        };
        await PersistentStorage.saveIntegrationStatus(userId, status);

        console.log('✅ Strava connecté via serveur VPS');
        return true;
      }

      return false;
    } catch (error) {
      console.error('❌ Erreur connexion Strava:', error);
      throw new Error('Impossible de se connecter à Strava. Vérifiez votre connexion internet.');
    }
  }

  static async disconnectStrava(userId: string): Promise<void> {
    try {
      const status = await this.getIntegrationStatus(userId);
      status.strava = {
        connected: false
      };
      await PersistentStorage.saveIntegrationStatus(userId, status);
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

      const clientId = process.env.EXPO_PUBLIC_STRAVA_CLIENT_ID;
      const clientSecret = process.env.EXPO_PUBLIC_STRAVA_CLIENT_SECRET;

      const response = await fetch('https://www.strava.com/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: status.strava.refreshToken,
          grant_type: 'refresh_token'
        })
      });

      if (!response.ok) {
        throw new Error('Erreur lors du rafraîchissement du token Strava');
      }

      const tokenData = await response.json();

      // Mettre à jour les tokens
      status.strava.accessToken = tokenData.access_token;
      status.strava.refreshToken = tokenData.refresh_token;
      status.strava.expiresAt = tokenData.expires_at;

      await PersistentStorage.saveIntegrationStatus(userId, status);

      return tokenData.access_token;
    } catch (error) {
      console.error('❌ Erreur rafraîchissement token Strava:', error);
      throw new Error('Impossible de rafraîchir le token Strava. Vérifiez votre connexion internet.');
    }
  }

  static async getValidStravaToken(userId: string): Promise<string> {
    try {
      const status = await this.getIntegrationStatus(userId);

      if (!status.strava.connected) {
        throw new Error('Strava non connecté');
      }

      const now = Math.floor(Date.now() / 1000);
      if (status.strava.expiresAt && now >= status.strava.expiresAt - 300) {
        // Token expire dans 5 minutes ou moins, le rafraîchir
        return await this.refreshStravaToken(userId);
      }

      return status.strava.accessToken;
    } catch (error) {
      console.error('❌ Erreur récupération token Strava:', error);
      throw new Error('Impossible de récupérer le token Strava. Vérifiez votre connexion internet.');
    }
  }

  static async syncStravaActivities(userId: string): Promise<void> {
    try {
      const accessToken = await this.getValidStravaToken(userId);

      // Récupérer les activités des 30 derniers jours
      const after = Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000);

      const response = await fetch(`https://www.strava.com/api/v3/athlete/activities?after=${after}&per_page=100`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des activités Strava');
      }

      const activities = await response.json();

      // Traiter et formater les activités
      const processedActivities = activities.map((activity: any) => ({
        id: activity.id,
        name: activity.name,
        type: activity.type,
        date: activity.start_date,
        duration: activity.moving_time,
        distance: activity.distance,
        elevationGain: activity.total_elevation_gain,
        averageHeartrate: activity.average_heartrate,
        maxHeartrate: activity.max_heartrate,
        averageSpeed: activity.average_speed,
        maxSpeed: activity.max_speed,
        calories: activity.kilojoules ? Math.round(activity.kilojoules * 0.239) : 0,
        kudosCount: activity.kudos_count,
        achievementCount: activity.achievement_count
      }));

      // Sauvegarder les activités sur le serveur VPS uniquement
      const serverUrl = process.env.EXPO_PUBLIC_VPS_URL || 'http://51.178.29.220:5000';
      const saveResponse = await fetch(`${serverUrl}/api/strava/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(processedActivities),
      });

      if (!saveResponse.ok) {
        throw new Error('Erreur sauvegarde activités Strava');
      }

      console.log('✅ Activités Strava synchronisées sur le serveur');
    } catch (error) {
      console.error('❌ Erreur synchronisation Strava:', error);
      throw new Error('Impossible de synchroniser les activités Strava. Vérifiez votre connexion internet.');
    }
  }

  static async getStravaActivities(userId: string): Promise<any[]> {
    try {
      return await PersistentStorage.getStravaActivities(userId);
    } catch (error) {
      console.error('❌ Erreur récupération activités Strava:', error);
      throw new Error('Impossible de récupérer les activités Strava. Vérifiez votre connexion internet.');
    }
  }

  static async getStravaStatusFromServer(userId: string): Promise<any> {
    try {
      const serverUrl = process.env.EXPO_PUBLIC_VPS_URL || 'http://51.178.29.220:5000';

      const response = await fetch(`${serverUrl}/api/strava/status/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Statut Strava récupéré du serveur VPS:', data);
        return data;
      }

      return { connected: false };
    } catch (error) {
      console.error('❌ Erreur récupération statut Strava du serveur:', error);
      return { connected: false };
    }
  }

  // Méthodes générales
  static async getIntegrationStatus(userId: string): Promise<IntegrationConfig> {
    try {
      return await PersistentStorage.getUserIntegrationStatus(userId);
    } catch (error) {
      console.log('⚠️ Erreur récupération statuts intégrations, utilisation des valeurs par défaut:', error?.message || error);

      // Retourner une configuration par défaut au lieu de lancer une erreur
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
    console.log('🔄 Début de la synchronisation complète pour utilisateur:', userId);

    const integrationStatus = await IntegrationsManager.getIntegrationStatus(userId);
    const results = {
      appleHealth: false,
      strava: false
    };

    // Synchroniser Apple Health si connecté
    if (integrationStatus.appleHealth.connected) {
      try {
        await IntegrationsManager.syncAppleHealthData(userId);
        results.appleHealth = true;
        console.log('✅ Apple Health synchronisé avec succès');
      } catch (error) {
        console.error('❌ Erreur sync Apple Health:', error);
        throw error;
      }
    }

    // Synchroniser Strava si connecté
    if (integrationStatus.strava.connected) {
      try {
        await IntegrationsManager.syncStravaActivities(userId);
        results.strava = true;
        console.log('✅ Strava synchronisé avec succès');
      } catch (error) {
        console.error('❌ Erreur sync Strava:', error);
        throw error;
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

export const testServerConnection = async (serverUrl: string): Promise<boolean> => {
  try {
    console.log(`Test de connexion au serveur VPS: ${serverUrl}`);

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
    console.log(`⚠️ Erreur de connexion au serveur ${serverUrl}:`, error);
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
    console.log('🔍 Récupération statuts intégrations pour:', userId);

    // Tester d'abord la disponibilité du serveur avec un timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 secondes

    try {
      const testResponse = await fetch(`${process.env.EXPO_PUBLIC_VPS_URL}/api/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!testResponse.ok) {
        console.log('⚠️ Serveur non disponible, utilisation des données par défaut pour les intégrations');
        return getDefaultIntegrationStatuses();
      }

      console.log('✅ Serveur disponible pour les intégrations');
    } catch (testError) {
      clearTimeout(timeoutId);
      console.log('⚠️ Test de connexion échoué, utilisation des données par défaut pour les intégrations');
      return getDefaultIntegrationStatuses();
    }

    // Pour l'instant, on retourne toujours les valeurs par défaut car l'endpoint n'existe pas encore
    console.log('📋 Utilisation des statuts d\'intégrations par défaut');
    return getDefaultIntegrationStatuses();

  } catch (error) {
    console.log('⚠️ Erreur récupération intégrations, utilisation des valeurs par défaut:', error?.message || error);
    return getDefaultIntegrationStatuses();
  }
};

// Fonction helper pour les valeurs par défaut
const getDefaultIntegrationStatuses = (): IntegrationStatus[] => {
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
};