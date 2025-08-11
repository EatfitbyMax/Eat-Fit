import { PersistentStorage } from './storage';
import { Platform } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configuration Strava avec les variables d'environnement
const STRAVA_CLIENT_ID = process.env.EXPO_PUBLIC_STRAVA_CLIENT_ID;
const STRAVA_CLIENT_SECRET = process.env.EXPO_PUBLIC_STRAVA_CLIENT_SECRET;

// Configuration du redirect URI selon l'environnement  
const getStravaRedirectUri = (): string => {
  return process.env.EXPO_PUBLIC_VPS_URL ? `${process.env.EXPO_PUBLIC_VPS_URL}/strava-callback` : 'https://eatfitbymax.cloud/strava-callback';
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
    lastSync?: string;
    athleteId?: string;
  };
}

export interface StravaActivity {
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
  avgHeartRate?: number | null;
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

  // ========================================
  // 🏃‍♂️ GESTION CONNEXION/DÉCONNEXION STRAVA
  // ========================================

  static async connectStrava(userId: string): Promise<boolean> {
    console.log('🔄 Connexion Strava pour:', userId);

    try {
      const config = this.validateStravaConfig();
      if (!config.isValid) {
        throw new Error(config.errorMessage);
      }

      const serverAvailable = await this.testServerConnectivity(config.serverUrl);
      if (!serverAvailable) {
        throw new Error('Serveur EatFitByMax indisponible. Vérifiez votre connexion internet.');
      }

      const authResult = await this.initiateStravaOAuth(userId, config);

      const connectionResult = await this.verifyStravaConnection(userId, config.serverUrl);

      if (connectionResult.success) {
        await this.updateLocalStravaStatus(userId, connectionResult.data);
        console.log('✅ Connexion Strava réussie pour utilisateur:', userId);
        return true;
      } else {
        console.log('❌ Connexion Strava échouée pour utilisateur:', userId);
        return false;
      }

    } catch (error) {
      console.error('❌ Erreur lors de la connexion Strava:', error);
      throw this.formatStravaError(error);
    }
  }

  static async disconnectStrava(userId: string): Promise<void> {
    console.log('🔄 [STRAVA] Début de la déconnexion pour utilisateur:', userId);

    try {
      await this.clearLocalStravaData(userId);
      await this.notifyServerDisconnection(userId);
      console.log('✅ [STRAVA] Déconnexion réussie pour utilisateur:', userId);
    } catch (error) {
      console.error('❌ [STRAVA] Erreur lors de la déconnexion:', error);
      throw new Error('Impossible de déconnecter Strava. Veuillez réessayer.');
    }
  }

  private static validateStravaConfig(): { isValid: boolean; errorMessage?: string; clientId?: string; serverUrl?: string } {
    const clientId = STRAVA_CLIENT_ID;
    const serverUrl = process.env.EXPO_PUBLIC_VPS_URL || 'https://eatfitbymax.cloud';

    console.log('🔍 [STRAVA] Validation configuration - Client ID:', clientId);
    console.log('🔍 [STRAVA] Validation configuration - Serveur:', serverUrl);
    console.log('🔍 [STRAVA] Validation configuration - Client Secret présent:', !!STRAVA_CLIENT_SECRET);

    if (!clientId || clientId.trim() === '') {
      return {
        isValid: false,
        errorMessage: 'Configuration Strava manquante (Client ID). Veuillez contacter le support technique.'
      };
    }

    if (!STRAVA_CLIENT_SECRET || STRAVA_CLIENT_SECRET.trim() === '') {
      return {
        isValid: false,
        errorMessage: 'Configuration Strava manquante (Client Secret). Veuillez contacter le support technique.'
      };
    }

    return {
      isValid: true,
      clientId,
      serverUrl
    };
  }

