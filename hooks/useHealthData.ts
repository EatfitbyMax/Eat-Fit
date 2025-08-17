
import { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import HealthKit, { 
  HealthKitPermissions, 
  HealthInputOptions,
  HealthValue,
  HealthUnit
} from 'react-native-health';

interface HealthData {
  steps: number;
  flights: number;
  distance: number;
  heartRate: number;
  weight: number | null;
  activeEnergy: number;
  sleepHours: number;
  hasPermissions: boolean;
  isLoading: boolean;
  error: string | null;
  writeWeight: (weight: number) => Promise<boolean>;
}

const permissions: HealthKitPermissions = {
  permissions: {
    read: [
      'Steps',
      'FlightsClimbed',
      'DistanceWalkingRunning',
      'HeartRate',
      'BodyMass',
      'ActiveEnergyBurned',
      'SleepAnalysis',
    ],
    write: [
      'BodyMass',
      'ActiveEnergyBurned',
    ],
  },
};

const useHealthData = (date: Date = new Date()): HealthData => {
  const [healthData, setHealthData] = useState<HealthData>({
    steps: 0,
    flights: 0,
    distance: 0,
    heartRate: 0,
    weight: null,
    activeEnergy: 0,
    sleepHours: 0,
    hasPermissions: false,
    isLoading: true,
    error: null,
    writeWeight: async () => false,
  });

  useEffect(() => {
    if (Platform.OS !== 'ios') {
      setHealthData(prev => ({
        ...prev,
        isLoading: false,
        error: 'HealthKit disponible uniquement sur iOS',
      }));
      return;
    }

    initializeHealthKit();
  }, []);

  useEffect(() => {
    if (healthData.hasPermissions && Platform.OS === 'ios') {
      fetchHealthData();
    }
  }, [date, healthData.hasPermissions]);

  const initializeHealthKit = async () => {
    try {
      const isAvailable = await HealthKit.isAvailable();
      if (!isAvailable) {
        setHealthData(prev => ({
          ...prev,
          isLoading: false,
          error: 'HealthKit non disponible sur cet appareil',
        }));
        return;
      }

      HealthKit.initHealthKit(permissions, (error: string) => {
        if (error) {
          setHealthData(prev => ({
            ...prev,
            isLoading: false,
            error: `Erreur d'initialisation HealthKit: ${error}`,
          }));
        } else {
          setHealthData(prev => ({
            ...prev,
            hasPermissions: true,
            isLoading: false,
            error: null,
          }));
        }
      });
    } catch (error) {
      setHealthData(prev => ({
        ...prev,
        isLoading: false,
        error: `Erreur: ${error}`,
      }));
    }
  };

  const fetchHealthData = async () => {
    try {
      setHealthData(prev => ({ ...prev, isLoading: true }));

      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const options: HealthInputOptions = {
        startDate: startOfDay.toISOString(),
        endDate: endOfDay.toISOString(),
      };

      // Récupération des données en parallèle
      const [
        stepsData,
        flightsData,
        distanceData,
        heartRateData,
        weightData,
        activeEnergyData,
        sleepData,
      ] = await Promise.allSettled([
        getHealthData('Steps', options),
        getHealthData('FlightsClimbed', options),
        getHealthData('DistanceWalkingRunning', options),
        getHealthData('HeartRate', options),
        getHealthData('BodyMass', { ...options, limit: 1 }),
        getHealthData('ActiveEnergyBurned', options),
        getHealthData('SleepAnalysis', options),
      ]);

      setHealthData(prev => ({
        ...prev,
        steps: stepsData.status === 'fulfilled' ? aggregateValue(stepsData.value) : 0,
        flights: flightsData.status === 'fulfilled' ? aggregateValue(flightsData.value) : 0,
        distance: distanceData.status === 'fulfilled' ? aggregateValue(distanceData.value) : 0,
        heartRate: heartRateData.status === 'fulfilled' ? getLatestValue(heartRateData.value) : 0,
        weight: weightData.status === 'fulfilled' ? getLatestValue(weightData.value) : null,
        activeEnergy: activeEnergyData.status === 'fulfilled' ? aggregateValue(activeEnergyData.value) : 0,
        sleepHours: sleepData.status === 'fulfilled' ? calculateSleepHours(sleepData.value) : 0,
        isLoading: false,
      }));
    } catch (error) {
      setHealthData(prev => ({
        ...prev,
        isLoading: false,
        error: `Erreur lors de la récupération des données: ${error}`,
      }));
    }
  };

  const getHealthData = (type: string, options: HealthInputOptions): Promise<HealthValue[]> => {
    return new Promise((resolve, reject) => {
      HealthKit.getSamples(
        type as any,
        options,
        (error: string, results: HealthValue[]) => {
          if (error) {
            reject(error);
          } else {
            resolve(results || []);
          }
        }
      );
    });
  };

  const aggregateValue = (data: HealthValue[]): number => {
    return data.reduce((sum, item) => sum + (item.value || 0), 0);
  };

  const getLatestValue = (data: HealthValue[]): number | null => {
    if (!data || data.length === 0) return null;
    const sorted = data.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
    return sorted[0]?.value || null;
  };

  const calculateSleepHours = (data: HealthValue[]): number => {
    if (!data || data.length === 0) return 0;
    
    const totalMinutes = data.reduce((sum, item) => {
      const start = new Date(item.startDate).getTime();
      const end = new Date(item.endDate).getTime();
      return sum + (end - start) / (1000 * 60);
    }, 0);
    
    return Math.round((totalMinutes / 60) * 10) / 10;
  };

  const writeWeight = async (weight: number): Promise<boolean> => {
    if (!healthData.hasPermissions || Platform.OS !== 'ios') {
      return false;
    }

    return new Promise((resolve) => {
      const weightData = {
        value: weight,
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString(),
        unit: HealthUnit.Kilogram,
      };

      HealthKit.saveSample(
        'BodyMass' as any,
        weightData,
        (error: string, result: any) => {
          resolve(!error);
        }
      );
    });
  };

  return {
    ...healthData,
    writeWeight,
  };
};

export default useHealthData;
