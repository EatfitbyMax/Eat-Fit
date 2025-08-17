
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import AppleHealthKit, {
  HealthInputOptions,
  HealthKitPermissions,
  HealthUnit,
} from 'react-native-health';

const { Permissions } = AppleHealthKit.Constants;

const permissions: HealthKitPermissions = {
  permissions: {
    read: [
      Permissions.Steps,
      Permissions.FlightsClimbed,
      Permissions.DistanceWalkingRunning,
      Permissions.HeartRate,
      Permissions.Weight,
      Permissions.ActiveEnergyBurned,
      Permissions.SleepAnalysis,
    ],
    write: [
      Permissions.Weight,
      Permissions.ActiveEnergyBurned,
    ],
  },
};

const useHealthData = (date: Date = new Date()) => {
  const [steps, setSteps] = useState(0);
  const [flights, setFlights] = useState(0);
  const [distance, setDistance] = useState(0);
  const [heartRate, setHeartRate] = useState(0);
  const [weight, setWeight] = useState<number | null>(null);
  const [activeEnergy, setActiveEnergy] = useState(0);
  const [sleepHours, setSleepHours] = useState(0);
  const [hasPermissions, setHasPermission] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (Platform.OS !== 'ios') {
      setIsLoading(false);
      return;
    }

    AppleHealthKit.initHealthKit(permissions, (err) => {
      if (err) {
        console.log('🚫 Erreur lors de l\'obtention des permissions HealthKit:', err);
        setIsLoading(false);
        return;
      }
      console.log('✅ Permissions HealthKit accordées');
      setHasPermission(true);
      setIsLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!hasPermissions || Platform.OS !== 'ios') {
      return;
    }

    const options: HealthInputOptions = {
      date: date.toISOString(),
    };

    // Récupérer les pas
    AppleHealthKit.getStepCount(options, (err, results) => {
      if (err) {
        console.log('❌ Erreur lors de la récupération des pas:', err);
        return;
      }
      console.log('👟 Pas récupérés:', results.value);
      setSteps(results.value);
    });

    // Récupérer les étages montés
    AppleHealthKit.getFlightsClimbed(options, (err, results) => {
      if (err) {
        console.log('❌ Erreur lors de la récupération des étages:', err);
        return;
      }
      console.log('🏢 Étages montés:', results.value);
      setFlights(results.value);
    });

    // Récupérer la distance
    AppleHealthKit.getDistanceWalkingRunning(options, (err, results) => {
      if (err) {
        console.log('❌ Erreur lors de la récupération de la distance:', err);
        return;
      }
      console.log('🚶 Distance parcourue:', results.value);
      setDistance(results.value);
    });

    // Récupérer la fréquence cardiaque
    const heartRateOptions = {
      unit: HealthUnit.bpm,
      startDate: new Date(date.getTime() - 24 * 60 * 60 * 1000).toISOString(),
      endDate: date.toISOString(),
      ascending: false,
      limit: 1,
    };

    AppleHealthKit.getHeartRateSamples(heartRateOptions, (err, results) => {
      if (err) {
        console.log('❌ Erreur lors de la récupération de la FC:', err);
        return;
      }
      if (results && results.length > 0) {
        console.log('❤️ Fréquence cardiaque:', results[0].value);
        setHeartRate(results[0].value);
      }
    });

    // Récupérer le poids
    const weightOptions = {
      unit: HealthUnit.gram,
      startDate: new Date(date.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: date.toISOString(),
      ascending: false,
      limit: 1,
    };

    AppleHealthKit.getWeightSamples(weightOptions, (err, results) => {
      if (err) {
        console.log('❌ Erreur lors de la récupération du poids:', err);
        return;
      }
      if (results && results.length > 0) {
        const weightInKg = results[0].value / 1000; // Convertir de grammes en kg
        console.log('⚖️ Poids:', weightInKg);
        setWeight(weightInKg);
      }
    });

    // Récupérer les calories actives
    AppleHealthKit.getActiveEnergyBurned(options, (err, results) => {
      if (err) {
        console.log('❌ Erreur lors de la récupération des calories:', err);
        return;
      }
      console.log('🔥 Calories actives:', results.value);
      setActiveEnergy(results.value);
    });

  }, [hasPermissions, date]);

  const writeWeight = (weightInKg: number): Promise<boolean> => {
    return new Promise((resolve) => {
      if (Platform.OS !== 'ios' || !hasPermissions) {
        resolve(false);
        return;
      }

      const options = {
        value: weightInKg * 1000, // Convertir en grammes
        date: new Date().toISOString(),
      };

      AppleHealthKit.saveWeight(options, (err, results) => {
        if (err) {
          console.log('❌ Erreur lors de l\'écriture du poids:', err);
          resolve(false);
          return;
        }
        console.log('✅ Poids écrit dans HealthKit:', weightInKg);
        setWeight(weightInKg);
        resolve(true);
      });
    });
  };

  return {
    steps,
    flights,
    distance,
    heartRate,
    weight,
    activeEnergy,
    sleepHours,
    hasPermissions,
    isLoading,
    writeWeight,
  };
};

export default useHealthData;
