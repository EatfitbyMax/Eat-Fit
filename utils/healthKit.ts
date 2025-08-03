
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
      // Vérifier si rn-apple-healthkit est disponible (mode production)
      const AppleHealthKit = require('rn-apple-healthkit');
      
      // En production, vérifier explicitement les capabilities
      if (!__DEV__) {
        console.log('🏭 Mode production détecté - vérification HealthKit...');
        
        // Vérifier si l'appareil supporte HealthKit
        if (!AppleHealthKit.isAvailable()) {
          console.log('❌ HealthKit non disponible sur cet appareil');
          throw new Error('Apple Health n\'est pas disponible sur cet appareil. Assurez-vous que l\'application Santé est installée et que votre appareil supporte HealthKit.');
        }
        
        console.log('✅ HealthKit disponible en production');
        return true;
      }
      
      // Vérifier si HealthKit est disponible sur l'appareil
      const available = AppleHealthKit.isAvailable();
      console.log('✅ Apple Health disponible:', available);
      return available;
    } catch (error) {
      console.log('⚠️ Erreur vérification HealthKit:', error);
      
      // En mode développement avec Expo Go, HealthKit n'est pas supporté
      if (__DEV__) {
        console.log('📱 Mode développement - HealthKit non supporté dans Expo Go');
        return false;
      }
      
      // En production, si le module n'est pas trouvé, c'est un problème de build
      console.error('❌ Problème HealthKit en production:', error.message);
      throw error;
    }
  }

  static async requestPermissions(): Promise<boolean> {
    try {
      if (Platform.OS !== 'ios') {
        console.log('❌ Apple Health non disponible sur cette plateforme');
        return false;
      }

      const AppleHealthKit = require('rn-apple-healthkit');

      // Vérifier d'abord si HealthKit est disponible
      if (!AppleHealthKit.isAvailable()) {
        console.log('❌ Apple Health non disponible sur cet appareil');
        throw new Error('Apple Health n\'est pas disponible sur cet appareil');
      }

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

      return new Promise((resolve) => {
        console.log('🔐 Demande des permissions Apple Health...');
        AppleHealthKit.initHealthKit(permissions, (error: any) => {
          if (error) {
            console.log('⚠️ Erreur permissions HealthKit:', error);
            if (error.message && error.message.includes('denied')) {
              console.log('❌ Permissions refusées par l\'utilisateur');
            }
            resolve(false);
          } else {
            console.log('✅ Permissions HealthKit accordées avec succès');
            resolve(true);
          }
        });
      });
    } catch (error) {
      console.log('⚠️ Erreur lors de la demande de permissions HealthKit:', error);
      throw error;
    }
  }

  static async getSteps(date: Date): Promise<number> {
    try {
      const AppleHealthKit = require('rn-apple-healthkit');

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
      const AppleHealthKit = require('rn-apple-healthkit');

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
      const AppleHealthKit = require('rn-apple-healthkit');

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
      const AppleHealthKit = require('rn-apple-healthkit');

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
      const AppleHealthKit = require('rn-apple-healthkit');

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
      return false;
    }

    // Toujours utiliser les vraies APIs HealthKit en production
    try {
      const isAvailable = await HealthKitService.isAvailable();
      if (!isAvailable) {
        console.log('❌ Apple Health non disponible sur cet appareil');
        Alert.alert(
          'Apple Health non disponible',
          'Apple Health n\'est pas disponible sur cet appareil. Assurez-vous que l\'application Santé est installée et que votre appareil supporte HealthKit.'
        );
        return false;
      }

      const hasPermissions = await HealthKitService.requestPermissions();
      
      if (hasPermissions) {
        await AsyncStorage.setItem('appleHealthConnected', 'true');
        console.log('✅ Apple Health connecté avec succès');
        return true;
      } else {
        console.log('❌ Permissions Apple Health refusées');
        Alert.alert(
          'Permissions requises',
          'L\'accès à Apple Health est nécessaire pour synchroniser vos données de santé. Veuillez autoriser l\'accès dans les réglages.'
        );
        return false;
      }
    } catch (error) {
      console.error('❌ Erreur connexion Apple Health:', error);
      
      // En développement seulement, proposer une simulation comme fallback
      if (__DEV__) {
        console.log('📱 Mode développement - Fallback simulation Apple Health');
        
        return new Promise((resolve) => {
          Alert.alert(
            'Apple Health (Mode Dev)',
            'HealthKit non disponible en développement. Utiliser la simulation ?',
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
                    console.log('✅ Apple Health connecté (simulé)');
                    resolve(true);
                  } catch (error) {
                    console.error('Erreur sauvegarde:', error);
                    resolve(false);
                  }
                }
              }
            ]
          );
        });
      }
      
      return false;
    }
    
  } catch (error) {
    console.error('❌ Erreur générale connexion Apple Health:', error);
    return false;
  }
};

export default HealthKitService;
