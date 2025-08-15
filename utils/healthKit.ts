
// Service Apple Health compatible avec iOS uniquement
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface HealthData {
  steps?: number;
  heartRate?: number;
  weight?: number;
  calories?: number;
  distance?: number;
}

class HealthKitService {
  static async isAvailable(): Promise<boolean> {
    if (Platform.OS !== 'ios') {
      console.log('ℹ️ Apple Health disponible uniquement sur iOS');
      return false;
    }

    try {
      // Import conditionnel plus robuste
      let AppleHealthKit;
      
      try {
        // Essayer d'importer le module natif
        AppleHealthKit = require('rn-apple-healthkit').default || require('rn-apple-healthkit');
        
        // Vérification supplémentaire de l'objet
        if (!AppleHealthKit) {
          throw new Error('Module rn-apple-healthkit non disponible');
        }
        
        console.log('📦 Module rn-apple-healthkit chargé avec succès');
        
      } catch (requireError) {
        console.log('❌ Erreur import rn-apple-healthkit:', requireError.message);
        
        // En mode développement, on accepte que le module ne soit pas disponible
        if (__DEV__) {
          console.log('📱 Mode développement - Module HealthKit non disponible, mais on continue');
          return true; // On retourne true pour permettre les tests en dev
        }
        
        // En production, essayer des chemins alternatifs
        try {
          AppleHealthKit = require('rn-apple-healthkit/RNAppleHealthKit');
        } catch (fallbackError) {
          console.log('❌ Aucun chemin d\'import fonctionnel pour rn-apple-healthkit');
          return false;
        }
      }
      
      // En mode développement sans module natif, on simule la disponibilité
      if (__DEV__ && !AppleHealthKit) {
        console.log('📱 Mode développement - Simulation HealthKit disponible');
        return true;
      }
      
      console.log('🔍 Vérification API HealthKit...');
      
      // Vérifications plus robustes des méthodes
      const requiredMethods = ['isAvailable', 'initHealthKit'];
      for (const method of requiredMethods) {
        if (!AppleHealthKit[method] || typeof AppleHealthKit[method] !== 'function') {
          console.log(`❌ Méthode ${method} manquante dans AppleHealthKit`);
          
          // En développement, on continue même si les méthodes manquent
          if (__DEV__) {
            console.log('📱 Mode développement - Méthodes manquantes ignorées');
            return true;
          }
          return false;
        }
      }
      
      console.log('✅ Toutes les méthodes HealthKit disponibles');
      
      // Vérifier la disponibilité sur l'appareil
      let deviceSupported = false;
      try {
        deviceSupported = AppleHealthKit.isAvailable();
        console.log('📱 Support HealthKit sur appareil:', deviceSupported);
      } catch (availabilityError) {
        console.log('❌ Erreur vérification support appareil:', availabilityError.message);
        
        // En développement, on simule que c'est supporté
        if (__DEV__) {
          console.log('📱 Mode développement - Support appareil simulé');
          return true;
        }
        return false;
      }
      
      if (!deviceSupported) {
        console.log('❌ HealthKit non supporté sur cet appareil');
        
        // En développement, on accepte même si non supporté
        if (__DEV__) {
          console.log('📱 Mode développement - Support forcé pour test');
          return true;
        }
        return false;
      }
      
      console.log('✅ HealthKit disponible et prêt');
      console.log('📱 Plateforme:', Platform.OS);
      console.log('🔧 Mode développement:', __DEV__);
      return true;
      
    } catch (error) {
      console.error('⚠️ Erreur critique vérification HealthKit:', error);
      
      // En mode développement, on retourne true pour permettre les tests
      if (__DEV__) {
        console.log('📱 Mode développement - Erreur ignorée, disponibilité simulée');
        return true;
      }
      
      // En production, plus de détails
      console.error('❌ Erreur HealthKit production:', {
        message: error?.message || 'Erreur inconnue',
        stack: error?.stack || 'Stack non disponible',
        name: error?.name || 'Erreur sans nom',
        toString: error?.toString() || 'toString non disponible'
      });
      
      return false;
    }
  }

