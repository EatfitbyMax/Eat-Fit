
import { Platform } from 'react-native';
import AppleHealthKit, { 
  HealthValue, 
  HealthKitPermissions,
  HealthInputOptions 
} from 'react-native-health';

export interface HealthPermissions {
  steps: boolean;
  heartRate: boolean;
  activeEnergy: boolean;
  workouts: boolean;
}

export class AppleHealthManager {
  /**
   * Vérifier si HealthKit est disponible
   */
  static async isAvailable(): Promise<boolean> {
    if (Platform.OS !== 'ios') {
      return false;
    }

    try {
      return new Promise((resolve) => {
        AppleHealthKit.isAvailable((error: string, available: boolean) => {
          if (error) {
            console.error('❌ [HEALTH] Erreur vérification disponibilité:', error);
            resolve(false);
          } else {
            resolve(available);
          }
        });
      });
    } catch (error) {
      console.error('❌ [HEALTH] Erreur vérification disponibilité:', error);
      return false;
    }
  }

  /**
   * Demander les permissions HealthKit
   */
  static async requestPermissions(): Promise<boolean> {
    try {
      console.log('🔄 [HEALTH] Demande de permissions...');

      if (!await this.isAvailable()) {
        console.log('❌ [HEALTH] HealthKit non disponible');
        return false;
      }

      const permissions: HealthKitPermissions = {
        permissions: {
          read: [
            AppleHealthKit.Constants.Permissions.Steps,
            AppleHealthKit.Constants.Permissions.HeartRate,
            AppleHealthKit.Constants.Permissions.ActiveEnergyBurned,
            AppleHealthKit.Constants.Permissions.DistanceWalkingRunning,
            AppleHealthKit.Constants.Permissions.Weight,
            AppleHealthKit.Constants.Permissions.SleepAnalysis,
            AppleHealthKit.Constants.Permissions.Workout
          ],
          write: [
            AppleHealthKit.Constants.Permissions.Weight,
            AppleHealthKit.Constants.Permissions.ActiveEnergyBurned,
            AppleHealthKit.Constants.Permissions.Workout
          ],
        },
      };

      return new Promise((resolve) => {
        AppleHealthKit.initHealthKit(permissions, (error: string) => {
          if (error) {
            console.error('❌ [HEALTH] Erreur lors de l\'initialisation de HealthKit:', error);
            resolve(false);
          } else {
            console.log('✅ [HEALTH] Permissions accordées');
            resolve(true);
          }
        });
      });
    } catch (error) {
      console.error('❌ [HEALTH] Erreur demande permissions:', error);
      return false;
    }
  }

  /**
   * Vérifier le statut des permissions
   */
  static async checkPermissions(): Promise<HealthPermissions> {
    try {
      if (!await this.isAvailable()) {
        return {
          steps: false,
          heartRate: false,
          activeEnergy: false,
          workouts: false
        };
      }

      return new Promise((resolve) => {
        AppleHealthKit.getAuthStatus(
          {
            read: [
              AppleHealthKit.Constants.Permissions.Steps,
              AppleHealthKit.Constants.Permissions.HeartRate,
              AppleHealthKit.Constants.Permissions.ActiveEnergyBurned,
              AppleHealthKit.Constants.Permissions.Workout
            ]
          },
          (error: string, results: any) => {
            if (error) {
              console.error('❌ [HEALTH] Erreur vérification permissions:', error);
              resolve({
                steps: false,
                heartRate: false,
                activeEnergy: false,
                workouts: false
              });
            } else {
              resolve({
                steps: results[AppleHealthKit.Constants.Permissions.Steps] === 2,
                heartRate: results[AppleHealthKit.Constants.Permissions.HeartRate] === 2,
                activeEnergy: results[AppleHealthKit.Constants.Permissions.ActiveEnergyBurned] === 2,
                workouts: results[AppleHealthKit.Constants.Permissions.Workout] === 2
              });
            }
          }
        );
      });
    } catch (error) {
      console.error('❌ [HEALTH] Erreur vérification permissions:', error);
      return {
        steps: false,
        heartRate: false,
        activeEnergy: false,
        workouts: false
      };
    }
  }

  /**
   * Récupérer les données de pas
   */
  static async getStepsData(startDate: Date, endDate: Date): Promise<number> {
    try {
      if (!await this.isAvailable()) {
        return 0;
      }

      const options = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      };

      return new Promise((resolve) => {
        AppleHealthKit.getStepCount(options, (callbackError: string, results: HealthValue) => {
          if (callbackError) {
            console.error('❌ [HEALTH] Erreur récupération pas:', callbackError);
            resolve(0);
          } else {
            resolve(results.value || 0);
          }
        });
      });
    } catch (error) {
      console.error('❌ [HEALTH] Erreur récupération pas:', error);
      return 0;
    }
  }

  /**
   * Récupérer les données de fréquence cardiaque
   */
  static async getHeartRateData(startDate: Date, endDate: Date): Promise<number[]> {
    try {
      if (!await this.isAvailable()) {
        return [];
      }

      const options = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      };

      return new Promise((resolve) => {
        AppleHealthKit.getHeartRateSamples(options, (callbackError: string, results: HealthValue[]) => {
          if (callbackError) {
            console.error('❌ [HEALTH] Erreur récupération fréquence cardiaque:', callbackError);
            resolve([]);
          } else {
            const formattedResults = results.map((item) => item.value);
            resolve(formattedResults);
          }
        });
      });
    } catch (error) {
      console.error('❌ [HEALTH] Erreur récupération fréquence cardiaque:', error);
      return [];
    }
  }

  /**
   * Récupérer les séances d'entraînement
   */
  static async getWorkouts(startDate: Date, endDate: Date): Promise<any[]> {
    try {
      if (!await this.isAvailable()) {
        return [];
      }

      const options = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      };

      return new Promise((resolve) => {
        AppleHealthKit.getSamples(
          { 
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            type: 'Workout'
          } as any,
          (callbackError: string, results: any[]) => {
            if (callbackError) {
              console.error('❌ [HEALTH] Erreur récupération workouts:', callbackError);
              resolve([]);
            } else {
              resolve(results);
            }
          }
        );
      });
    } catch (error) {
      console.error('❌ [HEALTH] Erreur récupération workouts:', error);
      return [];
    }
  }
}
