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
  // Utiliser l'URL du serveur Replit pour la cohérence
  return `${process.env.EXPO_PUBLIC_VPS_URL || 'https://eatfitbymax.cloud'}/strava-callback`;
};

const STRAVA_REDIRECT_URI = getStravaRedirectUri();

export interface IntegrationConfig {
  appleHealth: {
    connected: boolean;
    permissions: string[];
    lastSync?: string; // Ajout pour stocker la date du dernier sync
  };
  strava: {
    connected: boolean;
    athlete?: any; // Ajout pour stocker les infos de l'athlète
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
  };
}

// Interface pour les activités Strava, utilisée dans getStravaActivities
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

      // Importer HealthKitService
      const HealthKitService = require('../utils/healthKit').default;

      // Vérifier la disponibilité d'Apple Health
      console.log('🔍 Vérification disponibilité Apple Health...');
      const isAvailable = await HealthKitService.isAvailable();
      if (!isAvailable) {
        console.log('❌ Apple Health non disponible');
        throw new Error('Apple Health n\'est pas disponible sur cet appareil. Vérifiez que l\'application Santé est installée et que HealthKit est supporté.');
      }

      // Demander les permissions via HealthKitService
      console.log('🔐 Demande des permissions Apple Health...');
      const granted = await HealthKitService.requestPermissions();

      if (granted) {
        // Sauvegarder le statut de connexion
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

      // Obtenir les données des 7 derniers jours
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 7);

      // Récupérer les pas des 7 derniers jours
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

      // Récupérer les données de fréquence cardiaque
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

      // Récupérer les données de sommeil (pas directement supporté par rn-apple-healthkit de base)
      const sleepData: any[] = [];
      // Note: Les données de sommeil nécessitent une configuration spéciale avec rn-apple-healthkit
      // Pour l'instant, on laisse le tableau vide

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
      // Les données de sommeil ne sont pas directement disponibles via rn-apple-healthkit
      // On peut ajouter cette fonctionnalité plus tard si nécessaire

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

  // Méthodes pour Strava
  static async connectStrava(userId: string): Promise<boolean> {
    try {
      const clientId = process.env.EXPO_PUBLIC_STRAVA_CLIENT_ID;
      const serverUrl = process.env.EXPO_PUBLIC_VPS_URL || 'https://eatfitbymax.cloud';

      console.log('🔍 Vérification configuration Strava...');
      console.log('Client ID présent:', !!clientId);
      console.log('Serveur URL:', serverUrl);

      if (!clientId || clientId.includes('your_')) {
        throw new Error('Configuration Strava manquante. Contactez le support technique.');
      }

      // Créer l'URL d'autorisation Strava vers notre serveur
      const authUrl = `https://www.strava.com/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(serverUrl + '/strava-callback')}&approval_prompt=force&scope=read,activity:read_all&state=${userId}`;

      console.log('🔗 Ouverture de l\'autorisation Strava...');

      // Ouvrir l'autorisation Strava
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl, 
        serverUrl,
        {
          showInRecents: false,
          presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN
        }
      );

      console.log('🔄 Résultat WebBrowser:', result.type);

      // Toujours vérifier le statut côté serveur après tentative de connexion
      await new Promise(resolve => setTimeout(resolve, 3000)); // Attendre 3 secondes

      const serverStatus = await this.getStravaStatusFromServer(userId);
      console.log('📡 Statut serveur Strava:', serverStatus);

      if (serverStatus && serverStatus.connected) {
        console.log('✅ Connexion Strava confirmée côté serveur');

        // Mettre à jour le statut local
        const status = await this.getIntegrationStatus(userId);
        status.strava = {
          connected: true,
          athlete: serverStatus.athlete
        };
        await PersistentStorage.saveIntegrationStatus(userId, status);

        return true;
      } else {
        console.log('❌ Connexion Strava échouée');
        return false;
      }

    } catch (error) {
      console.error('❌ Erreur connexion Strava:', error);
      if (error.message.includes('Configuration')) {
        throw error; // Propager les erreurs de configuration
      }
      throw new Error('Impossible de connecter Strava. Vérifiez votre connexion internet et réessayez.');
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
          athlete: result.athlete,
          accessToken: result.access_token, // Stocker l'access token
          refreshToken: result.refresh_token, // Stocker le refresh token
          expiresAt: result.expires_at // Stocker l'expiration
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

      if (!clientId || !clientSecret) {
        throw new Error('Configuration Strava manquante pour le rafraîchissement du token.');
      }

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
        console.error('Strava API Error:', await response.text()); // Log the actual error from Strava
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
      // Si le token de rafraîchissement n'est plus valide, déconnecter Strava
      if (error.message.includes('Erreur lors du rafraîchissement') || error.message.includes('invalid_grant')) {
        console.log('Token de rafraîchissement invalide ou expiré. Déconnexion de Strava.');
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
      if (!status.strava.expiresAt || now >= status.strava.expiresAt - 300) { // 5 minutes buffer
        // Token expire dans 5 minutes ou moins, le rafraîchir
        console.log('Token Strava expire bientôt, rafraîchissement...');
        return await this.refreshStravaToken(userId);
      }

      console.log('Utilisation du token Strava existant.');
      return status.strava.accessToken!; // L'opérateur ! est sûr ici car nous avons déjà vérifié connected et le refresh est géré.
    } catch (error) {
      console.error('❌ Erreur récupération token Strava:', error);
      throw error; // Propager l'erreur pour que l'appelant puisse la gérer
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
        console.error('Strava API Error:', await response.text());
        throw new Error(`Erreur lors de la récupération des activités Strava (Statut: ${response.status})`);
      }

      const activities = await response.json();

      // Traiter et formater les activités
      const processedActivities: StravaActivity[] = activities.map((activity: any) => ({
        id: activity.id.toString(), // Assurer que l'ID est une chaîne
        name: activity.name || 'Sans nom', // Valeur par défaut si le nom est manquant
        type: activity.type,
        date: new Date(activity.start_date).toISOString(), // Normaliser la date
        duration: activity.moving_time,
        distance: activity.distance,
        elevationGain: activity.total_elevation_gain,
        averageHeartrate: activity.average_heartrate || null, // Gérer les nulls
        maxHeartrate: activity.max_heartrate || null, // Gérer les nulls
        averageSpeed: activity.average_speed,
        maxSpeed: activity.max_speed,
        calories: activity.kilojoules ? Math.round(activity.kilojoules * 0.239) : 0,
        kudosCount: activity.kudos_count || 0, // Valeur par défaut
        achievementCount: activity.achievement_count || 0 // Valeur par défaut
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
        console.error('Serveur VPS Error:', await saveResponse.text());
        throw new Error(`Erreur lors de la sauvegarde des activités Strava sur le serveur (Statut: ${saveResponse.status})`);
      }

      console.log('✅ Activités Strava synchronisées sur le serveur');
    } catch (error) {
      console.error('❌ Erreur synchronisation Strava:', error);
      // Si l'erreur est liée à un token invalide, cela sera géré par getValidStravaToken
      throw error; // Propager l'erreur
    }
  }

  static async getStravaActivities(userId: string): Promise<StravaActivity[]> {
    try {
      const stored = await AsyncStorage.getItem(`strava_activities_${userId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Validation du format des données
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
      // Nettoyer les données corrompues
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
      const serverUrl = process.env.EXPO_PUBLIC_VPS_URL || 'http://51.178.29.220:5000';

      const response = await fetch(`${serverUrl}/api/strava/status/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Statut Strava récupéré du serveur VPS:', data);
        return data;
      } else if (response.status === 404) {
        console.log('Statut Strava non trouvé sur le serveur pour:', userId);
        return { connected: false }; // Si le serveur ne trouve pas le statut, considérer comme déconnecté
      } else {
        console.error(`Erreur serveur VPS pour /api/strava/status/${userId}: Statut ${response.status}`);
        return { connected: false }; // En cas d'autre erreur, considérer comme déconnecté
      }
    } catch (error) {
      console.error('❌ Erreur récupération statut Strava du serveur:', error);
      return { connected: false }; // En cas d'erreur réseau, considérer comme déconnecté
    }
  }

  // Méthodes générales
  static async getIntegrationStatus(userId: string): Promise<IntegrationConfig> {
    try {
      const status = await PersistentStorage.getUserIntegrationStatus(userId);
      // S'assurer que toutes les propriétés existent pour éviter les erreurs
      status.appleHealth = status.appleHealth || { connected: false, permissions: [] };
      status.strava = status.strava || { connected: false };
      return status;
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
        // Ne pas arrêter la synchronisation complète en cas d'échec d'une intégration
      }
    } else {
      console.log('🍎 Apple Health non connecté, synchronisation ignorée.');
    }

    // Synchroniser Strava si connecté
    if (integrationStatus.strava.connected) {
      try {
        await IntegrationsManager.syncStravaActivities(userId);
        results.strava = true;
        console.log('✅ Strava synchronisé avec succès');
      } catch (error) {
        console.error('❌ Erreur sync Strava:', error);
        // Ne pas arrêter la synchronisation complète en cas d'échec d'une intégration
      }
    } else {
      console.log('🏃 Strava non connecté, synchronisation ignorée.');
    }

    console.log('Synchronisation complète terminée pour utilisateur:', userId, results);

    if (!results.appleHealth && integrationStatus.appleHealth.connected) {
      console.warn('Apple Health connecté mais synchronisation échouée');
    }
    if (!results.strava && integrationStatus.strava.connected) {
      console.warn('Strava connecté mais synchronisation échouée');
    }
  } catch (error) {
    console.error('Erreur lors de la synchronisation complète:', error);
    // Lancer une erreur si la récupération du statut des intégrations échoue gravement
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

    let isServerAvailable = false;
    try {
      const testResponse = await fetch(`${process.env.EXPO_PUBLIC_VPS_URL}/api/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      });

      isServerAvailable = testResponse.ok;
      console.log(`✅ Serveur ${process.env.EXPO_PUBLIC_VPS_URL} disponible: ${isServerAvailable}`);
    } catch (testError) {
      console.log(`⚠️ Test de connexion au serveur ${process.env.EXPO_PUBLIC_VPS_URL} échoué:`, testError);
      isServerAvailable = false;
    } finally {
      clearTimeout(timeoutId);
    }

    if (!isServerAvailable) {
      console.log('📋 Utilisation des statuts d\'intégrations par défaut car le serveur n\'est pas disponible.');
      return getDefaultIntegrationStatuses();
    }

    // Si le serveur est disponible, récupérer les statuts réels
    // Pour l'instant, on retourne toujours les valeurs par défaut car l'endpoint /api/integrations n'existe pas encore
    // et l'endpoint /api/strava/status/{userId} ne couvre pas toutes les intégrations.
    console.log('📋 Utilisation des statuts d\'intégrations par défaut (endpoint API manquant)');
    
    // Tentative de récupération des statuts réels si l'API était implémentée
    // Exemple :
    // const integrationStatus = await IntegrationsManager.getIntegrationStatus(userId);
    // return [
    //   { id: 'strava', name: 'Strava', description: 'Synchronisation des activités sportives', isConnected: integrationStatus.strava.connected, icon: '🏃‍♂️', lastSync: null },
    //   { id: 'apple-health', name: 'Apple Health', description: 'Données de santé et fitness', isConnected: integrationStatus.appleHealth.connected, icon: '❤️', lastSync: integrationStatus.appleHealth.lastSync ? new Date(integrationStatus.appleHealth.lastSync) : null },
    //   { id: 'google-fit', name: 'Google Fit', description: 'Suivi d\'activité Google', isConnected: false, icon: '📊', lastSync: null } // Google Fit non implémenté
    // ];

    return getDefaultIntegrationStatuses();

  } catch (error) {
    console.log('⚠️ Erreur générale récupération intégrations, utilisation des valeurs par défaut:', error?.message || error);
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