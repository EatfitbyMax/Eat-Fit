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
  // Toujours utiliser l'URL du serveur VPS pour Strava OAuth
  return 'https://eatfitbymax.cloud/strava-callback';
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
  // Alias pour compatibilité avec l'affichage
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

  // ========================================
  // 🏃‍♂️ GESTION CONNEXION/DÉCONNEXION STRAVA
  // ========================================

  /**
   * Connexion à Strava avec gestion d'erreurs améliorée
   * @param userId - ID de l'utilisateur
   * @returns Promise<boolean> - true si connexion réussie
   */
  static async connectStrava(userId: string): Promise<boolean> {
    console.log('🔄 [STRAVA] Début de la connexion pour utilisateur:', userId);

    try {
      // 1. Validation de la configuration
      const config = this.validateStravaConfig();
      if (!config.isValid) {
        throw new Error(config.errorMessage);
      }

      // 2. Test de connectivité serveur
      const serverAvailable = await this.testServerConnectivity(config.serverUrl);
      if (!serverAvailable) {
        throw new Error('Serveur EatFitByMax indisponible. Vérifiez votre connexion internet.');
      }

      // 3. Lancement du processus d'autorisation OAuth
      const authResult = await this.initiateStravaOAuth(userId, config);
      
      // 4. Vérification du résultat côté serveur
      const connectionResult = await this.verifyStravaConnection(userId, config.serverUrl);
      
      if (connectionResult.success) {
        // 5. Mise à jour du statut local
        await this.updateLocalStravaStatus(userId, connectionResult.data);
        console.log('✅ [STRAVA] Connexion réussie pour utilisateur:', userId);
        return true;
      } else {
        console.log('❌ [STRAVA] Connexion échouée pour utilisateur:', userId);
        return false;
      }

    } catch (error) {
      console.error('❌ [STRAVA] Erreur lors de la connexion:', error);
      throw this.formatStravaError(error);
    }
  }

  /**
   * Déconnexion de Strava avec nettoyage complet
   * @param userId - ID de l'utilisateur
   */
  static async disconnectStrava(userId: string): Promise<void> {
    console.log('🔄 [STRAVA] Début de la déconnexion pour utilisateur:', userId);

    try {
      // 1. Nettoyer les données locales
      await this.clearLocalStravaData(userId);

      // 2. Notifier le serveur de la déconnexion
      await this.notifyServerDisconnection(userId);

      console.log('✅ [STRAVA] Déconnexion réussie pour utilisateur:', userId);
    } catch (error) {
      console.error('❌ [STRAVA] Erreur lors de la déconnexion:', error);
      throw new Error('Impossible de déconnecter Strava. Veuillez réessayer.');
    }
  }

  /**
   * Validation de la configuration Strava
   * @returns object - Configuration validée ou erreur
   */
  private static validateStravaConfig(): { isValid: boolean; errorMessage?: string; clientId?: string; serverUrl?: string } {
    const clientId = process.env.EXPO_PUBLIC_STRAVA_CLIENT_ID;
    const serverUrl = process.env.EXPO_PUBLIC_VPS_URL || 'https://eatfitbymax.cloud';

    console.log('🔍 [STRAVA] Validation configuration - Client ID:', clientId ? 'Configuré' : 'Manquant');
    console.log('🔍 [STRAVA] Validation configuration - Serveur:', serverUrl);

    if (!clientId || clientId.includes('your_') || clientId.trim() === '') {
      return {
        isValid: false,
        errorMessage: 'Configuration Strava manquante. Veuillez contacter le support technique.'
      };
    }

    return {
      isValid: true,
      clientId,
      serverUrl
    };
  }

  /**
   * Test de connectivité au serveur
   * @param serverUrl - URL du serveur
   * @returns Promise<boolean> - true si serveur disponible
   */
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
      
      console.log(isAvailable ? '✅ [STRAVA] Serveur disponible' : '❌ [STRAVA] Serveur indisponible');
      return isAvailable;
    } catch (error) {
      console.log('❌ [STRAVA] Erreur test connectivité:', error);
      return false;
    }
  }

  /**
   * Initiation du processus OAuth Strava
   * @param userId - ID utilisateur
   * @param config - Configuration validée
   * @returns Promise<any> - Résultat WebBrowser
   */
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

  /**
   * Vérification de la connexion côté serveur avec retry
   * @param userId - ID utilisateur
   * @param serverUrl - URL du serveur
   * @returns Promise<object> - Résultat de la vérification
   */
  private static async verifyStravaConnection(userId: string, serverUrl: string): Promise<{ success: boolean; data?: any }> {
    console.log('⏳ [STRAVA] Vérification connexion côté serveur...');
    
    // Attendre que le serveur traite la demande
    await new Promise(resolve => setTimeout(resolve, 3000));

    const maxAttempts = 4;
    const retryDelay = 2000;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`🔄 [STRAVA] Tentative ${attempt}/${maxAttempts} de vérification...`);
        
        const serverStatus = await this.getStravaStatusFromServer(userId);
        
        if (serverStatus && serverStatus.connected) {
          console.log('✅ [STRAVA] Connexion confirmée côté serveur');
          return { success: true, data: serverStatus };
        }

        if (attempt < maxAttempts) {
          console.log(`⏳ [STRAVA] Attente ${retryDelay}ms avant nouvelle tentative...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
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

  /**
   * Mise à jour du statut local Strava
   * @param userId - ID utilisateur
   * @param stravaData - Données Strava du serveur
   */
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

  /**
   * Nettoyage des données locales Strava
   * @param userId - ID utilisateur
   */
  private static async clearLocalStravaData(userId: string): Promise<void> {
    try {
      // Nettoyer le statut d'intégration
      const status = await this.getIntegrationStatus(userId);
      status.strava = {
        connected: false,
        athlete: null,
        lastSync: null,
        athleteId: null
      };
      await PersistentStorage.saveIntegrationStatus(userId, status);

      // Nettoyer les activités stockées localement
      await AsyncStorage.removeItem(`strava_activities_${userId}`);
      
      console.log('🧹 [STRAVA] Données locales nettoyées');
    } catch (error) {
      console.error('❌ [STRAVA] Erreur nettoyage données locales:', error);
      throw error;
    }
  }

  /**
   * Notification de déconnexion au serveur
   * @param userId - ID utilisateur
   */
  private static async notifyServerDisconnection(userId: string): Promise<void> {
    try {
      const serverUrl = process.env.EXPO_PUBLIC_VPS_URL || 'https://eatfitbymax.cloud';
      
      const response = await fetch(`${serverUrl}/api/strava/disconnect/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 5000
      });

      if (response.ok) {
        console.log('📡 [STRAVA] Serveur notifié de la déconnexion');
      } else {
        console.log('⚠️ [STRAVA] Échec notification serveur (non critique)');
      }
    } catch (error) {
      console.log('⚠️ [STRAVA] Erreur notification serveur (non critique):', error);
      // Ne pas lancer d'erreur car la déconnexion locale a réussi
    }
  }

  /**
   * Formatage des erreurs Strava
   * @param error - Erreur originale
   * @returns Error - Erreur formatée pour l'utilisateur
   */
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

  /**
   * Échange du code d'autorisation contre un token (legacy, maintenu pour compatibilité)
   * @param code - Code d'autorisation Strava
   * @param userId - ID utilisateur
   * @returns Promise<boolean> - true si échange réussi
   */
  static async exchangeStravaCode(code: string, userId: string): Promise<boolean> {
    console.log('🔄 [STRAVA] Échange code autorisation (legacy method)');
    
    try {
      const serverUrl = process.env.EXPO_PUBLIC_VPS_URL || 'https://eatfitbymax.cloud';

      const response = await fetch(`${serverUrl}/api/strava/exchange-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: code,
          userId: userId
        }),
        timeout: 10000
      });

      if (!response.ok) {
        throw new Error(`Erreur serveur: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        await this.updateLocalStravaStatus(userId, result);
        console.log('✅ [STRAVA] Échange code réussi');
        return true;
      }

      return false;
    } catch (error) {
      console.error('❌ [STRAVA] Erreur échange code:', error);
      throw new Error('Impossible d\'échanger le code d\'autorisation Strava.');
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
        // Ajouter l'alias pour compatibilité
        avgHeartRate: activity.average_heartrate || null
      }));

      // Sauvegarder localement pour l'affichage immédiat
      await AsyncStorage.setItem(`strava_activities_${userId}`, JSON.stringify(processedActivities));

      // Sauvegarder sur le serveur VPS
      const serverUrl = process.env.EXPO_PUBLIC_VPS_URL || 'https://eatfitbymax.cloud';
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

      // Mettre à jour la date de dernière synchronisation
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
      // Essayer de récupérer depuis le cache local d'abord
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
            // S'assurer que avgHeartRate est disponible pour l'affichage
            avgHeartRate: activity.avgHeartRate || activity.averageHeartrate
          }));
          
          if (validActivities.length > 0) {
            console.log(`📱 ${validActivities.length} activités Strava chargées depuis le cache local`);
            return validActivities;
          }
        }
      }

      // Si pas de cache local, essayer de synchroniser
      console.log('🔄 Aucune activité en cache, tentative de synchronisation...');
      const integrationStatus = await this.getIntegrationStatus(userId);
      
      if (integrationStatus.strava.connected) {
        try {
          await this.syncStravaActivities(userId);
          // Réessayer de lire le cache après synchronisation
          const newStored = await AsyncStorage.getItem(`strava_activities_${userId}`);
          if (newStored) {
            const newParsed = JSON.parse(newStored);
            if (Array.isArray(newParsed)) {
              return newParsed.map(activity => ({
                ...activity,
                avgHeartRate: activity.avgHeartRate || activity.averageHeartrate
              }));
            }
          }
        } catch (syncError) {
          console.error('❌ Erreur lors de la synchronisation automatique:', syncError);
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

  /**
   * Récupération du statut Strava depuis le serveur
   * @param userId - ID utilisateur
   * @returns Promise<any> - Statut Strava ou null si erreur
   */
  static async getStravaStatusFromServer(userId: string): Promise<any> {
    try {
      const serverUrl = process.env.EXPO_PUBLIC_VPS_URL || 'https://eatfitbymax.cloud';

      console.log(`🔍 [STRAVA] Vérification statut serveur pour utilisateur: ${userId}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 secondes timeout

      const response = await fetch(`${serverUrl}/api/strava/status/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ [STRAVA] Statut récupéré du serveur:', { 
          connected: data.connected, 
          athleteId: data.athlete?.id 
        });
        return data;
      } else if (response.status === 404) {
        console.log('📝 [STRAVA] Statut non trouvé sur serveur (normal pour nouveau compte)');
        return { connected: false };
      } else {
        const errorText = await response.text().catch(() => 'Erreur inconnue');
        console.error(`❌ [STRAVA] Erreur serveur ${response.status}:`, errorText);
        return { connected: false };
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error('⏰ [STRAVA] Timeout récupération statut serveur');
      } else {
        console.error('❌ [STRAVA] Erreur récupération statut serveur:', error);
      }
      return { connected: false };
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