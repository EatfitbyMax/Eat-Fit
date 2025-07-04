import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Alert,
  Image,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  interpolate,
  useAnimatedScrollHandler,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { getCurrentUser } from '@/utils/auth';
import { syncWithExternalApps, IntegrationsManager } from '@/utils/integrations';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PersistentStorage } from '@/utils/storage';

const { width, height } = Dimensions.get('window');

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  userType: 'client' | 'coach';
}

export default function HomeScreen() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [todayStats, setTodayStats] = useState({
    calories: 0,
    workouts: 0,
    steps: 0,
  });
  const [formeScore, setFormeScore] = useState(0);
  const [currentTip, setCurrentTip] = useState('');
  const [calorieGoals, setCalorieGoals] = useState({
    calories: 2286,
    proteins: 171,
    carbohydrates: 257,
    fat: 64,
  });

  // Animation values
  const headerOpacity = useSharedValue(0);
  const cardsScale = useSharedValue(0.8);
  const statsOpacity = useSharedValue(0);
  const scrollY = useSharedValue(0);

  const tips = [
    "Buvez un verre d'eau dès votre réveil pour réveiller votre métabolisme et bien commencer la journée !",
    "Prenez 5 minutes pour vous étirer entre vos séances de travail, votre corps vous remerciera.",
    "Mangez des protéines à chaque repas pour maintenir votre masse musculaire et votre satiété.",
    "Dormez 7-8h par nuit : c'est pendant le sommeil que vos muscles se réparent et grandissent.",
    "Variez vos exercices chaque semaine pour éviter la routine et stimuler votre progression.",
    "Privilégiez les aliments non transformés : ils sont plus riches en nutriments essentiels.",
    "Écoutez votre corps : une journée de repos peut être plus bénéfique qu'un entraînement forcé.",
    "Planifiez vos repas à l'avance pour éviter les choix alimentaires impulsifs.",
    "Respirez profondément pendant vos exercices pour optimiser vos performances.",
    "Célébrez vos petites victoires : chaque progrès compte sur votre chemin vers vos objectifs !",
  ];

  useEffect(() => {
    loadUserData();
    startAnimations();
    generateRandomTip();
    calculateFormeScore();
    loadWeightData();
    calculateWeeklyWorkouts();
  }, []);

  // Générer un nouveau conseil seulement quand on clique sur le bouton refresh
  const handleRefreshTip = () => {
    generateRandomTip();
  };

  // Rechargement automatique quand l'écran est focalisé
  useFocusEffect(
    React.useCallback(() => {
      const loadDataOnFocus = async () => {
        // Recharger les données utilisateur d'abord
        await loadUserData();

        // Ensuite charger les autres données
        await loadTodayStats();
        calculateFormeScore();
        loadWeightData();
        calculateWeeklyWorkouts();
      };

      loadDataOnFocus();
    }, []) // Pas de dépendance pour éviter les boucles infinies
  );

  const generateRandomTip = () => {
    const randomIndex = Math.floor(Math.random() * tips.length);
    setCurrentTip(tips[randomIndex]);
  };

  const calculatePersonalizedGoals = (user: any) => {
    if (!user || !user.age || !user.weight || !user.height || !user.gender) {
      return {
        calories: 2286,
        proteins: 171,
        carbohydrates: 257,
        fat: 64,
      };
    }

    // Calcul du métabolisme de base (BMR) avec la formule de Mifflin-St Jeor
    let bmr;
    if (user.gender === 'Homme') {
      bmr = 88.362 + (13.397 * user.weight) + (4.799 * user.height) - (5.677 * user.age);
    } else {
      bmr = 447.593 + (9.247 * user.weight) + (3.098 * user.height) - (4.330 * user.age);
    }

    // Facteurs d'activité physique
    const activityFactors = {
      'sedentaire': 1.2,
      'leger': 1.375,
      'modere': 1.55,
      'actif': 1.725,
      'extreme': 1.9
    };

    const activityFactor = activityFactors[user.activityLevel] || 1.2;
    let totalCalories = Math.round(bmr * activityFactor);

    // Ajustements selon les objectifs
    const goals = user.goals || [];

    if (goals.includes('Perdre du poids')) {
      totalCalories -= 200; // Déficit de 200 kcal
    }

    // Calcul des macronutriments selon les objectifs
    let proteinRatio = 0.20; // 20% par défaut
    let carbRatio = 0.50;    // 50% par défaut
    let fatRatio = 0.30;     // 30% par défaut

    if (goals.includes('Me muscler')) {
      // Augmenter les protéines, réduire les lipides
      proteinRatio = 0.30; // 30%
      carbRatio = 0.45;    // 45%
      fatRatio = 0.25;     // 25%
    } else if (goals.includes('Gagner en performance')) {
      // Ratio glucides/protéines optimal pour la performance
      proteinRatio = 0.25; // 25%
      carbRatio = 0.55;    // 55%
      fatRatio = 0.20;     // 20%
    }

    // Calcul des grammes de macronutriments
    const proteins = Math.round((totalCalories * proteinRatio) / 4); // 4 kcal par gramme
    const carbohydrates = Math.round((totalCalories * carbRatio) / 4); // 4 kcal par gramme
    const fat = Math.round((totalCalories * fatRatio) / 9); // 9 kcal par gramme

    return {
      calories: Math.max(totalCalories, 1200), // Minimum 1200 kcal pour la santé
      proteins,
      carbohydrates,
      fat,
    };
  };

  const [isPremium, setIsPremium] = useState(false);
  const [formeData, setFormeData] = useState(null);

  const loadUserData = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (currentUser) {
        // Toujours mettre à jour l'état utilisateur avec les dernières données
        setUser(currentUser);
        console.log('Données utilisateur rechargées:', currentUser.firstName, currentUser.lastName);

        // Vérifier le statut premium
        const { checkSubscriptionStatus } = await import('@/utils/subscription');
        const subscription = await checkSubscriptionStatus();
        setIsPremium(subscription.isPremium);
        console.log(`Statut Premium Accueil: ${subscription.isPremium ? 'OUI' : 'NON'} (Plan: ${subscription.planId})`);

        // Calculer les objectifs personnalisés
        const personalizedGoals = calculatePersonalizedGoals(currentUser);
        setCalorieGoals(personalizedGoals);

        await loadTodayStats();
      }
    } catch (error) {
      console.error('Erreur chargement utilisateur:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFormeData = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) return;

      const today = new Date().toISOString().split('T')[0];

      // Simulation du calcul du score de forme basé sur le sommeil et la variabilité cardiaque
      // En réalité, ces données viendraient des intégrations Apple Health/Strava
      // Valeurs simulées pour la démonstration
      setFormeData({
        sleep: { hours: 7, quality: 'Bien', bedTime: '', wakeTime: '' },
        stress: { level: 3, factors: [], notes: '' },
        heartRate: { resting: 60, variability: 80 },
        rpe: { value: 4, notes: '' },
        cycle: currentUser?.gender === 'Femme' ? { phase: 'Menstruel', dayOfCycle: 1, symptoms: [], notes: '' } : undefined,
        date: today
      });
    } catch (error) {
      console.error('Erreur chargement données forme:', error);
      setFormeData(null);
    }
  };

  const calculateFormeScore = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) return;

      const today = new Date().toISOString().split('T')[0];
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;

      // Essayer d'abord le stockage local
      let todayData = null;
      const localDataString = await AsyncStorage.getItem(`forme_data_${currentUser.id}_${today}`);

      if (localDataString) {
        todayData = JSON.parse(localDataString);
        console.log('Données de forme chargées depuis le stockage local pour l\'accueil');
      } else {
        // Fallback vers le serveur si pas de données locales
        try {
          todayData = await PersistentStorage.getFormeData(currentUser.id, today);
          console.log('Données de forme chargées depuis le serveur VPS pour l\'accueil');
        } catch (serverError) {
          console.log('Aucune donnée de forme trouvée, utilisation du score par défaut');
          setFormeScore(75); // Valeur par défaut si aucune donnée
          return;
        }
      }

      // Récupérer les notes RPE du jour si premium
      if (isPremium && todayData) {
        const todayRPEData = await getTodayActivityRPE(currentUser.id);
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

      if (todayData) {
        // Utiliser la même logique de calcul que dans forme.tsx
        const realScore = calculateRealFormeScore(todayData, currentUser);
        setFormeScore(realScore);
        console.log(`Score de forme réel calculé pour l'accueil: ${realScore}/100`);
      } else {
        setFormeScore(75); // Valeur par défaut
      }
    } catch (error) {
      console.error('Erreur calcul score de forme:', error);
      setFormeScore(75); // Valeur par défaut
    }
  };

  // Fonction pour récupérer les données RPE du jour
  const getTodayActivityRPE = async (userId: string) => {
    try {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      const storedRatings = await AsyncStorage.getItem(`activity_ratings_${userId}`);

      if (!storedRatings) {
        console.log('Aucune note RPE trouvée dans le stockage (accueil)');
        return null;
      }

      const ratings = JSON.parse(storedRatings);

      // Date du jour en format YYYY-MM-DD dans le timezone local
      const today = new Date();
      const todayString = today.getFullYear() + '-' + 
        String(today.getMonth() + 1).padStart(2, '0') + '-' + 
        String(today.getDate()).padStart(2, '0');

      console.log('Recherche RPE pour le jour (accueil):', todayString);

      // Récupérer toutes les activités du jour et fusionner leurs notes
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
        console.log(`${todayRatings.length} activité(s) RPE trouvée(s) pour aujourd'hui (accueil)`);

        // Calculer la moyenne des RPE et fusionner les notes
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

      console.log('Aucune activité RPE trouvée pour aujourd\'hui (accueil)');
      return null;
    } catch (error) {
      console.error('Erreur récupération RPE du jour (accueil):', error);
      return null;
    }
  };

  // Fonction pour calculer le score de forme réel (même logique que forme.tsx)
  const calculateRealFormeScore = (formeData: any, userData: any) => {
    let totalScore = 0;
    let totalWeight = 0;

    // Adaptation des poids selon le genre
    const isWoman = userData?.gender === 'Femme';

    // Définir les poids de base
    let baseWeights = {
      sleep: 0.35,
      stress: 0.30,
      heartRate: 0.0, // Initialisé à 0, sera ajusté par les plans
      rpe: 0.0,       // Initialisé à 0, sera ajusté par les plans
      cycle: isWoman ? 0.05 : 0,
      macros: 0.0,    // Initialisé à 0, sera ajusté par les plans
      micros: 0.0     // Initialisé à 0, sera ajusté par les plans
    };

    // Ajuster les poids selon le plan
    let weights = { ...baseWeights }; // Créer une copie pour ne pas modifier l'original

    if (isPremium) {
      // Récupérer l'ID du plan de l'utilisateur (simulé, à remplacer par la logique réelle)
      const userPlanId = 'premium_gold'; // Remplacez par la valeur réelle de l'utilisateur

      switch (userPlanId) {
        case 'premium_bronze':
          weights.heartRate = 0.20;
          weights.rpe = 0.15;
          weights.sleep = 0.25;
          weights.stress = 0.25;
          break;
        case 'premium_silver':
          weights.heartRate = 0.20;
          weights.rpe = 0.15;
          break;
        case 'premium_gold':
          weights.heartRate = 0.20;
          weights.rpe = 0.15;
          weights.macros = 0.05;
          weights.micros = 0.05;
          break;
        case 'premium_diamond':
          weights.heartRate = 0.20;
          weights.rpe = 0.15;
          weights.macros = 0.10;
          weights.micros = 0.10;
          break;
        default:
          // Plan gratuit (ou inconnu) : sommeil et stress uniquement
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
      // Plan gratuit
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
    if (formeData.sleep?.hours > 0) {
      let sleepHoursScore;
      if (formeData.sleep.hours >= 7 && formeData.sleep.hours <= 9) {
        sleepHoursScore = 100;
      } else if (formeData.sleep.hours >= 6 && formeData.sleep.hours <= 10) {
        sleepHoursScore = 80;
      } else if (formeData.sleep.hours >= 5 && formeData.sleep.hours <= 11) {
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

      let sleepScore = sleepHoursScore * (qualityMultiplier[formeData.sleep.quality] || 0.65);

      // Ajustement cycle pour les femmes
      if (isWoman && formeData.cycle) {
        const cycleMultiplier = {
          'Menstruel': 0.9,
          'Folliculaire': 1.0,
          'Ovulation': 1.05,
          'Lutéal': 0.85
        };
        sleepScore *= (cycleMultiplier[formeData.cycle.phase] || 1.0);
      }

      totalScore += sleepScore * weights.sleep;
      totalWeight += weights.sleep;
    }

    // Stress - inversé (1 = excellent, 10 = très mauvais)
    let stressScore = Math.max(0, ((10 - (formeData.stress?.level || 5)) / 9) * 100);

    if (isWoman && formeData.cycle) {
      const stressCycleMultiplier = {
        'Menstruel': 0.8,
        'Folliculaire': 1.1,
        'Ovulation': 1.15,
        'Lutéal': 0.7
      };
      stressScore *= (stressCycleMultiplier[formeData.cycle.phase] || 1.0);
    }

    totalScore += stressScore * weights.stress;
    totalWeight += weights.stress;

    // FC repos - Plans Bronze et plus
    if (weights.heartRate > 0 && formeData.heartRate?.resting > 0) {
      const optimalResting = userData?.gender === 'Homme' ? 65 : 70;
      let diff = Math.abs(formeData.heartRate.resting - optimalResting);

      // Ajustement cycle pour les femmes: FC varie selon la phase
      if (isWoman && formeData.cycle) {
        const hrCycleAdjustment = {
          'Menstruel': -3,       // FC légèrement plus élevée
          'Folliculaire': 0,     // FC normale
          'Ovulation': -2,       // FC peut être légèrement élevée
          'Lutéal': -5           // FC souvent plus élevée en pré-menstruel
        };

        const adjustedOptimal = optimalResting + hrCycleAdjustment[formeData.cycle.phase];
        diff = Math.abs(formeData.heartRate.resting - adjustedOptimal);
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

    // RPE - Plans Bronze et plus
    if (weights.rpe > 0 && formeData.rpe?.value > 0) {
      let rpeScore;
      if (formeData.rpe.value <= 3) rpeScore = 100;
      else if (formeData.rpe.value <= 5) rpeScore = 80;
      else if (formeData.rpe.value <= 7) rpeScore = 60;
      else rpeScore = 30;

      // Ajustement cycle pour les femmes
      if (isWoman && formeData.cycle) {
        const rpeCycleMultiplier = {
          'Menstruel': 0.8,
          'Folliculaire': 1.15,
          'Ovulation': 1.2,
          'Lutéal': 0.85
        };
        rpeScore *= (rpeCycleMultiplier[formeData.cycle.phase] || 1.0);
      }

      totalScore += rpeScore * weights.rpe;
      totalWeight += weights.rpe;
    }

    // Relation Macronutriments/Fatigue - Plans Or et Diamant
    if (weights.macros > 0) {
      let macrosScore = 75; // Score par défaut simulé

      // Impact du cycle pour les femmes
      if (isWoman && formeData.cycle) {
        const macrosCycleMultiplier = {
          'Menstruel': 0.85,
          'Folliculaire': 1.1,
          'Ovulation': 1.15,
          'Lutéal': 0.9
        };
        macrosScore *= (macrosCycleMultiplier[formeData.cycle.phase] || 1.0);
      }

      totalScore += macrosScore * weights.macros;
      totalWeight += weights.macros;
    }

    // Relation Micronutriments/Fatigue - Plans Or et Diamant
    if (weights.micros > 0) {
      let microsScore = 75; // Score par défaut simulé

      // Impact du cycle pour les femmes
      if (isWoman && formeData.cycle) {
        const microsCycleMultiplier = {
          'Menstruel': 0.8,
          'Folliculaire': 1.05,
          'Ovulation': 1.1,
          'Lutéal': 0.85
        };
        microsScore *= (microsCycleMultiplier[formeData.cycle.phase] || 1.0);
      }

      totalScore += microsScore * weights.micros;
      totalWeight += weights.micros;
    }

    // Cycle hormonal pour les femmes
    if (isWoman && formeData.cycle) {
      let cycleScore = 75;
      const dayInCycle = formeData.cycle.dayOfCycle || 1;

      switch (formeData.cycle.phase) {
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

      const symptomPenalty = Math.min((formeData.cycle.symptoms?.length || 0) * 8, 40);
      cycleScore = Math.max(25, cycleScore - symptomPenalty);

      if ((formeData.cycle.symptoms?.length || 0) === 0 && 
          (formeData.cycle.phase === 'Folliculaire' || formeData.cycle.phase === 'Ovulation')) {
        cycleScore = Math.min(100, cycleScore + 5);
      }

      totalScore += cycleScore * weights.cycle;
      totalWeight += weights.cycle;
    }

    // Calculer le score final
    let finalScore;
    if (totalWeight === 0) {
      finalScore = 50; // Score par défaut si aucune donnée
    } else {
      finalScore = totalScore / totalWeight;
    }

    return Math.max(0, Math.min(100, Math.round(finalScore)));
  };

  const loadTodayStats = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) return;

      const today = new Date().toISOString().split('T')[0];

      // 1. Récupérer les calories depuis la nutrition
      let totalCalories = 0;
      try {
        const foodEntries = await AsyncStorage.getItem(`food_entries_${currentUser.id}`);
        if (foodEntries) {
          const entries = JSON.parse(foodEntries);
          const todayEntries = entries.filter((entry: any) => entry.date === today);
          totalCalories = todayEntries.reduce((sum: number, entry: any) => sum + (entry.calories || 0), 0);
        }
      } catch (error) {
        console.error('Erreur récupération calories:', error);
      }

      // 2. Récupérer le nombre de séances terminées depuis Strava
      let totalWorkouts = 0;
      try {
        const stravaActivities = await IntegrationsManager.getStravaActivities(currentUser.id);
        // Filtrer les activités du jour actuel
        totalWorkouts = stravaActivities.filter((activity: any) => {
          const activityDate = new Date(activity.date).toISOString().split('T')[0];
          return activityDate === today;
        }).length;
        console.log(`Séances terminées aujourd'hui (Strava): ${totalWorkouts}`);
      } catch (error) {
        console.error('Erreur récupération séances Strava:', error);
      }

      // 3. Récupérer les pas depuis Apple Health
      let totalSteps = 0;
      try {
        const healthData = await IntegrationsManager.getHealthData(currentUser.id);
        const todayHealthData = healthData.find((data: any) => data.date === today);
        if (todayHealthData) {
          totalSteps = todayHealthData.steps || 0;
        }
      } catch (error) {
        console.error('Erreur récupération pas Apple Health:', error);
      }

      // Si aucune donnée Apple Health, essayer de synchroniser
      if (totalSteps === 0) {
        try {
          const integrationStatus = await IntegrationsManager.getIntegrationStatus(currentUser.id);
          if (integrationStatus.appleHealth.connected) {
            console.log('Tentative de synchronisation Apple Health...');
            await IntegrationsManager.syncAppleHealthData(currentUser.id);
            const updatedHealthData = await IntegrationsManager.getHealthData(currentUser.id);
            const todayData = updatedHealthData.find((data: any) => data.date === today);
            if (todayData) {
              totalSteps = todayData.steps || 0;
            }
          }
        } catch (syncError) {
          console.warn('Impossible de synchroniser Apple Health:', syncError);
        }
      }

      setTodayStats({
        calories: Math.round(totalCalories),
        workouts: totalWorkouts,
        steps: totalSteps,
      });

      console.log(`Statistiques du jour chargées: ${Math.round(totalCalories)} calories, ${totalWorkouts} séances, ${totalSteps} pas`);
    } catch (error) {
      console.error('Erreur chargement statistiques du jour:', error);
      // En cas d'erreur, garder des valeurs par défaut
      setTodayStats({
        calories: 0,
        workouts: 0,
        steps: 0,
      });
    }
  };

  // États pour les données de poids
  const [weightData, setWeightData] = useState({
    startWeight: 0,
    currentWeight: 0,
    targetWeight: 0,
  });

  // État pour stocker le nombre de séances hebdomadaires
  const [weeklyWorkouts, setWeeklyWorkouts] = useState(0);

  // Fonction synchrone pour obtenir les séances hebdomadaires
  const getWeeklyWorkouts = () => {
    return weeklyWorkouts;
  };

  // Fonction pour calculer l'objectif d'entraînement personnalisé basé sur les données réelles
  const getTrainingGoal = () => {
    if (!user) return Math.max(weeklyWorkouts, 1);

    // Si l'utilisateur a des séances planifiées, utiliser ce nombre comme objectif minimum
    let baseGoal = Math.max(weeklyWorkouts, 1); // Au minimum, le nombre de séances planifiées

    // Ajuster légèrement selon les objectifs de l'utilisateur
    if (user.goals?.includes('Me muscler') || user.goals?.includes('Gagner en performance')) {
      // Pour ces objectifs, suggérer une séance supplémentaire si possible
      baseGoal = Math.max(baseGoal, weeklyWorkouts + 1);
    }

    if (user.goals?.includes('Perdre du poids')) {
      // Pour la perte de poids, suggérer au minimum 2 séances
      baseGoal = Math.max(baseGoal, 2);
    }

    // Si aucune séance n'est planifiée, suggérer un objectif minimal
    if (weeklyWorkouts === 0) {
      return user.goals?.includes('Perdre du poids') ? 2 : 1;
    }

    return baseGoal;
  };

  // Charger les données de poids depuis le stockage local
  const loadWeightData = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) return;

      // Charger depuis le serveur d'abord
      try {
        const VPS_URL = process.env.EXPO_PUBLIC_VPS_URL || 'https://eatfitbymax.replit.app';
        const response = await fetch(`${VPS_URL}/api/weight/${user.id}`);
        if (response.ok) {
          const data = await response.json();
          setWeightData(data);
          // Sauvegarder en local comme backup
          await AsyncStorage.setItem(`weight_data_${user.id}`, JSON.stringify(data));
          return;
        }
      } catch (serverError) {
        console.log('Fallback vers le stockage local pour les données de poids (index)');
      }

      // Fallback vers le stockage local
      const weightDataString = await AsyncStorage.getItem(`weight_data_${currentUser.id}`);
      if (weightDataString) {
        const data = JSON.parse(weightDataString);
        setWeightData(data);
      }
    } catch (error) {
      console.error('Erreur chargement données poids:', error);
    }
  };

  // Fonctions pour les objectifs de perte de poids
  const getWeightLossProgress = () => {
    if (!weightData.targetWeight || !weightData.startWeight) return 'À définir';

    const totalLoss = weightData.startWeight - weightData.targetWeight;
    const currentLoss = weightData.startWeight - weightData.currentWeight;

    if (totalLoss <= 0) return 'À définir';

    return `${Math.round(currentLoss * 10) / 10}/${Math.round(totalLoss * 10) / 10} kg`;
  };

  const getWeightLossPercentage = () => {
    if (!weightData.targetWeight || !weightData.startWeight) return 0;

    const totalLoss = weightData.startWeight - weightData.targetWeight;
    const currentLoss = weightData.startWeight - weightData.currentWeight;

    if (totalLoss <= 0) return 0;

    return Math.min(100, Math.max(0, (currentLoss / totalLoss) * 100));
  };

  const getWeightLossDescription = () => {
    if (!weightData.targetWeight || !weightData.startWeight) {
      return 'Définissez votre objectif de poids dans Progrès';
    }

    const totalLoss = weightData.startWeight - weightData.targetWeight;
    const currentLoss = weightData.startWeight - weightData.currentWeight;
    const remaining = totalLoss - currentLoss;

    if (totalLoss <= 0) {
      return 'Objectif de poids non défini';
    }

    if (remaining <= 0) {
      return 'Objectif atteint ! Félicitations !';
    }

    return `${Math.round(remaining * 10) / 10} kg restants à perdre`;
  };

  // Fonction asynchrone pour calculer et mettre à jour les séances hebdomadaires
  const calculateWeeklyWorkouts = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) return;

      // Calculer les dates de début et fin de semaine (Lundi à Dimanche)
      const today = new Date();
      const startOfWeek = new Date(today);
      const dayOfWeek = today.getDay();
      const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Lundi comme début de semaine
      startOfWeek.setDate(diff);
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      console.log(`Calcul séances semaine du ${startOfWeek.toISOString().split('T')[0]} au ${endOfWeek.toISOString().split('T')[0]}`);

      let weeklyWorkoutsCount = 0;
      try {
        const workouts = await PersistentStorage.getWorkouts(currentUser.id);
        console.log(`Total entraînements trouvés: ${workouts.length}`);

        // Filtrer les entraînements de la semaine en cours
        const weekWorkouts = workouts.filter((workout: any) => {
          const workoutDate = new Date(workout.date + 'T00:00:00');
          const isInWeek = workoutDate >= startOfWeek && workoutDate <= endOfWeek;
          if (isInWeek) {
            console.log(`Séance trouvée: ${workout.name} le ${workout.date}`);
          }
          return isInWeek;
        });

        weeklyWorkoutsCount = weekWorkouts.length;
        console.log(`Séances planifiées cette semaine: ${weeklyWorkoutsCount}`);
      } catch (error) {
        console.error('Erreur PersistentStorage, tentative fallback local:', error);
        // Fallback vers le stockage local
        try {
          const storedWorkouts = await AsyncStorage.getItem(`workouts_${currentUser.id}`);
          if (storedWorkouts) {
            const workouts = JSON.parse(storedWorkouts);
            console.log(`Fallback - Total entraînements trouvés: ${workouts.length}`);

            const weekWorkouts = workouts.filter((workout: any) => {
              const workoutDate = new Date(workout.date + 'T00:00:00');
              const isInWeek = workoutDate >= startOfWeek && workoutDate <= endOfWeek;
              if (isInWeek) {
                console.log(`Fallback - Séance trouvée: ${workout.name} le ${workout.date}`);
              }
              return isInWeek;
            });

            weeklyWorkoutsCount = weekWorkouts.length;
            console.log(`Fallback - Séances planifiées cette semaine: ${weeklyWorkoutsCount}`);
          }
        } catch (localError) {
          console.error('Erreur fallback local séances hebdomadaires:', localError);
        }
      }

      setWeeklyWorkouts(weeklyWorkoutsCount);
    } catch (error) {
      console.error('Erreur calcul séances hebdomadaires:', error);
    }
  };

  const startAnimations = () => {
    headerOpacity.value = withTiming(1, { duration: 800 });
    cardsScale.value = withSequence(
      withTiming(1.05, { duration: 600 }),
      withTiming(1, { duration: 200 })
    );
    statsOpacity.value = withTiming(1, { duration: 1000 });
  };

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{
      translateY: interpolate(scrollY.value, [0, 100], [0, -20])
    }],
  }));

  const cardsAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardsScale.value }],
  }));

  const statsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: statsOpacity.value,
  }));

  const handleSync = async () => {
    try {
      Alert.alert(
        'Synchronisation',
        'Voulez-vous synchroniser vos données avec vos applications de santé ?',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Synchroniser',
            onPress: async () => {
              await syncWithExternalApps(user?.id || '');
              Alert.alert('Succès', 'Synchronisation terminée');
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de synchroniser les données');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  const getGreeting = () => {
    return 'Bonjour';
  };

  return (
    <SafeAreaView style={styles.container}>
      <Animated.ScrollView
        style={styles.scrollView}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        {/* Header avec gradient */}
        <Animated.View style={[styles.headerContainer, headerAnimatedStyle]}>
          <LinearGradient
            colors={['#F5A623', '#0D1117']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.headerGradient}
          >
            <View style={styles.headerContent}>
              <View>
                <Text style={styles.greetingText}>
                  {getGreeting()}, {user?.firstName || 'Champion'} !
                </Text>
                <Text style={styles.motivationText}>
                  Prêt pour une nouvelle journée ?
                </Text>
              </View>
              <TouchableOpacity 
                style={styles.profileButton}
                onPress={() => router.push('/(client)/profil')}
              >
                {user?.profileImage ? (
                  <Image 
                    source={{ uri: user.profileImage }} 
                    style={styles.profileImage}
                  />
                ) : (
                  <Text style={styles.profileInitial}>
                    {user?.firstName?.charAt(0) || 'U'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Statistiques du jour */}
        <Animated.View style={[styles.statsContainer, statsAnimatedStyle]}>
          <Text style={styles.sectionTitle}>Aujourd'hui</Text>
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, styles.caloriesCard]}>
              <Text style={styles.statNumber}>{todayStats.calories}</Text>
              <Text style={styles.statLabel}>Calories</Text>
              <View style={styles.statIcon}>
                <Text style={styles.statEmoji}>🔥</Text>
              </View>
            </View>
            <View style={[styles.statCard, styles.workoutCard]}>
              <Text style={styles.statNumber}>{todayStats.workouts}</Text>
              <Text style={styles.statLabel}>Séances</Text>
              <View style={styles.statIcon}>
                <Text style={styles.statEmoji}>💪</Text>
              </View>
            </View>
            <View style={[styles.statCard, styles.stepsCard]}>
              <Text style={styles.statNumber}>{todayStats.steps.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Pas</Text>
              <View style={styles.statIcon}>
                <Text style={styles.statEmoji}>👟</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Actions rapides */}
        <Animated.View style={[styles.actionsContainer, cardsAnimatedStyle]}>
          <Text style={styles.sectionTitle}>Actions rapides</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity 
              style={[styles.actionCard, styles.nutritionAction]}
              onPress={() => router.push('/(client)/nutrition')}
            >
              <View style={styles.actionIcon}>
                <Text style={styles.actionEmoji}>🥗</Text>
              </View>
              <Text style={styles.actionTitle}>Nutrition</Text>
              <Text style={styles.actionSubtitle}>Suivre mon alimentation</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionCard, styles.workoutAction]}
              onPress={() => router.push('/(client)/entrainement')}
            >
              <View style={styles.actionIcon}>
                <Text style={styles.actionEmoji}>🏋️</Text>
              </View>
              <Text style={styles.actionTitle}>Entraînement</Text>
              <Text style={styles.actionSubtitle}>Enregistrer mes séances</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionCard, styles.progressAction]}
              onPress={() => router.push('/(client)/progres')}
            >
              <View style={styles.actionIcon}>
                <Text style={styles.actionEmoji}>📊</Text>
              </View>
              <Text style={styles.actionTitle}>Progrès</Text>
              <Text style={styles.actionSubtitle}>Voir mon évolution</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionCard, styles.formeAction]}
              onPress={() => router.push('/(client)/forme')}
            >
              <View style={styles.actionIcon}>
                <Text style={styles.actionEmoji}>💓</Text>
              </View>
              <Text style={styles.actionTitle}>Forme</Text>
              <Text style={styles.actionSubtitle}>Score: {formeScore}/100</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Conseils */}
        <View style={styles.tipsContainer}>
          <View style={styles.tipsHeader}>
            <Text style={styles.sectionTitle}>Conseils</Text>
            <TouchableOpacity onPress={handleRefreshTip}>
              <Text style={styles.refreshTip}>🔄</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.tipCard}>
            <View style={styles.tipHeader}>
              <Text style={styles.tipEmoji}>💡</Text>
              <Text style={styles.tipTitle}>Conseil personnalisé</Text>
            </View>
            <Text style={styles.tipContent}>
              {currentTip}
            </Text>
          </View>
        </View>

        {/* Objectifs de la semaine */}
        <View style={styles.goalsContainer}>
          <Text style={styles.sectionTitle}>Mes objectifs de la semaine</Text>

          {/* Objectif Nutrition - Basé sur les objectifs nutritionnels personnalisés */}
          <View style={styles.goalCard}>
            <View style={styles.goalHeader}>
              <Text style={styles.goalTitle}>🥗 Objectif calories journalier</Text>
              <Text style={styles.goalProgress}>{todayStats.calories}/{calorieGoals.calories}</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[
                styles.progressFill, 
                { 
                  width: `${Math.min((todayStats.calories / calorieGoals.calories) * 100, 100)}%`,
                  backgroundColor: todayStats.calories >= calorieGoals.calories * 0.8 ? '#28A745' : '#F5A623'
                }
              ]} />
            </View>
            <Text style={styles.goalSubtext}>
              {todayStats.calories >= calorieGoals.calories 
                ? 'Objectif atteint !' 
                : `${Math.max(0, calorieGoals.calories - todayStats.calories)} kcal restantes`
              }
            </Text>
          </View>

          {/* Objectif Entraînement - Basé sur les séances réelles de la semaine */}
          <View style={styles.goalCard}>
            <View style={styles.goalHeader}>
              <Text style={styles.goalTitle}>💪 Séances d'entraînement</Text>
              <Text style={styles.goalProgress}>{getWeeklyWorkouts()}/{getTrainingGoal()}</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[
                styles.progressFill, 
                { 
                  width: `${Math.min((getWeeklyWorkouts() / getTrainingGoal()) * 100, 100)}%`,
                  backgroundColor: getWeeklyWorkouts() >= getTrainingGoal() ? '#28A745' : '#F5A623'
                }
              ]} />
            </View>
            <Text style={styles.goalSubtext}>
              {getWeeklyWorkouts() >= getTrainingGoal() 
                ? 'Objectif hebdomadaire atteint ! 🎉' 
                : weeklyWorkouts === 0 
                  ? 'Planifiez vos séances dans Entraînement'
                  : `${Math.max(0, getTrainingGoal() - getWeeklyWorkouts())} séance${getTrainingGoal() - getWeeklyWorkouts() > 1 ? 's' : ''} supplémentaire${getTrainingGoal() - getWeeklyWorkouts() > 1 ? 's' : ''} suggérée${getTrainingGoal() - getWeeklyWorkouts() > 1 ? 's' : ''}`
              }
            </Text>
          </View>

          {/* Objectif Perte de poids - Basé sur les données de progression réelles */}
          {user?.goals?.includes('Perdre du poids') && (
            <View style={styles.goalCard}>
              <View style={styles.goalHeader}>
                <Text style={styles.goalTitle}>🎯 Perte du poids</Text>
                <Text style={styles.goalProgress}>{getWeightLossProgress()}</Text>
              </View>
              <View style={styles.progressBar}>
                <View style={[
                  styles.progressFill, 
                  { 
                    width: `${getWeightLossPercentage()}%`,
                    backgroundColor: getWeightLossPercentage() >= 50 ? '#28A745' : '#F5A623'
                  }
                ]} />
              </View>
              <Text style={styles.goalSubtext}>
                {getWeightLossDescription()}
              </Text>
            </View>
          )}

          {/* Objectif secondaire basé sur les autres objectifs de l'utilisateur */}
          {user?.goals && user.goals.length > 0 && !user.goals.includes('Perdre du poids') && (
            <View style={styles.goalCard}>
              <View style={styles.goalHeader}>
                <Text style={styles.goalTitle}>🎯 {user.goals[0]}</Text>
                <Text style={styles.goalProgress}>En cours</Text>
              </View>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: '65%' }]} />
              </View>
              <Text style={styles.goalSubtext}>Progression constante vers votre objectif</Text>
            </View>
          )}
        </View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1117',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0D1117',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  headerContainer: {
    marginBottom: 20,
  },
  headerGradient: {
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greetingText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  motivationText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  profileButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  profileInitial: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  statsContainer: {
    marginBottom: 30,
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  caloriesCard: {
    backgroundColor: '#1A1F36',
    borderLeftWidth: 4,
    borderLeftColor: '#F5A623',
  },
  workoutCard: {
    backgroundColor: '#1A1F36',
    borderLeftWidth: 4,
    borderLeftColor: '#45B7D1',
  },
  stepsCard: {
    backgroundColor: '#1A1F36',
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B6B',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#8B949E',
  },
  statIcon: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  statEmoji: {
    fontSize: 20,
  },
  actionsContainer: {
    marginBottom: 30,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
  },
  actionCard: {
    width: (width - 52) / 2,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  nutritionAction: {
    backgroundColor: '#1A2332',
    borderWidth: 1,
    borderColor: '#2D3748',
  },
  workoutAction: {
    backgroundColor: '#1A2332',
    borderWidth: 1,
    borderColor: '#2D3748',
  },
  progressAction: {
    backgroundColor: '#1A2332',
    borderWidth: 1,
    borderColor: '#2D3748',
  },
  formeAction: {
    backgroundColor: '#1A2332',
    borderWidth: 1,
    borderColor: '#2D3748',
  },
  profileImage: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },
  actionIcon: {
    marginBottom: 12,
  },
  actionEmoji: {
    fontSize: 32,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: 'center',
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#8B949E',
    textAlign: 'center',
  },
  tipsContainer: {
    marginBottom: 30,
  },
  tipsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  refreshTip: {
    fontSize: 18,
    color: '#F5A623',
  },
  tipCard: {
    marginHorizontal: 20,
    padding: 20,
    backgroundColor: '#1A2332',
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#F5A623',
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tipEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  tipTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  tipContent: {
    fontSize: 14,
    color: '#8B949E',
    lineHeight: 20,
  },
  goalsContainer: {
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  goalCard: {
    backgroundColor: '#1A2332',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  goalTitle: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  goalProgress: {
    fontSize: 14,
    color: '#F5A623',
    fontWeight: '600',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#2D3748',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#F5A623',
    borderRadius: 3,
  },
  goalSubtext: {
    fontSize: 12,
    color: '#8B949E',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default HomeScreen;