
import { Platform, NativeModules } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Interface pour le module HealthKit natif
interface HealthKitModule {
  isAvailable(): Promise<boolean>;
  requestPermissions(options: HealthKitPermissions): Promise<{ granted: boolean }>;
  getPermissions(options: HealthKitPermissions): Promise<{ granted: boolean }>;
  readSteps(startDate: string, endDate: string): Promise<number>;
  readHeartRate(startDate: string, endDate: string): Promise<number>;
  readWeight(startDate: string, endDate: string): Promise<number | null>;
  readActiveCalories(startDate: string, endDate: string): Promise<number>;
  readDistance(startDate: string, endDate: string): Promise<number>;
  readSleepAnalysis(startDate: string, endDate: string): Promise<number>;
  writeWeight(weight: number): Promise<boolean>;
}

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
  read: string[];
  write: string[];
}

class HealthKitService {
  private isAvailable = false;
  private healthKit: HealthKitModule | null = null;
  private permissions: HealthKitPermissions = {
    read: [
      'HKQuantityTypeIdentifierStepCount',
      'HKQuantityTypeIdentifierHeartRate',
      'HKQuantityTypeIdentifierBodyMass',
      'HKQuantityTypeIdentifierHeight',
      'HKQuantityTypeIdentifierBodyMassIndex',
      'HKQuantityTypeIdentifierActiveEnergyBurned',
      'HKQuantityTypeIdentifierDistanceWalkingRunning',
      'HKCategoryTypeIdentifierSleepAnalysis',
      'HKQuantityTypeIdentifierRestingHeartRate',
      'HKQuantityTypeIdentifierBloodPressureSystolic',
      'HKQuantityTypeIdentifierBloodPressureDiastolic'
    ],
    write: [
      'HKQuantityTypeIdentifierBodyMass',
      'HKQuantityTypeIdentifierActiveEnergyBurned'
    ]
  };

  constructor() {
    if (Platform.OS === 'ios') {
      this.healthKit = NativeModules.HealthKitManager;
    }
  }

  async initialize(): Promise<boolean> {
    console.log('🍎 Initialisation HealthKit...');
    
    if (Platform.OS !== 'ios') {
      console.log('⚠️ HealthKit uniquement disponible sur iOS');
      return false;
    }

    if (!this.healthKit) {
      console.log('❌ Module HealthKit natif non disponible - Vérifiez que le module est correctement lié');
      console.log('Modules disponibles:', Object.keys(NativeModules));
      return false;
    }

    try {
      console.log('🔍 Vérification de la disponibilité de HealthKit...');
      const isHealthKitAvailable = await this.healthKit.isAvailable();
      
      console.log('📱 HealthKit disponible:', isHealthKitAvailable);
      
      if (!isHealthKitAvailable) {
        console.log('❌ HealthKit non disponible - Vérifiez les entitlements et capabilities');
        return false;
      }

      this.isAvailable = true;
      console.log('✅ HealthKit initialisé avec succès');
      return true;
    } catch (error) {
      console.error('❌ Erreur initialisation HealthKit:', error);
      console.error('Type d\'erreur:', typeof error);
      console.error('Message:', error?.message || 'Erreur inconnue');
      return false;
    }
  }

  async requestPermissions(): Promise<boolean> {
    console.log('🔐 Demande des permissions HealthKit...');
    
    if (!this.isAvailable) {
      await this.initialize();
    }

    if (!this.isAvailable || !this.healthKit) {
      return false;
    }

    try {
      const readPermissions = await this.healthKit.requestPermissions(this.permissions);
      
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
      if (!this.isAvailable || !this.healthKit) {
        return false;
      }
      
      const permissions = await this.healthKit.getPermissions(this.permissions);
      return permissions.granted;
    } catch (error) {
      console.error('Erreur vérification permissions:', error);
      return false;
    }
  }

  async readStepsData(startDate: Date, endDate: Date): Promise<number> {
    try {
      if (!await this.hasPermissions() || !this.healthKit) {
        throw new Error('Permissions HealthKit requises');
      }

      const totalSteps = await this.healthKit.readSteps(
        startDate.toISOString(),
        endDate.toISOString()
      );
      
      console.log('📊 Pas lus depuis HealthKit:', totalSteps);
      return totalSteps || 0;
    } catch (error) {
      console.error('Erreur lecture pas HealthKit:', error);
      return 0;
    }
  }

  async readHeartRateData(startDate: Date, endDate: Date): Promise<number> {
    try {
      if (!await this.hasPermissions() || !this.healthKit) {
        throw new Error('Permissions HealthKit requises');
      }

      const heartRate = await this.healthKit.readHeartRate(
        startDate.toISOString(),
        endDate.toISOString()
      );
      
      console.log('❤️ FC lue depuis HealthKit:', heartRate);
      return heartRate || 0;
    } catch (error) {
      console.error('Erreur lecture FC HealthKit:', error);
      return 0;
    }
  }

  async readWeightData(): Promise<number | null> {
    try {
      if (!await this.hasPermissions() || !this.healthKit) {
        throw new Error('Permissions HealthKit requises');
      }

      const now = new Date();
      const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const weight = await this.healthKit.readWeight(
        lastMonth.toISOString(),
        now.toISOString()
      );
      
      console.log('⚖️ Poids lu depuis HealthKit:', weight);
      return weight;
    } catch (error) {
      console.error('Erreur lecture poids HealthKit:', error);
      return null;
    }
  }

  async writeWeightData(weight: number): Promise<boolean> {
    try {
      if (!await this.hasPermissions() || !this.healthKit) {
        throw new Error('Permissions HealthKit requises');
      }

      const success = await this.healthKit.writeWeight(weight);
      
      console.log('✍️ Poids écrit dans HealthKit:', weight);
      return success;
    } catch (error) {
      console.error('Erreur écriture poids HealthKit:', error);
      return false;
    }
  }

  async readActiveEnergyData(startDate: Date, endDate: Date): Promise<number> {
    try {
      if (!await this.hasPermissions() || !this.healthKit) {
        throw new Error('Permissions HealthKit requises');
      }

      const totalEnergy = await this.healthKit.readActiveCalories(
        startDate.toISOString(),
        endDate.toISOString()
      );
      
      console.log('🔥 Calories actives lues depuis HealthKit:', totalEnergy);
      return totalEnergy || 0;
    } catch (error) {
      console.error('Erreur lecture calories actives HealthKit:', error);
      return 0;
    }
  }

  async readDistanceData(startDate: Date, endDate: Date): Promise<number> {
    try {
      if (!await this.hasPermissions() || !this.healthKit) {
        throw new Error('Permissions HealthKit requises');
      }

      const totalDistance = await this.healthKit.readDistance(
        startDate.toISOString(),
        endDate.toISOString()
      );
      
      // Convertir de mètres en kilomètres
      const distanceInKm = (totalDistance || 0) / 1000;
      
      console.log('🚶 Distance lue depuis HealthKit:', distanceInKm, 'km');
      return distanceInKm;
    } catch (error) {
      console.error('Erreur lecture distance HealthKit:', error);
      return 0;
    }
  }

  async readSleepData(startDate: Date, endDate: Date): Promise<number> {
    try {
      if (!await this.hasPermissions() || !this.healthKit) {
        throw new Error('Permissions HealthKit requises');
      }

      const sleepHours = await this.healthKit.readSleepAnalysis(
        startDate.toISOString(),
        endDate.toISOString()
      );
      
      console.log('😴 Heures de sommeil lues depuis HealthKit:', sleepHours);
      return sleepHours || 0;
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
