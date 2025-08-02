// Service Apple Health compatible avec iOS uniquement
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ExpoHealth from 'expo-health';

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
      const available = AppleHealthKit.isAvailable();
      console.log('✅ Apple Health disponible (Production):', available);
      return available;
    } catch (error) {
      console.log('⚠️ rn-apple-healthkit non disponible en développement:', error);
      // En développement (Expo Go), retourner false car HealthKit n'est pas supporté
      return false;
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

export const connectToAppleHealth = async (): Promise<boolean> => {
  try {
    console.log('🍎 Tentative de connexion à Apple Health...');

    // En production, utiliser les vraies APIs HealthKit
    if (Platform.OS === 'ios') {
      // Utiliser expo-health pour les permissions HealthKit
      const { status } = await ExpoHealth.requestPermissionsAsync({
        read: [
          ExpoHealth.HealthDataType.Steps,
          ExpoHealth.HealthDataType.Weight,
          ExpoHealth.HealthDataType.Height,
          ExpoHealth.HealthDataType.HeartRate,
          ExpoHealth.HealthDataType.ActiveEnergyBurned,
        ],
      });

      if (status === 'granted') {
        await AsyncStorage.setItem('appleHealthConnected', 'true');
        console.log('✅ Apple Health connecté avec succès');
        return true;
      } else {
        console.log('❌ Permission Apple Health refusée');
        return false;
      }
    }

    // Fallback pour le développement
    if (__DEV__) {
      console.log('📱 Mode développement - Simulation Apple Health');
      await new Promise(resolve => setTimeout(resolve, 1500));

      Alert.alert(
        'Connecter Apple Health',
        'Mode simulation uniquement (sécurisé pour iOS)',
        [
          { text: 'Annuler', style: 'cancel' },
          { 
            text: 'Connecter', 
            onPress: async () => {
              await AsyncStorage.setItem('appleHealthConnected', 'true');
              console.log('✅ Apple Health connecté (simulé)');
            }
          }
        ]
      );
      return true;
    }
}

export default HealthKitService;