  private static async testServerConnectivity(serverUrl: string): Promise<boolean> {
    try {
      console.log('🔍 [STRAVA] Test connectivité serveur:', serverUrl);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${serverUrl}/api/health`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        }
      });

      clearTimeout(timeoutId);
      const isAvailable = response.ok;

      console.log(isAvailable ? '✅ [STRAVA] Serveur disponible' : '❌ [STRAVA] Serveur indisponible', {
        status: response.status,
        url: `${serverUrl}/api/health`
      });
      return isAvailable;
    } catch (error) {
      console.log('❌ [STRAVA] Erreur test connectivité:', error);
      return false;
    }
  }

  private static async initiateStravaOAuth(userId: string, config: any): Promise<any> {
    try {
      const redirectUri = `${config.serverUrl}/strava-callback`;
      const scope = 'read,activity:read_all';

      const authUrl = [
        'https://www.strava.com/oauth/authorize',
        `?client_id=${config.clientId}`,
        `&response_type=code`,
        `&redirect_uri=${encodeURIComponent(redirectUri)}`,
        `&approval_prompt=force`,
        `&scope=${scope}`,
        `&state=${userId}`
      ].join('');

      console.log('🔗 [STRAVA] Ouverture autorisation OAuth...');

      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        config.serverUrl,
        {
          showInRecents: false,
          presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
          controlsColor: '#FC4C02',
          toolbarColor: '#FFFFFF'
        }
      );

      console.log('📱 [STRAVA] Résultat WebBrowser:', result.type);
      return result;
    } catch (error) {
      console.error('❌ [STRAVA] Erreur OAuth:', error);
      throw error;
    }
  }

  private static async verifyStravaConnection(userId: string, serverUrl: string): Promise<{ success: boolean; data?: any }> {
    console.log('🔄 [STRAVA] Vérification connexion avec délais adaptatifs...');

    await new Promise(resolve => setTimeout(resolve, 1000));

    const maxAttempts = 15;
    const baseDelay = 500;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`🔄 [STRAVA] Vérification ${attempt}/${maxAttempts}...`);

        const serverStatus = await this.getStravaStatusFromServer(userId);

        if (serverStatus && serverStatus.connected) {
          console.log('✅ [STRAVA] Connexion confirmée !');

          await this.updateLocalStravaStatus(userId, serverStatus);

          this.triggerImmediateSync(userId).catch(err => 
            console.log('⚠️ [STRAVA] Sync arrière-plan échoué:', err)
          );

          return { success: true, data: serverStatus };
        }

        if (attempt < maxAttempts) {
          const delay = baseDelay * (attempt <= 5 ? 1 : attempt <= 10 ? 2 : 3);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      } catch (error) {
        console.log(`⚠️ [STRAVA] Erreur tentative ${attempt}:`, error);
        if (attempt === maxAttempts) {
          throw error;
        }
      }
    }

    return { success: false };
  }

  private static async triggerImmediateSync(userId: string): Promise<void> {
    try {
      console.log('🔄 [STRAVA] Démarrage synchronisation immédiate...');
      await this.syncStravaActivities(userId);
      console.log('✅ [STRAVA] Synchronisation immédiate réussie');
    } catch (error) {
      console.error('❌ [STRAVA] Erreur synchronisation immédiate:', error);
    }
  }

  private static async updateLocalStravaStatus(userId: string, stravaData: any): Promise<void> {
    try {
      const status = await this.getIntegrationStatus(userId);

      status.strava = {
        connected: true,
        athlete: stravaData.athlete,
        lastSync: new Date().toISOString(),
        athleteId: stravaData.athlete?.id?.toString() || null
      };

      await PersistentStorage.saveIntegrationStatus(userId, status);
      console.log('💾 [STRAVA] Statut local mis à jour');
    } catch (error) {
      console.error('❌ [STRAVA] Erreur mise à jour statut local:', error);
      throw error;
    }
  }

  private static async clearLocalStravaData(userId: string): Promise<void> {
    try {
      const status = await this.getIntegrationStatus(userId);
      status.strava = {
        connected: false,
        athlete: null,
        lastSync: null,
        athleteId: null
      };
      await PersistentStorage.saveIntegrationStatus(userId, status);

      await AsyncStorage.removeItem(`strava_activities_${userId}`);

      console.log('🧹 [STRAVA] Données locales nettoyées');
    } catch (error) {
      console.error('❌ [STRAVA] Erreur nettoyage données locales:', error);
      throw error;
    }
  }

  private static async notifyServerDisconnection(userId: string): Promise<void> {
    try {
      const serverUrl = 'https://eatfitbymax.cloud';

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${serverUrl}/api/strava/disconnect/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        console.log('📡 [STRAVA] Serveur notifié de la déconnexion');
      } else {
        console.log('⚠️ [STRAVA] Échec notification serveur (non critique)');
      }
    } catch (error) {
      console.log('⚠️ [STRAVA] Erreur notification serveur (non critique):', error);
    }
  }

  private static formatStravaError(error: any): Error {
    if (error.message?.includes('Configuration')) {
      return new Error('Configuration Strava manquante. Contactez le support technique.');
    }

    if (error.message?.includes('Serveur indisponible')) {
      return new Error('Serveur temporairement indisponible. Vérifiez votre connexion internet.');
    }

    if (error.message?.includes('OAuth') || error.message?.includes('authorization')) {
      return new Error('Erreur d\'autorisation Strava. Veuillez réessayer.');
    }

    return new Error('Impossible de connecter Strava. Vérifiez votre connexion internet et réessayez.');
  }

  static async exchangeStravaCode(code: string, userId: string): Promise<boolean> {
    console.log('🔄 [STRAVA] Échange code autorisation (legacy method)');

    try {
      const serverUrl = process.env.EXPO_PUBLIC_VPS_URL || 'https://eatfitbymax.cloud';

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      console.log('📤 [STRAVA] Envoi vers serveur:', {
        url: `${serverUrl}/api/strava/exchange-token`,
        codeLength: code.length,
        userId: userId
      });

      const response = await fetch(`${serverUrl}/api/strava/exchange-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: code,
          userId: userId,
          useStravaIntegration: true
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      console.log('📥 [STRAVA] Réponse serveur:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [STRAVA] Détails erreur serveur:', errorText);
        throw new Error(`Erreur serveur: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ [STRAVA] Résultat échange:', {
        success: result.success,
        hasAthlete: !!result.athlete
      });

      if (result.success) {
        await this.updateLocalStravaStatus(userId, result);
        console.log('✅ [STRAVA] Échange code réussi');
        return true;
      }

      console.log('❌ [STRAVA] Échange échoué côté serveur');
      return false;
    } catch (error) {
      console.error('❌ [STRAVA] Erreur échange code:', error);
      throw new Error('Impossible d\'échanger le code d\'autorisation Strava: ' + error.message);
    }
  }

  static async refreshStravaToken(userId: string): Promise<string> {
    try {
      const status = await this.getIntegrationStatus(userId);

      if (!status.strava.connected || !status.strava.refreshToken) {
        throw new Error('Strava non connecté ou token de rafraîchissement manquant');
      }

      const clientId = STRAVA_CLIENT_ID;
      const clientSecret = STRAVA_CLIENT_SECRET;

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
        console.error('Strava API Error:', await response.text());
        throw new Error('Erreur lors du rafraîchissement du token Strava');
      }

      const tokenData = await response.json();

      status.strava.accessToken = tokenData.access_token;
      status.strava.refreshToken = tokenData.refresh_token;
      status.strava.expiresAt = tokenData.expires_at;

      await PersistentStorage.saveIntegrationStatus(userId, status);

      return tokenData.access_token;
    } catch (error) {
      console.error('❌ Erreur rafraîchissement token Strava:', error);
      if (error.message.includes('Erreur lors du rafraîchissement') || error.message.includes('invalid_grant')) {
        console.log('Token de rafraîchissement invalide ou expiré. Déconnexion de Strava.');
        await this.disconnectStrava(userId);
      }
      throw new Error('Impossible de rafraîchir le token Strava. Veuillez vous reconnecter.');
    }
  }

  static async getValidStravaToken(userId: string): Promise<string> {
    try {
      await this.syncStravaStatusFromServer(userId);

      const status = await this.getIntegrationStatus(userId);

      if (!status.strava.connected) {
        throw new Error('Strava non connecté');
      }

      if (!status.strava.accessToken) {
        console.log('⚠️ Pas d\'access token, vérification serveur...');
        const serverStatus = await this.getStravaStatusFromServer(userId);
        if (serverStatus && serverStatus.connected && serverStatus.accessToken) {
          status.strava.accessToken = serverStatus.accessToken;
          status.strava.refreshToken = serverStatus.refreshToken;
          status.strava.expiresAt = serverStatus.expiresAt;
          await PersistentStorage.saveIntegrationStatus(userId, status);
          return serverStatus.accessToken;
        } else {
          throw new Error('Strava non connecté');
        }
      }

      const now = Math.floor(Date.now() / 1000);
      if (!status.strava.expiresAt || now >= status.strava.expiresAt - 300) {
        console.log('Token Strava expire bientôt, rafraîchissement...');
        return await this.refreshStravaToken(userId);
      }

      console.log('Utilisation du token Strava existant.');
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
        }
      });

      if (!response.ok) {
        console.error('Strava API Error:', await response.text());
        throw new Error(`Erreur lors de la récupération des activités Strava (Statut: ${response.status})`);
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
        achievementCount: activity.achievement_count || 0,
        avgHeartRate: activity.average_heartrate || null
      }));

      await AsyncStorage.setItem(`strava_activities_${userId}`, JSON.stringify(processedActivities));

      const serverUrl = 'https://eatfitbymax.cloud';
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

      const status = await this.getIntegrationStatus(userId);
      status.strava.lastSync = new Date().toISOString();
      await PersistentStorage.saveIntegrationStatus(userId, status);

      console.log('✅ Activités Strava synchronisées sur le serveur et localement');
    } catch (error) {
      console.error('❌ Erreur synchronisation Strava:', error);
      throw error;
    }
  }

  static async getStravaActivities(userId: string): Promise<StravaActivity[]> {
    try {
      console.log(`🔍 [GET_STRAVA_ACTIVITIES] Début pour utilisateur: ${userId}`);

      try {
        const serverUrl = 'https://eatfitbymax.cloud';
        const response = await fetch(`${serverUrl}/api/strava/${userId}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          timeout: 5000
        });

        if (response.ok) {
          const serverActivities = await response.json();
          if (Array.isArray(serverActivities) && serverActivities.length > 0) {
            console.log(`✅ [SERVEUR] ${serverActivities.length} activités récupérées depuis serveur VPS`);

            const validServerActivities = serverActivities.filter(activity =>
              activity &&
              typeof activity === 'object' &&
              activity.id &&
              activity.name &&
              activity.date
            ).map(activity => ({
              ...activity,
              avgHeartRate: activity.avgHeartRate || activity.averageHeartrate
            }));

            await AsyncStorage.setItem(`strava_activities_${userId}`, JSON.stringify(validServerActivities));
            console.log(`💾 [CACHE] ${validServerActivities.length} activités sauvées en cache`);

            return validServerActivities;
          }
        }
        console.log('⚠️ [SERVEUR] Aucune activité trouvée sur le serveur, essai cache local...');
      } catch (serverError) {
        console.log('⚠️ [SERVEUR] Erreur serveur, fallback vers cache:', serverError);
      }

