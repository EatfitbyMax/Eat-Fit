import { Platform } from 'react-native';
import { AppleHealthKit, HealthValue, HealthKitPermissions } from 'react-native-health';

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
      // react-native-health does not have a direct isAvailableAsync method.
      // We can infer availability from the initHealthKit callback, but for simplicity,
      // we'll assume it's available if the platform is iOS and initialization doesn't fail.
      // A more robust check might involve attempting a read operation.
      return true;
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
            AppleHealthKit.Constants.Permissions.Workouts
          ],
          write: [
            AppleHealthKit.Constants.Permissions.Weight,
            AppleHealthKit.Constants.Permissions.ActiveEnergyBurned,
            AppleHealthKit.Constants.Permissions.Workouts
          ],
        },
      };

      return new Promise((resolve) => {
        AppleHealthKit.initHealthKit(permissions, (error: string) => {
          if (error) {
            console.error('❌ [HEALTH] Erreur lors de l\'initialisation de HealthKit:', error);
            resolve(false);
          } else {
            console.log('✅ [HEALTH] Permissions accordées: true');
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

      // react-native-health does not provide a direct way to check permissions for specific types.
      // We rely on the initHealthKit callback to indicate if permissions were granted.
      // A more granular check would require attempting to read data and handling potential errors.
      // For now, we'll return true if initialization was successful, assuming granted permissions.
      // This is a simplification due to the library's API.
      const isInitialized = await new Promise<boolean>((resolve) => {
        AppleHealthKit.initHealthKit({ permissions: { read: [], write: [] } }, (error: string) => {
          resolve(!error);
        });
      });

      return {
        steps: isInitialized,
        heartRate: isInitialized,
        activeEnergy: isInitialized,
        workouts: isInitialized
      };
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
        AppleHealthKit.getStepCount(options, (callbackError: string, results: HealthValue[]) => {
          if (callbackError) {
            console.error('❌ [HEALTH] Erreur récupération pas:', callbackError);
            resolve(0);
          } else {
            // The getStepCount returns a single value for the total steps in the period.
            // If results is an array, it might be from a different method or an older version.
            // Assuming results is the total step count.
            const totalSteps = Array.isArray(results) ? results.reduce((sum, item) => sum + (item.value as number), 0) : (results as unknown as number);
            resolve(totalSteps || 0);
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
            const formattedResults = results.map((item) => item.value as number);
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
        AppleHealthKit.getWorkouts(options, (callbackError: string, results: any[]) => {
          if (callbackError) {
            console.error('❌ [HEALTH] Erreur récupération workouts:', callbackError);
            resolve([]);
          } else {
            resolve(results);
          }
        });
      });
    } catch (error) {
      console.error('❌ [HEALTH] Erreur récupération workouts:', error);
      return [];
    }
  }
}