import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Dimensions, Alert, TextInput, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring } from 'react-native-reanimated';
import { useFocusEffect } from 'expo-router';
import { checkSubscriptionStatus } from '@/utils/subscription';
import { PersistentStorage } from '@/utils/storage';
import { IntegrationsManager } from '@/utils/integrations';

const { width } = Dimensions.get('window');

interface FormeData {
  sleep: {
    hours: number;
    quality: 'Excellent' | 'Bien' | 'Moyen' | 'Mauvais';
    bedTime: string;
    wakeTime: string;
  };
  stress: {
    level: number; // 1-10
    factors: string[];
    notes: string;
  };
  heartRate: {
    resting: number;
    variability: number;
  };
  rpe: {
    value: number; // 1-10
    workoutId?: string;
    notes: string;
  };
  cycle?: {
    phase: 'Menstruel' | 'Folliculaire' | 'Ovulation' | 'Lutéal';
    dayOfCycle: number; // 1-35 (moyenne 28 jours)
    symptoms: string[];
    notes: string;
  };
  date: string;
  actualCalories?: number;
  actualMacros?: {
    proteins: number;
    carbohydrates: number;
    fat: number;
  };
  actualMicros?: {
    // Vitamines
    vitaminA: number;
    vitaminC: number;
    vitaminD: number;
    vitaminE: number;
    vitaminK: number;
    vitaminB1: number;
    vitaminB2: number;
    vitaminB3: number;
    vitaminB5: number;
    vitaminB6: number;
    vitaminB7: number;
    vitaminB9: number;
    vitaminB12: number;
    // Minéraux
    calcium: number;
    iron: number;
    magnesium: number;
    potassium: number;
    zinc: number;
    sodium: number;
    phosphorus: number;
    selenium: number;
    copper: number;
    manganese: number;
    iodine: number;
    chromium: number;
    molybdenum: number;
    // Autres
    caffeine: number;
    fiber: number;
    omega3: number;
    omega6: number;
  };
}

