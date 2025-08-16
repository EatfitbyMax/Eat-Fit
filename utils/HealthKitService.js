
import AppleHealthKit from 'react-native-apple-healthkit';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const permissions = {
  permissions: {
    read: [
      'StepCount',
      'HeartRate',
      'Weight',
      'Height',
      'BodyMassIndex',
      'ActiveEnergyBurned',
      'DistanceWalkingRunning',
      'SleepAnalysis'
    ],
    write: [
      'Weight',
      'ActiveEnergyBurned'
    ]
  }
};

export const initHealthKit = () => {
  return new Promise((resolve, reject) => {
    if (Platform.OS !== 'ios') {
      reject(new Error('HealthKit is only available on iOS'));
      return;
    }

    AppleHealthKit.initHealthKit(permissions, (err, results) => {
      if (err) {
        console.error('HealthKit initialization error:', err);
        reject(err);
      } else {
        console.log('✅ HealthKit initialized successfully');
        resolve(results);
      }
    });
  });
};

export const isHealthKitAvailable = () => {
  return Platform.OS === 'ios' && AppleHealthKit.isAvailable();
};

export const getSteps = (date = new Date()) => {
  return new Promise((resolve, reject) => {
    const options = {
      date: date.toISOString(),
      includeManuallyAdded: false
    };

    AppleHealthKit.getStepCount(options, (err, results) => {
      if (err) {
        console.error('Error getting steps:', err);
        reject(err);
      } else {
        resolve(results.value || 0);
      }
    });
  });
};

export const getHeartRate = () => {
  return new Promise((resolve, reject) => {
    const options = {
      unit: 'bpm',
      startDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date().toISOString(),
      limit: 1
    };

    AppleHealthKit.getHeartRateSamples(options, (err, results) => {
      if (err) {
        console.error('Error getting heart rate:', err);
        reject(err);
      } else {
        const latestRate = results.length > 0 ? results[0].value : 0;
        resolve(latestRate);
      }
    });
  });
};

export const getWeight = () => {
  return new Promise((resolve, reject) => {
    const options = {
      unit: 'kg',
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date().toISOString(),
      limit: 1
    };

    AppleHealthKit.getWeightSamples(options, (err, results) => {
      if (err) {
        console.error('Error getting weight:', err);
        reject(err);
      } else {
        const latestWeight = results.length > 0 ? results[0].value : null;
        resolve(latestWeight);
      }
    });
  });
};

export const saveWeight = (weight) => {
  return new Promise((resolve, reject) => {
    const options = {
      value: weight,
      unit: 'kg',
      date: new Date().toISOString()
    };

    AppleHealthKit.saveWeight(options, (err, results) => {
      if (err) {
        console.error('Error saving weight:', err);
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
};

export const getActiveEnergy = (date = new Date()) => {
  return new Promise((resolve, reject) => {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const options = {
      startDate: startOfDay.toISOString(),
      endDate: endOfDay.toISOString(),
      unit: 'calorie'
    };

    AppleHealthKit.getActiveEnergyBurned(options, (err, results) => {
      if (err) {
        console.error('Error getting active energy:', err);
        reject(err);
      } else {
        resolve(results.value || 0);
      }
    });
  });
};

export const getDistance = (date = new Date()) => {
  return new Promise((resolve, reject) => {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const options = {
      unit: 'meter',
      startDate: startOfDay.toISOString(),
      endDate: endOfDay.toISOString()
    };

    AppleHealthKit.getDistanceWalkingRunning(options, (err, results) => {
      if (err) {
        console.error('Error getting distance:', err);
        reject(err);
      } else {
        // Convertir en kilomètres
        const distanceInKm = (results.value || 0) / 1000;
        resolve(distanceInKm);
      }
    });
  });
};

export const getSleepData = (date = new Date()) => {
  return new Promise((resolve, reject) => {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const options = {
      startDate: startOfDay.toISOString(),
      endDate: endOfDay.toISOString()
    };

    AppleHealthKit.getSleepSamples(options, (err, results) => {
      if (err) {
        console.error('Error getting sleep data:', err);
        reject(err);
      } else {
        // Calculer le total d'heures de sommeil
        let totalSleepHours = 0;
        results.forEach(sample => {
          if (sample.value === 'INBED' || sample.value === 'ASLEEP') {
            const duration = new Date(sample.endDate) - new Date(sample.startDate);
            totalSleepHours += duration / (1000 * 60 * 60); // Convertir en heures
          }
        });
        resolve(totalSleepHours);
      }
    });
  });
};

export const getAllHealthData = async (days = 7) => {
  try {
    const data = [];
    const now = new Date();

    for (let i = 0; i < days; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);

      const [steps, heartRate, weight, activeEnergy, distance, sleepHours] = await Promise.all([
        getSteps(date).catch(() => 0),
        i === 0 ? getHeartRate().catch(() => 0) : 0, // FC seulement pour aujourd'hui
        i === 0 ? getWeight().catch(() => null) : null, // Poids seulement pour aujourd'hui
        getActiveEnergy(date).catch(() => 0),
        getDistance(date).catch(() => 0),
        getSleepData(date).catch(() => 0)
      ]);

      const dayData = {
        steps,
        heartRate,
        weight,
        activeEnergyBurned: activeEnergy,
        distanceWalkingRunning: distance,
        sleepHours,
        timestamp: date.getTime()
      };

      data.push(dayData);
    }

    console.log('📊 Données HealthKit récupérées:', data.length, 'jours');
    return data;
  } catch (error) {
    console.error('Erreur récupération données HealthKit:', error);
    return [];
  }
};

export const syncWithServer = async (userId, data) => {
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
};
