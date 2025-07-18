import AsyncStorage from '@react-native-async-storage/async-storage';

const SERVER_URL = process.env.EXPO_PUBLIC_VPS_URL || 'http://51.178.29.220:5000';
const VPS_URL = process.env.EXPO_PUBLIC_VPS_URL || 'http://51.178.29.220:5000';

export class PersistentStorage {
  // Test de connexion au serveur avec cache temporaire
  private static connectionCache: { isConnected: boolean; timestamp: number } | null = null;
  private static readonly CACHE_DURATION = 30000; // 30 secondes

  static async testConnection(): Promise<boolean> {
    try {
      console.log(`Test de connexion au serveur Replit: ${SERVER_URL}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${SERVER_URL}/api/health-check`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
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
        return false;
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.warn('⚠️ Timeout de connexion au serveur Replit');
      } else {
        console.warn(`⚠️ Erreur de connexion au serveur ${SERVER_URL}:`, error.message);
      }
      return false;
    }
  }

  // Programmes storage
  static async getProgrammes(): Promise<any[]> {
    try {
      const isConnected = await this.testConnection();
      if (!isConnected) {
        console.log('📱 Serveur VPS indisponible, retour liste vide');
        return [];
      }

      const response = await fetch(`${SERVER_URL}/api/programmes`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(5000)
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Programmes récupérés depuis le serveur VPS');
        return data;
      }
      throw new Error(`Erreur HTTP ${response.status}`);
    } catch (error) {
      console.error('Erreur récupération programmes:', error);
      return [];
    }
  }

  static async saveProgrammes(programmes: any[]): Promise<void> {
    try {
      await this.testConnection();
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

      console.log('Programmes sauvegardés sur le serveur VPS');
    } catch (error) {
      console.error('Erreur sauvegarde programmes:', error);
      throw error;
    }
  }

  // Fonctions pour les données utilisateur spécifiques
  static async getUserWorkouts(userId: string): Promise<any[]> {
    try {
      const isConnected = await this.testConnection();
      if (isConnected) {
        const response = await fetch(`${SERVER_URL}/api/workouts/${userId}`);
        if (response.ok) {
          const data = await response.json();
          console.log('Entraînements récupérés depuis le serveur VPS');
          return data;
        }
      }

      // Fallback vers le stockage local
      console.log('Fallback vers le stockage local pour les entraînements');
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      const localData = await AsyncStorage.getItem(`workouts_${userId}`);
      return localData ? JSON.parse(localData) : [];
    } catch (error) {
      console.error('Erreur récupération entraînements:', error);
      // Essayer le stockage local en cas d'erreur
      try {
        const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
        const localData = await AsyncStorage.getItem(`workouts_${userId}`);
        return localData ? JSON.parse(localData) : [];
      } catch (localError) {
        console.error('Erreur stockage local:', localError);
        return [];
      }
    }
  }

