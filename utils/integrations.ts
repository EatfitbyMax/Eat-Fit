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
  // 🏃‍♂️ STRAVA - VERSION SERVEUR UNIQUEMENT
  // ========================================

  /**
   * Connexion Strava - tout géré côté serveur
   */
  static async connectStrava(userId: string): Promise<boolean> {
    console.log('🔄 [STRAVA] Début connexion côté serveur pour:', userId);

    try {
      // Validation de base
      if (!STRAVA_CLIENT_ID || !userId) {
        throw new Error('Configuration manquante');
      }

      // Construction de l'URL d'autorisation Strava
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

      // Configuration du WebBrowser pour Strava
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        'eatfitbymax://',
        {
          showInRecents: false,
          presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
          preferEphemeralSession: true,
          browserPackage: undefined,
          readerMode: false,
          dismissButtonStyle: 'close',
        }
      );

      console.log('📱 [STRAVA] Résultat WebBrowser:', result.type);

      // Vérifier si l'utilisateur a annulé
      if (result.type === 'cancel') {
        console.log('👤 [STRAVA] Connexion annulée par l\'utilisateur');
        throw new Error('Connexion annulée par l\'utilisateur');
      }

      // Attendre que le serveur traite l'autorisation
      console.log('⏳ [STRAVA] Attente du traitement serveur...');
      await new Promise(resolve => setTimeout(resolve, 4000));

      // Vérifier le statut final depuis le serveur plusieurs fois
      for (let i = 0; i < 3; i++) {
        const isConnected = await this.checkStravaConnectionFromServer(userId);
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
   * Vérification du statut de connexion depuis le serveur uniquement
   */
  static async checkStravaConnectionFromServer(userId: string): Promise<boolean> {
    try {
      const response = await fetch(`${SERVER_URL}/api/strava/status/${userId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('📊 [STRAVA] Statut serveur:', { connected: data.connected, athlete: data.athlete?.firstname });
        return data.connected || false;
      }

      return false;
    } catch (error) {
      console.error('❌ [STRAVA] Erreur vérification serveur:', error);
      return false;
    }
  }

  /**
   * Récupération du statut d'intégration depuis le serveur et local
   */
  static async getIntegrationStatusFromServer(userId: string): Promise<IntegrationConfig> {
    try {
      console.log('🔄 [INTEGRATIONS] Récupération statut depuis serveur pour:', userId);

      // Récupérer le statut Strava depuis le serveur
      const stravaResponse = await fetch(`${SERVER_URL}/api/strava/status/${userId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      let stravaStatus = { connected: false, athlete: null, lastSync: null, athleteId: null };

      if (stravaResponse.ok) {
        const stravaData = await stravaResponse.json();
        if (stravaData.connected && stravaData.athlete) {
          stravaStatus = {
            connected: true,
            athlete: stravaData.athlete,
            lastSync: stravaData.lastSync || new Date().toISOString(),
            athleteId: stravaData.athlete.id?.toString() || null
          };
        }
      }

      // Récupérer le statut Apple Health depuis AsyncStorage (local uniquement)
      let appleHealthStatus = { connected: false, permissions: [], lastSync: null };
      
      try {
        const appleHealthConnected = await AsyncStorage.getItem('appleHealthConnected');
        const appleHealthPermissions = await AsyncStorage.getItem('appleHealthPermissions');
        const appleHealthLastSync = await AsyncStorage.getItem('appleHealthLastSync');
        
        if (appleHealthConnected === 'true') {
          appleHealthStatus = {
            connected: true,
            permissions: appleHealthPermissions ? JSON.parse(appleHealthPermissions) : ['Steps', 'ActiveEnergyBurned', 'HeartRate', 'Weight', 'DistanceWalkingRunning'],
            lastSync: appleHealthLastSync || new Date().toISOString()
          };
          console.log('✅ [APPLE HEALTH] Statut récupéré depuis AsyncStorage:', appleHealthStatus);
        }
      } catch (storageError) {
        console.log('⚠️ [APPLE HEALTH] Erreur lecture AsyncStorage:', storageError);
      }

      return {
        appleHealth: appleHealthStatus,
        strava: stravaStatus
      };
    } catch (error) {
      console.error('❌ [INTEGRATIONS] Erreur récupération statut serveur:', error);
      return {
        appleHealth: { connected: false, permissions: [], lastSync: null },
        strava: { connected: false, athlete: null, lastSync: null, athleteId: null }
      };
    }
  }

  /**
   * Déconnexion Strava via le serveur
   */
  static async disconnectStrava(userId: string): Promise<void> {
    console.log('🔄 [STRAVA] Déconnexion serveur pour:', userId);

    try {
      const response = await fetch(`${SERVER_URL}/api/strava/disconnect/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        console.log('✅ [STRAVA] Déconnexion serveur réussie');
      } else {
        throw new Error('Erreur serveur lors de la déconnexion');
      }
    } catch (error) {
      console.error('❌ [STRAVA] Erreur déconnexion serveur:', error);
      throw new Error('Impossible de déconnecter Strava');
    }
  }

  /**
   * Récupération des activités Strava depuis le serveur (fichier Strava dédié)
   */
  static async getStravaActivities(userId: string): Promise<StravaActivity[]> {
    try {
      console.log('🔍 [STRAVA] Récupération activités depuis serveur pour:', userId);

      const response = await fetch(`${SERVER_URL}/api/strava/${userId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const activities = await response.json();
        if (Array.isArray(activities)) {
          console.log(`✅ [STRAVA] ${activities.length} activités récupérées depuis Strava/${userId}.json`);
          return activities;
        }
      }

      console.log('📭 [STRAVA] Aucune activité trouvée dans le fichier Strava dédié');
      return [];
    } catch (error) {
      console.error('❌ [STRAVA] Erreur récupération activités:', error);
      return [];
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

      console.log('🔄 [APPLE HEALTH] Tentative de connexion pour:', userId);

      const HealthKitService = require('../utils/healthKit').default;
      const isAvailable = await HealthKitService.isAvailable();
      if (!isAvailable) {
        console.log('❌ [APPLE HEALTH] Non disponible sur cet appareil');
        throw new Error('Apple Health n\'est pas disponible sur cet appareil');
      }

      console.log('✅ [APPLE HEALTH] Disponible - demande de permissions...');
      const granted = await HealthKitService.requestPermissions();
      
      if (granted) {
        console.log('✅ [APPLE HEALTH] Permissions accordées');
        
        const permissionsList = permissions || ['Steps', 'ActiveEnergyBurned', 'HeartRate', 'Weight', 'DistanceWalkingRunning'];
        const currentTime = new Date().toISOString();
        
        // Sauvegarder dans AsyncStorage
        await AsyncStorage.setItem('appleHealthConnected', 'true');
        await AsyncStorage.setItem('appleHealthPermissions', JSON.stringify(permissionsList));
        await AsyncStorage.setItem('appleHealthLastSync', currentTime);
        
        console.log('💾 [APPLE HEALTH] État sauvegardé localement:', {
          connected: true,
          permissions: permissionsList,
          lastSync: currentTime
        });
        
        return true;
      } else {
        console.log('❌ [APPLE HEALTH] Permissions refusées');
        return false;
      }
    } catch (error) {
      console.error('❌ [APPLE HEALTH] Erreur connexion:', error);
      throw error;
    }
  }

  static async disconnectAppleHealth(userId: string): Promise<void> {
    try {
      console.log('🔄 [APPLE HEALTH] Déconnexion pour:', userId);
      
      // Nettoyer AsyncStorage
      await AsyncStorage.removeItem('appleHealthConnected');
      await AsyncStorage.removeItem('appleHealthPermissions');
      await AsyncStorage.removeItem('appleHealthLastSync');
      
      console.log('✅ [APPLE HEALTH] Déconnexion locale terminée');
    } catch (error) {
      console.error('❌ [APPLE HEALTH] Erreur déconnexion:', error);
      throw error;
    }
  }

  // ========================================
  // 🔧 UTILITAIRES - VERSION SERVEUR
  // ========================================

  /**
   * Récupération du statut d'intégration (utilise désormais le serveur comme source de vérité)
   */
  static async getIntegrationStatus(userId: string): Promise<IntegrationConfig> {
    try {
      // Récupérer le statut depuis le serveur
      return await this.getIntegrationStatusFromServer(userId);
    } catch (error) {
      console.error('❌ [INTEGRATIONS] Erreur récupération statut:', error);
      return {
        appleHealth: { connected: false, permissions: [] },
        strava: { connected: false, athlete: null, lastSync: null, athleteId: null }
      };
    }
  }

  /**
   * Vérification rapide de la connexion Strava (alias pour compatibilité)
   */
  static async checkStravaConnection(userId: string): Promise<boolean> {
    return await this.checkStravaConnectionFromServer(userId);
  }
}

// Fonction de synchronisation simplifiée - tout géré côté serveur
export async function syncWithExternalApps(userId: string): Promise<void> {
  try {
    console.log('🔄 Synchronisation depuis serveur pour:', userId);
    
    // Vérifier les intégrations côté serveur
    const integrationStatus = await IntegrationsManager.getIntegrationStatusFromServer(userId);

    if (integrationStatus.strava.connected) {
      console.log('🏃 Strava connecté côté serveur - synchronisation automatique');
    }

    console.log('✅ Synchronisation serveur terminée');
  } catch (error) {
    console.error('❌ Erreur synchronisation serveur:', error);
  }
}