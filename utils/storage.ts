import { ServerWakeupService } from './serverWakeup';

// Configuration serveur Replit uniquement
const SERVER_URL = 'https://workspace-eatfitbymax.replit.dev';
const API_URL = SERVER_URL;

export class PersistentStorage {
  // Fonction pour nettoyer toutes les données utilisateurs
  static async clearAllUserData(): Promise<void> {
    try {
      console.log('🧹 Suppression des données utilisateurs sur le serveur...');
      // Note: Cette fonction ne fait plus rien côté local
    } catch (error) {
      console.error('❌ Erreur nettoyage données:', error);
      throw error;
    }
  }

  // Test de connexion au serveur avec réveil automatique
  static async testConnection(): Promise<boolean> {
    try {
      console.log(`🔍 Test de connexion au serveur Replit: ${SERVER_URL}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(`${SERVER_URL}/api/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Serveur Replit opérationnel -', data.message);
        return true;
      } else {
        console.warn(`⚠️ Serveur Replit indisponible (status: ${response.status})`);

        if (response.status >= 500) {
          console.log('🔄 Tentative de réveil du serveur...');
          const wakeupSuccess = await ServerWakeupService.wakeupServer();
          return wakeupSuccess;
        }

        return false;
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.warn('⚠️ Timeout de connexion au serveur Replit (15s)');
      } else if (error.message.includes('Network request failed')) {
        console.warn('⚠️ Échec réseau - Tentative de réveil du serveur...');
        const wakeupSuccess = await ServerWakeupService.wakeupServer();
        return wakeupSuccess;
      } else {
        console.warn(`⚠️ Erreur de connexion au serveur ${SERVER_URL}:`, error.message);
      }
      return false;
    }
  }

  // Assurer la connexion au serveur (avec réveil si nécessaire)
  static async ensureConnection(): Promise<void> {
    const isConnected = await this.testConnection();
    if (!isConnected) {
      throw new Error('Impossible de se connecter au serveur Replit');
    }
  }

  // Users storage
  static async getUsers(): Promise<any[]> {
    try {
      await this.ensureConnection();

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${SERVER_URL}/api/users`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Utilisateurs récupérés depuis le serveur Replit');
        return data;
      }
      throw new Error(`Erreur HTTP ${response.status}`);
    } catch (error) {
      console.error('❌ Erreur récupération utilisateurs:', error);
      throw error;
    }
  }

  static async saveUsers(users: any[]): Promise<void> {
    try {
      await this.ensureConnection();

      const response = await fetch(`${SERVER_URL}/api/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(users),
      });

