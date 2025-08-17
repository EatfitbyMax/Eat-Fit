
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
  const [hasPermissions, setHasPermissions] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (Platform.OS !== 'ios') {
      setIsLoading(false);
      return;
    }

    const initHealthKit = async () => {
      try {
        // Vérifier si HealthKit est disponible sur l'appareil
        const isAvailable = await new Promise((resolve) => {
          AppleHealthKit.isAvailable((error, available) => {
            if (error) {
              console.log('❌ HealthKit non disponible:', error);
              resolve(false);
              return;
            }
            resolve(available);
          });
        });

        if (!isAvailable) {
          console.log('❌ HealthKit n\'est pas disponible sur cet appareil');
          setHasPermissions(false);
          setIsLoading(false);
          return;
        }

        console.log('✅ HealthKit est disponible, demande des permissions...');
        
        // Initialiser HealthKit avec les permissions
        AppleHealthKit.initHealthKit(permissions, (err) => {
          if (err) {
            console.log('🚫 Erreur lors de l\'obtention des permissions HealthKit:', err);
            setHasPermissions(false);
            setIsLoading(false);
            return;
          }
          console.log('✅ Permissions HealthKit accordées');
          setHasPermissions(true);
          setIsLoading(false);
        });
      } catch (error) {
        console.log('🚫 Erreur d\'initialisation HealthKit:', error);
        setHasPermissions(false);
        setIsLoading(false);
      }
    };

    // Délai pour laisser l'app se charger complètement
    const timer = setTimeout(initHealthKit, 500);
    return () => clearTimeout(timer);
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

    // Récupérer le sommeil
    const sleepOptions = {
      startDate: new Date(date.getTime() - 24 * 60 * 60 * 1000).toISOString(),
      endDate: date.toISOString(),
    };

    AppleHealthKit.getSleepSamples(sleepOptions, (err, results) => {
      if (err) {
        console.log('❌ Erreur lors de la récupération du sommeil:', err);
        return;
      }
      if (results && results.length > 0) {
        let totalSleepHours = 0;
        results.forEach(sample => {
          if (sample.value === AppleHealthKit.Constants.SleepValue.ASLEEP) {
            const duration = new Date(sample.endDate).getTime() - new Date(sample.startDate).getTime();
            totalSleepHours += duration / (1000 * 60 * 60); // Convertir en heures
          }
        });
        console.log('😴 Heures de sommeil:', totalSleepHours);
        setSleepHours(totalSleepHours);
      }
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