  static async requestPermissions(): Promise<boolean> {
    try {
      if (Platform.OS !== 'ios') {
        console.log('❌ Apple Health non disponible sur cette plateforme');
        return false;
      }

      // Import sécurisé et robuste
      let AppleHealthKit;
      try {
        AppleHealthKit = require('rn-apple-healthkit').default || require('rn-apple-healthkit');
        if (!AppleHealthKit) {
          throw new Error('Module vide');
        }
      } catch (error) {
        console.log('❌ Erreur import dans requestPermissions:', error.message);
        
        // En mode développement, on simule le succès
        if (__DEV__) {
          console.log('📱 Mode développement - Permissions simulées accordées');
          return true;
        }
        return false;
      }

      // En mode développement sans module natif, on simule le succès
      if (__DEV__ && !AppleHealthKit) {
        console.log('📱 Mode développement - Module non disponible, permissions simulées');
        return true;
      }

      // Vérifier d'abord si HealthKit est disponible
      console.log('🔍 Vérification disponibilité avant permissions...');
      try {
        if (!AppleHealthKit.isAvailable()) {
          console.log('❌ Apple Health non disponible sur cet appareil');
          
          // En développement, on continue même si non disponible
          if (__DEV__) {
            console.log('📱 Mode développement - Disponibilité forcée');
            return true;
          }
          throw new Error('Apple Health n\'est pas disponible sur cet appareil');
        }
      } catch (availabilityError) {
        console.log('❌ Erreur vérification disponibilité:', availabilityError.message);
        
        // En développement, on ignore l'erreur
        if (__DEV__) {
          console.log('📱 Mode développement - Erreur disponibilité ignorée');
          return true;
        }
        throw availabilityError;
      }

      // Configuration permissions simplifiée
      const permissions = {
        permissions: {
          read: [
            AppleHealthKit.Constants.Permissions.Steps,
            AppleHealthKit.Constants.Permissions.ActiveEnergyBurned,
            AppleHealthKit.Constants.Permissions.HeartRate,
            AppleHealthKit.Constants.Permissions.Weight,
            AppleHealthKit.Constants.Permissions.DistanceWalkingRunning,
          ],
          write: [
            AppleHealthKit.Constants.Permissions.Weight,
            AppleHealthKit.Constants.Permissions.ActiveEnergyBurned,
          ],
        },
      };

      console.log('🔐 Initialisation HealthKit avec permissions...');
      console.log('📋 Permissions demandées:', Object.keys(permissions.permissions.read).length + Object.keys(permissions.permissions.write).length);

      return new Promise((resolve) => {
        AppleHealthKit.initHealthKit(permissions, (error: any) => {
          if (error) {
            console.error('⚠️ Erreur détaillée permissions HealthKit:', {
              message: error.message,
              code: error.code,
              domain: error.domain,
              userInfo: error.userInfo
            });
            
            if (error.message && error.message.includes('denied')) {
              console.log('❌ Permissions refusées par l\'utilisateur');
            } else if (error.message && error.message.includes('not available')) {
              console.log('❌ HealthKit non disponible sur ce simulateur/appareil');
            } else {
              console.error('❌ Erreur inconnue HealthKit:', error);
            }
            
            // En développement, on accepte même les erreurs
            if (__DEV__) {
              console.log('📱 Mode développement - Erreur permissions ignorée');
              resolve(true);
            } else {
              resolve(false);
            }
          } else {
            console.log('✅ HealthKit initialisé avec succès');
            console.log('✅ Permissions accordées');
            resolve(true);
          }
        });
      });
    } catch (error) {
      console.error('⚠️ Exception lors de la demande de permissions HealthKit:', error);
      
      // En développement, on simule le succès même en cas d'erreur
      if (__DEV__) {
        console.log('📱 Mode développement - Exception ignorée, succès simulé');
        return true;
      }
      return false;
    }
  }