export default function FormeScreen() {
  const [isPremium, setIsPremium] = useState(false);
  const [currentSubscription, setCurrentSubscription] = useState<any>(null);
  const [selectedTab, setSelectedTab] = useState('Aujourd\'hui');
  const [userData, setUserData] = useState<any>(null);
  const [formeData, setFormeData] = useState<FormeData>({
    sleep: { hours: 0, quality: 'Moyen', bedTime: '', wakeTime: '' },
    stress: { level: 5, factors: [], notes: '' },
    heartRate: { resting: 0, variability: 0 },
    rpe: { value: 5, notes: '' },
    cycle: undefined, // Sera initialisé après le chargement des données utilisateur
    date: new Date().toISOString().split('T')[0]
  });
  const [weeklyData, setWeeklyData] = useState<FormeData[]>([]);
  const [formeScore, setFormeScore] = useState(76);

  // Modals state
  const [showSleepModal, setShowSleepModal] = useState(false);
  const [showStressModal, setShowStressModal] = useState(false);
  const [showHeartRateModal, setShowHeartRateModal] = useState(false);

  const [showCycleModal, setShowCycleModal] = useState(false);

  // Temporary form data
  const [tempSleep, setTempSleep] = useState({ hours: '', quality: 'Moyen', bedTime: '', wakeTime: '' });
  const [tempStress, setTempStress] = useState({ level: 5, factors: [], notes: '' });
  const [tempHeartRate, setTempHeartRate] = useState({ resting: '', variability: '' });

  const [tempCycle, setTempCycle] = useState({ phase: 'Menstruel', dayOfCycle: 1, symptoms: [], notes: '' });

  const stressFactors = [
    'Travail', 'Famille', 'Finances', 'Santé', 'Relations', 'Transport'
  ];

  const cycleSymptoms = [
    'Crampes', 'Fatigue', 'Irritabilité', 'Sensibilité mammaire', 'Ballonnements', 
    'Maux de tête', 'Humeur changeante', 'Fringales', 'Acné', 'Douleurs lombaires'
  ];

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    if (userData) {
      // Initialiser le cycle pour les femmes si ce n'est pas déjà fait
      if (userData.gender === 'Femme' && !formeData.cycle) {
        setFormeData(prevData => ({
          ...prevData,
          cycle: { phase: 'Menstruel', dayOfCycle: 1, symptoms: [], notes: '' }
        }));
      }
      loadFormeData();
    }
  }, [userData]);

  // Recharger les données quand l\'écran devient visible
  useFocusEffect(
    useCallback(() => {
      if (userData) {
        console.log('Écran Forme refocalisé - rechargement des données RPE');
        loadFormeData();
      }
    }, [userData])
  );

  useEffect(() => {
    calculateFormeScore();
  }, [formeData]);

  const loadUserData = async () => {
    try {
      const { getCurrentUser } = await import('@/utils/auth');
      const user = await getCurrentUser();
      if (user) {
        setUserData(user);

        // Vérifier le statut premium
        const subscription = await checkSubscriptionStatus();
        setIsPremium(subscription.isPremium);
        setCurrentSubscription(subscription);
        console.log(`Statut Premium Forme: ${subscription.isPremium ? 'OUI' : 'NON'} (Plan: ${subscription.planId})`);
      }
    } catch (error) {
      console.error('Erreur chargement données utilisateur:', error);
    }
  };

  const loadFormeData = async () => {
    try {
      if (!userData) return;

      const today = new Date().toISOString().split('T')[0];

      // Charger uniquement depuis le serveur VPS
      let todayData = null;
      try {
        todayData = await PersistentStorage.getFormeData(userData.id, today);
        console.log('✅ Données de forme chargées depuis le serveur VPS');
      } catch (serverError) {
        console.log('⚠️ Aucune donnée de forme trouvée, création des données par défaut');
        // Créer des données par défaut si rien n'est trouvé
        todayData = {
          sleep: { hours: 0, quality: 'Moyen', bedTime: '', wakeTime: '' },
          stress: { level: 5, factors: [], notes: '' },
          heartRate: { resting: 0, variability: 0 },
          rpe: { value: 5, notes: '' },
          cycle: userData?.gender === 'Femme' ? { phase: 'Menstruel', dayOfCycle: 1, symptoms: [], notes: '' } : undefined,
          date: today
        };
        console.log('✅ Nouvelles données de forme par défaut créées');
      }

      // Récupérer les données nutritionnelles réelles depuis la nutrition
      const nutritionData = await getTodayNutritionData();
      todayData = {
        ...todayData,
        actualCalories: nutritionData.calories,
        actualMacros: {
          proteins: nutritionData.proteins,
          carbohydrates: nutritionData.carbohydrates,
          fat: nutritionData.fat
        },
        actualMicros: {
          // Vitamines
          vitaminA: nutritionData.vitaminA,
          vitaminC: nutritionData.vitaminC,
          vitaminD: nutritionData.vitaminD,
          vitaminE: nutritionData.vitaminE,
          vitaminK: nutritionData.vitaminK,
          vitaminB1: nutritionData.vitaminB1,
          vitaminB2: nutritionData.vitaminB2,
          vitaminB3: nutritionData.vitaminB3,
          vitaminB5: nutritionData.vitaminB5,
          vitaminB6: nutritionData.vitaminB6,
          vitaminB7: nutritionData.vitaminB7,
          vitaminB9: nutritionData.vitaminB9,
          vitaminB12: nutritionData.vitaminB12,
          // Minéraux
          calcium: nutritionData.calcium,
          iron: nutritionData.iron,
          magnesium: nutritionData.magnesium,
          potassium: nutritionData.potassium,
          zinc: nutritionData.zinc,
          sodium: nutritionData.sodium,
          phosphorus: nutritionData.phosphorus,
          selenium: nutritionData.selenium,
          copper: nutritionData.copper,
          manganese: nutritionData.manganese,
          iodine: nutritionData.iodine,
          chromium: nutritionData.chromium,
          molybdenum: nutritionData.molybdenum,
          // Autres
          caffeine: nutritionData.caffeine,
          fiber: nutritionData.fiber,
          omega3: nutritionData.omega3,
          omega6: nutritionData.omega6,
        }
      };
      console.log(`Données nutrition complètes du jour récupérées: ${nutritionData.calories} kcal, ${nutritionData.proteins}g protéines, ${nutritionData.vitaminC}mg vitamine C, ${nutritionData.calcium}mg calcium`);

      // Récupérer les notes RPE du jour depuis les activités
      if (isPremium) {
        const todayRPEData = await getTodayActivityRPE();
        if (todayRPEData) {
          todayData = {
            ...todayData,
            rpe: {
              value: todayRPEData.rpe,
              notes: todayRPEData.notes || '',
              workoutId: 'auto_from_activity'
            }
          };
          // Sauvegarder automatiquement les données mises à jour
          await saveFormeData(todayData);
        }
      }

      setFormeData(todayData);

      // Charger les données de la semaine
      const weekData = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateString = date.toISOString().split('T')[0];

        // Charger uniquement depuis le serveur VPS
        let dayData;
        try {
          dayData = await PersistentStorage.getFormeData(userData.id, dateString);
        } catch (error) {
          // Données par défaut si aucune donnée trouvée
          dayData = {
            sleep: { hours: 0, quality: 'Moyen', bedTime: '', wakeTime: '' },
            stress: { level: 5, factors: [], notes: '' },
            heartRate: { resting: 0, variability: 0 },
            rpe: { value: 5, notes: '' },
            cycle: userData?.gender === 'Femme' ? { phase: 'Menstruel', dayOfCycle: 1, symptoms: [], notes: '' } : undefined,
            date: dateString
          };
        }

        weekData.push(dayData);
      }
      setWeeklyData(weekData);

    } catch (error) {
      console.error('Erreur chargement données forme:', error);
    }
  };

  const saveFormeData = async (newData: FormeData) => {
    try {
      if (!userData) return;

      // Sauvegarder uniquement sur le serveur VPS
      await PersistentStorage.saveFormeData(userData.id, newData.date, newData);
      console.log('Données de forme sauvegardées sur le serveur VPS');

      // Mettre à jour l'état local
      setFormeData(newData);

    } catch (error) {
      console.error('Erreur sauvegarde données forme:', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder les données.');
    }
  };

  const calculateFormeScore = async () => {
    if (!userData) {
      console.log('❌ Pas de données utilisateur pour calculer le score');
      return;
    }

    let totalScore = 0;
    let totalWeight = 0;

    // Adaptation des poids selon le genre
    const isWoman = userData?.gender === 'Femme';

    // Définir les poids de base
    let baseWeights = {
      sleep: 0.35,
      stress: 0.30,
      calories: 0.15,
      training: 0.00,
      heartRate: 0.00,
      rpe: 0.00,
      cycle: isWoman ? 0.20 : 0.00 // Poids plus important pour le cycle
    };

    // Ajuster les poids en fonction du plan d'abonnement
    let weights = { ...baseWeights };

    if (!isPremium) {
      // Plan Gratuit: sommeil, stress, calories, entraînement
      weights.heartRate = 0;
      weights.rpe = 0;
      weights.training = 0.20;
      weights.calories = 0.15;
    } else {
      // Plans Premium: sommeil, stress, FC, RPE, calories, cycle
      weights.training = 0;
      weights.heartRate = 0.10; // FC repos
      weights.rpe = 0.10;       // RPE
      weights.calories = 0.05; // Calories (moins important dans les plans avancés)
    }

    // Normaliser les poids pour que la somme soit égale à 1 (ou 100%)
    const totalBaseWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
    if (totalBaseWeight > 0) {
      for (const key in weights) {
        weights[key] = weights[key] / totalBaseWeight;
      }
    }

    console.log("🔄 Calcul score de forme - Premium:", isPremium);
    console.log("📊 Poids calculés:", weights);

    // Sommeil
    if (formeData.sleep.hours > 0) {
      // Score basé sur les heures de sommeil (optimal: 7-9h)
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

      // Multiplicateur qualité
      const qualityMultiplier = {
        'Excellent': 1.0,
        'Bien': 0.85,
        'Moyen': 0.65,
        'Mauvais': 0.4
      };

      let sleepScore = sleepHoursScore * qualityMultiplier[formeData.sleep.quality];

      // Ajustement cycle pour les femmes: le sommeil est plus impacté selon la phase
      if (isWoman && formeData.cycle) {
        const cycleMultiplier = {
          'Menstruel': 0.9,      // Sommeil plus difficile pendant les règles
          'Folliculaire': 1.0,   // Sommeil normal
          'Ovulation': 1.05,     // Légère amélioration
          'Lutéal': 0.85         // Sommeil souvent perturbé en pré-menstruel
        };
        sleepScore *= cycleMultiplier[formeData.cycle.phase];
      }

      totalScore += sleepScore * weights.sleep;
      totalWeight += weights.sleep;
    }

    // Stress - inversé (1 = excellent, 10 = très mauvais)
    let stressScore = Math.max(0, ((10 - formeData.stress.level) / 9) * 100);

    // Ajustement cycle pour les femmes: le stress est plus sensible selon la phase
    if (isWoman && formeData.cycle) {
      const stressCycleMultiplier = {
        'Menstruel': 0.8,       // Plus de stress/irritabilité
        'Folliculaire': 1.1,    // Généralement moins de stress
        'Ovulation': 1.15,      // Pic de bien-être
        'Lutéal': 0.7           // Stress pré-menstruel important
      };
      stressScore *= stressCycleMultiplier[formeData.cycle.phase];
    }

    totalScore += stressScore * weights.stress;
    totalWeight += weights.stress;

    // Apport calorique - Tous les plans
    if (weights.calories > 0) {
      let caloriesScore = 75; // Score par défaut

      // Utiliser les calories réelles si disponibles
      const actualCalories = formeData.actualCalories || 0;

      if (actualCalories > 0) {
        // Calculer l'objectif calorique basé sur le profil utilisateur
        const targetCalories = Math.round(
          (userData?.gender === 'Homme' ? 2200 : 1800) * 
          (userData?.activityLevel === 'sedentaire' ? 1.2 : 
           userData?.activityLevel === 'leger' ? 1.375 :
           userData?.activityLevel === 'modere' ? 1.55 :
           userData?.activityLevel === 'intense' ? 1.725 : 1.9)
        );

        // Score basé sur la proximité avec l'objectif (±20% de marge acceptable)
        const lowerBound = targetCalories * 0.8;
        const upperBound = targetCalories * 1.2;

        if (actualCalories >= lowerBound && actualCalories <= upperBound) {
          caloriesScore = 100; // Parfait dans la fourchette
        } else if (actualCalories >= lowerBound * 0.7 && actualCalories <= upperBound * 1.3) {
          caloriesScore = 80; // Acceptable
        } else if (actualCalories >= lowerBound * 0.5 && actualCalories <= upperBound * 1.5) {
          caloriesScore = 60; // Moyen
        } else {
          caloriesScore = 40; // Trop loin de l'objectif
        }

        console.log(`Score calories: ${caloriesScore} (consommé: ${actualCalories}, objectif: ${targetCalories})`);
      } else {
        // Pas de données nutrition = score neutre
        caloriesScore = 50;
        console.log('Aucune donnée calorique - score neutre');
      }

      totalScore += caloriesScore * weights.calories;
      totalWeight += weights.calories;
    }

    // Entraînement programmé - Plan gratuit uniquement
    if (weights.training > 0) {
      let trainingScore = 50; // Score par défaut

      // Vérifier s'il y a des entraînements programmés aujourd'hui
      const today = new Date().toISOString().split('T')[0];
      // Simuler la présence d'entraînements (à adapter selon votre logique)
      const hasTrainingToday = weeklyData.some(day => 
        day.date === today && day.rpe?.value > 0
      );

      trainingScore = hasTrainingToday ? 85 : 40;

      totalScore += trainingScore * weights.training;
      totalWeight += weights.training;
    }

    // FC repos - Plans Bronze et plus
    if (weights.heartRate > 0 && formeData.heartRate.resting > 0) {
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
        const adjustedDiff = Math.abs(formeData.heartRate.resting - adjustedOptimal);

        if (adjustedDiff <= 5) hrScore = 100;
        else if (adjustedDiff <= 10) hrScore = 85;
        else if (adjustedDiff <= 15) hrScore = 70;
        else if (adjustedDiff <= 20) hrScore = 55;
        else hrScore = 30;
      } else {
        let hrScore;
        if (diff <= 5) hrScore = 100;
        else if (diff <= 10) hrScore = 85;
        else if (diff <= 15) hrScore = 70;
        else if (diff <= 20) hrScore = 55;
        else hrScore = 30;
      }

      totalScore += hrScore * weights.heartRate;
      totalWeight += weights.heartRate;
    }

    // RPE - Premium (1-3 = excellent, 8-10 = épuisé)
    if (isPremium && formeData.rpe.value > 0) {
      let rpeScore;
      if (formeData.rpe.value <= 3) rpeScore = 100;      // Très facile
      else if (formeData.rpe.value <= 5) rpeScore = 80;  // Modéré
      else if (formeData.rpe.value <= 7) rpeScore = 60;  // Difficile
      else rpeScore = 30;                                // Très difficile

      // Ajustement cycle pour les femmes: performance varie selon la phase
      if (isWoman && formeData.cycle) {
        const rpeCycleMultiplier = {
          'Menstruel': 0.8,      // Performance réduite, récupération plus difficile
          'Folliculaire': 1.15,  // Phase d'amélioration des performances
          'Ovulation': 1.2,      // Pic de performance
          'Lutéal': 0.85         // Fatigue pré-menstruelle
        };
        rpeScore *= rpeCycleMultiplier[formeData.cycle.phase];
      }

      totalScore += rpeScore * weights.rpe;
      totalWeight += weights.rpe;
    }

    // Cycle hormonal pour les femmes (poids beaucoup plus important)
    if (isWoman && formeData.cycle) {
      let cycleScore = 75; // Score de base

      // Ajustements détaillés selon la phase et le jour du cycle
      const dayInCycle = formeData.cycle.dayOfCycle;

      switch (formeData.cycle.phase) {
        case 'Menstruel':
          // Jours 1-5: Score bas mais progressif
          if (dayInCycle <= 2) {
            cycleScore = 45; // Jours les plus difficiles
          } else if (dayInCycle <= 4) {
            cycleScore = 55; // Amélioration progressive
          } else {
            cycleScore = 65; // Fin des règles
          }
          break;

        case 'Folliculaire':
          // Jours 6-13: Amélioration progressive
          cycleScore = 70 + Math.min((dayInCycle - 5) * 3, 20); // 70 à 90
          break;

        case 'Ovulation':
          // Jours 14-16: Pic d'énergie
          cycleScore = 95;
          break;

        case 'Lutéal':
          // Jours 17-28: Déclin progressif
          const lutealDay = dayInCycle - 16;
          if (lutealDay <= 4) {
            cycleScore = 80; // Début de phase lutéale
          } else if (lutealDay <= 8) {
            cycleScore = 70; // Milieu de phase
          } else {
            cycleScore = 50; // SPM (syndrome pré-menstruel)
          }
          break;
      }

      // Réduction importante selon les symptômes
      const symptomPenalty = Math.min(formeData.cycle.symptoms.length * 8, 40);
      cycleScore = Math.max(25, cycleScore - symptomPenalty);

      // Bonus pour absence de symptômes en phase favorable
      if (formeData.cycle.symptoms.length === 0 && 
          (formeData.cycle.phase === 'Folliculaire' || formeData.cycle.phase === 'Ovulation')) {
        cycleScore = Math.min(100, cycleScore + 5);
      }

      totalScore += cycleScore * weights.cycle;
      totalWeight += weights.cycle;
    }

    console.log("📊 Données de calcul:", {
      sommeil: { heures: formeData.sleep.hours, qualité: formeData.sleep.quality },
      stress: formeData.stress.level,
      calories: formeData.actualCalories,
      heartRate: formeData.heartRate.resting,
      rpe: formeData.rpe.value,
      cycle: formeData.cycle?.phase
    });

    // Calculer le score final
    let finalScore;
    if (totalWeight === 0) {
      finalScore = 50; // Score par défaut si aucune donnée
      console.log("⚠️ Aucune donnée disponible, score par défaut: 50");
    } else {
      finalScore = totalScore / totalWeight;
      console.log(`📊 Score calculé: ${totalScore}/${totalWeight} = ${finalScore}`);
    }

    // S'assurer que le score est entre 0 et 100
    finalScore = Math.max(0, Math.min(100, Math.round(finalScore)));
    setFormeScore(finalScore);

    // Sauvegarder le score calculé avec les données de forme
    try {
      const today = new Date().toISOString().split('T')[0];
      const updatedFormeData = {
        ...formeData,
        formeScore: finalScore,
        lastScoreUpdate: new Date().toISOString()
      };
      await PersistentStorage.saveFormeData(userData.id, today, updatedFormeData);
      console.log(`✅ Score de forme sauvegardé: ${finalScore}/100 pour ${today}`);
    } catch (error) {
      console.error('❌ Erreur sauvegarde score de forme:', error);
    }
  };

  const handleSaveSleep = async () => {
    // Fermer le clavier
    const { Keyboard } = await import('react-native');
    Keyboard.dismiss();

    const inputValue = tempSleep.hours.replace(',', '.');

    // Validation pour format décimal (ex: 7.59 = 7h59min maximum)
    const hours = parseFloat(inputValue);
    if (isNaN(hours) || hours < 0 || hours > 24) {
      Alert.alert('Erreur', 'Veuillez entrer un nombre d\'heures valide (0-24)\nExemple: 7.59 pour 7h59min');
      return;
    }

    // Vérifier que les décimales ne dépassent pas 59 (pour les minutes)
    const wholeHours = Math.floor(hours);
    const decimalPart = hours - wholeHours;

    if (decimalPart > 0.59) {
      Alert.alert('Erreur', 'Les minutes ne peuvent pas dépasser 59.\nExemple: 7.59 pour 7h59min (maximum)');
      return;
    }

    // Convertir les décimales en minutes réelles
    const minutes = Math.round(decimalPart * 100);
    const correctedHours = wholeHours + (minutes / 60);

    const newData = {
      ...formeData,
      sleep: {
        hours: correctedHours,
        quality: tempSleep.quality as 'Excellent' | 'Bien' | 'Moyen' | 'Mauvais',
        bedTime: tempSleep.bedTime,
        wakeTime: tempSleep.wakeTime
      }
    };

    await saveFormeData(newData);
    setShowSleepModal(false);
    setTempSleep({ hours: '', quality: 'Moyen', bedTime: '', wakeTime: '' });
    Alert.alert('Succès', 'Données de sommeil enregistrées !');
  };

  const handleSaveStress = async () => {
    const newData = {
      ...formeData,
      stress: {
        level: tempStress.level,
        factors: tempStress.factors,
        notes: tempStress.notes
      }
    };

    await saveFormeData(newData);
    setShowStressModal(false);
    setTempStress({ level: 5, factors: [], notes: '' });
    Alert.alert('Succès', 'Niveau de stress enregistré !');
  };

  const handleSaveHeartRate = async () => {
    if (!isPremium) {
      Alert.alert('Fonctionnalité Premium', 'Le suivi de la fréquence cardiaque est réservé aux abonnés premium.');
      return;
    }

    const resting = parseInt(tempHeartRate.resting);
    const variability = parseInt(tempHeartRate.variability);

    if (isNaN(resting) || resting < 30 || resting > 200) {
      Alert.alert('Erreur', 'Veuillez entrer une FC repos valide (30-200 bpm)');
      return;
    }

    if (isNaN(variability) || variability < 0 || variability > 200) {
      Alert.alert('Erreur', 'Veuillez entrer une variabilité FC valide (0-200 ms)');
      return;
    }

    const newData = {
      ...formeData,
      heartRate: {
        resting: resting,
        variability: variability
      }
    };

    await saveFormeData(newData);
    setShowHeartRateModal(false);
    setTempHeartRate({ resting: '', variability: '' });
    Alert.alert('Succès', 'Données de fréquence cardiaque enregistrées !');
  };



  const handleSaveCycle = async () => {
    if (userData?.gender !== 'Femme') {
      Alert.alert('Erreur', 'Le suivi du cycle hormonal est réservé aux femmes.');
      return;
    }

    if (tempCycle.dayOfCycle < 1 || tempCycle.dayOfCycle > 35) {
      Alert.alert('Erreur', 'Veuillez entrer un jour de cycle valide (1-35)\nUn cycle dure en moyenne 28 jours');
      return;
    }

    const newData = {
      ...formeData,
      cycle: {
        phase: tempCycle.phase as 'Menstruel' | 'Folliculaire' | 'Ovulation' | 'Lutéal',
        dayOfCycle: tempCycle.dayOfCycle,
        symptoms: tempCycle.symptoms,
        notes: tempCycle.notes
      }
    };

    await saveFormeData(newData);
    setShowCycleModal(false);
    setTempCycle({ phase: 'Menstruel', dayOfCycle: 1, symptoms: [], notes: '' });
    Alert.alert('Succès', 'Informations sur le cycle hormonal enregistrées !');
  };

  const getTodayNutritionData = async () => {
    try {
      if (!userData) return { 
        calories: 0, proteins: 0, carbohydrates: 0, fat: 0,
        // Micronutriments - Vitamines
        vitaminA: 0, vitaminC: 0, vitaminD: 0, vitaminE: 0, vitaminK: 0,
        vitaminB1: 0, vitaminB2: 0, vitaminB3: 0, vitaminB5: 0, vitaminB6: 0,
        vitaminB7: 0, vitaminB9: 0, vitaminB12: 0,
        // Micronutriments - Minéraux
        calcium: 0, iron: 0, magnesium: 0, potassium: 0, zinc: 0,
        sodium: 0, phosphorus: 0, selenium: 0, copper: 0, manganese: 0,
        iodine: 0, chromium: 0, molybdenum: 0,
        // Autres
        caffeine: 0, fiber: 0, omega3: 0, omega6: 0
      };

      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      const today = new Date().toISOString().split('T')[0];

      // Fonction d'estimation des micronutriments (même logique que nutrition.tsx)
      const estimateMicronutrients = (entry: any) => {
        const productName = entry.product?.name?.toLowerCase() || '';
        const calories = entry.calories || 0;

        let vitaminA = 0, vitaminC = 0, vitaminD = 0, vitaminE = 0, vitaminK = 0;
        let vitaminB1 = 0, vitaminB2 = 0, vitaminB3 = 0, vitaminB5 = 0, vitaminB6 = 0;
        let vitaminB7 = 0, vitaminB9 = 0, vitaminB12 = 0;
        let calcium = 0, iron = 0, magnesium = 0, potassium = 0, zinc = 0;
        let sodium = 0, phosphorus = 0, selenium = 0, copper = 0, manganese = 0;
        let iodine = 0, chromium = 0, molybdenum = 0;
        let caffeine = 0, fiber = 0, omega3 = 0, omega6 = 0;

        // Estimation basée sur les types d'aliments
        if (productName.includes('café') || productName.includes('coffee') || productName.includes('expresso')) {
          caffeine = calories * 8;
          potassium = calories * 2;
          magnesium = calories * 0.3;
        } else if (productName.includes('thé') || productName.includes('tea')) {
          caffeine = calories * 3;
          vitaminC = calories * 0.5;
          manganese = calories * 0.02;
        } else if (productName.includes('chocolat') || productName.includes('cacao')) {
          caffeine = calories * 0.8;
          magnesium = calories * 1.5;
          iron = calories * 0.12;
          copper = calories * 0.008;
          fiber = calories * 0.3;
        } else if (productName.includes('fruit') || productName.includes('orange') || productName.includes('pomme') || productName.includes('banane')) {
          vitaminC = calories * 0.8;
          potassium = calories * 3;
          vitaminA = calories * 0.1;
          fiber = calories * 0.4;
          vitaminB9 = calories * 0.02;
        } else if (productName.includes('légume') || productName.includes('carotte') || productName.includes('épinard') || productName.includes('brocoli')) {
          vitaminA = calories * 1.2;
          vitaminC = calories * 0.6;
          vitaminK = calories * 0.8;
          iron = calories * 0.05;
          magnesium = calories * 0.8;
          fiber = calories * 0.5;
          vitaminB9 = calories * 0.03;
          manganese = calories * 0.01;
        } else if (productName.includes('viande') || productName.includes('porc') || productName.includes('bœuf') || productName.includes('agneau')) {
          vitaminB12 = calories * 0.02;
          vitaminB6 = calories * 0.008;
          vitaminB3 = calories * 0.06;
          iron = calories * 0.08;
          zinc = calories * 0.06;
          vitaminB1 = calories * 0.004;
          selenium = calories * 0.015;
          phosphorus = calories * 2;
        } else if (productName.includes('poisson') || productName.includes('saumon') || productName.includes('thon') || productName.includes('sardine')) {
          vitaminD = calories * 0.03;
          vitaminB12 = calories * 0.025;
          calcium = calories * 0.5;
          vitaminE = calories * 0.05;
          omega3 = calories * 0.08;
          selenium = calories * 0.02;
          iodine = calories * 0.01;
          phosphorus = calories * 2.5;
        } else if (productName.includes('lait') || productName.includes('fromage') || productName.includes('yaourt') || productName.includes('dairy')) {
          calcium = calories * 2.5;
          vitaminD = calories * 0.01;
          vitaminB12 = calories * 0.01;
          vitaminA = calories * 0.08;
          vitaminB2 = calories * 0.008;
          phosphorus = calories * 2;
          sodium = calories * 0.5;
        } else if (productName.includes('céréale') || productName.includes('pain') || productName.includes('riz') || productName.includes('pâte')) {
          vitaminB1 = calories * 0.006;
          vitaminB6 = calories * 0.005;
          vitaminB3 = calories * 0.04;
          iron = calories * 0.03;
          magnesium = calories * 0.6;
          fiber = calories * 0.3;
          vitaminB9 = calories * 0.025;
          manganese = calories * 0.008;
        } else if (productName.includes('noix') || productName.includes('amande') || productName.includes('noisette') || productName.includes('graine')) {
          vitaminE = calories * 0.15;
          magnesium = calories * 1.2;
          zinc = calories * 0.04;
          vitaminB6 = calories * 0.006;
          copper = calories * 0.01;
          manganese = calories * 0.01;
          omega6 = calories * 0.12;
          fiber = calories * 0.4;
        } else if (productName.includes('œuf') || productName.includes('egg')) {
          vitaminB12 = calories * 0.01;
          vitaminA = calories * 0.1;
          vitaminD = calories * 0.015;
          vitaminB7 = calories * 0.002;
          selenium = calories * 0.02;
          phosphorus = calories * 1.5;
          vitaminB2 = calories * 0.006;
        } else {
          // Valeurs par défaut
          vitaminA = calories * 0.05;
          vitaminC = calories * 0.3;
          vitaminD = calories * 0.005;
          vitaminE = calories * 0.03;
          vitaminK = calories * 0.02;
          vitaminB1 = calories * 0.003;
          vitaminB2 = calories * 0.003;
          vitaminB3 = calories * 0.02;
          vitaminB5 = calories * 0.01;
          vitaminB6 = calories * 0.004;
          vitaminB7 = calories * 0.001;
          vitaminB9 = calories * 0.015;
          vitaminB12 = calories * 0.008;
          calcium = calories * 0.8;
          iron = calories * 0.04;
          magnesium = calories * 0.5;
          potassium = calories * 2;
          zinc = calories * 0.03;
          sodium = calories * 0.3;
          phosphorus = calories * 1;
          selenium = calories * 0.005;
          copper = calories * 0.003;
          manganese = calories * 0.005;
          iodine = calories * 0.002;
          chromium = calories * 0.001;
          molybdenum = calories * 0.001;
          fiber = calories * 0.2;
          omega3 = calories * 0.01;
          omega6 = calories * 0.03;
        }

        return {
          vitaminA: Math.round(vitaminA * 10) / 10,
          vitaminC: Math.round(vitaminC * 10) / 10,
          vitaminD: Math.round(vitaminD * 10) / 10,
          vitaminE: Math.round(vitaminE * 10) / 10,
          vitaminK: Math.round(vitaminK * 10) / 10,
          vitaminB1: Math.round(vitaminB1 * 100) / 100,
          vitaminB2: Math.round(vitaminB2 * 100) / 100,
          vitaminB3: Math.round(vitaminB3 * 10) / 10,
          vitaminB5: Math.round(vitaminB5 * 10) / 10,
          vitaminB6: Math.round(vitaminB6 * 100) / 100,
          vitaminB7: Math.round(vitaminB7 * 1000) / 1000,
          vitaminB9: Math.round(vitaminB9 * 10) / 10,
          vitaminB12: Math.round(vitaminB12 * 100) / 100,
          calcium: Math.round(calcium * 10) / 10,
          iron: Math.round(iron * 100) / 100,
          magnesium: Math.round(magnesium * 10) / 10,
          potassium: Math.round(potassium * 10) / 10,
          zinc: Math.round(zinc * 100) / 100,
          sodium: Math.round(sodium * 10) / 10,
          phosphorus: Math.round(phosphorus * 10) / 10,
          selenium: Math.round(selenium * 100) / 100,
          copper: Math.round(copper * 1000) / 1000,
          manganese: Math.round(manganese * 1000) / 1000,
          iodine: Math.round(iodine * 100) / 100,
          chromium: Math.round(chromium * 1000) / 1000,
          molybdenum: Math.round(molybdenum * 1000) / 1000,
          caffeine: Math.round(caffeine * 10) / 10,
          fiber: Math.round(fiber * 10) / 10,
          omega3: Math.round(omega3 * 100) / 100,
          omega6: Math.round(omega6 * 100) / 100,
        };
      };

      // Charger depuis le serveur VPS
      try {
        const VPS_URL = process.env.EXPO_PUBLIC_VPS_URL || 'https://eatfitbymax.cloud';
        const response = await fetch(`${VPS_URL}/api/nutrition/${userData.id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        if (response.ok) {
          const nutritionEntries = await response.json();
          const todayEntries = nutritionEntries.filter((entry: any) => entry.date === today);

          const totals = todayEntries.reduce((sum: any, entry: any) => {
            const estimatedMicros = estimateMicronutrients(entry);
            return {
              calories: sum.calories + (entry.calories || 0),
              proteins: sum.proteins + (entry.proteins || 0),
              carbohydrates: sum.carbohydrates + (entry.carbohydrates || 0),
              fat: sum.fat + (entry.fat || 0),
              // Vitamines
              vitaminA: sum.vitaminA + estimatedMicros.vitaminA,
              vitaminC: sum.vitaminC + estimatedMicros.vitaminC,
              vitaminD: sum.vitaminD + estimatedMicros.vitaminD,
              vitaminE: sum.vitaminE + estimatedMicros.vitaminE,
              vitaminK: sum.vitaminK + estimatedMicros.vitaminK,
              vitaminB1: sum.vitaminB1 + estimatedMicros.vitaminB1,
              vitaminB2: sum.vitaminB2 + estimatedMicros.vitaminB2,
              vitaminB3: sum.vitaminB3 + estimatedMicros.vitaminB3,
              vitaminB5: sum.vitaminB5 + estimatedMicros.vitaminB5,
              vitaminB6: sum.vitaminB6 + estimatedMicros.vitaminB6,
              vitaminB7: sum.vitaminB7 + estimatedMicros.vitaminB7,
              vitaminB9: sum.vitaminB9 + estimatedMicros.vitaminB9,
              vitaminB12: sum.vitaminB12 + estimatedMicros.vitaminB12,
              // Minéraux
              calcium: sum.calcium + estimatedMicros.calcium,
              iron: sum.iron + estimatedMicros.iron,
              magnesium: sum.magnesium + estimatedMicros.magnesium,
              potassium: sum.potassium + estimatedMicros.potassium,
              zinc: sum.zinc + estimatedMicros.zinc,
              sodium: sum.sodium + estimatedMicros.sodium,
              phosphorus: sum.phosphorus + estimatedMicros.phosphorus,
              selenium: sum.selenium + estimatedMicros.selenium,
              copper: sum.copper + estimatedMicros.copper,
              manganese: sum.manganese + estimatedMicros.manganese,
              iodine: sum.iodine + estimatedMicros.iodine,
              chromium: sum.chromium + estimatedMicros.chromium,
              molybdenum: sum.molybdenum + estimatedMicros.molybdenum,
              // Autres
              caffeine: sum.caffeine + estimatedMicros.caffeine,
              fiber: sum.fiber + estimatedMicros.fiber,
              omega3: sum.omega3 + estimatedMicros.omega3,
              omega6: sum.omega6 + estimatedMicros.omega6,
            };
          }, { 
            calories: 0, proteins: 0, carbohydrates: 0, fat: 0,
            // Vitamines
            vitaminA: 0, vitaminC: 0, vitaminD: 0, vitaminE: 0, vitaminK: 0,
            vitaminB1: 0, vitaminB2: 0, vitaminB3: 0, vitaminB5: 0, vitaminB6: 0,
            vitaminB7: 0, vitaminB9: 0, vitaminB12: 0,
            // Minéraux
            calcium: 0, iron: 0, magnesium: 0, potassium: 0, zinc: 0,
            sodium: 0, phosphorus: 0, selenium: 0, copper: 0, manganese: 0,
            iodine: 0, chromium: 0, molybdenum: 0,
            // Autres
            caffeine: 0, fiber: 0, omega3: 0, omega6: 0
          });

          console.log(`Nutrition complète depuis serveur: ${totals.calories} kcal, ${totals.proteins}g protéines, ${totals.vitaminC}mg vitC, ${totals.calcium}mg calcium`);
          return totals;
        }
      } catch (serverError) {
        console.log('Serveur nutrition indisponible:', serverError.message);
      }

      console.log('Aucune donnée nutrition trouvée');
      return { 
        calories: 0, proteins: 0, carbohydrates: 0, fat: 0,
        // Vitamines
        vitaminA: 0, vitaminC: 0, vitaminD: 0, vitaminE: 0, vitaminK: 0,
        vitaminB1: 0, vitaminB2: 0, vitaminB3: 0, vitaminB5: 0, vitaminB6: 0,
        vitaminB7: 0, vitaminB9: 0, vitaminB12: 0,
        // Minéraux
        calcium: 0, iron: 0, magnesium: 0, potassium: 0, zinc: 0,
        sodium: 0, phosphorus: 0, selenium: 0, copper: 0, manganese: 0,
        iodine: 0, chromium: 0, molybdenum: 0,
        // Autres
        caffeine: 0, fiber: 0, omega3: 0, omega6: 0
      };
    } catch (error) {
      console.error('Erreur récupération données nutrition:', error);
      return { 
        calories: 0, proteins: 0, carbohydrates: 0, fat: 0,
        // Vitamines
        vitaminA: 0, vitaminC: 0, vitaminD: 0, vitaminE: 0, vitaminK: 0,
        vitaminB1: 0, vitaminB2: 0, vitaminB3: 0, vitaminB5: 0, vitaminB6: 0,
        vitaminB7: 0, vitaminB9: 0, vitaminB12: 0,
        // Minéraux
        calcium: 0, iron: 0, magnesium: 0, potassium: 0, zinc: 0,
        sodium: 0, phosphorus: 0, selenium: 0, copper: 0, manganese: 0,
        iodine: 0, chromium: 0, molybdenum: 0,
        // Autres
        caffeine: 0, fiber: 0, omega3: 0, omega6: 0
      };
    }
  };

  const analyzeMacroBalance = (macros: { proteins: number; carbohydrates: number; fat: number }, totalCalories: number) => {
    if (!macros.proteins && !macros.carbohydrates && !macros.fat) {
      return {
        status: 'Aucune donnée',
        score: 50,
        issues: ['Pas de données nutritionnelles disponibles']
      };
    }

    // Calculer les calories réelles de chaque macronutriment
    const proteinCalories = macros.proteins * 4;
    const carbCalories = macros.carbohydrates * 4;
    const fatCalories = macros.fat * 9;
    const totalMacroCalories = proteinCalories + carbCalories + fatCalories;

    if (totalMacroCalories === 0) {
      return {
        status: 'Données incomplètes',
        score: 40,
        issues: ['Macronutriments non renseignés']
      };
    }

    // Calculer les pourcentages basés sur les calories réelles des macronutriments
    const proteinPercent = (proteinCalories / totalMacroCalories) * 100;
    const carbPercent = (carbCalories / totalMacroCalories) * 100;
    const fatPercent = (fatCalories / totalMacroCalories) * 100;

    // Définir les fourchettes optimales selon les objectifs
    const goals = userData?.goals || [];
    let optimalRanges = {
      protein: { min: 15, max: 25 },
      carb: { min: 45, max: 60 },
      fat: { min: 20, max: 35 }
    };

    if (goals.includes('Me muscler')) {
      optimalRanges = {
        protein: { min: 25, max: 35 },
        carb: { min: 40, max: 50 },
        fat: { min: 20, max: 30 }
      };
    } else if (goals.includes('Gagner en performance')) {
      optimalRanges = {
        protein: { min: 20, max: 30 },
        carb: { min: 50, max: 65 },
        fat: { min: 15, max: 25 }
      };
    }

    // Analyser chaque macronutriment
    const issues = [];
    let score = 100;

    // Calculer les écarts par rapport aux fourchettes optimales
    const proteinDeviation = proteinPercent < optimalRanges.protein.min ? 
      optimalRanges.protein.min - proteinPercent : 
      proteinPercent > optimalRanges.protein.max ? proteinPercent - optimalRanges.protein.max : 0;

    const carbDeviation = carbPercent < optimalRanges.carb.min ? 
      optimalRanges.carb.min - carbPercent : 
      carbPercent > optimalRanges.carb.max ? carbPercent - optimalRanges.carb.max : 0;

    const fatDeviation = fatPercent < optimalRanges.fat.min ? 
      optimalRanges.fat.min - fatPercent : 
      fatPercent > optimalRanges.fat.max ? fatPercent - optimalRanges.fat.max : 0;

    // Protéines avec pénalités progressives
    if (proteinPercent < optimalRanges.protein.min) {
      issues.push(`Protéines insuffisantes (${Math.round(proteinPercent)}% vs ${optimalRanges.protein.min}-${optimalRanges.protein.max}%)`);
      if (proteinDeviation > 20) score -= 35; // Déficit extrême (< 5% si optimal 25%)
      else if (proteinDeviation > 10) score -= 25; // Déficit sévère
      else score -= 15; // Déficit modéré
    } else if (proteinPercent > optimalRanges.protein.max) {
      issues.push(`Protéines excessives (${Math.round(proteinPercent)}% vs ${optimalRanges.protein.min}-${optimalRanges.protein.max}%)`);
      if (proteinDeviation > 20) score -= 20; // Excès extrême
      else if (proteinDeviation > 10) score -= 15; // Excès sévère
      else score -= 10; // Excès modéré
    }

    // Glucides avec pénalités progressives
    if (carbPercent < optimalRanges.carb.min) {
      issues.push(`Glucides insuffisants (${Math.round(carbPercent)}% vs ${optimalRanges.carb.min}-${optimalRanges.carb.max}%)`);
      if (carbDeviation > 30) score -= 30; // Déficit extrême (< 15% si optimal 45%)
      else if (carbDeviation > 20) score -= 20; // Déficit sévère
      else score -= 15; // Déficit modéré
    } else if (carbPercent > optimalRanges.carb.max) {
      issues.push(`Glucides excessifs (${Math.round(carbPercent)}% vs ${optimalRanges.carb.min}-${optimalRanges.carb.max}%)`);
      if (carbDeviation > 30) score -= 25; // Excès extrême
      else if (carbDeviation > 20) score -= 15; // Excès sévère
      else score -= 10; // Excès modéré
    }

    // Lipides avec pénalités progressives (plus sévères car dangereux en excès)
    if (fatPercent < optimalRanges.fat.min) {
      issues.push(`Lipides insuffisants (${Math.round(fatPercent)}% vs ${optimalRanges.fat.min}-${optimalRanges.fat.max}%)`);
      if (fatDeviation > 15) score -= 25; // Déficit extrême
      else if (fatDeviation > 10) score -= 20; // Déficit sévère
      else score -= 15; // Déficit modéré
    } else if (fatPercent > optimalRanges.fat.max) {
      issues.push(`Lipides excessifs (${Math.round(fatPercent)}% vs ${optimalRanges.fat.min}-${optimalRanges.fat.max}%)`);
      if (fatDeviation > 50) score -= 50; // Excès extrême (> 85% si optimal 35%)
      else if (fatDeviation > 30) score -= 35; // Excès sévère (> 65%)
      else if (fatDeviation > 20) score -= 25; // Excès important (> 55%)
      else score -= 15; // Excès modéré
    }

    // Pénalité supplémentaire pour des déséquilibres extrêmes multiples
    const extremeDeviations = [proteinDeviation, carbDeviation, fatDeviation].filter(d => d > 25);
    if (extremeDeviations.length >= 2) {
      score -= 20; // Pénalité pour multiples déséquilibres extrêmes
    }

    // Score minimum de 0
    score = Math.max(0, score);

    let status = 'Excellent';
    if (score < 30) status = 'Critique';
    else if (score < 50) status = 'Médiocre';
    else if (score < 70) status = 'Moyen';
    else if (score < 85) status = 'Bon';

    return {
      status,
      score: Math.round(score),
      issues: issues.length > 0 ? issues : ['Équilibre optimal atteint']
    };
  };

  const getTodayActivityRPE = async () => {
    try {
      if (!userData) return null;

      // Charger les notes RPE depuis le serveur VPS
      const storedRatings = await PersistentStorage.getActivityRatings(userData.id);

      if (!storedRatings || Object.keys(storedRatings).length === 0) {
        console.log('Aucune note RPE trouvée sur le serveur');
        return null;
      }

      const ratings = storedRatings;

      // Date du jour en format YYYY-MM-DD dans le timezone local
      const today = new Date();
      const todayString = today.getFullYear() + '-' + 
        String(today.getMonth() + 1).padStart(2, '0') + '-' + 
        String(today.getDate()).padStart(2, '0');

      console.log('Recherche RPE pour le jour:', todayString);

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
        console.log(`${todayRatings.length} activité(s) RPE trouvée(s) pour aujourd'hui`);

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

      console.log('Aucune activité RPE trouvée pour aujourd\'hui');
      return null;
    } catch (error) {
      console.error('Erreur récupération RPE du jour:', error);
      return null;
    }
  };

  const handleSyncHeartRate = async () => {
    if (!isPremium) {
      Alert.alert('Fonctionnalité Premium', 'Le suivi de la fréquence cardiaque est réservé aux abonnés premium.');
      return;
    }

    if (!userData) {
      Alert.alert('Erreur', 'Utilisateur non connecté');
      return;
    }

    try {
      Alert.alert(
        'Synchronisation FC',
        'Synchroniser les données de fréquence cardiaque depuis Apple Health, votre montre connectée ou d\'autres capteurs ?',
        [
          { text: 'Annuler', style: 'cancel' },
          { 
            text: 'Synchroniser', 
            onPress: async () => {
              try {
                // Vérifier le statut de l'intégration Apple Health
                const integrationStatus = await IntegrationsManager.getIntegrationStatus(userData.id);

                if (!integrationStatus.appleHealth.connected) {
                  Alert.alert(
                    'Apple Health requis',
                    'Pour synchroniser vos données de fréquence cardiaque, vous devez d\'abord connecter Apple Health dans votre profil.',
                    [
                      { text: 'OK', style: 'default' },
                      { 
                        text: 'Connecter maintenant', 
                        onPress: async () => {
                          const success = await IntegrationsManager.connectAppleHealth(userData.id);
                          if (success) {
                            await syncHeartRateData();
                          }
                        }
                      }
                    ]
                  );
                  return;
                }

                await syncHeartRateData();
              } catch (error) {
                console.error('Erreur synchronisation FC:', error);
                Alert.alert('Erreur', 'Impossible de synchroniser les données de fréquence cardiaque');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Erreur gestion sync FC:', error);
      Alert.alert('Erreur', 'Une erreur est survenue');
    }
  };

  const syncHeartRateData = async () => {
    try {
      if (!userData) return;

      // Synchroniser les données Apple Health
      const healthData = await IntegrationsManager.syncAppleHealthData(userData.id);

      if (healthData && healthData.length > 0) {
        const latestData = healthData[0];

        if (latestData.heartRate && latestData.heartRate > 0) {
          const newData = {
            ...formeData,
            heartRate: {
              resting: latestData.heartRate,
              variability: formeData.heartRate.variability // Garder la variabilité existante si pas de nouvelle donnée
            }
          };

          await saveFormeData(newData);
          Alert.alert(
            'Synchronisation réussie',
            `FC repos mise à jour: ${latestData.heartRate} bpm\n\nDonnées récupérées depuis Apple Health, votre montre connectée ou vos capteurs.`
          );
        } else {
          Alert.alert(
            'Aucune donnée trouvée',
            'Aucune donnée de fréquence cardiaque récente trouvée dans Apple Health.\n\nAssurez-vous que votre montre connectée ou vos capteurs synchronisent correctement avec Apple Health.'
          );
        }
      } else {
        Alert.alert(
          'Synchronisation échouée',
          'Impossible de récupérer les données de fréquence cardiaque. Vérifiez les autorisations Apple Health.'
        );
      }
    } catch (error) {
      console.error('Erreur sync données FC:', error);
      Alert.alert('Erreur', 'Erreur lors de la synchronisation des données de fréquence cardiaque');
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return'#28A745';
    if (score >= 60) return '#F5A623';
    return '#DC3545';
  };

  const getScoreStatus = (score: number) => {
    if (score >= 80) return 'Excellente forme';
    if (score >= 60) return 'Forme correcte';
    return 'Fatigue détectée';
  };

  const formatSleepHours = (hours: number) => {
    if (hours === 0) return 'Non renseigné';

    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);

    if (minutes === 0) {
      return `${wholeHours}h`;
    } else {
      return `${wholeHours}h${minutes.toString().padStart(2, '0')}min`;
    }
  };

  const renderWeeklyChart = () => {
    const maxScore = Math.max(...weeklyData.map(d => calculateDayScore(d)), 100);

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Évolution de la forme (7 jours)</Text>

        <View style={styles.chartArea}>
          <View style={styles.yAxis}>
            {['100', '80', '60', '40', '20', '0'].map((label, index) => (
              <Text key={index} style={styles.yAxisLabel}>{label}</Text>
            ))}
          </View>

          <View style={styles.chartContent}>
            <View style={styles.gridContainer}>
              {[...Array(6)].map((_, i) => (
                <View key={i} style={styles.gridLine} />
              ))}
            </View>

            <View style={styles.scorePoints}>
              {weeklyData.map((dayData, index) => {
                const dayScore = calculateDayScore(dayData);
                const height = (dayScore / 100) * 80;
                return (
                  <View key={index} style={styles.scorePointContainer}>
                    <View 
                      style={[
                        styles.scorePoint, 
                        { 
                          bottom: height + '%',
                          backgroundColor: getScoreColor(dayScore)
                        }
                      ]} 
                    />
                    <Text style={styles.dayLabel}>
                      {new Date(dayData.date).toLocaleDateString('fr-FR', { weekday: 'short' })}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      </View>
    );
  };

  const calculateDayScore = (dayData: FormeData) => {
    let totalScore = 0;
    let totalWeight = 0;

    // Adaptation des poids selon le genre (même logique que calculateFormeScore)
    const isWoman = userData?.gender === 'Femme';
        // Adaptation des poids selon le genre
    // Définir les poids de base
    let baseWeights = {
      sleep: 0.35,
      stress: 0.30,
      calories: 0.15,
      training: 0.00,
      heartRate: 0.00,
      rpe: 0.00,
      cycle: isWoman ? 0.20 : 0.00 // Poids plus important pour le cycle
    };

    // Ajuster les poids en fonction du plan d'abonnement
    let weights = { ...baseWeights };

    if (!isPremium) {
      // Plan Gratuit: sommeil, stress, calories, entraînement
      weights.heartRate = 0;
      weights.rpe = 0;
      weights.training = 0.20;
      weights.calories = 0.15;
    } else {
      // Plans Bronze, Argent, Or, Diamant
      weights.training = 0;

      // Ajustements spécifiques pour les plans premium
      weights.heartRate = 0.10; // FC repos
      weights.rpe = 0.10;       // RPE
      weights.calories = 0.05; // Calories (moins important dans les plans avancés)

      // Ajustements spécifiques pour les plans Or et Diamant peuvent être ajoutés ici
    }

    // Normaliser les poids pour que la somme soit égale à 1 (ou 100%)
    const totalBaseWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
    for (const key in weights) {
      weights[key] = weights[key] / totalBaseWeight;
    }

    // Sommeil
    if (dayData.sleep.hours > 0) {
      let sleepHoursScore;
      if (dayData.sleep.hours >= 7 && dayData.sleep.hours <= 9) {
        sleepHoursScore = 100;
      } else if (dayData.sleep.hours >= 6 && dayData.sleep.hours <= 10) {
        sleepHoursScore = 80;
      } else if (dayData.sleep.hours >= 5 && dayData.sleep.hours <= 11) {
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

      let sleepScore = sleepHoursScore * qualityMultiplier[dayData.sleep.quality];

      // Ajustement cycle pour les femmes
      if (isWoman && dayData.cycle) {
        const cycleMultiplier = {
          'Menstruel': 0.9,
          'Folliculaire': 1.0,
          'Ovulation': 1.05,
          'Lutéal': 0.85
        };
        sleepScore *= cycleMultiplier[dayData.cycle.phase];
      }

      totalScore += sleepScore * weights.sleep;
      totalWeight += weights.sleep;
    }

    // Stress
    let stressScore = Math.max(0, ((10 - dayData.stress.level) / 9) * 100);

    if (isWoman && dayData.cycle) {
      const stressCycleMultiplier = {
        'Menstruel': 0.8,
        'Folliculaire': 1.1,
        'Ovulation': 1.15,
        'Lutéal': 0.7
      };
      stressScore *= stressCycleMultiplier[dayData.cycle.phase];
    }

    totalScore += stressScore * weights.stress;
    totalWeight += weights.stress;
        // Apport calorique - Tous les plans
    if (weights.calories > 0) {
      let caloriesScore = 75; // Score par défaut

      // Utiliser les calories réelles si disponibles
      const actualCalories = dayData.actualCalories || 0;

      if (actualCalories > 0) {
        // Calculer l'objectif calorique basé sur le profil utilisateur
        const targetCalories = Math.round(
          (userData?.gender === 'Homme' ? 2200 : 1800) * 
          (userData?.activityLevel === 'sedentaire' ? 1.2 : 
           userData?.activityLevel === 'leger' ? 1.375 :
           userData?.activityLevel === 'modere' ? 1.55 :
           userData?.activityLevel === 'intense' ? 1.725 : 1.9)
        );

        // Score basé sur la proximité avec l'objectif (±20% de marge acceptable)
        const lowerBound = targetCalories * 0.8;
        const upperBound = targetCalories * 1.2;

        if (actualCalories >= lowerBound && actualCalories <= upperBound) {
          caloriesScore = 100; // Parfait dans la fourchette
        } else if (actualCalories >= lowerBound * 0.7 && actualCalories <= upperBound * 1.3) {
          caloriesScore = 80; // Acceptable
        } else if (actualCalories >= lowerBound * 0.5 && actualCalories <= upperBound * 1.5) {
          caloriesScore = 60; // Moyen
        } else {
          caloriesScore = 40; // Trop loin de l'objectif
        }
      } else {
        // Pas de données nutrition = score neutre
        caloriesScore = 50;
      }

      totalScore += caloriesScore * weights.calories;
      totalWeight += weights.calories;
    }

    // Entraînement programmé - Plan gratuit uniquement
    if (weights.training > 0) {
      let trainingScore = 50; // Score par défaut

      // Vérifier s'il y a des entraînements programmés aujourd'hui
      const today = new Date().toISOString().split('T')[0];
      // Simuler la présence d'entraînements (à adapter selon votre logique)
      const hasTrainingToday = weeklyData.some(day => 
        day.date === today && day.rpe?.value > 0
      );

      trainingScore = hasTrainingToday ? 85 : 40;

      totalScore += trainingScore * weights.training;
      totalWeight += weights.training;
    }

    // FC repos - Plans Bronze et plus
    if (weights.heartRate > 0 && dayData.heartRate.resting > 0) {
      const optimalResting = userData?.gender === 'Homme' ? 65 : 70;
      let diff = Math.abs(dayData.heartRate.resting - optimalResting);

      // Ajustement cycle pour les femmes
      if (isWoman && dayData.cycle) {
        const hrCycleAdjustment = {
          'Menstruel': -3,
          'Folliculaire': 0,
          'Ovulation': -2,
          'Lutéal': -5
        };

        const adjustedOptimal = optimalResting + hrCycleAdjustment[dayData.cycle.phase];
        diff = Math.abs(dayData.heartRate.resting - adjustedOptimal);
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

    // RPE - Premium
    if (isPremium && dayData.rpe.value > 0) {
      let rpeScore;
      if (dayData.rpe.value <= 3) rpeScore = 100;
      else if (dayData.rpe.value <= 5) rpeScore = 80;
      else if (dayData.rpe.value <= 7) rpeScore = 60;
      else rpeScore = 30;

      // Ajustement cycle pour les femmes
      if (isWoman && dayData.cycle) {
        const rpeCycleMultiplier = {
          'Menstruel': 0.8,
          'Folliculaire': 1.15,
          'Ovulation': 1.2,
          'Lutéal': 0.85
        };
        rpeScore *= rpeCycleMultiplier[dayData.cycle.phase];
      }

      totalScore += rpeScore * weights.rpe;
      totalWeight += weights.rpe;
    }

    // Cycle hormonal pour les femmes
    if (isWoman && dayData.cycle) {
      let cycleScore = 75;
      const dayInCycle = dayData.cycle.dayOfCycle;

      switch (dayData.cycle.phase) {
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

      const symptomPenalty = Math.min(dayData.cycle.symptoms.length * 8, 40);
      cycleScore = Math.max(25, cycleScore - symptomPenalty);

      if (dayData.cycle.symptoms.length === 0 && 
          (dayData.cycle.phase === 'Folliculaire' || dayData.cycle.phase === 'Ovulation')) {
        cycleScore = Math.min(100, cycleScore + 5);
      }

      totalScore += cycleScore * weights.cycle;
      totalWeight += weights.cycle;
    }

    // Calculer le score final
    let finalScore;
    if (totalWeight === 0) {
      finalScore = 50;
    } else {
      finalScore = totalScore / totalWeight;
    }

    return Math.max(0, Math.min(100, Math.round(finalScore)));
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>


        {/* Score principal */}
        <View style={styles.scoreCard}>
          <View style={styles.scoreCircle}>
            <LinearGradient
              colors={[getScoreColor(formeScore), getScoreColor(formeScore) + '80']}
              style={styles.scoreGradient}
            >
              <Text style={styles.scoreText}>{formeScore}</Text>
              <Text style={styles.scoreSubtext}>/ 100</Text>
            </LinearGradient>
          </View>
          <Text style={[styles.scoreStatus, { color: getScoreColor(formeScore) }]}>
            {getScoreStatus(formeScore)}
          </Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          {['Aujourd\'hui', 'Historique'].map((tab) => (
            <TouchableOpacity 
              key={tab}
              style={[styles.tab, selectedTab === tab && styles.activeTab]}
              onPress={() => setSelectedTab(tab)}
            >
              {selectedTab === tab && (
                <LinearGradient
                  colors={['#F5A623', '#E8941A']}
                  style={styles.tabGradient}
                />
              )}
              <Text style={[styles.tabText, selectedTab === tab && styles.activeTabText]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {selectedTab === 'Aujourd\'hui' && (
          <View style={styles.todayContainer}>
            {/* Sommeil */}
            <TouchableOpacity 
              style={styles.metricCard}
              onPress={() => {
                setTempSleep({
                  hours: (formeData.sleep?.hours || 0).toString(),
                  quality: formeData.sleep?.quality || 'Moyen',
                  bedTime: formeData.sleep?.bedTime || '',
                  wakeTime: formeData.sleep?.wakeTime || ''
                });
                setShowSleepModal(true);
              }}
            >
              <View style={styles.metricIcon}>
                <Text style={styles.iconText}>😴</Text>
              </View>
              <View style={styles.metricInfo}>
                <Text style={styles.metricLabel}>Sommeil</Text>
                <Text style={styles.metricValue}>
                  {formatSleepHours(formeData.sleep?.hours || 0)}
                </Text>
                <Text style={styles.metricDetail}>
                  {formeData.sleep?.quality || 'Non renseigné'}
                </Text>
              </View>
              <Text style={styles.updateHint}>Appuyez pour modifier</Text>
            </TouchableOpacity>

            {/* Stress */}
            <TouchableOpacity 
              style={styles.metricCard}
              onPress={() => {
                setTempStress({
                  level: formeData.stress?.level || 5,
                  factors: formeData.stress?.factors || [],
                  notes: formeData.stress?.notes || ''
                });
                setShowStressModal(true);
              }}
            >
              <View style={styles.metricIcon}>
                <Text style={styles.iconText}>😤</Text>
              </View>
              <View style={styles.metricInfo}>
                <Text style={styles.metricLabel}>Niveau de stress</Text>
                <Text style={styles.metricValue}>{formeData.stress?.level || 5}/10</Text>
                <Text style={styles.metricDetail}>
                  {(formeData.stress?.level || 5) <= 3 ? 'Faible' : 
                   (formeData.stress?.level || 5) <= 6 ? 'Modéré' : 'Élevé'}
                </Text>
              </View>
              <Text style={styles.updateHint}>Appuyez pour modifier</Text>
            </TouchableOpacity>

            {/* FC Repos - Premium */}
            <TouchableOpacity 
              style={[styles.metricCard, !isPremium && styles.premiumCard]}
              onPress={() => {
                if (!isPremium) {
                  Alert.alert('Fonctionnalité Premium', 'Le suivi de la fréquence cardiaque est réservé aux abonnés premium.');
                  return;
                }
                handleSyncHeartRate();
              }}
            >
              <View style={styles.metricIcon}>
                <Text style={styles.iconText}>❤️</Text>
              </View>
              <View style={styles.metricInfo}>
                <Text style={styles.metricLabel}>
                  FC Repos {!isPremium && '👑'}
                </Text>
                <Text style={styles.metricValue}>
                  {isPremium ? 
                    (formeData.heartRate.resting > 0 ? formeData.heartRate.resting + ' bpm' : 'Non renseigné') :
                    'Premium requis'
                  }
                </Text>
                {isPremium && formeData.heartRate.variability > 0 && (
                  <Text style={styles.metricDetail}>
                    Variabilité: {formeData.heartRate.variability}ms
                  </Text>
                )}
              </View>
              <Text style={styles.updateHint}>
                {isPremium ? 'Appuyez pour synchroniser' : 'Mise à niveau requise'}
              </Text>
            </TouchableOpacity>

            {/* RPE - Premium */}
            <TouchableOpacity 
              style={[styles.metricCard, !isPremium && styles.premiumCard]}
              onPress={() => {
                if (!isPremium) {
                  Alert.alert('Fonctionnalité Premium', 'Le suivi RPE est réservé aux abonnés premium.');
                  return;
                }
                // Toujours proposer uniquement la synchronisation
                Alert.alert(
                  'Synchronisation RPE',
                  'Les données RPE sont automatiquement récupérées de vos séances terminées. Voulez-vous rafraîchir ?',
                  [
                    { text: 'Annuler', style: 'cancel' },
                    { text: 'Synchroniser', onPress: () => loadFormeData() }
                  ]
                );
              }}
            >
              <View style={styles.metricIcon}>
                <Text style={styles.iconText}>💪</Text>
              </View>
              <View style={styles.metricInfo}>
                <Text style={styles.metricLabel}>
                  RPE {!isPremium && '👑'}
                </Text>
                <Text style={styles.metricValue}>
                  {isPremium ? 
                    (formeData.rpe.workoutId === 'auto_from_activity' ? 
                      formeData.rpe.value + '/10' : 'Non renseigné'
                    ) : 
                    'Premium requis'
                  }
                </Text>
                <Text style={styles.metricDetail}>
                  {isPremium ? 
                    (formeData.rpe.workoutId === 'auto_from_activity' ? 
                      (formeData.rpe.notes || 'Données des séances du jour') :
                      'Aucune séance'
                    ) :
                    'Évaluation fatigue'
                  }
                </Text>
              </View>
              <Text style={styles.updateHint}>
                {isPremium ? 'Appuyez pour synchroniser' : 'Mise à niveau requise'}
              </Text>
            </TouchableOpacity>

            {/* Apport Calorique - Tous les plans avec contour orange pour gratuit */}
            <TouchableOpacity 
              style={[styles.metricCard, !isPremium && styles.premiumCard]}
              onPress={() => {
                if (!isPremium) {
                  Alert.alert('Fonctionnalité Premium', 'Le suivi détaillé de l\'apport calorique est réservé aux abonnés premium.');
                  return;
                }

                const targetCalories = Math.round(
                  (userData?.gender === 'Homme' ? 2200 : 1800) * 
                  (userData?.activityLevel === 'sedentaire' ? 1.2 : 
                   userData?.activityLevel === 'leger' ? 1.375 :
                   userData?.activityLevel === 'modere' ? 1.55 :
                   userData?.activityLevel === 'intense' ? 1.725 : 1.9)
                );

                Alert.alert(
                  'Apport Calorique',
                  `Consommé aujourd'hui: ${formeData.actualCalories || 0} kcal\nObjectif estimé: ${targetCalories} kcal\n\nLes données sont récupérées depuis votre journal nutrition. Utilisez la section Nutrition pour ajouter vos repas.`,
                  [{ text: 'OK' }]
                );
              }}
            >
              <View style={styles.metricIcon}>
                <Text style={styles.iconText}>🔥</Text>
              </View>
              <View style={styles.metricInfo}>
                <Text style={styles.metricLabel}>
                  Apport Calorique {!isPremium && '👑'}
                </Text>
                <Text style={styles.metricValue}>
                  {isPremium ? 
                    (formeData.actualCalories || 0) + ' kcal' :
                    'Premium requis'
                  }
                </Text>
                <Text style={styles.metricDetail}>
                  {isPremium ? 
                    (formeData.actualCalories > 0 ? 
                      'Données nutrition du jour' : 
                      'Aucune donnée'
                    ) :
                    'Suivi détaillé'
                  }
                </Text>
              </View>
              <Text style={styles.updateHint}>
                {isPremium ? 'Appuyez pour plus d\'infos' : 'Mise à niveau requise'}
              </Text>
            </TouchableOpacity>



            {/* Macronutriments - Toujours visible avec contour orange pour gratuit */}
            <TouchableOpacity 
              style={[styles.metricCard, !isPremium && styles.premiumCard]}
              onPress={() => {
                if (!isPremium) {
                  Alert.alert('Fonctionnalité Premium', 'L\'analyse des macronutriments est réservée aux abonnés premium.');
                  return;
                }

                const macros = formeData.actualMacros;
                const calories = formeData.actualCalories || 0;

                if (!macros || calories === 0) {
                  Alert.alert(
                    'Macronutriments/Fatigue',
                    'Aucune donnée nutritionnelle disponible pour aujourd\'hui.\n\nUtilisez la section Nutrition pour ajouter vos repas et obtenir une analyse détaillée de l\'équilibre de vos macronutriments.',
                    [{ text: 'OK' }]
                  );
                  return;
                }

                const analysis = analyzeMacroBalance(macros, calories);

                const detailMessage = `Répartition actuelle:\n• Protéines: ${macros.proteins}g (${analysis.percentages?.protein || 0}%)\n• Glucides: ${macros.carbohydrates}g (${analysis.percentages?.carb || 0}%)\n• Lipides: ${macros.fat}g (${analysis.percentages?.fat || 0}%)\n\nAnalyse: ${analysis.issues.join(', ')}`;

                Alert.alert(
                  'Analyse Macronutriments/Fatigue',
                  detailMessage,
                  [{ text: 'OK' }]
                );
              }}
            >
              <View style={styles.metricIcon}>
                <Text style={styles.iconText}>🥗</Text>
              </View>
              <View style={styles.metricInfo}>
                <Text style={styles.metricLabel}>
                  Macronutriments {!isPremium && '👑'}
                </Text>
                <Text style={styles.metricValue}>
                  {isPremium ? 
                    (() => {
                      const macros = formeData.actualMacros;
                      const calories = formeData.actualCalories || 0;

                      if (!macros || calories === 0) {
                        return 'Aucune donnée';
                      }

                      const analysis = analyzeMacroBalance(macros, calories);
                      return analysis.status;
                    })() :
                    'Premium requis'
                  }
                </Text>
                <Text style={styles.metricDetail}>
                  {isPremium ? 
                    (() => {
                      const macros = formeData.actualMacros;
                      const calories = formeData.actualCalories || 0;

                      if (!macros || calories === 0) {
                        return 'Ajoutez vos repas';
                      }

                      return `P:${macros.proteins}g C:${macros.carbohydrates}g L:${macros.fat}g`;
                    })() :
                    'Analyse équilibre'
                  }
                </Text>
              </View>
              <Text style={styles.updateHint}>
                {isPremium ? 'Appuyez pour plus d\'infos' : 'Mise à niveau requise'}
              </Text>
            </TouchableOpacity>

            {/* Micronutriments - Toujours visible avec contour orange pour gratuit */}
            <TouchableOpacity 
              style={[styles.metricCard, !isPremium && styles.premiumCard]}
              onPress={() => {
                if (!isPremium) {
                  Alert.alert('Fonctionnalité Premium', 'L\'analyse des micronutriments est réservée aux abonnés premium.');
                  return;
                }

                const micros = formeData.actualMicros;
                const calories = formeData.actualCalories || 0;

                if (!micros || calories === 0) {
                  Alert.alert(
                    'Micronutriments/Fatigue',
                    'Aucune donnée nutritionnelle disponible pour aujourd\'hui.\n\nUtilisez la section Nutrition pour ajouter vos repas et obtenir une analyse détaillée de vos micronutriments.',
                    [{ text: 'OK' }]
                  );
                  return;
                }

                // Analyse des carences importantes qui impactent la fatigue
                const deficiencies = [];

                // Vitamines critiques pour l'énergie
                if (micros.vitaminB12 < 1.5) deficiencies.push('Vitamine B12 faible');
                if (micros.vitaminD < 10) deficiencies.push('Vitamine D insuffisante');
                if (micros.vitaminC < 50) deficiencies.push('Vitamine C faible');
                if (micros.vitaminB6 < 1.0) deficiencies.push('Vitamine B6 insuffisante');

                // Minéraux critiques pour l'énergie
                if (micros.iron < 5) deficiencies.push('Fer faible (risque anémie)');
                if (micros.magnesium < 200) deficiencies.push('Magnésium insuffisant');
                if (micros.zinc < 6) deficiencies.push('Zinc faible');

                // Analyse globale
                let analysis = '';
                if (deficiencies.length === 0) {
                  analysis = '✅ Profil micronutritionnel favorable\n\nVos apports en vitamines et minéraux semblent suffisants pour maintenir un bon niveau d\'énergie.';
                } else if (deficiencies.length <= 2) {
                  analysis = `⚠️ Quelques carences détectées\n\n${deficiencies.join(', ')}\n\nCes carences peuvent contribuer à la fatigue. Considérez d'enrichir votre alimentation.`;
                } else {
                  analysis = `🚨 Carences multiples détectées\n\n${deficiencies.join(', ')}\n\nCes carences importantes peuvent expliquer une fatigue persistante. Consultez un professionnel de santé.`;
                }

                const detailMessage = `Apports du jour:\n• Vitamine B12: ${micros.vitaminB12.toFixed(1)}μg\n• Vitamine D: ${micros.vitaminD.toFixed(1)}μg\n• Fer: ${micros.iron.toFixed(1)}mg\n• Magnésium: ${micros.magnesium.toFixed(0)}mg\n\n${analysis}`;

                Alert.alert(
                  'Analyse Micronutriments/Fatigue',
                  detailMessage,
                  [{ text: 'OK' }]
                );
              }}
            >
              <View style={styles.metricIcon}>
                <Text style={styles.iconText}>💊</Text>
              </View>
              <View style={styles.metricInfo}>
                <Text style={styles.metricLabel}>
                  Micronutriments {!isPremium && '👑'}
                </Text>
                <Text style={styles.metricValue}>
                  {isPremium ? 
                    (() => {
                      const micros = formeData.actualMicros;
                      const calories = formeData.actualCalories || 0;

                      if (!micros || calories === 0) {
                        return 'Aucune donnée';
                      }

                      // Analyse rapide des carences critiques
                      const criticalDeficiencies = [
                        micros.vitaminB12 < 1.5,
                        micros.vitaminD < 10,
                        micros.iron < 5,
                        micros.magnesium < 200
                      ].filter(Boolean).length;

                      if (criticalDeficiencies === 0) return 'Profil favorable';
                      if (criticalDeficiencies <= 1) return 'Légères carences';
                      if (criticalDeficiencies <= 2) return 'Carences modérées';
                      return 'Carences importantes';
                    })() :
                    'Premium requis'
                  }
                </Text>
                <Text style={styles.metricDetail}>
                  {isPremium ? 
                    (() => {
                      const micros = formeData.actualMicros;
                      const calories = formeData.actualCalories || 0;

                      if (!micros || calories === 0) {
                        return 'Ajoutez vos repas';
                      }

                      return `B12: ${micros.vitaminB12.toFixed(1)}μg, Fer: ${micros.iron.toFixed(1)}mg`;
                    })() :
                    'Analyse carences'
                  }
                </Text>
              </View>
              <Text style={styles.updateHint}>
                {isPremium ? 'Appuyez pour plus d\'infos' : 'Mise à niveau requise'}
              </Text>
            </TouchableOpacity>

            {/* Cycle Hormonal - Femmes uniquement */}
            {userData?.gender === 'Femme' && (
              <TouchableOpacity 
                style={styles.metricCard}
                onPress={() => {
                  setTempCycle({
                    phase: formeData.cycle?.phase || 'Menstruel',
                    dayOfCycle: formeData.cycle?.dayOfCycle || 1,
                    symptoms: formeData.cycle?.symptoms || [],
                    notes: formeData.cycle?.notes || ''
                  });
                  setShowCycleModal(true);
                }}
              >
                <View style={styles.metricIcon}>
                  <Text style={styles.iconText}>🌸</Text>
                </View>
                <View style={styles.metricInfo}>
                  <Text style={styles.metricLabel}>Cycle Hormonal</Text>
                  <Text style={styles.metricValue}>
                    {formeData.cycle ? 'Jour ' + formeData.cycle.dayOfCycle : 'Non renseigné'}
                  </Text>
                  <Text style={styles.metricDetail}>
                    {formeData.cycle?.phase || 'Phase non définie'}
                  </Text>
                </View>
                <Text style={styles.updateHint}>Appuyez pour modifier</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {selectedTab === 'Historique' && (
          <View style={styles.historyContainer}>
            {renderWeeklyChart()}

            {/* Recommandations */}
            <View style={styles.recommendationsCard}>
              <Text style={styles.recommendationsTitle}>💡 Recommandations</Text>

              {formeData.sleep.hours < 7 && (
                <Text style={styles.recommendation}>
                  • Essayez de dormir au moins 7-8h par nuit pour une meilleure récupération
                </Text>
              )}

              {formeData.stress.level > 6 && (
                <Text style={styles.recommendation}>
                  • Votre niveau de stress est élevé. Considérez des techniques de relaxation
                </Text>
              )}

              {isPremium && formeData.heartRate.resting > 80 && (
                <Text style={styles.recommendation}>
                  • Votre FC repos est élevée. Augmentez progressivement votre activité cardio
                </Text>
              )}

              {isPremium && formeData.rpe.value > 7 && (
                <Text style={styles.recommendation}>
                  • RPE élevé détecté. Prévoyez une récupération active ou un jour de repos
                </Text>
              )}

              {formeScore > 80 && (
                <Text style={styles.recommendation}>
                  • Excellente forme ! C\'est le moment idéal pour un entraînement intensif
                </Text>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Modal Sommeil */}
      <Modal visible={showSleepModal} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Sommeil</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Heures de sommeil</Text>
              <TextInput
                style={styles.modalInput}
                value={tempSleep.hours}
                onChangeText={(text) => setTempSleep({...tempSleep, hours: text})}
                placeholder="7.30 (pour 7h30min)"
                keyboardType="numeric"
                autoComplete="off"
                autoCorrect={false}
                spellCheck={false}
              />

            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Qualité du sommeil</Text>
              <View style={styles.qualityButtons}>
                {['Excellent', 'Bien', 'Moyen', 'Mauvais'].map((quality) => (
                  <TouchableOpacity
                    key={quality}
                    style={[
                      styles.qualityButton,
                      tempSleep.quality === quality && styles.selectedQualityButton
                    ]}
                    onPress={() => setTempSleep({...tempSleep, quality})}
                  >
                    <Text style={[
                      styles.qualityButtonText,
                      tempSleep.quality === quality && styles.selectedQualityButtonText
                    ]}>
                      {quality}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalButtonSecondary}
                onPress={() => setShowSleepModal(false)}
              >
                <Text style={styles.modalButtonSecondaryText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalButtonPrimary}
                onPress={handleSaveSleep}
              >
                <Text style={styles.modalButtonPrimaryText}>Sauvegarder</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Stress */}
      <Modal visible={showStressModal} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Niveau de stress</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Niveau (1-10)</Text>
              <View style={styles.stressSlider}>
                {[...Array(10)].map((_, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[
                      styles.stressLevel,
                      tempStress.level === i + 1 && styles.selectedStressLevel
                    ]}
                    onPress={() => setTempStress({...tempStress, level: i + 1})}
                  >
                    <Text style={[
                      styles.stressLevelText,
                      tempStress.level === i + 1 && styles.selectedStressLevelText
                    ]}>
                      {i + 1}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Facteurs de stress</Text>
              <View style={styles.factorsGrid}>
                {stressFactors.map((factor) => (
                  <TouchableOpacity
                    key={factor}
                    style={[
                      styles.factorButton,
                      tempStress.factors.includes(factor) && styles.selectedFactorButton
                    ]}
                    onPress={() => {
                      const factors = tempStress.factors.includes(factor)
                        ? tempStress.factors.filter(f => f !== factor)
                        : [...tempStress.factors, factor];
                      setTempStress({...tempStress, factors});
                    }}
                  >
                    <Text style={[
                      styles.factorButtonText,
                      tempStress.factors.includes(factor) && styles.selectedFactorButtonText
                    ]}>
                      {factor}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalButtonSecondary}
                onPress={() => setShowStressModal(false)}
              >
                <Text style={styles.modalButtonSecondaryText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalButtonPrimary}
                onPress={handleSaveStress}
              >
                <Text style={styles.modalButtonPrimaryText}>Sauvegarder</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal FC */}
      <Modal visible={showHeartRateModal} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Fréquence Cardiaque</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>FC au repos (bpm)</Text>
              <TextInput
                style={styles.modalInput}
                value={tempHeartRate.resting}
                onChangeText={(text) => setTempHeartRate({...tempHeartRate, resting: text})}
                placeholder="65"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Variabilité FC (ms)</Text>
              <TextInput
                style={styles.modalInput}
                value={tempHeartRate.variability}
                onChangeText={(text) => setTempHeartRate({...tempHeartRate, variability: text})}
                placeholder="45"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalButtonSecondary}
                onPress={() => setShowHeartRateModal(false)}
              >
                <Text style={styles.modalButtonSecondaryText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalButtonPrimary}
                onPress={handleSaveHeartRate}
              >
                <Text style={styles.modalButtonPrimaryText}>Sauvegarder</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>



      {/* Modal Cycle Hormonal */}
      <Modal visible={showCycleModal} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.cycleModalContainer}>
            <ScrollView 
              style={styles.cycleModalScroll}
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              <View style={styles.cycleModalContent}>
                <Text style={styles.cycleModalTitle}>Cycle Hormonal</Text>
                <Text style={styles.cycleModalSubtitle}>
                  Suivez votre cycle pour mieux comprendre votre forme
                </Text>

                <View style={styles.cycleInputContainer}>
                  <Text style={styles.cycleInputLabel}>Jour du cycle</Text>
                  <TextInput
                    style={styles.cycleModalInput}
                    value={tempCycle.dayOfCycle.toString()}
                    onChangeText={(text) => {
                      const day = parseInt(text) || 1;
                      setTempCycle({...tempCycle, dayOfCycle: day});
                    }}
                    placeholder="1-35 (moy. 28j)"
                    keyboardType="numeric"
                    autoComplete="off"
                    autoCorrect={false}
                    spellCheck={false}
                  />
                </View>

                <View style={styles.cycleInputContainer}>
                  <Text style={styles.cycleInputLabel}>Phase du cycle</Text>
                  <View style={styles.cyclePhaseButtons}>
                    {['Menstruel', 'Folliculaire', 'Ovulation', 'Lutéal'].map((phase) => (
                      <TouchableOpacity
                        key={phase}
                        style={[
                          styles.cyclePhaseButton,
                          tempCycle.phase === phase && styles.selectedCyclePhaseButton
                        ]}
                        onPress={() => setTempCycle({...tempCycle, phase})}
                      >
                        <Text style={[
                          styles.cyclePhaseButtonText,
                          tempCycle.phase === phase && styles.selectedCyclePhaseButtonText
                        ]}>
                          {phase}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.cycleInputContainer}>
                  <Text style={styles.cycleInputLabel}>Symptômes</Text>
                  <View style={styles.cycleSymptomsGrid}>
                    {cycleSymptoms.map((symptom) => (
                      <TouchableOpacity
                        key={symptom}
                        style={[
                          styles.cycleSymptomButton,
                          tempCycle.symptoms.includes(symptom) && styles.selectedCycleSymptomButton
                        ]}
                        onPress={() => {
                          const symptoms = tempCycle.symptoms.includes(symptom)
                            ? tempCycle.symptoms.filter(s => s !== symptom)
                            : [...tempCycle.symptoms, symptom];
                          setTempCycle({...tempCycle, symptoms});
                        }}
                      >
                        <Text style={[
                          styles.cycleSymptomButtonText,
                          tempCycle.symptoms.includes(symptom) && styles.selectedCycleSymptomButtonText
                        ]}>
                          {symptom}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.cycleInputContainer}>
                  <Text style={styles.cycleInputLabel}>Notes (optionnel)</Text>
                  <TextInput
                    style={styles.cycleNotesInput}
                    value={tempCycle.notes}
                    onChangeText={(text) => setTempCycle({...tempCycle, notes: text})}
                    placeholder="Ressenti général, humeur..."
                    multiline={true}
                    numberOfLines={2}
                  />
                </View>
              </View>
            </ScrollView>

            <View style={styles.cycleModalButtons}>
              <TouchableOpacity 
                style={styles.cycleModalButtonSecondary}
                onPress={() => setShowCycleModal(false)}
              >
                <Text style={styles.cycleModalButtonSecondaryText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.cycleModalButtonPrimary}
                onPress={handleSaveCycle}
              >
                <Text style={styles.cycleModalButtonPrimaryText}>Sauvegarder</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1117',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#0D1117',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingTop: 10,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#8B949E',
  },
  scoreCard: {
    marginHorizontal: 20,
    backgroundColor: '#161B22',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#21262D',
    alignItems: 'center',
    marginBottom: 20,
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
    overflow: 'hidden',
  },
  scoreGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  scoreSubtext: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  scoreStatus: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  scoreDescription: {
    fontSize: 14,
    color: '#8B949E',
    textAlign: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 10,
    marginHorizontal: 3,
    backgroundColor: '#161B22',
    borderWidth: 1,
    borderColor: '#21262D',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  activeTab: {
    borderColor: 'transparent',
  },
  tabGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  tabText: {
    fontSize: 14,
    color: '#8B949E',
    fontWeight: '600',
    zIndex: 1,
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  todayContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  metricCard: {
    backgroundColor: '#161B22',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#21262D',
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  premiumCard: {
    borderColor: '#F5A623',
    borderWidth: 1,
  },
  metricIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#21262D',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  iconText: {
    fontSize: 20,
  },
  metricInfo: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 14,
    color: '#8B949E',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  metricDetail: {
    fontSize: 12,
    color: '#8B949E',
  },
  updateHint: {
    fontSize: 10,
    color: '#F5A623',
    fontStyle: 'italic',
  },
  historyContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  chartContainer: {
    backgroundColor: '#161B22',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#21262D',
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  chartArea: {
    flexDirection: 'row',
    height: 200,
  },
  yAxis: {
    justifyContent: 'space-between',
    width: 40,
    paddingRight: 8,
  },
  yAxisLabel: {
    fontSize: 12,
    color: '#8B949E',
    textAlign: 'right',
  },
  chartContent: {
    flex: 1,
    position: 'relative',
  },
  gridContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  gridLine: {
    height: 1,
    backgroundColor: '#21262D',
  },
  scorePoints: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingBottom: 25,
    paddingHorizontal: 10,
  },
  scorePointContainer: {
    alignItems: 'center',
    flex: 1,
    height: '100%',
    position: 'relative',
  },
  scorePoint: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  dayLabel: {
    position: 'absolute',
    bottom: -20,
    fontSize: 11,
    color: '#8B949E',
    fontWeight: '500',
  },
  recommendationsCard: {
    backgroundColor: '#161B22',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#21262D',
  },
  recommendationsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  recommendation: {
    fontSize: 14,
    color: '#8B949E',
    lineHeight: 20,
    marginBottom: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: '#161B22',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#21262D',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#8B949E',
    textAlign: 'center',
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 8,
    fontWeight: '500',
  },
  modalInput: {
    backgroundColor: '#0D1117',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#21262D',
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  qualityButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  qualityButton: {
    flex: 1,
    backgroundColor: '#21262D',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#30363D',
    alignItems: 'center',
  },
  selectedQualityButton: {
    backgroundColor: '#F5A623',
    borderColor: '#F5A623',
  },
  qualityButtonText: {
    fontSize: 11,
    color: '#8B949E',
    fontWeight: '500',
    textAlign: 'center',
  },
  selectedQualityButtonText: {
    color: '#000000',
  },
  stressSlider: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'nowrap',
    gap: 4,
  },
  stressLevel: {
    width: 28,
    height: 28,
    backgroundColor: '#21262D',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#30363D',
    flex: 1,
    maxWidth: 32,
  },
  selectedStressLevel: {
    backgroundColor: '#F5A623',
    borderColor: '#F5A623',
  },
  stressLevelText: {
    fontSize: 14,
    color: '#8B949E',
    fontWeight: '600',
  },
  selectedStressLevelText: {
    color: '#000000',
  },
  factorsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  factorButton: {
    backgroundColor: '#21262D',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#30363D',
    width: '31%',
    alignItems: 'center',
  },
  selectedFactorButton: {
    backgroundColor: '#F5A623',
    borderColor: '#F5A623',
  },
  factorButtonText: {
    fontSize: 12,
    color: '#8B949E',
    fontWeight: '500',
  },
  selectedFactorButtonText: {
    color: '#000000',
  },
  rpeSlider: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  rpeLevel: {
    width: 28,
    height: 28,
    backgroundColor: '#21262D',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#30363D',
  },
  selectedRPELevel: {
    backgroundColor: '#F5A623',
    borderColor: '#F5A623',
  },
  rpeLevelText: {
    fontSize: 12,
    color: '#8B949E',
    fontWeight: '600',
  },
  selectedRPELevelText: {
    color: '#000000',
  },
  rpeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rpeLabel: {
    fontSize: 12,
    color: '#8B949E',
  },
  modalScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  symptomsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  symptomButton: {
    backgroundColor: '#21262D',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#30363D',
    width: '48%',
    alignItems: 'center',
    marginBottom: 4,
  },
  selectedSymptomButton: {
    backgroundColor: '#F5A623',
    borderColor: '#F5A623',
  },
  symptomButtonText: {
    fontSize: 11,
    color: '#8B949E',
    fontWeight: '500',
    textAlign: 'center',
  },
  selectedSymptomButtonText: {
    color: '#000000',
  },
  // Styles spécifiques pour la modal cycle hormonal
  cycleModalContainer: {
    backgroundColor: '#161B22',
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 60,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: '#21262D',
    overflow: 'hidden',
  },
  cycleModalScroll: {
    flex: 1,
  },
  cycleModalContent: {
    padding: 16,
  },
  cycleModalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 6,
  },
  cycleModalSubtitle: {
    fontSize: 12,
    color: '#8B949E',
    textAlign: 'center',
    marginBottom: 16,
  },
  cycleInputContainer: {
    marginBottom: 16,
  },
  cycleInputLabel: {
    fontSize: 13,
    color: '#FFFFFF',
    marginBottom: 6,
    fontWeight: '500',
  },
  cycleModalInput: {
    backgroundColor: '#0D1117',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#21262D',
  },
  cyclePhaseButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'space-between',
  },
  cyclePhaseButton: {
    flex: 1,
    backgroundColor: '#21262D',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#30363D',
    alignItems: 'center',
    minWidth: '23%',
  },
  selectedCyclePhaseButton: {
    backgroundColor: '#F5A623',
    borderColor: '#F5A623',
  },
  cyclePhaseButtonText: {
    fontSize: 10,
    color: '#8B949E',
    fontWeight: '500',
    textAlign: 'center',
  },
  selectedCyclePhaseButtonText: {
    color: '#000000',
  },
  cycleSymptomsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'space-between',
  },
  cycleSymptomButton: {
    backgroundColor: '#21262D',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#30363D',
    width: '48%',
    alignItems: 'center',
    marginBottom: 2,
  },
  selectedCycleSymptomButton: {
    backgroundColor: '#F5A623',
    borderColor: '#F5A623',
  },
  cycleSymptomButtonText: {
    fontSize: 10,
    color: '#8B949E',
    fontWeight: '500',
    textAlign: 'center',
  },
  selectedCycleSymptomButtonText: {
    color: '#000000',
  },
  cycleNotesInput: {
    backgroundColor: '#0D1117',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#21262D',
    height: 60,
    textAlignVertical: 'top',
  },
  cycleModalButtons: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#21262D',
    backgroundColor: '#161B22',
  },
  cycleModalButtonSecondary: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#21262D',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  cycleModalButtonSecondaryText: {
    color: '#8B949E',
    fontSize: 14,
    fontWeight: '600',
  },
  cycleModalButtonPrimary: {
    flex: 1,
    backgroundColor: '#F5A623',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  cycleModalButtonPrimaryText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButtonSecondary: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#21262D',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalButtonSecondaryText: {
    color: '#8B949E',
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonPrimary: {
    flex: 1,
    backgroundColor: '#F5A623',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalButtonPrimaryText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
  inputHint: {
    fontSize: 12,
    color: '#8B949E',
    marginTop: 4,
    fontStyle: 'italic',
  },
});