  static async saveUserWorkouts(userId: string, workouts: any[]): Promise<void> {
    try {
      await this.testConnection();
      const response = await fetch(`${SERVER_URL}/api/workouts/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workouts),
      });
      if (!response.ok) {
        throw new Error('Erreur sauvegarde entraînements');
      }
    } catch (error) {
      console.error('Erreur sauvegarde entraînements:', error);
      throw error;
    }
  }

  static async getUserData(): Promise<any> {
    try {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      const userData = await AsyncStorage.getItem('currentUser');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Erreur récupération données utilisateur:', error);
      return null;
    }
  }

  static async getUserNutrition(userId: string): Promise<any[]> {
    try {
      console.log('🔍 Récupération des données nutrition (getUserNutrition)...');

      // 1. PRIORITÉ: Essayer le serveur VPS
      const isConnected = await this.testConnection();
      if (isConnected) {
        try {
          const response = await fetch(`${SERVER_URL}/api/nutrition/${userId}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            signal: AbortSignal.timeout(5000)
          });

          if (response.ok) {
            const data = await response.json();
            console.log(`✅ ${data.length} entrées nutrition récupérées depuis le serveur VPS`);
            // Mettre à jour le cache local
            await AsyncStorage.setItem(`nutrition_data_${userId}`, JSON.stringify(data));
            return data;
          }
        } catch (vpsError) {
          console.warn('⚠️ Erreur récupération nutrition VPS:', vpsError);
        }
      }

      // 2. FALLBACK: Utiliser le stockage local
      console.log('📱 Utilisation du stockage local nutrition (fallback)');
      const localData = await AsyncStorage.getItem(`nutrition_data_${userId}`);
      const nutrition = localData ? JSON.parse(localData) : [];
      console.log(`💾 ${nutrition.length} entrées nutrition trouvées en local`);
      return nutrition;
    } catch (error) {
      console.error('❌ Erreur critique récupération nutrition:', error);
      return [];
    }
  }

  static async saveUserNutrition(userId: string, nutrition: any[]): Promise<void> {
    let localSaved = false;
    let vpsSaved = false;

    try {
      console.log(`🥗 Sauvegarde de ${nutrition.length} entrées nutrition (saveUserNutrition)...`);

      // 1. TOUJOURS sauvegarder en local EN PREMIER
      await AsyncStorage.setItem(`nutrition_data_${userId}`, JSON.stringify(nutrition));
      localSaved = true;
      console.log('✅ Sauvegarde nutrition locale réussie');

      // 2. PRIORITÉ: Essayer de sauvegarder sur le serveur VPS
      const isConnected = await this.testConnection();
      if (isConnected) {
        try {
          const response = await fetch(`${SERVER_URL}/api/nutrition/${userId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(nutrition),
            signal: AbortSignal.timeout(8000)
          });

          if (response.ok) {
            vpsSaved = true;
            console.log('🚀 Sauvegarde nutrition VPS réussie');
          } else {
            console.warn(`⚠️ Échec sauvegarde nutrition VPS (HTTP ${response.status})`);
          }
        } catch (vpsError) {
          console.warn('⚠️ Erreur sauvegarde nutrition VPS:', vpsError);
        }
      }

      // 3. Rapport final
      if (localSaved && vpsSaved) {
        console.log('🎉 Sauvegarde nutrition complète (local + VPS)');
      } else if (localSaved) {
        console.log('⚠️ Sauvegarde nutrition locale uniquement');
      }

    } catch (error) {
      console.error('❌ Erreur sauvegarde nutrition:', error);

      if (!localSaved) {
        try {
          await AsyncStorage.setItem(`nutrition_data_${userId}`, JSON.stringify(nutrition));
          console.log('🆘 Sauvegarde nutrition locale de secours');
        } catch (localError) {
          console.error('🔥 ERREUR CRITIQUE nutrition:', localError);
          throw localError;
        }
      }
    }
  }

  static async getUserWeight(userId: string): Promise<any> {
    try {
      console.log('🔍 Récupération des données de poids...');

      // 1. PRIORITÉ: Essayer le serveur VPS
      const isConnected = await this.testConnection();
      if (isConnected) {
        try {
          const response = await fetch(`${SERVER_URL}/api/weight/${userId}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            signal: AbortSignal.timeout(5000)
          });

          if (response.ok) {
            const data = await response.json();
            console.log('✅ Données poids récupérées depuis le serveur VPS');
            // Mettre à jour le cache local
            await AsyncStorage.setItem(`weight_data_${userId}`, JSON.stringify(data));
            return data;
          }
        } catch (vpsError) {
          console.warn('⚠️ Erreur récupération poids VPS:', vpsError);
        }
      }

      // 2. FALLBACK: Utiliser le stockage local
      console.log('📱 Utilisation du stockage local poids (fallback)');
      const localData = await AsyncStorage.getItem(`weight_data_${userId}`);
      return localData ? JSON.parse(localData) : {
        startWeight: 0,
        currentWeight: 0,
        targetWeight: 0,
        lastWeightUpdate: null,
        targetAsked: false,
        weightHistory: [],
      };
    } catch (error) {
      console.error('❌ Erreur critique récupération poids:', error);
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

  static async saveUserWeight(userId: string, weightData: any): Promise<void> {
    let localSaved = false;
    let vpsSaved = false;

    try {
      console.log('💾 Sauvegarde des données de poids...');

      // 1. TOUJOURS sauvegarder en local EN PREMIER
      await AsyncStorage.setItem(`weight_data_${userId}`, JSON.stringify(weightData));
      localSaved = true;
      console.log('✅ Sauvegarde poids locale réussie');

      // 2. PRIORITÉ: Essayer de sauvegarder sur le serveur VPS
      const isConnected = await this.testConnection();
      if (isConnected) {
        try {
          const response = await fetch(`${SERVER_URL}/api/weight/${userId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(weightData),
            signal: AbortSignal.timeout(8000)
          });

          if (response.ok) {
            vpsSaved = true;
            console.log('🚀 Sauvegarde poids VPS réussie');
          } else {
            console.warn(`⚠️ Échec sauvegarde poids VPS (HTTP ${response.status})`);
          }
        } catch (vpsError) {
          console.warn('⚠️ Erreur sauvegarde poids VPS:', vpsError);
        }
      }

      // 3. Rapport final
      if (localSaved && vpsSaved) {
        console.log('🎉 Sauvegarde poids complète (local + VPS)');
      } else if (localSaved) {
        console.log('⚠️ Sauvegarde poids locale uniquement');
      }

    } catch (error) {
      console.error('❌ Erreur sauvegarde poids:', error);

      if (!localSaved) {
        try {
          await AsyncStorage.setItem(`weight_data_${userId}`, JSON.stringify(weightData));
          console.log('🆘 Sauvegarde poids locale de secours');
        } catch (localError) {
          console.error('🔥 ERREUR CRITIQUE poids:', localError);
          throw localError;
        }
      }
    }
  }

  static async getUserMensurations(userId: string): Promise<any> {
    try {
      console.log('🔍 Récupération des mensurations...');

      // 1. PRIORITÉ: Essayer le serveur VPS
      const isConnected = await this.testConnection();
      if (isConnected) {
        try {
          const response = await fetch(`${SERVER_URL}/api/mensurations/${userId}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            signal: AbortSignal.timeout(5000)
          });

          if (response.ok) {
            const data = await response.json();
            console.log('✅ Mensurations récupérées depuis le serveur VPS');
            // Mettre à jour le cache local
            await AsyncStorage.setItem(`mensurations_${userId}`, JSON.stringify(data));
            return data;
          }
        } catch (vpsError) {
          console.warn('⚠️ Erreur récupération mensurations VPS:', vpsError);
        }
      }

      // 2. FALLBACK: Utiliser le stockage local
      console.log('📱 Utilisation du stockage local mensurations (fallback)');
      const localData = await AsyncStorage.getItem(`mensurations_${userId}`);
      return localData ? JSON.parse(localData) : {
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
    } catch (error) {
      console.error('❌ Erreur critique récupération mensurations:', error);
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
    let localSaved = false;
    let vpsSaved = false;

    try {
      console.log('💾 Sauvegarde des mensurations...');

      // 1. TOUJOURS sauvegarder en local EN PREMIER
      await AsyncStorage.setItem(`mensurations_${userId}`, JSON.stringify(mensurations));
      localSaved = true;
      console.log('✅ Sauvegarde mensurations locale réussie');

      // 2. PRIORITÉ: Essayer de sauvegarder sur le serveur VPS
      const isConnected = await this.testConnection();
      if (isConnected) {
        try {
          const response = await fetch(`${SERVER_URL}/api/mensurations/${userId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(mensurations),
            signal: AbortSignal.timeout(8000)
          });

          if (response.ok) {
            vpsSaved = true;
            console.log('🚀 Sauvegarde mensurations VPS réussie');
          } else {
            console.warn(`⚠️ Échec sauvegarde mensurations VPS (HTTP ${response.status})`);
          }
        } catch (vpsError) {
          console.warn('⚠️ Erreur sauvegarde mensurations VPS:', vpsError);
        }
      }

      // 3. Rapport final
      if (localSaved && vpsSaved) {
        console.log('🎉 Sauvegarde mensurations complète (local + VPS)');
      } else if (localSaved) {
        console.log('⚠️ Sauvegarde mensurations locale uniquement');
      }

    } catch (error) {
      console.error('❌ Erreur sauvegarde mensurations:', error);

      if (!localSaved) {
        try {
          await AsyncStorage.setItem(`mensurations_${userId}`, JSON.stringify(mensurations));
          console.log('🆘 Sauvegarde mensurations locale de secours');
        } catch (localError) {
          console.error('🔥 ERREUR CRITIQUE mensurations:', localError);
          throw localError;
        }
      }
    }
  }

  static async getUserForme(userId: string, date: string): Promise<any> {
    try {
      await this.testConnection();
      const response = await fetch(`${SERVER_URL}/api/forme/${userId}/${date}`);
      if (response.ok) {
        return await response.json();
      }
      throw new Error('Erreur récupération forme');
    } catch (error) {
      console.error('Erreur récupération forme:', error);
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
      await this.testConnection();
      const response = await fetch(`${SERVER_URL}/api/forme/${userId}/${date}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formeData),
      });
      if (!response.ok) {
        throw new Error('Erreur sauvegarde forme');
      }
    } catch (error) {
      console.error('Erreur sauvegarde forme:', error);
      throw error;
    }
  }

  // Users storage
  static async getUsers(): Promise<any[]> {
    try {
      const isConnected = await this.testConnection();
      if (!isConnected) {
        console.log('📱 Serveur VPS indisponible, retour liste vide');
        return [];
      }

      const response = await fetch(`${SERVER_URL}/api/users`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(5000)
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Utilisateurs récupérés depuis le serveur VPS');
        return data;
      }
      throw new Error(`Erreur HTTP ${response.status}`);
    } catch (error) {
      console.error('Erreur récupération utilisateurs:', error);
      return [];
    }
  }

  static async saveUsers(users: any[]): Promise<void> {
    try {
      await this.testConnection();
      const response = await fetch(`${SERVER_URL}/api/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(users),
      });

      if (response.ok) {
        console.log('Utilisateurs sauvegardés sur le serveur VPS');
        return;
      }
      throw new Error('Erreur sauvegarde utilisateurs sur le serveur');
    } catch (error) {
      console.error('Erreur sauvegarde utilisateurs:', error);
      throw error;
    }
  }

  // Messages storage
  static async getMessages(userId: string): Promise<any[]> {
    try {
      await this.testConnection();
      const response = await fetch(`${SERVER_URL}/api/messages/${userId}`);
      if (response.ok) {
        const data = await response.json();
        console.log('Messages récupérés depuis le serveur VPS');
        return data;
      }
      throw new Error('Erreur récupération messages depuis le serveur');
    } catch (error) {
      console.error('Erreur récupération messages:', error);
      throw error;
    }
  }

  // Sauvegarde des messages
  static async saveMessages(userId: string, messages: any[]): Promise<void> {
    try {
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

      console.log('Messages sauvegardés sur le serveur VPS');
    } catch (error) {
      console.error('Erreur sauvegarde messages:', error);
      throw error;
    }
  }

  // Méthodes pour Apple Health
  static async saveHealthData(userId: string, healthData: any[]): Promise<void> {
    try {
      await this.testConnection();
      const response = await fetch(`${SERVER_URL}/api/health/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(healthData),
      });

      if (response.ok) {
        console.log('Données Apple Health sauvegardées sur le serveur VPS');
        return;
      }
      throw new Error('Erreur sauvegarde données Apple Health sur le serveur');
    } catch (error) {
      console.error('Erreur sauvegarde données Apple Health:', error);
      throw error;
    }
  }

  static async getHealthData(userId: string): Promise<any[]> {
    try {
      await this.testConnection();
      const response = await fetch(`${SERVER_URL}/api/health/${userId}`);

      if (response.ok) {
        const data = await response.json();
        console.log('Données Apple Health récupérées du serveur VPS');
        return data;
      }
      throw new Error('Erreur récupération données Apple Health du serveur');
    } catch (error) {
      console.error('Erreur récupération données Apple Health:', error);
      return [];
    }
  }

  // Méthodes pour Strava
  static async saveStravaActivities(userId: string, activities: any[]): Promise<void> {
    try {
      await this.testConnection();
      const response = await fetch(`${SERVER_URL}/api/strava/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(activities),
      });

      if (response.ok) {
        console.log('Activités Strava sauvegardées sur le serveur VPS');
        return;
      }
      console.warn('Échec sauvegarde Strava sur serveur VPS, données conservées localement');
    } catch (error) {
      console.warn('Erreur sauvegarde activités Strava sur serveur VPS:', error);
      console.log('Les données Strava restent disponibles localement');
    }
  }

  // Méthodes pour les données nutritionnelles
  static async getNutritionData(userId: string): Promise<any[]> {
    try {
      console.log('🔍 Récupération des données nutrition...');

      // 1. PRIORITÉ: Essayer le serveur VPS
      const isConnected = await this.testConnection();
      if (isConnected) {
        try {
          const response = await fetch(`${SERVER_URL}/api/nutrition/${userId}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            signal: AbortSignal.timeout(5000)
          });

          if (response.ok) {
            const data = await response.json();
            console.log(`✅ ${data.length} entrées nutrition récupérées depuis le serveur VPS`);
            // Mettre à jour le cache local
            await AsyncStorage.setItem(`food_entries_${userId}`, JSON.stringify(data));
            console.log('💾 Cache nutrition local mis à jour');
            return data;
          }
        } catch (vpsError) {
          console.warn('⚠️ Erreur récupération nutrition VPS:', vpsError);
        }
      }

      // 2. FALLBACK: Utiliser le stockage local
      console.log('📱 Utilisation du cache local nutrition (fallback)');
      const localData = await AsyncStorage.getItem(`food_entries_${userId}`);
      const nutrition = localData ? JSON.parse(localData) : [];
      console.log(`💾 ${nutrition.length} entrées nutrition trouvées en local`);

      return nutrition;
    } catch (error) {
      console.error('❌ Erreur critique récupération nutrition:', error);
      return [];
    }
  }

  static async saveNutritionData(userId: string, nutritionData: any[]): Promise<void> {
    let localSaved = false;
    let vpsSaved = false;

    try {
      console.log(`🥗 Sauvegarde de ${nutritionData.length} entrées nutrition...`);

      // 1. TOUJOURS sauvegarder en local EN PREMIER
      await AsyncStorage.setItem(`food_entries_${userId}`, JSON.stringify(nutritionData));
      localSaved = true;
      console.log('✅ Sauvegarde nutrition locale réussie');

      // 2. PRIORITÉ: Essayer de sauvegarder sur le serveur VPS
      const isConnected = await this.testConnection();
      if (isConnected) {
        try {
          const response = await fetch(`${SERVER_URL}/api/nutrition/${userId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(nutritionData),
            signal: AbortSignal.timeout(8000)
          });

          if (response.ok) {
            vpsSaved = true;
            console.log('🚀 Sauvegarde nutrition VPS réussie');
          } else {
            console.warn(`⚠️ Échec sauvegarde nutrition VPS (HTTP ${response.status})`);
          }
        } catch (vpsError) {
          console.warn('⚠️ Erreur sauvegarde nutrition VPS:', vpsError);
        }
      }

      // 3. Rapport final
      if (localSaved && vpsSaved) {
        console.log('🎉 Sauvegarde nutrition complète (local + VPS)');
      } else if (localSaved) {
        console.log('⚠️ Sauvegarde nutrition locale uniquement');
      }

    } catch (error) {
      console.error('❌ Erreur sauvegarde nutrition:', error);

      // Dernier recours
      if (!localSaved) {
        try {
          await AsyncStorage.setItem(`food_entries_${userId}`, JSON.stringify(nutritionData));
          console.log('🆘 Sauvegarde nutrition locale de secours');
        } catch (localError) {
          console.error('🔥 ERREUR CRITIQUE nutrition:', localError);
          throw localError;
        }
      }
    }
  }

  // Méthodes pour les entraînements (workouts) avec priorité serveur VPS
  static async getWorkouts(userId: string): Promise<any[]> {
    try {
      console.log('🔍 Récupération des entraînements...');

      // 1. PRIORITÉ: Essayer le serveur VPS
      const isConnected = await this.testConnection();
      if (isConnected) {
        try {
          const response = await fetch(`${SERVER_URL}/api/workouts/${userId}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            signal: AbortSignal.timeout(5000) // Timeout de 5 secondes
          });

          if (response.ok) {
            const data = await response.json();
            console.log(`✅ ${data.length} entraînements récupérés depuis le serveur VPS`);
            // Mettre à jour le cache local avec les données du serveur
            await AsyncStorage.setItem(`workouts_${userId}`, JSON.stringify(data));
            console.log('💾 Cache local mis à jour');
            return data;
          }
        } catch (vpsError) {
          console.warn('⚠️ Erreur lors de la récupération VPS:', vpsError);
        }
      }

      // 2. FALLBACK: Utiliser le stockage local
      console.log('📱 Utilisation du stockage local (fallback)');
      const localData = await AsyncStorage.getItem(`workouts_${userId}`);
      const workouts = localData ? JSON.parse(localData) : [];
      console.log(`💾 ${workouts.length} entraînements trouvés en local`);

      if (workouts.length === 0) {
        console.log('ℹ️ Aucun entraînement trouvé (ni serveur, ni local)');
      }

      return workouts;
    } catch (error) {
      console.error('❌ Erreur critique récupération entraînements:', error);
      return [];
    }
  }

  static async saveWorkouts(userId: string, workouts: any[]): Promise<void> {
    let localSaved = false;
    let vpsSaved = false;

    try {
      console.log(`💾 Sauvegarde de ${workouts.length} entraînements...`);

      // 1. TOUJOURS sauvegarder en local EN PREMIER (garantie de persistance)
      await AsyncStorage.setItem(`workouts_${userId}`, JSON.stringify(workouts));
      localSaved = true;
      console.log('✅ Sauvegarde locale réussie');

      // 2. PRIORITÉ: Essayer de sauvegarder sur le serveur VPS
      const isConnected = await this.testConnection();
      if (isConnected) {
        try {
          const response = await fetch(`${SERVER_URL}/api/workouts/${userId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(workouts),
            signal: AbortSignal.timeout(8000) // Timeout de 8 secondes pour la sauvegarde
          });

          if (response.ok) {
            vpsSaved = true;
            console.log('🚀 Sauvegarde serveur VPS réussie');
          } else {
            console.warn(`⚠️ Échec sauvegarde VPS (HTTP ${response.status})`);
          }
        } catch (vpsError) {
          console.warn('⚠️ Erreur sauvegarde VPS:', vpsError);
        }
      } else {
        console.log('📶 Serveur VPS indisponible - sauvegarde locale uniquement');
      }

      // 3. Rapport final
      if (localSaved && vpsSaved) {
        console.log('🎉 Sauvegarde complète (local + VPS)');
      } else if (localSaved) {
        console.log('⚠️ Sauvegarde locale uniquement (VPS indisponible)');
      } else {
        throw new Error('Échec de toutes les sauvegardes');
      }

    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde:', error);

      // Dernier recours: s'assurer que la sauvegarde locale est faite
      if (!localSaved) {
        try {
          await AsyncStorage.setItem(`workouts_${userId}`, JSON.stringify(workouts));
          console.log('🆘 Sauvegarde locale de secours effectuée');
        } catch (localError) {
          console.error('🔥 ERREUR CRITIQUE - Impossible de sauvegarder:', localError);
          throw new Error('Échec critique de la sauvegarde');
        }
      }
    }
  }

  // Méthodes pour les données de forme
  static async getFormeData(userId: string, date: string): Promise<any> {
    try {
      const isConnected = await this.testConnection();
      if (isConnected) {
        const response = await fetch(`${SERVER_URL}/api/forme/${userId}/${date}`);
        if (response.ok) {
          const data = await response.json();
          console.log('Données de forme récupérées depuis le serveur VPS');
          // Sauvegarder en local comme backup
          await AsyncStorage.setItem(`forme_data_${userId}_${date}`, JSON.stringify(data));
          return data;
        }
      }

      // Fallback vers le stockage local
      console.log('Fallback vers le stockage local pour les données de forme');
      const localData = await AsyncStorage.getItem(`forme_data_${userId}_${date}`);
      return localData ? JSON.parse(localData) : {
        sleep: { hours: 0, quality: 'Moyen', bedTime: '', wakeTime: '' },
        stress: { level: 5, factors: [], notes: '' },
        heartRate: { resting: 0, variability: 0 },
        rpe: { value: 5, notes: '' },
        cycle: { phase: 'Menstruel', dayOfCycle: 1, symptoms: [], notes: '' },
        date: date
      };
    } catch (error) {
      console.error('Erreur récupération données forme:', error);
      try {
        const localData = await AsyncStorage.getItem(`forme_data_${userId}_${date}`);
        return localData ? JSON.parse(localData) : {
          sleep: { hours: 0, quality: 'Moyen', bedTime: '', wakeTime: '' },
          stress: { level: 5, factors: [], notes: '' },
          heartRate: { resting: 0, variability: 0 },
          rpe: { value: 5, notes: '' },
          date: date
        };
      } catch (localError) {
        console.error('Erreur stockage local forme:', localError);
        return {
          sleep: { hours: 0, quality: 'Moyen', bedTime: '', wakeTime: '' },
          stress: { level: 5, factors: [], notes: '' },
          heartRate: { resting: 0, variability: 0 },
          rpe: { value: 5, notes: '' },
          cycle: { phase: 'Menstruel', dayOfCycle: 1, symptoms: [], notes: '' },
          date: date
        };
      }
    }
  }

  static async saveFormeData(userId: string, date: string, formeData: any): Promise<void> {
    try {
      // Toujours sauvegarder en local d'abord
      await AsyncStorage.setItem(`forme_data_${userId}_${date}`, JSON.stringify(formeData));

      const isConnected = await this.testConnection();
      if (isConnected) {
        const response = await fetch(`${SERVER_URL}/api/forme/${userId}/${date}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formeData),
        });

        if (response.ok) {
          console.log('Données de forme sauvegardées sur le serveur VPS');
        } else {
          console.log('Données de forme sauvegardées localement (serveur indisponible)');
        }
      } else {
        console.log('Données de forme sauvegardées localement (serveur indisponible)');
      }
    } catch (error) {
      console.error('Erreur sauvegarde données forme:', error);
      // Au moins garder la sauvegarde locale
      await AsyncStorage.setItem(`forme_data_${userId}_${date}`, JSON.stringify(formeData));
    }
  }

  // Gestion de l'utilisateur actuel
  static async getCurrentUser(): Promise<any> {
    try {
      const userData = await AsyncStorage.getItem('currentUser');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Erreur récupération utilisateur:', error);
      return null;
    }
  }

  static async setCurrentUser(user: any): Promise<void> {
    try {
      // Sauvegarder en local
      await AsyncStorage.setItem('currentUser', JSON.stringify(user));

      // Synchroniser avec le serveur VPS
      if (user?.id) {
        try {
          const isConnected = await this.testConnection();
          if (isConnected) {
            await this.saveUserProfile(user.id, user);
          }
        } catch (error) {
          console.warn('Impossible de synchroniser le profil utilisateur avec le serveur:', error);
        }
      }
    } catch (error) {
      console.error('Erreur sauvegarde utilisateur actuel:', error);
      throw error;
    }
  }

  // Méthodes pour les profils utilisateur
  static async getUserProfile(userId: string): Promise<any> {
    try {
      const isConnected = await this.testConnection();
      if (isConnected) {
        const response = await fetch(`${SERVER_URL}/api/user-profile/${userId}`);
        if (response.ok) {
          const data = await response.json();
          console.log('Profil utilisateur récupéré depuis le serveur VPS');
          // Sauvegarder en local comme backup
          await AsyncStorage.setItem(`user_profile_${userId}`, JSON.stringify(data));
          return data;
        }
      }

      // Fallback vers le stockage local
      console.log('Fallback vers le stockage local pour le profil utilisateur');
      const localData = await AsyncStorage.getItem(`user_profile_${userId}`);
      return localData ? JSON.parse(localData) : null;
    } catch (error) {
      console.error('Erreur récupération profil utilisateur:', error);
      try {
        const localData = await AsyncStorage.getItem(`user_profile_${userId}`);
        return localData ? JSON.parse(localData) : null;
      } catch (localError) {
        console.error('Erreur stockage local profil:', localError);
        return null;
      }
    }
  }

  static async saveUserProfile(userId: string, profileData: any): Promise<void> {
    try {
      // Toujours sauvegarder en local d'abord
      await AsyncStorage.setItem(`user_profile_${userId}`, JSON.stringify(profileData));

      const isConnected = await this.testConnection();
      if (isConnected) {
        const response = await fetch(`${SERVER_URL}/api/user-profile/${userId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(profileData),
        });

        if (response.ok) {
          console.log('Profil utilisateur sauvegardé sur le serveur VPS');
        } else {
          console.log('Profil utilisateur sauvegardé localement (serveur indisponible)');
        }
      } else {
        console.log('Profil utilisateur sauvegardé localement (serveur indisponible)');
      }
    } catch (error) {
      console.error('Erreur sauvegarde profil utilisateur:', error);
      // Au moins garder la sauvegarde locale
      await AsyncStorage.setItem(`user_profile_${userId}`, JSON.stringify(profileData));
    }
  }

  // Méthodes pour les paramètres de notifications
  static async getNotificationSettings(userId: string): Promise<any> {
    try {
      const isConnected = await this.testConnection();
      if (isConnected) {
        const response = await fetch(`${SERVER_URL}/api/notifications/${userId}`);
        if (response.ok) {
          const data = await response.json();
          console.log('Paramètres notifications récupérés depuis le serveur VPS');
          await AsyncStorage.setItem(`notification_settings_${userId}`, JSON.stringify(data));
          return data;
        }
      }

      // Fallback vers le stockage local
      console.log('Fallback vers le stockage local pour les paramètres notifications');
      const localData = await AsyncStorage.getItem(`notification_settings_${userId}`);
      return localData ? JSON.parse(localData) : {
        workoutReminder: true,
        nutritionReminder: true,
        progressUpdate: true,
        reminderTime: '09:00',
        weeklyReport: true,
        coachMessages: true
      };
    } catch (error) {
      console.error('Erreur récupération paramètres notifications:', error);
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
      // Toujours sauvegarder en local d'abord
      await AsyncStorage.setItem(`notification_settings_${userId}`, JSON.stringify(settings));

      const isConnected = await this.testConnection();
      if (isConnected) {
        const response = await fetch(`${SERVER_URL}/api/notifications/${userId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(settings),
        });

        if (response.ok) {
          console.log('Paramètres notifications sauvegardés sur le serveur VPS');
        } else {
          console.log('Paramètres notifications sauvegardés localement (serveur indisponible)');
        }
      } else {
        console.log('Paramètres notifications sauvegardés localement (serveur indisponible)');
      }
    } catch (error) {
      console.error('Erreur sauvegarde paramètres notifications:', error);
      await AsyncStorage.setItem(`notification_settings_${userId}`, JSON.stringify(settings));
    }
  }

  // Méthodes pour les préférences d'application
  static async getAppPreferences(userId: string): Promise<any> {
    try {
      const isConnected = await this.testConnection();
      if (isConnected) {
        const response = await fetch(`${SERVER_URL}/api/app-preferences/${userId}`);
        if (response.ok) {
          const data = await response.json();
          console.log('Préférences app récupérées depuis le serveur VPS');
          await AsyncStorage.setItem(`app_preferences_${userId}`, JSON.stringify(data));
          return data;
        }
      }

      // Fallback vers le stockage local
      console.log('Fallback vers le stockage local pour les préférences app');
      const localData = await AsyncStorage.getItem(`app_preferences_${userId}`);
      return localData ? JSON.parse(localData) : {
        theme: 'dark',
        language: 'fr',
        units: 'metric',
        notifications: true
      };
    } catch (error) {
      console.error('Erreur récupération préférences app:', error);
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
      // Toujours sauvegarder en local d'abord
      await AsyncStorage.setItem(`app_preferences_${userId}`, JSON.stringify(preferences));

      const isConnected = await this.testConnection();
      if (isConnected) {
        const response = await fetch(`${SERVER_URL}/api/app-preferences/${userId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(preferences),
        });

        if (response.ok) {
          console.log('Préférences app sauvegardées sur le serveur VPS');
        } else {
          console.log('Préférences app sauvegardées localement (serveur indisponible)');
        }
      } else {
        console.log('Préférences app sauvegardées localement (serveur indisponible)');
      }
    } catch (error) {
      console.error('Erreur sauvegarde préférences app:', error);
      await AsyncStorage.setItem(`app_preferences_${userId}`, JSON.stringify(preferences));
    }
  }

  // Méthodes utilitaires
  static async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove(['programmes_coach', 'users', 'current_user']);
      console.log('Toutes les données locales ont été supprimées');
    } catch (error) {
      console.error('Erreur lors de la suppression des données:', error);
      throw error;
    }
  }

  static async exportData(): Promise<{programmes: any[], users: any[]}> {
    try {
      const programmes = await this.getProgrammes();
      const users = await this.getUsers();
      return { programmes, users };
    } catch (error) {
      console.error('Erreur lors de l\'export des données:', error);
      throw error;
    }
  }

  static async getStravaActivities(userId: string): Promise<any[]> {
    try {
      await this.testConnection();
      const response = await fetch(`${SERVER_URL}/api/strava/${userId}`);

      if (response.ok) {
        const data = await response.json();
        console.log('Activités Strava récupérées du serveur VPS');
        return data;
      }
      throw new Error('Erreur récupération activités Strava du serveur');
    } catch (error) {
      console.error('Erreur récupération activités Strava:', error);
      return [];
    }
  }

  static async importData(data: {programmes: any[], users: any[]}): Promise<void> {
    try {
      await this.saveProgrammes(data.programmes || []);
      await this.saveUsers(data.users || []);
      console.log('Données importées avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'import des données:', error);
      throw error;
    }
  }

  // Méthodes pour les statuts d'intégrations
  static async getIntegrationStatus(userId: string): Promise<any> {
    try {
      const isConnected = await this.testConnection();
      if (isConnected) {
        const response = await fetch(`${SERVER_URL}/api/integrations/${userId}`);
        if (response.ok) {
          const data = await response.json();
          console.log('Statuts intégrations récupérés depuis le serveur VPS');
          // Sauvegarder en local comme backup
          await AsyncStorage.setItem(`user_integrations_${userId}`, JSON.stringify(data));
          return data;
        }
      }

      // Fallback vers le stockage local
      console.log('Fallback vers le stockage local pour les statuts intégrations');
      const localData = await AsyncStorage.getItem(`user_integrations_${userId}`);
      return localData ? JSON.parse(localData) : {
        appleHealth: { connected: false, permissions: [] },
        strava: { connected: false }
      };
    } catch (error) {
      console.error('Erreur récupération statuts intégrations:', error);
      try {
        const localData = await AsyncStorage.getItem(`user_integrations_${userId}`);
        return localData ? JSON.parse(localData) : {
          appleHealth: { connected: false, permissions: [] },
          strava: { connected: false }
        };
      } catch (localError) {
        console.error('Erreur stockage local intégrations:', localError);
        return {
          appleHealth: { connected: false, permissions: [] },
          strava: { connected: false }
        };
      }
    }
  }

  static async saveIntegrationStatus(userId: string, status: any): Promise<void> {
    try {
      // Toujours sauvegarder en local d'abord
      await AsyncStorage.setItem(`user_integrations_${userId}`, JSON.stringify(status));

      const isConnected = await this.testConnection();
      if (isConnected) {
        const response = await fetch(`${SERVER_URL}/api/integrations/${userId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(status),
        });

        if (response.ok) {
          console.log('Statuts intégrations sauvegardés sur le serveur VPS');
        } else {
          console.log('Statuts intégrations sauvegardés localement (serveur indisponible)');
        }
      } else {
        console.log('Statuts intégrations sauvegardés localement (serveur indisponible)');
      }
    } catch (error) {
      console.error('Erreur sauvegarde statuts intégrations:', error);
      // Au moins garder la sauvegarde locale
      await AsyncStorage.setItem(`user_integrations_${userId}`, JSON.stringify(status));
    }
  }

  // Vérification de l'état du serveur
  static async syncData(): Promise<void> {
    try {
      await this.testConnection();
      console.log('Serveur VPS opérationnel - toutes les données sont sur le serveur');
    } catch (error) {
      console.error('Erreur connexion serveur VPS:', error);
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

// Adding missing getClients function here
export const getClients = async (): Promise<any[]> => {
  const users = await PersistentStorage.getUsers();
  return users.filter(user => user.userType === 'client');
};

// Fonction pour récupérer les données utilisateur
export const getUserData = async (): Promise<any | null> => {
  try {
    const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
    const userData = await AsyncStorage.getItem('current_user');
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Erreur récupération données utilisateur:', error);
    return null;
  }
};

// Adding message management functions here
// Configuration de l'URL API avec fallback et validation
const getApiUrl = () => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;

  if (envUrl) {
    console.log(`[DEBUG] URL API depuis env: ${envUrl}`);
    return envUrl;
  }

  // Fallback pour le développement
  const fallbackUrl = 'http://51.178.29.220:5000';
  console.log(`[DEBUG] URL API fallback: ${fallbackUrl}`);
  return fallbackUrl;
};

const API_URL = getApiUrl();

// Test de connexion à l'API
export const testApiConnection = async (): Promise<{ success: boolean; message: string }> => {
  try {
    console.log(`[DEBUG] Test de connexion API: ${API_URL}/api/health-check`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 secondes

    const response = await fetch(`${API_URL}/api/health-check`, {
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
      return { success: false, message: 'Timeout de connexion (5s)' };
    }
    
    console.error('[ERROR] Test connexion API échoué:', error);
    return { success: false, message: `Erreur réseau: ${error.message || error}` };
  }
};

export const getMessages = async (userId: string): Promise<any[]> => {
  try {
    console.log(`[DEBUG] Récupération messages pour userId: ${userId}`);
    console.log(`[DEBUG] URL API: ${API_URL}/api/messages/${userId}`);

    // Test de connexion avec timeout court
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 secondes

    const response = await fetch(`${API_URL}/api/messages/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    console.log(`[DEBUG] Response status: ${response.status}`);

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`[DEBUG] Messages récupérés depuis VPS:`, data.length);

    // Sauvegarder en cache local
    await AsyncStorage.setItem(`messages_cache_${userId}`, JSON.stringify(data));

    return data.map((message: any) => ({
      ...message,
      timestamp: new Date(message.timestamp)
    }));
  } catch (error) {
    console.warn('[WARNING] Erreur récupération messages VPS:', error);
    
    // FALLBACK: Essayer le cache local
    try {
      const cachedData = await AsyncStorage.getItem(`messages_cache_${userId}`);
      if (cachedData) {
        const messages = JSON.parse(cachedData);
        console.log(`[DEBUG] Messages récupérés depuis cache local:`, messages.length);
        return messages.map((message: any) => ({
          ...message,
          timestamp: new Date(message.timestamp)
        }));
      }
    } catch (cacheError) {
      console.error('[ERROR] Erreur cache local messages:', cacheError);
    }

    // Dernier recours: tableau vide
    console.log('[DEBUG] Aucun message trouvé, retour tableau vide');
    return [];
  }
};

export const saveMessages = async (userId: string, messages: any[]): Promise<void> => {
  try {
    console.log(`[DEBUG] Sauvegarde messages pour userId: ${userId}`);
    console.log(`[DEBUG] Nombre de messages à sauvegarder: ${messages.length}`);

    const response = await fetch(`${API_URL}/api/messages/${userId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });

    console.log(`[DEBUG] Sauvegarde response status: ${response.status}`);

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status} - ${response.statusText}`);
    }

    console.log(`[DEBUG] Messages sauvegardés avec succès`);
  } catch (error) {
    console.error('[ERROR] Erreur sauvegarde messages:', error);
    throw error;
  }
};

export const testServerConnection = async (): Promise<boolean> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 secondes timeout

      const response = await fetch(`${SERVER_URL}/api/health-check`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

    clearTimeout(timeoutId);

    if (response.ok) {
      console.log('✅ Serveur VPS connecté');
      return true;
    } else {
      console.log(`⚠️ Serveur indisponible (status: ${response.status})`);
      return false;
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('⚠️ Timeout de connexion au serveur VPS');
    } else {
      console.log('⚠️ Erreur de connexion au serveur VPS:', error.message);
    }
    return false;
  }
};