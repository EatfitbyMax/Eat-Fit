
import { Platform } from 'react-native';
import * as Health from 'expo-health';

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
      return await Health.isAvailableAsync();
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

      // Définir les types de données à lire
      const readPermissions = [
        Health.HealthDataType.Steps,
        Health.HealthDataType.HeartRate,
        Health.HealthDataType.ActiveEnergyBurned,
        Health.HealthDataType.AppleExerciseTime,
        Health.HealthDataType.DistanceWalkingRunning,
        Health.HealthDataType.Workout
      ];

      // Définir les types de données à écrire
      const writePermissions = [
        Health.HealthDataType.Workout,
        Health.HealthDataType.ActiveEnergyBurned
      ];

      const { granted } = await Health.requestPermissionsAsync({
        read: readPermissions,
        write: writePermissions
      });

      console.log('✅ [HEALTH] Permissions accordées:', granted);
      return granted;
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

      const stepsPermission = await Health.getPermissionsAsync({
        read: [Health.HealthDataType.Steps]
      });

      const heartRatePermission = await Health.getPermissionsAsync({
        read: [Health.HealthDataType.HeartRate]
      });

      const activeEnergyPermission = await Health.getPermissionsAsync({
        read: [Health.HealthDataType.ActiveEnergyBurned]
      });

      const workoutPermission = await Health.getPermissionsAsync({
        read: [Health.HealthDataType.Workout],
        write: [Health.HealthDataType.Workout]
      });

      return {
        steps: stepsPermission.granted,
        heartRate: heartRatePermission.granted,
        activeEnergy: activeEnergyPermission.granted,
        workouts: workoutPermission.granted
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

      const result = await Health.getHealthDataAsync({
        dataType: Health.HealthDataType.Steps,
        startDate,
        endDate
      });

      return result.reduce((total, entry) => total + (entry.value as number), 0);
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

      const result = await Health.getHealthDataAsync({
        dataType: Health.HealthDataType.HeartRate,
        startDate,
        endDate
      });

      return result.map(entry => entry.value as number);
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

      const result = await Health.getHealthDataAsync({
        dataType: Health.HealthDataType.Workout,
        startDate,
        endDate
      });

      return result;
    } catch (error) {
      console.error('❌ [HEALTH] Erreur récupération workouts:', error);
      return [];
    }
  }
}
