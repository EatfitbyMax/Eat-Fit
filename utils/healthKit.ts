
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Health from 'expo-health';

// Types pour les données HealthKit
export interface HealthKitData {
  steps?: number;
  heartRate?: number;
  weight?: number;
  height?: number;
  bodyMassIndex?: number;
  activeEnergyBurned?: number;
  distanceWalkingRunning?: number;
  sleepHours?: number;
  restingHeartRate?: number;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  timestamp: number;
}

export interface HealthKitPermissions {
  read: Health.HealthDataType[];
  write: Health.HealthDataType[];
}

class HealthKitService {
  private isAvailable = false;
  private permissions: HealthKitPermissions = {
    read: [
      Health.HealthDataType.Steps,
      Health.HealthDataType.HeartRate,
      Health.HealthDataType.Weight,
      Health.HealthDataType.Height,
      Health.HealthDataType.BodyMassIndex,
      Health.HealthDataType.ActiveEnergyBurned,
      Health.HealthDataType.DistanceWalkingRunning,
      Health.HealthDataType.SleepAnalysis,
      Health.HealthDataType.RestingHeartRate,
      Health.HealthDataType.BloodPressureSystolic,
      Health.HealthDataType.BloodPressureDiastolic
    ],
    write: [
      Health.HealthDataType.Weight,
      Health.HealthDataType.ActiveEnergyBurned
    ]
  };

  async initialize(): Promise<boolean> {
    console.log('🍎 Initialisation HealthKit...');
    
    if (Platform.OS !== 'ios') {
      console.log('⚠️ HealthKit uniquement disponible sur iOS');
      return false;
    }

    try {
      // Vérifier la disponibilité de HealthKit
      const isHealthKitAvailable = await Health.isAvailableAsync();
      
      if (!isHealthKitAvailable) {
        console.log('❌ HealthKit non disponible sur cet appareil');
        return false;
      }

      this.isAvailable = true;
      console.log('✅ HealthKit initialisé');
      return true;
    } catch (error) {
      console.error('❌ Erreur initialisation HealthKit:', error);
      return false;
    }
  }

  async requestPermissions(): Promise<boolean> {
    console.log('🔐 Demande des permissions HealthKit...');
    
    if (!this.isAvailable) {
      await this.initialize();
    }

    if (!this.isAvailable) {
      return false;
    }

    try {
      // Demander les permissions pour lire les données
      const readPermissions = await Health.requestPermissionsAsync({
        read: this.permissions.read,
        write: this.permissions.write
      });
      
      if (readPermissions.granted) {
        await AsyncStorage.setItem('healthkit_permissions_granted', 'true');
        console.log('✅ Permissions HealthKit accordées');
        return true;
      } else {
        console.log('❌ Permissions HealthKit refusées');
        return false;
      }
    } catch (error) {
      console.error('❌ Erreur demande permissions HealthKit:', error);
      return false;
    }
  }

  async hasPermissions(): Promise<boolean> {
    try {
      if (!this.isAvailable) {
        return false;
      }
      
      const permissions = await Health.getPermissionsAsync({
        read: this.permissions.read,
        write: this.permissions.write
      });
      
      return permissions.granted;
    } catch (error) {
      console.error('Erreur vérification permissions:', error);
      return false;
    }
  }

  async readStepsData(startDate: Date, endDate: Date): Promise<number> {
    try {
      if (!await this.hasPermissions()) {
        throw new Error('Permissions HealthKit requises');
      }

      const stepsData = await Health.getHealthRecordsAsync({
        dataType: Health.HealthDataType.Steps,
        startDate,
        endDate
      });

      // Calculer le total des pas pour la période
      const totalSteps = stepsData.reduce((total, record) => {
        return total + (record.value || 0);
      }, 0);
      
      console.log('📊 Pas lus depuis HealthKit:', totalSteps);
      return totalSteps;
    } catch (error) {
      console.error('Erreur lecture pas HealthKit:', error);
      return 0;
    }
  }

  async readHeartRateData(startDate: Date, endDate: Date): Promise<number> {
    try {
      if (!await this.hasPermissions()) {
        throw new Error('Permissions HealthKit requises');
      }

      const heartRateData = await Health.getHealthRecordsAsync({
        dataType: Health.HealthDataType.HeartRate,
        startDate,
        endDate
      });

      if (heartRateData.length === 0) {
        return 0;
      }

      // Prendre la valeur la plus récente
      const latestHeartRate = heartRateData[heartRateData.length - 1];
      const heartRate = latestHeartRate.value || 0;
      
      console.log('❤️ FC lue depuis HealthKit:', heartRate);
      return heartRate;
    } catch (error) {
      console.error('Erreur lecture FC HealthKit:', error);
      return 0;
    }
  }

  async readWeightData(): Promise<number | null> {
    try {
      if (!await this.hasPermissions()) {
        throw new Error('Permissions HealthKit requises');
      }

      const now = new Date();
      const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const weightData = await Health.getHealthRecordsAsync({
        dataType: Health.HealthDataType.Weight,
        startDate: lastMonth,
        endDate: now
      });

      if (weightData.length === 0) {
        return null;
      }

      // Prendre la valeur la plus récente
      const latestWeight = weightData[weightData.length - 1];
      const weight = latestWeight.value || 0;
      
      console.log('⚖️ Poids lu depuis HealthKit:', weight);
      return weight;
    } catch (error) {
      console.error('Erreur lecture poids HealthKit:', error);
      return null;
    }
  }

