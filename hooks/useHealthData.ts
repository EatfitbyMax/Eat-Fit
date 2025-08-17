
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

  // Fonction pour vérifier si HealthKit est disponible
  const checkHealthKitAvailability = useCallback((): Promise<boolean> => {
    return new Promise((resolve) => {
      if (Platform.OS !== 'ios') {
        console.log('📱 Plateforme non-iOS détectée');
        resolve(false);
        return;
      }

      if (!AppleHealthKit) {
        console.log('❌ AppleHealthKit non importé');
        setError('Module HealthKit non trouvé. Assurez-vous que react-native-health est installé.');
        resolve(false);
        return;
      }

      // Vérification critique - cette méthode doit retourner true sur un vrai appareil iOS avec HealthKit activé
      try {
        AppleHealthKit.isAvailable((error: any, available: boolean) => {
          console.log('🔍 Vérification HealthKit disponibilité...');
          console.log('  - Erreur:', error);
          console.log('  - Disponible:', available);
          
          if (error) {
            console.log('❌ HealthKit erreur de disponibilité:', error);
            // Erreurs communes et leurs solutions
            if (error.message?.includes('not available')) {
              setError('HealthKit non disponible: App non signée correctement ou simulateur utilisé');
            } else if (error.message?.includes('entitlements')) {
              setError('HealthKit non disponible: Entitlements manquants dans le provisioning profile');
            } else {
              setError(`HealthKit non disponible: ${error.message || 'Erreur inconnue'}`);
            }
            resolve(false);
            return;
          }
          
          if (!available) {
            console.log('❌ HealthKit rapporte non disponible');
            setError('HealthKit non disponible sur cet appareil. Vérifiez que l\'app est signée avec le bon provisioning profile incluant HealthKit.');
            resolve(false);
            return;
          }
          
          console.log('✅ HealthKit disponible');
          resolve(true);
        });
      } catch (err) {
        console.log('❌ Exception lors de la vérification HealthKit:', err);
        setError(`Exception HealthKit: ${err}. Vérifiez la configuration du projet.`);
        resolve(false);
      }
    });
  }, []);

  // Fonction pour initialiser HealthKit avec permissions
  const initializeHealthKit = useCallback((): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!AppleHealthKit || !Permissions) {
        console.log('❌ AppleHealthKit ou Permissions non disponibles');
        setError('Configuration HealthKit invalide');
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

      console.log('🚀 Initialisation HealthKit avec permissions...');
      console.log('📋 Permissions demandées:', permissions);
      
      try {
        AppleHealthKit.initHealthKit(permissions, (err: any, results: any) => {
          console.log('📞 Callback initHealthKit reçu');
          console.log('  - Erreur:', err);
          console.log('  - Résultats:', results);
          
          if (err) {
            console.log('❌ Erreur initHealthKit:', err);
            
            // Messages d'erreur spécifiques
            if (err.message?.includes('User denied access')) {
              setError('Accès refusé par l\'utilisateur. Allez dans Réglages > Confidentialité > Santé > EatFit pour activer les permissions.');
            } else if (err.message?.includes('not available')) {
              setError('HealthKit non configuré correctement. Vérifiez les entitlements et le provisioning profile.');
            } else {
              setError(`Erreur HealthKit: ${err.message || 'Inconnue'}`);
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
        setError(`Exception HealthKit: ${error}. Vérifiez la configuration du build.`);
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

        // Étape 1: Vérifier la plateforme
        if (Platform.OS !== 'ios') {
          console.log('📱 Plateforme non-iOS, arrêt de l\'initialisation');
          if (isMounted) {
            setIsLoading(false);
            setHasPermissions(false);
          }
          return;
        }

        // Étape 2: Vérifier la disponibilité
        console.log('🔍 Vérification disponibilité HealthKit...');
        const isAvailable = await checkHealthKitAvailability();
        
        if (!isAvailable) {
          console.log('❌ HealthKit non disponible');
          if (isMounted) {
            setIsLoading(false);
            setHasPermissions(false);
          }
          return;
        }

        // Étape 3: Initialiser avec permissions
        console.log('🔑 Demande de permissions HealthKit...');
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
  }, [checkHealthKitAvailability, initializeHealthKit]);

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
          }
        });

        // Récupérer les étages montés
        AppleHealthKit.getFlightsClimbed(options, (err: any, results: any) => {
          if (!err && results?.value) {
            console.log('🏢 Étages montés:', results.value);
            setFlights(results.value);
          }
        });

        // Récupérer la distance
        AppleHealthKit.getDistanceWalkingRunning(options, (err: any, results: any) => {
          if (!err && results?.value) {
            console.log('🚶 Distance parcourue:', results.value);
            setDistance(results.value);
          }
        });

        // Récupérer les calories actives
        AppleHealthKit.getActiveEnergyBurned(options, (err: any, results: any) => {
          if (!err && results?.value) {
            console.log('🔥 Calories actives:', results.value);
            setActiveEnergy(results.value);
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
