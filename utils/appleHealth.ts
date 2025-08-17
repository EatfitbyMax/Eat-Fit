import { Platform, Alert } from 'react-native';
import AppleHealthKit, {
  HealthValue,
  HealthKitPermissions,
} from 'react-native-health';

export interface HealthPermissions {
  steps: boolean;
  heartRate: boolean;
  activeEnergy: boolean;
  workouts: boolean;
  sleep: boolean;
  caloriesConsumed: boolean;
}

export interface HealthSample {
  value: number;
  startDate: string;
  endDate: string;
}

export class AppleHealthManager {
  /**
   * Vérifier si HealthKit est disponible
   */
  static async isAvailable(): Promise<boolean> {
    if (Platform.OS !== 'ios') return false;

    return new Promise((resolve) => {
      AppleHealthKit.isAvailable((error: string, available: boolean) => {
        if (error) {
          console.error('❌ [HEALTH] HealthKit non disponible:', error);
          resolve(false);
        } else {
          resolve(available);
        }
      });
    });
  }

  /**
   * Afficher un écran explicatif avant la demande de permissions
   */
  static async showPermissionExplanation(): Promise<void> {
    return new Promise((resolve) => {
      Alert.alert(
        'Connexion à Apple Santé',
        'EatFit souhaite accéder à vos données de santé pour suivre vos pas, calories, fréquence cardiaque, sommeil et entraînements. Vos données resteront privées et ne seront pas partagées.',
        [{ text: 'OK', onPress: () => resolve() }]
      );
    });
  }

  /**
   * Demander les permissions HealthKit
   */
  static async requestPermissions(): Promise<boolean> {
    try {
      await this.showPermissionExplanation();

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
            AppleHealthKit.Constants.Permissions.Workout,
            AppleHealthKit.Constants.Permissions.DietaryEnergyConsumed,
          ],
          write: [
            AppleHealthKit.Constants.Permissions.Weight,
            AppleHealthKit.Constants.Permissions.ActiveEnergyBurned,
            AppleHealthKit.Constants.Permissions.Workout,
          ],
        },
      };

      return new Promise((resolve) => {
        AppleHealthKit.initHealthKit(permissions, (error: string) => {
          if (error) {
            console.error('❌ [HEALTH] Impossible d\'initialiser HealthKit:', error);
            resolve(false);
          } else {
            console.log('✅ [HEALTH] Permissions HealthKit accordées');
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
    if (!await this.isAvailable()) {
      return {
        steps: false,
        heartRate: false,
        activeEnergy: false,
        workouts: false,
        sleep: false,
        caloriesConsumed: false,
      };
    }

    return new Promise((resolve) => {
      AppleHealthKit.getAuthStatus(
        {
          read: [
            AppleHealthKit.Constants.Permissions.Steps,
            AppleHealthKit.Constants.Permissions.HeartRate,
            AppleHealthKit.Constants.Permissions.ActiveEnergyBurned,
            AppleHealthKit.Constants.Permissions.Workout,
            AppleHealthKit.Constants.Permissions.SleepAnalysis,
            AppleHealthKit.Constants.Permissions.DietaryEnergyConsumed,
          ],
        },
        (error: string, results: any) => {
          if (error) {
            console.error('❌ [HEALTH] Erreur vérification permissions:', error);
            resolve({
              steps: false,
              heartRate: false,
              activeEnergy: false,
              workouts: false,
              sleep: false,
              caloriesConsumed: false,
            });
          } else {
            resolve({
              steps: results[AppleHealthKit.Constants.Permissions.Steps] === 2,
              heartRate: results[AppleHealthKit.Constants.Permissions.HeartRate] === 2,
              activeEnergy: results[AppleHealthKit.Constants.Permissions.ActiveEnergyBurned] === 2,
              workouts: results[AppleHealthKit.Constants.Permissions.Workout] === 2,
              sleep: results[AppleHealthKit.Constants.Permissions.SleepAnalysis] === 2,
              caloriesConsumed: results[AppleHealthKit.Constants.Permissions.DietaryEnergyConsumed] === 2,
            });
          }
        }
      );
    });
  }

  /**
   * Récupérer les données de pas
   */
  static async getStepsData(startDate: Date, endDate: Date): Promise<HealthSample[]> {
    if (!await this.isAvailable()) return [];

    return new Promise((resolve) => {
      AppleHealthKit.getDailyStepCountSamples(
        {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
        (error: string, results: HealthValue[]) => {
          if (error) {
            console.error('❌ [HEALTH] Erreur récupération pas:', error);
            resolve([]);
          } else {
            resolve(results.map((r) => ({
              value: r.value || 0,
              startDate: r.startDate,
              endDate: r.endDate,
            })));
          }
        }
      );
    });
  }

  /**
   * Récupérer les données de fréquence cardiaque
   */
  static async getHeartRateData(startDate: Date, endDate: Date): Promise<HealthSample[]> {
    if (!await this.isAvailable()) return [];

    return new Promise((resolve) => {
      AppleHealthKit.getHeartRateSamples(
        {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
        (error: string, results: HealthValue[]) => {
          if (error) {
            console.error('❌ [HEALTH] Erreur récupération fréquence cardiaque:', error);
            resolve([]);
          } else {
            resolve(results.map((r) => ({
              value: r.value || 0,
              startDate: r.startDate,
              endDate: r.endDate,
            })));
          }
        }
      );
    });
  }

  /**
   * Récupérer les calories consommées
   */
  static async getCaloriesConsumed(startDate: Date, endDate: Date): Promise<HealthSample[]> {
    if (!await this.isAvailable()) return [];

    return new Promise((resolve) => {
      AppleHealthKit.getDietaryEnergyConsumed(
        {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
        (error: string, results: HealthValue[]) => {
          if (error) {
            console.error('❌ [HEALTH] Erreur récupération calories consommées:', error);
            resolve([]);
          } else {
            resolve(results.map((r) => ({
              value: r.value || 0,
              startDate: r.startDate,
              endDate: r.endDate,
            })));
          }
        }
      );
    });
  }

  /**
   * Récupérer les données de sommeil
   */
  static async getSleepData(startDate: Date, endDate: Date): Promise<HealthSample[]> {
    if (!await this.isAvailable()) return [];

    return new Promise((resolve) => {
      AppleHealthKit.getSleepSamples(
        {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
        (error: string, results: HealthValue[]) => {
          if (error) {
            console.error('❌ [HEALTH] Erreur récupération sommeil:', error);
            resolve([]);
          } else {
            resolve(results.map((r) => ({
              value: r.value || 0,
              startDate: r.startDate,
              endDate: r.endDate,
            })));
          }
        }
      );
    });
  }

  /**
   * Récupérer les séances d'entraînement
   */
  static async getWorkouts(startDate: Date, endDate: Date): Promise<HealthSample[]> {
    if (!await this.isAvailable()) return [];

    return new Promise((resolve) => {
      AppleHealthKit.getSamples(
        {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          type: 'Workout',
        } as any,
        (error: string, results: any[]) => {
          if (error) {
            console.error('❌ [HEALTH] Erreur récupération workouts:', error);
            resolve([]);
          } else {
            resolve(results.map((r) => ({
              value: r.duration || 0,
              startDate: r.startDate,
              endDate: r.endDate,
            })));
          }
        }
      );
    });
  }
}