  static async getSteps(date: Date): Promise<number> {
    try {
      const AppleHealthKit = require('rn-apple-healthkit').default || require('rn-apple-healthkit');

      const options = {
        startDate: new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString(),
        endDate: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1).toISOString(),
      };

      return new Promise((resolve) => {
        AppleHealthKit.getStepCount(options, (callbackError: any, results: any) => {
          if (callbackError) {
            console.log('Erreur récupération des pas:', callbackError);
            resolve(0);
          } else {
            resolve(results?.value || 0);
          }
        });
      });
    } catch (error) {
      console.log('Erreur récupération des pas:', error);
      return 0;
    }
  }

  static async getHeartRate(): Promise<number> {
    try {
      const AppleHealthKit = require('rn-apple-healthkit').default || require('rn-apple-healthkit');

      const options = {
        startDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date().toISOString(),
        limit: 1,
      };

      return new Promise((resolve) => {
        AppleHealthKit.getHeartRateSamples(options, (callbackError: any, results: any) => {
          if (callbackError) {
            console.log('Erreur récupération du rythme cardiaque:', callbackError);
            resolve(0);
          } else {
            const latestSample = results?.[0];
            resolve(latestSample?.value || 0);
          }
        });
      });
    } catch (error) {
      console.log('Erreur récupération du rythme cardiaque:', error);
      return 0;
    }
  }

  static async writeWeight(weight: number): Promise<boolean> {
    try {
      const AppleHealthKit = require('rn-apple-healthkit').default || require('rn-apple-healthkit');

      const options = {
        value: weight,
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString(),
      };

      return new Promise((resolve) => {
        AppleHealthKit.saveWeight(options, (callbackError: any) => {
          if (callbackError) {
            console.log('Erreur écriture du poids:', callbackError);
            resolve(false);
          } else {
            console.log('✅ Poids sauvegardé dans Apple Health:', weight);
            resolve(true);
          }
        });
      });
    } catch (error) {
      console.log('Erreur écriture du poids:', error);
      return false;
    }
  }

  static async getActiveEnergyBurned(date: Date): Promise<number> {
    try {
      const AppleHealthKit = require('rn-apple-healthkit').default || require('rn-apple-healthkit');

      const options = {
        startDate: new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString(),
        endDate: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1).toISOString(),
      };

      return new Promise((resolve) => {
        AppleHealthKit.getActiveEnergyBurned(options, (callbackError: any, results: any) => {
          if (callbackError) {
            console.log('Erreur récupération des calories actives:', callbackError);
            resolve(0);
          } else {
            const totalCalories = results?.reduce((sum: number, sample: any) => sum + (sample.value || 0), 0) || 0;
            resolve(totalCalories);
          }
        });
      });
    } catch (error) {
      console.log('Erreur récupération des calories actives:', error);
      return 0;
    }
  }

  static async getDistanceWalkingRunning(date: Date): Promise<number> {
    try {
      const AppleHealthKit = require('rn-apple-healthkit').default || require('rn-apple-healthkit');

      const options = {
        startDate: new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString(),
        endDate: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1).toISOString(),
      };

      return new Promise((resolve) => {
        AppleHealthKit.getDistanceWalkingRunning(options, (callbackError: any, results: any) => {
          if (callbackError) {
            console.log('Erreur récupération de la distance:', callbackError);
            resolve(0);
          } else {
            const totalDistance = results?.reduce((sum: number, sample: any) => sum + (sample.value || 0), 0) || 0;
            resolve(totalDistance);
          }
        });
      });
    } catch (error) {
      console.log('Erreur récupération de la distance:', error);
      return 0;
    }
  }

  static async getHealthData(date: Date): Promise<HealthData> {
    try {
      if (Platform.OS !== 'ios') {
        throw new Error('Apple Health n\'est disponible que sur iOS');
      }

      const isAvailable = await this.isAvailable();
      if (!isAvailable) {
        throw new Error('Apple Health n\'est pas disponible sur cet appareil');
      }

      // Récupération des données Apple Health
      console.log('✅ Récupération des données Apple Health');
      const [steps, heartRate, calories, distance] = await Promise.all([
        this.getSteps(date),
        this.getHeartRate(),
        this.getActiveEnergyBurned(date),
        this.getDistanceWalkingRunning(date)
      ]);

      return {
        steps,
        heartRate,
        calories,
        distance
      };
    } catch (error) {
      console.error('❌ Erreur lecture données Apple Health:', error);
      throw error;
    }
  }

  // Méthode de simulation pour développement
  private static generateSimulatedHealthData(): HealthData[] {
    const now = new Date();
    const simulatedData: HealthData[] = [];

    // Générer 7 jours de données de base
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      simulatedData.push({
        steps: Math.floor(Math.random() * 10000),
        heartRate: Math.floor(Math.random() * 70 + 60),
        weight: Math.floor(Math.random() * 20 + 70),
        calories: Math.floor(Math.random() * 500 + 1500),
        distance: Math.floor(Math.random() * 5 + 1),
      });
    }

    return simulatedData;
  }
}

