import { ServerWakeupService } from './serverWakeup';

// Configuration serveur Replit uniquement
const SERVER_URL = 'https://eatfitbymax.replit.app';
const API_URL = process.env.EXPO_PUBLIC_VPS_URL || process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';

export class PersistentStorage {
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
      throw new Error('❌ Impossible de se connecter au serveur Replit. Vérifiez votre connexion internet.');
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
      throw new Error('Impossible de récupérer les utilisateurs. Vérifiez votre connexion internet.');
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
      throw new Error('Impossible de sauvegarder les utilisateurs. Vérifiez votre connexion internet.');
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
      throw new Error('Impossible de récupérer les messages. Vérifiez votre connexion internet.');
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
      throw new Error('Impossible de sauvegarder les messages. Vérifiez votre connexion internet.');
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
      throw new Error('Impossible de sauvegarder les données Apple Health. Vérifiez votre connexion internet.');
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
      throw new Error('Impossible de récupérer les données Apple Health. Vérifiez votre connexion internet.');
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
      throw new Error('Impossible de sauvegarder les données de poids. Vérifiez votre connexion internet.');
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
      throw new Error('Impossible de récupérer les données de poids. Vérifiez votre connexion internet.');
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
      throw new Error('Impossible de sauvegarder les données nutritionnelles. Vérifiez votre connexion internet.');
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
      throw new Error('Impossible de récupérer les données nutritionnelles. Vérifiez votre connexion internet.');
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
      throw new Error('Impossible de sauvegarder les entraînements. Vérifiez votre connexion internet.');
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
      throw new Error('Impossible de récupérer les entraînements. Vérifiez votre connexion internet.');
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
      throw new Error('Impossible de récupérer les données de forme. Vérifiez votre connexion internet.');
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
      throw new Error('Impossible de sauvegarder les données de forme. Vérifiez votre connexion internet.');
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
      throw new Error('Impossible de récupérer les données d\'abonnement. Vérifiez votre connexion internet.');
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
      throw new Error('Impossible de récupérer le profil utilisateur. Vérifiez votre connexion internet.');
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
      throw new Error('Impossible de sauvegarder le profil utilisateur. Vérifiez votre connexion internet.');
    }
  }

  // Mensurations methods
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
      throw new Error('Impossible de récupérer les mensurations. Vérifiez votre connexion internet.');
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
      throw new Error('Impossible de sauvegarder les mensurations. Vérifiez votre connexion internet.');
    }
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
      throw new Error('Impossible de récupérer les paramètres de notifications. Vérifiez votre connexion internet.');
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
      throw new Error('Impossible de sauvegarder les paramètres de notifications. Vérifiez votre connexion internet.');
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
      throw new Error('Impossible de récupérer les préférences de l\'application. Vérifiez votre connexion internet.');
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
      throw new Error('Impossible de sauvegarder les préférences de l\'application. Vérifiez votre connexion internet.');
    }
  }

  // Integration status
  static async getUserIntegrationStatus(userId: string): Promise<any> {
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
      throw new Error('Impossible de récupérer les statuts d\'intégrations. Vérifiez votre connexion internet.');
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
      throw new Error('Impossible de sauvegarder les statuts d\'intégrations. Vérifiez votre connexion internet.');
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
      throw new Error('Impossible de récupérer les programmes. Vérifiez votre connexion internet.');
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
      throw new Error('Impossible de sauvegarder les programmes. Vérifiez votre connexion internet.');
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
      throw new Error('Impossible de récupérer les activités Strava. Vérifiez votre connexion internet.');
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

  // Alias methods pour compatibilité
  static async getIntegrationStatus(userId: string): Promise<any> {
    return await this.getUserIntegrationStatus(userId);
  }

  static async getUserWorkouts(userId: string): Promise<any[]> {
    return await this.getWorkouts(userId);
  }

  static async saveUserWorkouts(userId: string, workouts: any[]): Promise<void> {
    return await this.saveWorkouts(userId, workouts);
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

  static async getUserFormeData(userId: string, date: string): Promise<any> {
    return await this.getUserForme(userId, date);
  }

  static async saveFormeData(userId: string, date: string, formeData: any): Promise<void> {
    return await this.saveUserForme(userId, date, formeData);
  }

  // Data management
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