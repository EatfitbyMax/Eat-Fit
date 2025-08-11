import { PersistentStorage } from './storage';
import { Platform } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configuration Strava
const STRAVA_CLIENT_ID = process.env.EXPO_PUBLIC_STRAVA_CLIENT_ID;
const STRAVA_CLIENT_SECRET = process.env.EXPO_PUBLIC_STRAVA_CLIENT_SECRET;
const SERVER_URL = process.env.EXPO_PUBLIC_VPS_URL || 'https://eatfitbymax.cloud';

export interface IntegrationConfig {
  appleHealth: {
    connected: boolean;
    permissions: string[];
    lastSync?: string;
  };
  strava: {
    connected: boolean;
    athlete?: any;
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
  // ========================================
  // 🏃‍♂️ STRAVA - VERSION SIMPLIFIÉE
  // ========================================

  /**
   * Connexion Strava simplifiée
   */
  static async connectStrava(userId: string): Promise<boolean> {
    console.log('🔄 [STRAVA] Début connexion pour:', userId);

    try {
      // Validation de base
      if (!STRAVA_CLIENT_ID || !userId) {
        throw new Error('Configuration manquante');
      }

      console.log('🔧 [STRAVA] Configuration:', {
        clientId: STRAVA_CLIENT_ID,
        serverUrl: SERVER_URL,
        userId: userId
      });

      // Construction de l'URL d'autorisation Strava avec redirect_uri exact
      const redirectUri = 'https://eatfitbymax.cloud/strava-callback';
      const authUrl = [
        'https://www.strava.com/oauth/authorize',
        `?client_id=${STRAVA_CLIENT_ID}`,
        `&response_type=code`,
        `&redirect_uri=${encodeURIComponent(redirectUri)}`,
        `&approval_prompt=force`,
        `&scope=read,activity:read_all`,
        `&state=${userId}`
      ].join('');

      console.log('🔗 [STRAVA] Ouverture autorisation OAuth...');

      console.log('🔗 [STRAVA] URL d\'autorisation:', authUrl);

      // Configuration du WebBrowser pour Strava
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        'eatfitbymax://', // Deep link scheme
        {
          showInRecents: false,
          presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
          preferEphemeralSession: true, // Session privée
          browserPackage: undefined, // Utiliser le navigateur par défaut
          readerMode: false,
          dismissButtonStyle: 'close',
        }
      );

      console.log('📱 [STRAVA] Résultat WebBrowser:', {
        type: result.type,
        url: result.url
      });

      // Vérifier si l'utilisateur a annulé
      if (result.type === 'cancel') {
        console.log('👤 [STRAVA] Connexion annulée par l\'utilisateur');
        throw new Error('Connexion annulée par l\'utilisateur');
      }

      // Vérifier si on a reçu un code dans l'URL
      if (result.type === 'success' && result.url) {
        const url = new URL(result.url);
        const code = url.searchParams.get('code');
        const error = url.searchParams.get('error');
        
        if (error) {
          console.error('❌ [STRAVA] Erreur OAuth:', error);
          throw new Error(`Erreur OAuth: ${error}`);
        }
        
        if (code) {
          console.log('✅ [STRAVA] Code d\'autorisation reçu directement');
          // Échanger le code immédiatement
          const exchangeSuccess = await this.exchangeStravaCode(code, userId);
          if (exchangeSuccess) {
            console.log('✅ [STRAVA] Échange de code réussi');
            return true;
          }
        }
      }

      // Si pas de code direct, attendre que le serveur traite l'autorisation
      console.log('⏳ [STRAVA] Attente du traitement serveur...');
      await new Promise(resolve => setTimeout(resolve, 4000));

      // Vérifier le statut final plusieurs fois
      for (let i = 0; i < 3; i++) {
        const isConnected = await this.checkStravaConnection(userId);
        if (isConnected) {
          console.log('✅ [STRAVA] Connexion réussie (tentative', i + 1, ')');
          return true;
        }
        if (i < 2) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      console.log('❌ [STRAVA] Connexion échouée après vérifications');
      return false;
    } catch (error) {
      console.error('❌ [STRAVA] Erreur connexion:', error);
      throw new Error('Impossible de connecter Strava: ' + error.message);
    }
  }

  /**
   * Vérification simple du statut de connexion
   */
  static async checkStravaConnection(userId: string): Promise<boolean> {
    try {
      const response = await fetch(`${SERVER_URL}/api/strava/status/${userId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        timeout: 2000
      });

      if (response.ok) {
        const data = await response.json();
        console.log('📊 [STRAVA] Statut:', { connected: data.connected, athlete: data.athlete?.firstname });

        if (data.connected) {
          // Mettre à jour le statut local
          await this.updateLocalStravaStatus(userId, data);
        }

        return data.connected || false;
      }

      return false;
    } catch (error) {
      console.error('❌ [STRAVA] Erreur vérification:', error);
      return false;
    }
  }

  /**
   * Déconnexion Strava
   */
  static async disconnectStrava(userId: string): Promise<void> {
    console.log('🔄 [STRAVA] Déconnexion pour:', userId);

    try {
      // Nettoyer les données locales
      const status = await this.getIntegrationStatus(userId);
      status.strava = {
        connected: false,
        athlete: null,
        lastSync: null,
        athleteId: null
      };
      await PersistentStorage.saveIntegrationStatus(userId, status);

      // Nettoyer le cache des activités
      await AsyncStorage.removeItem(`strava_activities_${userId}`);

      // Notifier le serveur (non bloquant)
      try {
        await fetch(`${SERVER_URL}/api/strava/disconnect/${userId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (serverError) {
        console.log('⚠️ [STRAVA] Erreur notification serveur (non critique)');
      }

      console.log('✅ [STRAVA] Déconnexion réussie');
    } catch (error) {
      console.error('❌ [STRAVA] Erreur déconnexion:', error);
      throw new Error('Impossible de déconnecter Strava');
    }
  }

  /**
   * Récupération des activités Strava
   */
  static async getStravaActivities(userId: string): Promise<StravaActivity[]> {
    try {
      console.log('🔍 [STRAVA] Récupération activités pour:', userId);

      // Essayer de récupérer depuis le serveur
      const response = await fetch(`${SERVER_URL}/api/strava/${userId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000
      });

      if (response.ok) {
        const activities = await response.json();
        if (Array.isArray(activities) && activities.length > 0) {
          console.log(`✅ [STRAVA] ${activities.length} activités récupérées`);
          return activities;
        }
      }

      // Fallback vers le cache local
      const cached = await AsyncStorage.getItem(`strava_activities_${userId}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          console.log(`📱 [STRAVA] ${parsed.length} activités depuis le cache`);
          return parsed;
        }
      }

      console.log('📭 [STRAVA] Aucune activité trouvée');
      return [];
    } catch (error) {
      console.error('❌ [STRAVA] Erreur récupération activités:', error);
      return [];
    }
  }

  /**
   * Échanger le code d'autorisation contre un token
   */
  static async exchangeStravaCode(code: string, userId: string): Promise<boolean> {
    try {
      console.log('🔄 [STRAVA] Échange de code pour utilisateur:', userId);

      const response = await fetch(`${SERVER_URL}/api/strava/exchange-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, userId }),
        timeout: 10000
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          console.log('✅ [STRAVA] Échange de code réussi');
          // Mettre à jour le statut local
          if (data.athlete) {
            await this.updateLocalStravaStatus(userId, data);
          }
          return true;
        }
      }

      console.error('❌ [STRAVA] Échec échange de code');
      return false;
    } catch (error) {
      console.error('❌ [STRAVA] Erreur échange de code:', error);
      return false;
    }
  }

  /**
   * Mise à jour du statut local
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
    }
  }

  /**
   * Synchronisation du statut Strava depuis le serveur
   */
  static async syncStravaStatusFromServer(userId: string): Promise<void> {
    try {
      console.log('🔄 [STRAVA] Synchronisation statut depuis serveur pour:', userId);
      
      const response = await fetch(`${SERVER_URL}/api/strava/status/${userId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000
      });

      if (response.ok) {
        const data = await response.json();
        console.log('📊 [STRAVA] Statut serveur:', data);

        if (data.connected) {
          await this.updateLocalStravaStatus(userId, data);
        } else {
          // Mettre à jour le statut local comme déconnecté
          const status = await this.getIntegrationStatus(userId);
          status.strava = {
            connected: false,
            athlete: null,
            lastSync: null,
            athleteId: null
          };
          await PersistentStorage.saveIntegrationStatus(userId, status);
        }
      }
    } catch (error) {
      console.error('❌ [STRAVA] Erreur synchronisation depuis serveur:', error);
    }
  }

  // ========================================
  // 🍎 APPLE HEALTH (inchangé)
  // ========================================

  static async connectAppleHealth(userId: string, permissions?: string[]): Promise<boolean> {
    try {
      if (Platform.OS !== 'ios') {
        throw new Error('Apple Health est uniquement disponible sur iOS');
      }

      const HealthKitService = require('../utils/healthKit').default;
      const isAvailable = await HealthKitService.isAvailable();
      if (!isAvailable) {
        throw new Error('Apple Health n\'est pas disponible sur cet appareil');
      }

      const granted = await HealthKitService.requestPermissions();
      if (granted) {
        const status = await this.getIntegrationStatus(userId);
        status.appleHealth = {
          connected: true,
          lastSync: new Date().toISOString(),
          permissions: permissions || ['Steps', 'ActiveEnergyBurned', 'HeartRate', 'Weight', 'DistanceWalkingRunning']
        };
        await PersistentStorage.saveIntegrationStatus(userId, status);
        return true;
      }
      return false;
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
    } catch (error) {
      console.error('❌ Erreur déconnexion Apple Health:', error);
      throw error;
    }
  }

  // ========================================
  // 🔧 UTILITAIRES
  // ========================================

  static async getIntegrationStatus(userId: string): Promise<IntegrationConfig> {
    try {
      const status = await PersistentStorage.getUserIntegrationStatus(userId);
      status.appleHealth = status.appleHealth || { connected: false, permissions: [] };
      status.strava = status.strava || { connected: false };
      return status;
    } catch (error) {
      return {
        appleHealth: { connected: false, permissions: [] },
        strava: { connected: false }
      };
    }
  }

  static async updateIntegrationStatus(userId: string, status: IntegrationConfig): Promise<void> {
    try {
      await PersistentStorage.saveIntegrationStatus(userId, status);
    } catch (error) {
      console.error('❌ Erreur mise à jour statuts:', error);
      throw error;
    }
  }
}

// Fonction de synchronisation simplifiée
export async function syncWithExternalApps(userId: string): Promise<void> {
  try {
    console.log('🔄 Synchronisation pour:', userId);
    const integrationStatus = await IntegrationsManager.getIntegrationStatus(userId);

    if (integrationStatus.strava.connected) {
      console.log('🏃 Synchronisation Strava en cours...');
      // La synchronisation se fait côté serveur automatiquement
    }

    console.log('✅ Synchronisation terminée');
  } catch (error) {
    console.error('❌ Erreur synchronisation:', error);
  }
}