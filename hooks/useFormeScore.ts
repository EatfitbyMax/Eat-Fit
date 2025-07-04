
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PersistentStorage } from '@/utils/storage';
import { IntegrationsManager } from '@/utils/integrations';
import { checkSubscriptionStatus } from '@/utils/subscription';

interface FormeData {
  sleep: {
    hours: number;
    quality: 'Excellent' | 'Bien' | 'Moyen' | 'Mauvais';
    bedTime: string;
    wakeTime: string;
  };
  stress: {
    level: number;
    factors: string[];
    notes: string;
  };
  heartRate: {
    resting: number;
    variability: number;
  };
  rpe: {
    value: number;
    workoutId?: string;
    notes: string;
  };
  cycle?: {
    phase: 'Menstruel' | 'Folliculaire' | 'Ovulation' | 'Lutéal';
    dayOfCycle: number;
    symptoms: string[];
    notes: string;
  };
  date: string;
}

export const useFormeScore = (userData: any) => {
  const [formeScore, setFormeScore] = useState(75);
  const [formeData, setFormeData] = useState<FormeData>({
    sleep: { hours: 0, quality: 'Moyen', bedTime: '', wakeTime: '' },
    stress: { level: 5, factors: [], notes: '' },
    heartRate: { resting: 0, variability: 0 },
    rpe: { value: 5, notes: '' },
    date: new Date().toISOString().split('T')[0]
  });
  const [isPremium, setIsPremium] = useState(false);
  const [currentSubscription, setCurrentSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Fonction pour récupérer les données RPE du jour
  const getTodayActivityRPE = async (userId: string) => {
    try {
      const storedRatings = await AsyncStorage.getItem(`activity_ratings_${userId}`);

      if (!storedRatings) {
        return null;
      }

      const ratings = JSON.parse(storedRatings);
      const today = new Date();
      const todayString = today.getFullYear() + '-' + 
        String(today.getMonth() + 1).padStart(2, '0') + '-' + 
        String(today.getDate()).padStart(2, '0');

      const todayRatings = Object.entries(ratings)
        .map(([activityId, rating]: [string, any]) => ({
          activityId,
          ...rating
        }))
        .filter((rating: any) => {
          const ratingDate = rating.date.includes('T') ? rating.date.split('T')[0] : rating.date;
          return ratingDate === todayString;
        });

      if (todayRatings.length > 0) {
        const avgRPE = Math.round(todayRatings.reduce((sum: number, r: any) => sum + r.rpe, 0) / todayRatings.length);
        const allNotes = todayRatings
          .map((r: any) => r.notes)
          .filter((note: string) => note && note.trim() !== '')
          .join(' • ');

        return {
          rpe: avgRPE,
          notes: allNotes || `${todayRatings.length} séance${todayRatings.length > 1 ? 's' : ''} terminée${todayRatings.length > 1 ? 's' : ''} aujourd'hui`,
          activityCount: todayRatings.length
        };
      }

      return null;
    } catch (error) {
      console.error('Erreur récupération RPE du jour (hook):', error);
      return null;
    }
  };

  // Fonction principale de calcul du score
  const calculateFormeScore = (data: FormeData, userInfo: any, premium: boolean, subscription: any) => {
    let totalScore = 0;
    let totalWeight = 0;

    const isWoman = userInfo?.gender === 'Femme';

    // Définir les poids de base
    let baseWeights = {
      sleep: 0.35,
      stress: 0.30,
      heartRate: 0.0,
      rpe: 0.0,
      cycle: isWoman ? 0.05 : 0,
      macros: 0.0,
      micros: 0.0
    };

    let weights = { ...baseWeights };

    if (premium) {
      const userPlanId = subscription?.planId || 'premium_gold';

      switch (userPlanId) {
        case 'premium_bronze':
        case 'bronze':
          weights.heartRate = 0.20;
          weights.rpe = 0.15;
          weights.sleep = 0.25;
          weights.stress = 0.25;
          break;
        case 'premium_silver':
        case 'silver':
          weights.heartRate = 0.20;
          weights.rpe = 0.15;
          break;
        case 'premium_gold':
        case 'gold':
          weights.heartRate = 0.20;
          weights.rpe = 0.15;
          weights.macros = 0.05;
          weights.micros = 0.05;
          break;
        case 'premium_diamond':
        case 'diamond':
          weights.heartRate = 0.20;
          weights.rpe = 0.15;
          weights.macros = 0.10;
          weights.micros = 0.10;
          break;
        default:
          weights = {
            sleep: 0.5,
            stress: 0.5,
            heartRate: 0,
            rpe: 0,
            cycle: 0,
            macros: 0,
            micros: 0
          };
          break;
      }
    } else {
      weights = {
        sleep: 0.5,
        stress: 0.5,
        heartRate: 0,
        rpe: 0,
        cycle: 0,
        macros: 0,
        micros: 0
      };
    }

    // Sommeil
    if (data.sleep?.hours > 0) {
      let sleepHoursScore;
      if (data.sleep.hours >= 7 && data.sleep.hours <= 9) {
        sleepHoursScore = 100;
      } else if (data.sleep.hours >= 6 && data.sleep.hours <= 10) {
        sleepHoursScore = 80;
      } else if (data.sleep.hours >= 5 && data.sleep.hours <= 11) {
        sleepHoursScore = 60;
      } else {
        sleepHoursScore = 30;
      }

      const qualityMultiplier = {
        'Excellent': 1.0,
        'Bien': 0.85,
        'Moyen': 0.65,
        'Mauvais': 0.4
      };

      let sleepScore = sleepHoursScore * (qualityMultiplier[data.sleep.quality] || 0.65);

      if (isWoman && data.cycle) {
        const cycleMultiplier = {
          'Menstruel': 0.9,
          'Folliculaire': 1.0,
          'Ovulation': 1.05,
          'Lutéal': 0.85
        };
        sleepScore *= (cycleMultiplier[data.cycle.phase] || 1.0);
      }

      totalScore += sleepScore * weights.sleep;
      totalWeight += weights.sleep;
    }

    // Stress
    let stressScore = Math.max(0, ((10 - (data.stress?.level || 5)) / 9) * 100);

    if (isWoman && data.cycle) {
      const stressCycleMultiplier = {
        'Menstruel': 0.8,
        'Folliculaire': 1.1,
        'Ovulation': 1.15,
        'Lutéal': 0.7
      };
      stressScore *= (stressCycleMultiplier[data.cycle.phase] || 1.0);
    }

    totalScore += stressScore * weights.stress;
    totalWeight += weights.stress;

    // FC repos
    if (weights.heartRate > 0 && data.heartRate?.resting > 0) {
      const optimalResting = userInfo?.gender === 'Homme' ? 65 : 70;
      let diff = Math.abs(data.heartRate.resting - optimalResting);

      if (isWoman && data.cycle) {
        const hrCycleAdjustment = {
          'Menstruel': -3,
          'Folliculaire': 0,
          'Ovulation': -2,
          'Lutéal': -5
        };

        const adjustedOptimal = optimalResting + hrCycleAdjustment[data.cycle.phase];
        diff = Math.abs(data.heartRate.resting - adjustedOptimal);
      }

      let hrScore;
      if (diff <= 5) hrScore = 100;
      else if (diff <= 10) hrScore = 85;
      else if (diff <= 15) hrScore = 70;
      else if (diff <= 20) hrScore = 55;
      else hrScore = 30;

      totalScore += hrScore * weights.heartRate;
      totalWeight += weights.heartRate;
    }

    // RPE
    if (weights.rpe > 0 && data.rpe?.value > 0) {
      let rpeScore;
      if (data.rpe.value <= 3) rpeScore = 100;
      else if (data.rpe.value <= 5) rpeScore = 80;
      else if (data.rpe.value <= 7) rpeScore = 60;
      else rpeScore = 30;

      if (isWoman && data.cycle) {
        const rpeCycleMultiplier = {
          'Menstruel': 0.8,
          'Folliculaire': 1.15,
          'Ovulation': 1.2,
          'Lutéal': 0.85
        };
        rpeScore *= (rpeCycleMultiplier[data.cycle.phase] || 1.0);
      }

      totalScore += rpeScore * weights.rpe;
      totalWeight += weights.rpe;
    }

    // Macronutriments
    if (weights.macros > 0) {
      let macrosScore = 75;

      if (isWoman && data.cycle) {
        const macrosCycleMultiplier = {
          'Menstruel': 0.85,
          'Folliculaire': 1.1,
          'Ovulation': 1.15,
          'Lutéal': 0.9
        };
        macrosScore *= (macrosCycleMultiplier[data.cycle.phase] || 1.0);
      }

      totalScore += macrosScore * weights.macros;
      totalWeight += weights.macros;
    }

    // Micronutriments
    if (weights.micros > 0) {
      let microsScore = 75;

      if (isWoman && data.cycle) {
        const microsCycleMultiplier = {
          'Menstruel': 0.8,
          'Folliculaire': 1.05,
          'Ovulation': 1.1,
          'Lutéal': 0.85
        };
        microsScore *= (microsCycleMultiplier[data.cycle.phase] || 1.0);
      }

      totalScore += microsScore * weights.micros;
      totalWeight += weights.micros;
    }

    // Cycle hormonal
    if (isWoman && data.cycle) {
      let cycleScore = 75;
      const dayInCycle = data.cycle.dayOfCycle || 1;

      switch (data.cycle.phase) {
        case 'Menstruel':
          if (dayInCycle <= 2) {
            cycleScore = 45;
          } else if (dayInCycle <= 4) {
            cycleScore = 55;
          } else {
            cycleScore = 65;
          }
          break;

        case 'Folliculaire':
          cycleScore = 70 + Math.min((dayInCycle - 5) * 3, 20);
          break;

        case 'Ovulation':
          cycleScore = 95;
          break;

        case 'Lutéal':
          const lutealDay = dayInCycle - 16;
          if (lutealDay <= 4) {
            cycleScore = 80;
          } else if (lutealDay <= 8) {
            cycleScore = 70;
          } else {
            cycleScore = 50;
          }
          break;
      }

      const symptomPenalty = Math.min((data.cycle.symptoms?.length || 0) * 8, 40);
      cycleScore = Math.max(25, cycleScore - symptomPenalty);

      if ((data.cycle.symptoms?.length || 0) === 0 && 
          (data.cycle.phase === 'Folliculaire' || data.cycle.phase === 'Ovulation')) {
        cycleScore = Math.min(100, cycleScore + 5);
      }

      totalScore += cycleScore * weights.cycle;
      totalWeight += weights.cycle;
    }

    let finalScore;
    if (totalWeight === 0) {
      finalScore = 50;
    } else {
      finalScore = totalScore / totalWeight;
    }

    return Math.max(0, Math.min(100, Math.round(finalScore)));
  };

  // Charger les données de forme
  const loadFormeData = async () => {
    if (!userData) return;

    setLoading(true);
    try {
      // Vérifier le statut premium
      const subscription = await checkSubscriptionStatus();
      setIsPremium(subscription.isPremium);
      setCurrentSubscription(subscription);

      const today = new Date().toISOString().split('T')[0];

      // Essayer d'abord le stockage local
      let todayData = null;
      const localDataString = await AsyncStorage.getItem(`forme_data_${userData.id}_${today}`);

      if (localDataString) {
        todayData = JSON.parse(localDataString);
      } else {
        // Fallback vers le serveur
        try {
          todayData = await PersistentStorage.getFormeData(userData.id, today);
        } catch (serverError) {
          // Créer des données par défaut
          todayData = {
            sleep: { hours: 0, quality: 'Moyen', bedTime: '', wakeTime: '' },
            stress: { level: 5, factors: [], notes: '' },
            heartRate: { resting: 0, variability: 0 },
            rpe: { value: 5, notes: '' },
            cycle: userData?.gender === 'Femme' ? { phase: 'Menstruel', dayOfCycle: 1, symptoms: [], notes: '' } : undefined,
            date: today
          };
        }
      }

      // Récupérer les notes RPE du jour si premium
      if (subscription.isPremium) {
        const todayRPEData = await getTodayActivityRPE(userData.id);
        if (todayRPEData) {
          todayData = {
            ...todayData,
            rpe: {
              value: todayRPEData.rpe,
              notes: todayRPEData.notes || '',
              workoutId: 'auto_from_activity'
            }
          };
        }
      }

      setFormeData(todayData);

      // Calculer le score
      const score = calculateFormeScore(todayData, userData, subscription.isPremium, subscription);
      setFormeScore(score);

    } catch (error) {
      console.error('Erreur chargement données forme (hook):', error);
      setFormeScore(75);
    } finally {
      setLoading(false);
    }
  };

  // Utiliser useCallback pour stabiliser la fonction loadFormeData
  const refreshData = useCallback(() => {
    if (userData) {
      loadFormeData();
    }
  }, [userData]);

  // Recharger les données quand userData change
  useEffect(() => {
    if (userData) {
      loadFormeData();
    }
  }, [userData]);

  return {
    formeScore,
    formeData,
    isPremium,
    currentSubscription,
    loading,
    refreshData
  };
};