  async writeWeightData(weight: number): Promise<boolean> {
    try {
      if (!await this.hasPermissions()) {
        throw new Error('Permissions HealthKit requises');
      }

      await Health.writeHealthRecordAsync({
        dataType: Health.HealthDataType.Weight,
        value: weight,
        date: new Date()
      });
      
      console.log('✍️ Poids écrit dans HealthKit:', weight);
      return true;
    } catch (error) {
      console.error('Erreur écriture poids HealthKit:', error);
      return false;
    }
  }

  async readActiveEnergyData(startDate: Date, endDate: Date): Promise<number> {
    try {
      if (!await this.hasPermissions()) {
        throw new Error('Permissions HealthKit requises');
      }

      const energyData = await Health.getHealthRecordsAsync({
        dataType: Health.HealthDataType.ActiveEnergyBurned,
        startDate,
        endDate
      });

      const totalEnergy = energyData.reduce((total, record) => {
        return total + (record.value || 0);
      }, 0);
      
      console.log('🔥 Calories actives lues depuis HealthKit:', totalEnergy);
      return totalEnergy;
    } catch (error) {
      console.error('Erreur lecture calories actives HealthKit:', error);
      return 0;
    }
  }

  async readDistanceData(startDate: Date, endDate: Date): Promise<number> {
    try {
      if (!await this.hasPermissions()) {
        throw new Error('Permissions HealthKit requises');
      }

      const distanceData = await Health.getHealthRecordsAsync({
        dataType: Health.HealthDataType.DistanceWalkingRunning,
        startDate,
        endDate
      });

      const totalDistance = distanceData.reduce((total, record) => {
        return total + (record.value || 0);
      }, 0);
      
      // Convertir de mètres en kilomètres
      const distanceInKm = totalDistance / 1000;
      
      console.log('🚶 Distance lue depuis HealthKit:', distanceInKm, 'km');
      return distanceInKm;
    } catch (error) {
      console.error('Erreur lecture distance HealthKit:', error);
      return 0;
    }
  }

  async readSleepData(startDate: Date, endDate: Date): Promise<number> {
    try {
      if (!await this.hasPermissions()) {
        throw new Error('Permissions HealthKit requises');
      }

      const sleepData = await Health.getHealthRecordsAsync({
        dataType: Health.HealthDataType.SleepAnalysis,
        startDate,
        endDate
      });

      // Calculer les heures de sommeil (en supposant que les valeurs sont en minutes)
      const totalSleepMinutes = sleepData.reduce((total, record) => {
        return total + (record.value || 0);
      }, 0);
      
      const sleepHours = totalSleepMinutes / 60;
      
      console.log('😴 Heures de sommeil lues depuis HealthKit:', sleepHours);
      return sleepHours;
    } catch (error) {
      console.error('Erreur lecture sommeil HealthKit:', error);
      return 0;
    }
  }

  async getAllHealthData(days: number = 7): Promise<HealthKitData[]> {
    try {
      if (!await this.hasPermissions()) {
        throw new Error('Permissions HealthKit requises');
      }

      const data: HealthKitData[] = [];
      const now = new Date();

      for (let i = 0; i < days; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const [steps, heartRate, weight, activeEnergy, distance, sleepHours] = await Promise.all([
          this.readStepsData(startOfDay, endOfDay),
          this.readHeartRateData(startOfDay, endOfDay),
          i === 0 ? this.readWeightData() : null, // Poids seulement pour aujourd'hui
          this.readActiveEnergyData(startOfDay, endOfDay),
          this.readDistanceData(startOfDay, endOfDay),
          this.readSleepData(startOfDay, endOfDay)
        ]);

        const dayData: HealthKitData = {
          steps,
          heartRate,
          weight: weight || undefined,
          activeEnergyBurned: activeEnergy,
          distanceWalkingRunning: distance,
          sleepHours,
          timestamp: date.getTime()
        };

        data.push(dayData);
      }

      console.log('📊 Données HealthKit réelles récupérées:', data.length, 'jours');
      return data;
    } catch (error) {
      console.error('Erreur récupération données HealthKit:', error);
      return [];
    }
  }

  async syncWithServer(userId: string, data: HealthKitData[]): Promise<boolean> {
    try {
      console.log('🔄 Synchronisation HealthKit avec serveur...');
      
      // Sauvegarder localement
      await AsyncStorage.setItem(
        `healthkit_data_${userId}`, 
        JSON.stringify(data)
      );
      
      // Synchroniser avec le serveur VPS
      const response = await fetch(`${process.env.EXPO_PUBLIC_VPS_URL}/api/health/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        console.log('✅ Données HealthKit synchronisées avec le serveur');
        return true;
      } else {
        console.log('⚠️ Échec synchronisation serveur, données sauvées localement');
        return false;
      }
    } catch (error) {
      console.error('❌ Erreur synchronisation HealthKit:', error);
      return false;
    }
  }

  isAvailableOnDevice(): boolean {
    return this.isAvailable;
  }
}

export default new HealthKitService();