      if (response.ok) {
        console.log('✅ Utilisateurs sauvegardés sur le serveur Replit');
        return;
      }
      throw new Error('Erreur sauvegarde utilisateurs sur le serveur');
    } catch (error) {
      console.error('❌ Erreur sauvegarde utilisateurs:', error);
      throw error;
    }
  }

  // Messages storage
  static async getMessages(userId: string): Promise<any[]> {
    try {
      await this.ensureConnection();

      const response = await fetch(`${SERVER_URL}/api/messages/${userId}`);
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Messages récupérés depuis le serveur Replit');
        return data;
      }
      throw new Error('Erreur récupération messages depuis le serveur');
    } catch (error) {
      console.error('❌ Erreur récupération messages:', error);
      throw error;
    }
  }

  static async saveMessages(userId: string, messages: any[]): Promise<void> {
    try {
      await this.ensureConnection();

      const response = await fetch(`${SERVER_URL}/api/messages/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messages),
      });

      if (!response.ok) {
        throw new Error('Erreur sauvegarde messages sur le serveur');
      }

      console.log('✅ Messages sauvegardés sur le serveur Replit');
    } catch (error) {
      console.error('❌ Erreur sauvegarde messages:', error);
      throw error;
    }
  }

  // Health data methods
  static async saveHealthData(userId: string, healthData: any[]): Promise<void> {
    try {
      await this.ensureConnection();

      const response = await fetch(`${SERVER_URL}/api/health/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(healthData),
      });

      if (response.ok) {
        console.log('✅ Données Apple Health sauvegardées sur le serveur Replit');
        return;
      }
      throw new Error('Erreur sauvegarde données Apple Health sur le serveur');
    } catch (error) {
      console.error('❌ Erreur sauvegarde Apple Health:', error);
      throw error;
    }
  }

  static async getHealthData(userId: string): Promise<any[]> {
    try {
      await this.ensureConnection();

      const response = await fetch(`${SERVER_URL}/api/health/${userId}`);
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Données Apple Health récupérées depuis le serveur Replit');
        return data;
      }
      throw new Error('Erreur récupération données Apple Health');
    } catch (error) {
      console.error('❌ Erreur récupération Apple Health:', error);
      throw error;
    }
  }

  // Weight data methods
  static async saveWeightData(userId: string, weightData: any): Promise<void> {
    try {
      await this.ensureConnection();

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${SERVER_URL}/api/weight/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(weightData),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        console.log('✅ Sauvegarde poids Replit réussie');
      } else {
        throw new Error(`Échec sauvegarde poids Replit (HTTP ${response.status})`);
      }
    } catch (error) {
      console.error('❌ Erreur sauvegarde poids:', error);
      throw error;
    }
  }

  static async getWeightData(userId: string): Promise<any> {
    try {
      await this.ensureConnection();

      const response = await fetch(`${SERVER_URL}/api/weight/${userId}`);
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Données poids récupérées depuis Replit');
        return data;
      }
      throw new Error('Erreur récupération données poids');
    } catch (error) {
      console.error('❌ Erreur récupération données poids:', error);
      return {
        startWeight: 0,
        currentWeight: 0,
        targetWeight: 0,
        lastWeightUpdate: null,
        targetAsked: false,
        weightHistory: [],
      };
    }
  }

  // Nutrition methods
  static async saveNutrition(userId: string, nutrition: any[]): Promise<void> {
    try {
      await this.ensureConnection();

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${SERVER_URL}/api/nutrition/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nutrition),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        console.log('✅ Sauvegarde nutrition Replit réussie');
      } else {
        throw new Error(`Échec sauvegarde nutrition Replit (HTTP ${response.status})`);
      }
    } catch (error) {
      console.error('❌ Erreur sauvegarde nutrition:', error);
      throw error;
    }
  }

  static async getNutrition(userId: string): Promise<any[]> {
    try {
      await this.ensureConnection();

      const response = await fetch(`${SERVER_URL}/api/nutrition/${userId}`);
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Nutrition récupérée depuis Replit');
        return data;
      }
      throw new Error('Erreur récupération nutrition');
    } catch (error) {
      console.error('❌ Erreur récupération nutrition:', error);
      return [];
    }
  }

  // Workouts methods
  static async saveWorkouts(userId: string, workouts: any[]): Promise<void> {
    try {
      await this.ensureConnection();

      const response = await fetch(`${SERVER_URL}/api/workouts/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workouts),
      });
      if (!response.ok) {
        throw new Error('Erreur sauvegarde entraînements');
      }
      console.log('✅ Entraînements sauvegardés sur Replit');
    } catch (error) {
      console.error('❌ Erreur sauvegarde entraînements:', error);
      throw error;
    }
  }

  static async getWorkouts(userId: string): Promise<any[]> {
    try {
      await this.ensureConnection();

      const response = await fetch(`${SERVER_URL}/api/workouts/${userId}`);
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Entraînements récupérés depuis Replit');
        return data;
      }
      throw new Error('Erreur récupération entraînements');
    } catch (error) {
      console.error('❌ Erreur récupération entraînements:', error);
      return [];
    }
  }

  // User forme methods
  static async getUserForme(userId: string, date: string): Promise<any> {
    try {
      await this.ensureConnection();

      const response = await fetch(`${SERVER_URL}/api/forme/${userId}/${date}`);
      if (response.ok) {
        const data = await response.json();
        return data;
      }
      throw new Error('Erreur récupération forme');
    } catch (error) {
      console.error('❌ Erreur récupération forme:', error);
      return {
        sleep: { hours: 0, quality: 'Moyen', bedTime: '', wakeTime: '' },
        stress: { level: 5, factors: [], notes: '' },
        heartRate: { resting: 0, variability: 0 },
        rpe: { value: 5, notes: '' },
        date: date
      };
    }
  }

  static async saveUserForme(userId: string, date: string, formeData: any): Promise<void> {
    try {
      await this.ensureConnection();

      const response = await fetch(`${SERVER_URL}/api/forme/${userId}/${date}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formeData),
      });
      if (!response.ok) {
        throw new Error('Erreur sauvegarde forme');
      }
      console.log('✅ Forme sauvegardée sur Replit');
    } catch (error) {
      console.error('❌ Erreur sauvegarde forme:', error);
      throw error;
    }
  }

  // Subscription methods
  static async getSubscription(userId: string): Promise<any> {
    try {
      await this.ensureConnection();

      const response = await fetch(`${SERVER_URL}/api/stripe/subscription/${userId}`);
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Abonnement récupéré depuis Replit');
        return data;
      }
      throw new Error('Erreur récupération abonnement');
    } catch (error) {
      console.error('❌ Erreur récupération abonnement:', error);
      return { planId: 'free', isPremium: false };
    }
  }

  // User profile methods
  static async getUserProfile(userId: string): Promise<any> {
    try {
      await this.ensureConnection();

      const response = await fetch(`${SERVER_URL}/api/user-profile/${userId}`);
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Profil utilisateur récupéré depuis Replit');
        return data;
      }
      return null;
    } catch (error) {
      console.error('❌ Erreur récupération profil:', error);
      return null;
    }
  }

  static async saveUserProfile(userId: string, profileData: any): Promise<void> {
    try {
      await this.ensureConnection();

      const response = await fetch(`${SERVER_URL}/api/user-profile/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
      });
      if (!response.ok) {
        throw new Error('Erreur sauvegarde profil');
      }
      console.log('✅ Profil utilisateur sauvegardé sur Replit');
    } catch (error) {
      console.error('❌ Erreur sauvegarde profil:', error);
      throw error;
    }
  }

  // Toutes les autres méthodes utilisent maintenant uniquement le serveur
  static async getUserWorkouts(userId: string): Promise<any[]> {
    return await this.getWorkouts(userId);
  }

  static async saveUserWorkouts(userId: string, workouts: any[]): Promise<void> {
    return await this.saveWorkouts(userId, workouts);
  }

  static async getUserData(): Promise<any> {
    throw new Error('getUserData() non supporté - utilisez getCurrentUser() depuis auth.ts');
  }

  static async getUserNutrition(userId: string): Promise<any[]> {
    return await this.getNutrition(userId);
  }

  static async saveUserNutrition(userId: string, nutrition: any[]): Promise<void> {
    return await this.saveNutrition(userId, nutrition);
  }

  static async getUserWeight(userId: string): Promise<any> {
    return await this.getWeightData(userId);
  }

  static async saveUserWeight(userId: string, weightData: any): Promise<void> {
    return await this.saveWeightData(userId, weightData);
  }

  static async getUserMensurations(userId: string): Promise<any> {
    try {
      await this.ensureConnection();

      const response = await fetch(`${SERVER_URL}/api/mensurations/${userId}`);
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Mensurations récupérées depuis le serveur Replit');
        return data;
      }
      throw new Error('Erreur récupération mensurations');
    } catch (error) {
      console.error('❌ Erreur récupération mensurations:', error);
      return {
        biceps: { start: 0, current: 0 },
        bicepsGauche: { start: 0, current: 0 },
        bicepsDroit: { start: 0, current: 0 },
        cuisses: { start: 0, current: 0 },
        cuissesGauche: { start: 0, current: 0 },
        cuissesDroit: { start: 0, current: 0 },
        pectoraux: { start: 0, current: 0 },
        taille: { start: 0, current: 0 },
        avantBras: { start: 0, current: 0 },
        avantBrasGauche: { start: 0, current: 0 },
        avantBrasDroit: { start: 0, current: 0 },
        mollets: { start: 0, current: 0 },
        molletsGauche: { start: 0, current: 0 },
        molletsDroit: { start: 0, current: 0 },
      };
    }
  }

  static async saveUserMensurations(userId: string, mensurations: any): Promise<void> {
    try {
      await this.ensureConnection();

      const response = await fetch(`${SERVER_URL}/api/mensurations/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mensurations),
      });

      if (response.ok) {
        console.log('✅ Sauvegarde mensurations Replit réussie');
      } else {
        throw new Error(`Échec sauvegarde mensurations Replit (HTTP ${response.status})`);
      }
    } catch (error) {
      console.error('❌ Erreur sauvegarde mensurations:', error);
      throw error;
    }
  }

  static async getUserFormeData(userId: string, date: string): Promise<any> {
    return await this.getUserForme(userId, date);
  }

  static async saveFormeData(userId: string, date: string, formeData: any): Promise<void> {
    return await this.saveUserForme(userId, date, formeData);
  }

  // Utilisateur actuel - stocké sur le serveur maintenant
  static async getCurrentUser(): Promise<any> {
    throw new Error('getCurrentUser() moved to auth.ts - use auth.getCurrentUser()');
  }

  static async setCurrentUser(user: any): Promise<void> {
    throw new Error('setCurrentUser() moved to auth.ts - use auth methods');
  }

  // Notification settings
  static async getNotificationSettings(userId: string): Promise<any> {
    try {
      await this.ensureConnection();

      const response = await fetch(`${SERVER_URL}/api/notifications/${userId}`);
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Paramètres notifications récupérés depuis le serveur Replit');
        return data;
      }
      throw new Error('Erreur récupération notifications');
    } catch (error) {
      console.error('❌ Erreur récupération paramètres notifications:', error);
      return {
        workoutReminder: true,
        nutritionReminder: true,
        progressUpdate: true,
        reminderTime: '09:00',
        weeklyReport: true,
        coachMessages: true
      };
    }
  }

  static async saveNotificationSettings(userId: string, settings: any): Promise<void> {
    try {
      await this.ensureConnection();

      const response = await fetch(`${SERVER_URL}/api/notifications/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        console.log('✅ Paramètres notifications sauvegardés sur le serveur Replit');
      } else {
        throw new Error('Erreur sauvegarde notifications');
      }
    } catch (error) {
      console.error('❌ Erreur sauvegarde paramètres notifications:', error);
      throw error;
    }
  }

  // App preferences
  static async getAppPreferences(userId: string): Promise<any> {
    try {
      await this.ensureConnection();

      const response = await fetch(`${SERVER_URL}/api/app-preferences/${userId}`);
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Préférences app récupérées depuis le serveur Replit');
        return data;
      }
      throw new Error('Erreur récupération préférences');
    } catch (error) {
      console.error('❌ Erreur récupération préférences app:', error);
      return {
        theme: 'dark',
        language: 'fr',
        units: 'metric',
        notifications: true
      };
    }
  }

  static async saveAppPreferences(userId: string, preferences: any): Promise<void> {
    try {
      await this.ensureConnection();

      const response = await fetch(`${SERVER_URL}/api/app-preferences/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences),
      });

      if (response.ok) {
        console.log('✅ Préférences app sauvegardées sur le serveur Replit');
      } else {
        throw new Error('Erreur sauvegarde préférences');
      }
    } catch (error) {
      console.error('❌ Erreur sauvegarde préférences app:', error);
      throw error;
    }
  }

  // Integration status
  static async getIntegrationStatus(userId: string): Promise<any> {
    return await this.getUserIntegrationStatus(userId);
  }

  static async getUserIntegrationStatus(userId: string): Promise<any> {
    const defaultStatus = {
      appleHealth: { connected: false, permissions: [] },
      strava: { connected: false }
    };

    try {
      await this.ensureConnection();

      const response = await fetch(`${SERVER_URL}/api/integrations/${userId}`);
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Statuts intégrations récupérés depuis le serveur Replit');
        return data;
      }
      throw new Error('Erreur récupération intégrations');
    } catch (error) {
      console.error('❌ Erreur récupération statuts intégrations:', error);
      return defaultStatus;
    }
  }

  static async saveIntegrationStatus(userId: string, status: any): Promise<void> {
    try {
      await this.ensureConnection();

      const response = await fetch(`${SERVER_URL}/api/integrations/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(status),
      });

      if (response.ok) {
        console.log('✅ Statuts intégrations sauvegardés sur le serveur Replit');
      } else {
        throw new Error('Erreur sauvegarde intégrations');
      }
    } catch (error) {
      console.error('❌ Erreur sauvegarde statuts intégrations:', error);
      throw error;
    }
  }

  // Programmes storage
  static async getProgrammes(): Promise<any[]> {
    try {
      await this.ensureConnection();

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${SERVER_URL}/api/programmes`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Programmes récupérés depuis le serveur Replit');
        return data;
      }
      throw new Error(`Erreur HTTP ${response.status}`);
    } catch (error) {
      console.error('❌ Erreur récupération programmes:', error);
      return [];
    }
  }

  static async saveProgrammes(programmes: any[]): Promise<void> {
    try {
      await this.ensureConnection();

      const response = await fetch(`${SERVER_URL}/api/programmes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(programmes),
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      console.log('✅ Programmes sauvegardés sur le serveur Replit');
    } catch (error) {
      console.error('❌ Erreur sauvegarde programmes:', error);
      throw error;
    }
  }

  // Strava activities
  static async getStravaActivities(userId: string): Promise<any[]> {
    try {
      await this.ensureConnection();

      const response = await fetch(`${SERVER_URL}/api/strava/${userId}`);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Activités Strava récupérées du serveur Replit');
        return data;
      }
      throw new Error('Erreur récupération activités Strava du serveur');
    } catch (error) {
      console.error('❌ Erreur récupération activités Strava:', error);
      return [];
    }
  }

  // Vérification de l'état du serveur
  static async syncData(): Promise<void> {
    try {
      await this.ensureConnection();
      console.log('✅ Serveur Replit opérationnel - toutes les données sont sur le serveur');
    } catch (error) {
      console.error('❌ Erreur connexion serveur Replit:', error);
      throw error;
    }
  }

  // Data management
  static async clearAllData(): Promise<void> {
    throw new Error('clearAllData() non supporté en mode serveur uniquement');
  }

  static async exportData(): Promise<{ programmes: any[], users: any[] }> {
    try {
      const programmes = await this.getProgrammes();
      const users = await this.getUsers();
      return { programmes, users };
    } catch (error) {
      console.error('❌ Erreur lors de l\'export des données:', error);
      throw error;
    }
  }

  static async importData(data: { programmes: any[], users: any[] }): Promise<void> {
    try {
      await this.saveProgrammes(data.programmes || []);
      await this.saveUsers(data.users || []);
      console.log('✅ Données importées avec succès');
    } catch (error) {
      console.error('❌ Erreur lors de l\'import des données:', error);
      throw error;
    }
  }
}

// Fonctions utilitaires pour l'export
export const getAllUsers = async () => {
  return await PersistentStorage.getUsers();
};

export const getAllProgrammes = async () => {
  return await PersistentStorage.getProgrammes();
};

export const saveUser = async (user: any) => {
  const users = await PersistentStorage.getUsers();
  const existingIndex = users.findIndex(u => u.id === user.id || u.email === user.email);

  if (existingIndex !== -1) {
    users[existingIndex] = user;
  } else {
    users.push(user);
  }

  await PersistentStorage.saveUsers(users);
};

export const saveProgramme = async (programme: any) => {
  const programmes = await PersistentStorage.getProgrammes();
  const existingIndex = programmes.findIndex(p => p.id === programme.id);

  if (existingIndex !== -1) {
    programmes[existingIndex] = programme;
  } else {
    programmes.push(programme);
  }

  await PersistentStorage.saveProgrammes(programmes);
};

export const getClients = async (): Promise<any[]> => {
  const users = await PersistentStorage.getUsers();
  return users.filter(user => user.userType === 'client');
};

// Test de connexion à l'API
export const testApiConnection = async (): Promise<{ success: boolean; message: string }> => {
  try {
    console.log(`[DEBUG] Test de connexion API: ${SERVER_URL}/api/health`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(`${SERVER_URL}/api/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      console.log('[DEBUG] API connectée:', data);
      return { success: true, message: 'Connexion API réussie' };
    } else {
      return { success: false, message: `Erreur HTTP: ${response.status}` };
    }
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.error('[ERROR] Timeout connexion API');
      return { success: false, message: 'Timeout de connexion (10s)' };
    }

    console.error('[ERROR] Test connexion API échoué:', error);
    return { success: false, message: `Erreur réseau: ${error.message || error}` };
  }
};

export const getMessages = async (userId: string): Promise<any[]> => {
  return await PersistentStorage.getMessages(userId);
};

export const testServerConnection = async (): Promise<boolean> => {
  return await PersistentStorage.testConnection();
};