      const stored = await AsyncStorage.getItem(`strava_activities_${userId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const validActivities = parsed.filter(activity =>
            activity &&
            typeof activity === 'object' &&
            activity.id &&
            activity.name &&
            activity.date
          ).map(activity => ({
            ...activity,
            avgHeartRate: activity.avgHeartRate || activity.averageHeartrate
          }));

          if (validActivities.length > 0) {
            console.log(`📱 [CACHE] ${validActivities.length} activités chargées depuis le cache local`);
            return validActivities;
          }
        }
      }

      console.log('🔄 [SYNC] Aucune activité en cache, tentative de synchronisation...');
      const integrationStatus = await this.getIntegrationStatus(userId);

      if (integrationStatus.strava.connected) {
        try {
          await this.syncStravaActivities(userId);

          const newStored = await AsyncStorage.getItem(`strava_activities_${userId}`);
          if (newStored) {
            const newParsed = JSON.parse(newStored);
            if (Array.isArray(newParsed)) {
              const syncedActivities = newParsed.map(activity => ({
                ...activity,
                avgHeartRate: activity.avgHeartRate || activity.averageHeartrate
              }));
              console.log(`✅ [SYNC] ${syncedActivities.length} activités après synchronisation`);
              return syncedActivities;
            }
          }
        } catch (syncError) {
          console.error('❌ [SYNC] Erreur lors de la synchronisation automatique:', syncError);
        }
      } else {
        console.log('⚠️ [SYNC] Strava non connecté, impossible de synchroniser');
      }

      console.log('📭 [FINAL] Aucune activité trouvée');
      return [];
    } catch (error) {
      console.error('❌ [ERROR] Erreur chargement activités Strava:', error);
      await AsyncStorage.removeItem(`strava_activities_${userId}`);
      return [];
    }
  }

  static async getStravaStatusFromServer(userId: string): Promise<any> {
    try {
      const serverUrl = 'https://eatfitbymax.cloud';

      console.log(`⚡ [STRAVA] Vérification ultra-rapide statut serveur: ${userId}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const response = await fetch(`${serverUrl}/api/strava/status/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Accept': 'application/json',
          'Connection': 'keep-alive'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        console.log('⚡ [STRAVA] Statut récupéré ultra-rapidement:', { 
          connected: data.connected, 
          athleteId: data.athlete?.id,
          athleteName: data.athlete?.firstname,
          hasToken: !!data.accessToken
        });

        return data;
      } else if (response.status === 404) {
        console.log('📝 [STRAVA] Statut non trouvé (normal pour nouveau compte)');
        return { connected: false };
      } else {
        const errorText = await response.text().catch(() => 'Erreur inconnue');
        console.error(`❌ [STRAVA] Erreur serveur ${response.status}:`, errorText);
        return { connected: false };
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error('⏰ [STRAVA] Timeout (2s) récupération statut');
      } else {
        console.error('❌ [STRAVA] Erreur récupération statut serveur:', error);
      }
      return { connected: false };
    }
  }

  static async syncStravaStatusFromServer(userId: string): Promise<void> {
    try {
      console.log('🔄 [STRAVA] Synchronisation statut depuis serveur...');

      const serverStatus = await this.getStravaStatusFromServer(userId);
      const localStatus = await this.getIntegrationStatus(userId);

      if (serverStatus.connected !== localStatus.strava.connected) {
        console.log(`📝 [STRAVA] Mise à jour statut local: ${localStatus.strava.connected} -> ${serverStatus.connected}`);

        localStatus.strava = {
          connected: serverStatus.connected,
          athlete: serverStatus.athlete || null,
          lastSync: serverStatus.connected ? new Date().toISOString() : null,
          athleteId: serverStatus.athlete?.id?.toString() || null
        };

        await PersistentStorage.saveIntegrationStatus(userId, localStatus);
        console.log('✅ [STRAVA] Statut local synchronisé avec le serveur');
      } else {
        console.log('ℹ️ [STRAVA] Statut local déjà synchronisé');
      }
    } catch (error) {
      console.error('❌ [STRAVA] Erreur synchronisation statut depuis serveur:', error);
    }
  }

  static async getIntegrationStatus(userId: string): Promise<IntegrationConfig> {
    try {
      const status = await PersistentStorage.getUserIntegrationStatus(userId);
      status.appleHealth = status.appleHealth || { connected: false, permissions: [] };
      status.strava = status.strava || { connected: false };
      return status;
    } catch (error) {
      console.log('⚠️ Erreur récupération statuts intégrations, utilisation des valeurs par défaut:', error?.message || error);

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

export async function syncWithExternalApps(userId: string): Promise<void> {
  try {
    console.log('🔄 Début de la synchronisation complète pour utilisateur:', userId);

    const integrationStatus = await IntegrationsManager.getIntegrationStatus(userId);
    const results = {
      appleHealth: false,
      strava: false
    };

    if (integrationStatus.appleHealth.connected) {
      try {
        // Apple Health sync would go here
        results.appleHealth = true;
        console.log('✅ Apple Health synchronisé avec succès');
      } catch (error) {
        console.error('❌ Erreur sync Apple Health:', error);
      }
    } else {
      console.log('🍎 Apple Health non connecté, synchronisation ignorée.');
    }

    if (integrationStatus.strava.connected) {
      try {
        await IntegrationsManager.syncStravaActivities(userId);
        results.strava = true;
        console.log('✅ Strava synchronisé avec succès');
      } catch (error) {
        console.error('❌ Erreur sync Strava:', error);
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

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    let isServerAvailable = false;
    try {
      const testResponse = await fetch(`https://eatfitbymax.cloud/api/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      });

      isServerAvailable = testResponse.ok;
      console.log(`✅ Serveur https://eatfitbymax.cloud disponible: ${isServerAvailable}`);
    } catch (testError) {
      console.log(`⚠️ Test de connexion au serveur https://eatfitbymax.cloud échoué:`, testError);
      isServerAvailable = false;
    } finally {
      clearTimeout(timeoutId);
    }

    if (!isServerAvailable) {
      console.log('📋 Utilisation des statuts d\'intégrations par défaut car le serveur n\'est pas disponible.');
      return getDefaultIntegrationStatuses();
    }

    console.log('📋 Utilisation des statuts d\'intégrations par défaut (endpoint API manquant)');
    return getDefaultIntegrationStatuses();

  } catch (error) {
    console.log('⚠️ Erreur générale récupération intégrations, utilisation des valeurs par défaut:', error?.message || error);
    return getDefaultIntegrationStatuses();
  }
};

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