// Fonction pour connecter Apple Health (utilisée dans l'UI)
export const connectToAppleHealth = async (): Promise<boolean> => {
  try {
    console.log('🍎 Tentative de connexion à Apple Health...');

    if (Platform.OS !== 'ios') {
      console.log('❌ Apple Health disponible uniquement sur iOS');
      Alert.alert(
        'iOS Requis',
        'Apple Health est uniquement disponible sur les appareils iOS.'
      );
      return false;
    }

    // Vérifier d'abord si le module rn-apple-healthkit est disponible
    let AppleHealthKit;
    try {
      AppleHealthKit = require('rn-apple-healthkit').default || require('rn-apple-healthkit');
      
      if (!AppleHealthKit) {
        throw new Error('Module rn-apple-healthkit non trouvé');
      }
      
      // Vérifier les méthodes essentielles
      if (!AppleHealthKit.isAvailable || !AppleHealthKit.initHealthKit) {
        throw new Error('Méthodes HealthKit manquantes');
      }
      
      console.log('✅ Module rn-apple-healthkit chargé avec succès');
      
    } catch (moduleError) {
      console.error('❌ Erreur chargement module HealthKit:', moduleError);
      
      if (__DEV__) {
        console.log('📱 Mode développement - Module HealthKit non disponible');
        
        return new Promise((resolve) => {
          Alert.alert(
            'Module HealthKit (Dev)',
            'Le module rn-apple-healthkit n\'est pas disponible en développement.\n\nVoulez-vous simuler la connexion ?',
            [
              { 
                text: 'Annuler', 
                style: 'cancel',
                onPress: () => resolve(false)
              },
              { 
                text: 'Simuler', 
                onPress: async () => {
                  try {
                    await AsyncStorage.setItem('appleHealthConnected', 'true');
                    console.log('✅ Apple Health connecté (simulé en dev)');
                    resolve(true);
                  } catch (error) {
                    console.error('Erreur sauvegarde simulation:', error);
                    resolve(false);
                  }
                }
              }
            ]
          );
        });
      } else {
        Alert.alert(
          'Module non disponible',
          'Le module Apple Health n\'est pas disponible. L\'application doit être construite avec EAS Build pour accéder à HealthKit.'
        );
        return false;
      }
    }

    // Vérifier la disponibilité sur l'appareil
    try {
      console.log('🔍 Vérification disponibilité HealthKit sur l\'appareil...');
      
      const deviceSupported = AppleHealthKit.isAvailable();
      if (!deviceSupported) {
        console.log('❌ HealthKit non supporté sur cet appareil');
        Alert.alert(
          'HealthKit non supporté',
          'Apple Health n\'est pas disponible sur cet appareil. Assurez-vous que l\'application Santé est installée.'
        );
        return false;
      }
      
      console.log('✅ HealthKit disponible sur l\'appareil');
      
    } catch (availabilityError) {
      console.error('❌ Erreur vérification disponibilité:', availabilityError);
      Alert.alert(
        'Erreur de vérification',
        'Impossible de vérifier la disponibilité d\'Apple Health sur cet appareil.'
      );
      return false;
    }

    // Demander les permissions
    try {
      console.log('🔐 Demande des permissions HealthKit...');
      
      const permissions = {
        permissions: {
          read: [
            AppleHealthKit.Constants.Permissions.Steps,
            AppleHealthKit.Constants.Permissions.ActiveEnergyBurned,
            AppleHealthKit.Constants.Permissions.HeartRate,
            AppleHealthKit.Constants.Permissions.Weight,
            AppleHealthKit.Constants.Permissions.DistanceWalkingRunning,
          ],
          write: [
            AppleHealthKit.Constants.Permissions.Weight,
            AppleHealthKit.Constants.Permissions.ActiveEnergyBurned,
          ],
        },
      };

      const hasPermissions = await new Promise<boolean>((resolve) => {
        AppleHealthKit.initHealthKit(permissions, (error: any) => {
          if (error) {
            console.error('❌ Erreur permissions HealthKit:', error);
            
            if (error.message && error.message.includes('denied')) {
              Alert.alert(
                'Permissions refusées',
                'L\'accès à Apple Health a été refusé. Veuillez autoriser l\'accès dans Réglages > Confidentialité > Santé.'
              );
            } else {
              Alert.alert(
                'Erreur de permissions',
                'Impossible d\'obtenir les permissions pour Apple Health. Veuillez réessayer.'
              );
            }
            resolve(false);
          } else {
            console.log('✅ Permissions HealthKit accordées');
            resolve(true);
          }
        });
      });
      
      if (hasPermissions) {
        await AsyncStorage.setItem('appleHealthConnected', 'true');
        console.log('✅ Apple Health connecté avec succès');
        return true;
      } else {
        return false;
      }
      
    } catch (permissionError) {
      console.error('❌ Erreur demande permissions:', permissionError);
      Alert.alert(
        'Erreur de permissions',
        'Une erreur s\'est produite lors de la demande des permissions Apple Health.'
      );
      return false;
    }
    
  } catch (generalError) {
    console.error('❌ Erreur générale connexion Apple Health:', generalError);
    
    Alert.alert(
      'Erreur',
      'Une erreur inattendue s\'est produite lors de la connexion à Apple Health.'
    );
    return false;
  }
};

export default HealthKitService;
