
import { useEffect, useState, useCallback } from 'react';
import { Platform } from 'react-native';

// Import conditionnel pour éviter les crashes sur Android/Web
let AppleHealthKit: any = null;
let Permissions: any = null;

try {
  if (Platform.OS === 'ios') {
    const HealthKit = require('react-native-health');
    AppleHealthKit = HealthKit.default || HealthKit;
    Permissions = AppleHealthKit?.Constants?.Permissions;
  }
} catch (error) {
  console.log('⚠️ react-native-health non disponible:', error);
}

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
  const [error, setError] = useState<string | null>(null);

  // Fonction pour initialiser HealthKit directement
  const initializeHealthKit = useCallback((): Promise<boolean> => {
    return new Promise((resolve) => {
      if (Platform.OS !== 'ios') {
        console.log('📱 Plateforme non-iOS détectée');
        setError('Apple Health n\'est disponible que sur iOS');
        resolve(false);
        return;
      }

      if (!AppleHealthKit || !Permissions) {
        console.log('❌ AppleHealthKit ou Permissions non disponibles');
        setError('Module HealthKit non trouvé. L\'app doit être installée via TestFlight ou App Store.');
        resolve(false);
        return;
      }

      const permissions = {
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

      console.log('🚀 Initialisation HealthKit...');
      console.log('📋 Permissions demandées:', permissions);
      
      try {
        AppleHealthKit.initHealthKit(permissions, (err: any, results: any) => {
          console.log('📞 Callback initHealthKit reçu');
          console.log('  - Erreur:', err);
          console.log('  - Résultats:', results);
          
          if (err) {
            console.log('❌ Erreur initHealthKit:', err);
            
            // Messages d'erreur spécifiques selon le code d'erreur
            const errorMessage = err.message || err.toString();
            
            if (errorMessage.includes('not available') || errorMessage.includes('HealthKit is not available')) {
              setError('HealthKit non disponible sur cet appareil. L\'app doit être installée via TestFlight ou App Store avec un provisioning profile incluant HealthKit.');
            } else if (errorMessage.includes('User denied access') || errorMessage.includes('authorization denied')) {
              setError('Accès refusé par l\'utilisateur. Allez dans Réglages > Confidentialité et sécurité > Santé > EatFit pour activer les permissions.');
            } else if (errorMessage.includes('entitlements') || errorMessage.includes('not entitled')) {
              setError('HealthKit non configuré correctement. Vérifiez les entitlements et le provisioning profile.');
            } else {
              setError(`Erreur HealthKit: ${errorMessage}`);
            }
            resolve(false);
            return;
          }
          
          console.log('✅ HealthKit initialisé avec succès');
          setError(null);
          resolve(true);
        });
      } catch (error) {
        console.log('❌ Exception lors de l\'initialisation:', error);
        setError(`Exception lors de l'initialisation HealthKit: ${error}. Vérifiez que l'app est correctement signée et installée via TestFlight.`);
        resolve(false);
      }
    });
  }, []);

  // Effet principal d'initialisation
  useEffect(() => {
    let isMounted = true;

    const initHealthData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        console.log('🔄 Début initialisation HealthKit...');

        // Vérifier la plateforme
        if (Platform.OS !== 'ios') {
          console.log('📱 Plateforme non-iOS, arrêt de l\'initialisation');
          if (isMounted) {
            setError('Apple Health n\'est disponible que sur iOS');
            setIsLoading(false);
            setHasPermissions(false);
          }
          return;
        }

        // Vérifier que les modules sont disponibles
        if (!AppleHealthKit || !Permissions) {
          console.log('❌ Modules HealthKit non disponibles');
          if (isMounted) {
            setError('Module HealthKit non trouvé. Assurez-vous que l\'app est installée via TestFlight ou App Store.');
            setIsLoading(false);
            setHasPermissions(false);
          }
          return;
        }

        // Initialiser directement HealthKit
        console.log('🔑 Initialisation HealthKit...');
        const hasPerms = await initializeHealthKit();
        
        if (isMounted) {
          setHasPermissions(hasPerms);
          setIsLoading(false);
          
          if (hasPerms) {
            console.log('✅ HealthKit entièrement configuré');
          }
        }

      } catch (error) {
        console.log('❌ Erreur générale d\'initialisation:', error);
        if (isMounted) {
          setError(`Erreur d'initialisation: ${error}`);
          setIsLoading(false);
          setHasPermissions(false);
        }
      }
    };

    // Délai pour permettre au composant de se monter complètement
    const timer = setTimeout(initHealthData, 100);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [initializeHealthKit]);

  // Effet pour récupérer les données quand les permissions sont accordées
  useEffect(() => {
    if (!hasPermissions || Platform.OS !== 'ios' || !AppleHealthKit) {
      return;
    }

    const fetchHealthData = async () => {
      try {
        console.log('📊 Récupération des données HealthKit...');
        
        const options = {
          date: date.toISOString(),
        };

        // Récupérer les pas
        AppleHealthKit.getStepCount(options, (err: any, results: any) => {
          if (!err && results?.value) {
            console.log('👟 Pas récupérés:', results.value);
            setSteps(results.value);
          } else if (err) {
            console.log('⚠️ Erreur récupération pas:', err);
          }
        });

        // Récupérer les étages montés
        AppleHealthKit.getFlightsClimbed(options, (err: any, results: any) => {
          if (!err && results?.value) {
            console.log('🏢 Étages montés:', results.value);
            setFlights(results.value);
          } else if (err) {
            console.log('⚠️ Erreur récupération étages:', err);
          }
        });

        // Récupérer la distance
        AppleHealthKit.getDistanceWalkingRunning(options, (err: any, results: any) => {
          if (!err && results?.value) {
            console.log('🚶 Distance parcourue:', results.value);
            setDistance(results.value);
          } else if (err) {
            console.log('⚠️ Erreur récupération distance:', err);
          }
        });

        // Récupérer les calories actives
        AppleHealthKit.getActiveEnergyBurned(options, (err: any, results: any) => {
          if (!err && results?.value) {
            console.log('🔥 Calories actives:', results.value);
            setActiveEnergy(results.value);
          } else if (err) {
            console.log('⚠️ Erreur récupération calories:', err);
          }
        });

        // Récupérer la fréquence cardiaque (dernière valeur)
        const heartRateOptions = {
          unit: 'bpm',
          startDate: new Date(date.getTime() - 24 * 60 * 60 * 1000).toISOString(),
          endDate: date.toISOString(),
          ascending: false,
          limit: 1,
        };

        AppleHealthKit.getHeartRateSamples(heartRateOptions, (err: any, results: any) => {
          if (!err && results && results.length > 0) {
            console.log('❤️ Fréquence cardiaque:', results[0].value);
            setHeartRate(results[0].value);
          } else if (err) {
            console.log('⚠️ Erreur récupération fréquence cardiaque:', err);
          }
        });

        // Récupérer le poids (dernière valeur)
        const weightOptions = {
          unit: 'gram',
          startDate: new Date(date.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: date.toISOString(),
          ascending: false,
          limit: 1,
        };

        AppleHealthKit.getWeightSamples(weightOptions, (err: any, results: any) => {
          if (!err && results && results.length > 0) {
            const weightInKg = results[0].value / 1000;
            console.log('⚖️ Poids:', weightInKg);
            setWeight(weightInKg);
          } else if (err) {
            console.log('⚠️ Erreur récupération poids:', err);
          }
        });

      } catch (error) {
        console.log('❌ Erreur lors de la récupération des données:', error);
      }
    };

    fetchHealthData();
  }, [hasPermissions, date]);

  const writeWeight = useCallback((weightInKg: number): Promise<boolean> => {
    return new Promise((resolve) => {
      if (Platform.OS !== 'ios' || !hasPermissions || !AppleHealthKit) {
        resolve(false);
        return;
      }

      const options = {
        value: weightInKg * 1000, // Convertir en grammes
        date: new Date().toISOString(),
      };

      AppleHealthKit.saveWeight(options, (err: any, results: any) => {
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
  }, [hasPermissions]);

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
    error,
    writeWeight,
  };
};

export default useHealthData;
