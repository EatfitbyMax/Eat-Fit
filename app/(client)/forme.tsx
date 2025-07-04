import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Dimensions, Alert, TextInput, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring } from 'react-native-reanimated';
import { useFocusEffect } from 'expo-router';
import { checkSubscriptionStatus } from '@/utils/subscription';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
}

export default function FormeScreen() {
  const [isPremium, setIsPremium] = useState(false);
  const [selectedTab, setSelectedTab] = useState('Aujourd\'hui');
  const [userData, setUserData] = useState<any>(null);
  const [formeData, setFormeData] = useState<FormeData>({
    sleep: { hours: 0, quality: 'Moyen', bedTime: '', wakeTime: '' },
    stress: { level: 5, factors: [], notes: '' },
    heartRate: { resting: 0, variability: 0 },
    rpe: { value: 5, notes: '' },
    cycle: userData?.gender === 'Femme' ? { phase: 'Menstruel', dayOfCycle: 1, symptoms: [], notes: '' } : undefined,
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
      loadFormeData();
    }
  }, [userData]);

  // Recharger les données quand l'écran devient visible
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
      const currentUserString = await AsyncStorage.getItem('currentUser');
      if (currentUserString) {
        const user = JSON.parse(currentUserString);
        setUserData(user);

        // Vérifier le statut premium
        const subscription = await checkSubscriptionStatus();
        setIsPremium(subscription.isPremium);
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
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;

      // Essayer d'abord le stockage local
      let todayData = null;
      const localDataString = await AsyncStorage.getItem(`forme_data_${userData.id}_${today}`);

      if (localDataString) {
        todayData = JSON.parse(localDataString);
        console.log('Données de forme chargées depuis le stockage local');
      } else {
        // Fallback vers le serveur si pas de données locales
        try {
          todayData = await PersistentStorage.getFormeData(userData.id, today);
          console.log('Données de forme chargées depuis le serveur VPS');
        } catch (serverError) {
          // Créer des données par défaut si rien n'est trouvé
          todayData = {
            sleep: { hours: 0, quality: 'Moyen', bedTime: '', wakeTime: '' },
            stress: { level: 5, factors: [], notes: '' },
            heartRate: { resting: 0, variability: 0 },
            rpe: { value: 5, notes: '' },
            cycle: userData?.gender === 'Femme' ? { phase: 'Menstruel', dayOfCycle: 1, symptoms: [], notes: '' } : undefined,
            date: today
          };
          console.log('Création de nouvelles données de forme par défaut');
        }
      }

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

        // Essayer d'abord le stockage local pour chaque jour
        const dayLocalDataString = await AsyncStorage.getItem(`forme_data_${userData.id}_${dateString}`);
        let dayData;

        if (dayLocalDataString) {
          dayData = JSON.parse(dayLocalDataString);
        } else {
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

      // Sauvegarder d'abord en local pour garantir la persistance
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      await AsyncStorage.setItem(`forme_data_${userData.id}_${newData.date}`, JSON.stringify(newData));

      // Puis essayer de sauvegarder sur le serveur VPS
      try {
        await PersistentStorage.saveFormeData(userData.id, newData.date, newData);
        console.log('Données de forme sauvegardées sur le serveur VPS');
      } catch (serverError) {
        console.log('Serveur indisponible, sauvegarde locale effectuée');
      }

      // Mettre à jour l'état local
      setFormeData(newData);

    } catch (error) {
      console.error('Erreur sauvegarde données forme:', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder les données.');
    }
  };

  const calculateFormeScore = () => {
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
      // Plans Bronze, Argent, Or, Diamant
      weights.training = 0;

      // Ajuster les poids pour les plans premium
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
    console.log("Subscription Status:", isPremium);
    console.log("Calculated Weights:", weights);

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

      // Simuler un apport calorique basé sur les données utilisateur
      const estimatedDailyCalories = Math.round(
        (userData?.gender === 'Homme' ? 2200 : 1800) * 
        (userData?.activityLevel === 'sedentaire' ? 1.2 : 
         userData?.activityLevel === 'leger' ? 1.375 :
         userData?.activityLevel === 'modere' ? 1.55 :
         userData?.activityLevel === 'intense' ? 1.725 : 1.9)
      );

      // Score basé sur un apport théorique optimal
      caloriesScore = Math.min(100, Math.max(30, 
        100 - Math.abs(estimatedDailyCalories - (estimatedDailyCalories * 0.95)) / 50
      ));

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

    // Calculer le score final
    let finalScore;
    if (totalWeight === 0) {
      finalScore = 50; // Score par défaut si aucune donnée
    } else {
      finalScore = totalScore / totalWeight;
    }

    // S'assurer que le score est entre 0 et 100
    finalScore = Math.max(0, Math.min(100, Math.round(finalScore)));
    setFormeScore(finalScore);
  };

  const handleSaveSleep = async () => {
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

  const getTodayActivityRPE = async () => {
    try {
      if (!userData) return null;

      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      const storedRatings = await AsyncStorage.getItem(`activity_ratings_${userData.id}`);

      if (!storedRatings) {
        console.log('Aucune note RPE trouvée dans le stockage');
        return null;
      }

      const ratings = JSON.parse(storedRatings);

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
    if (score >= 80) return '#28A745';
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
```python
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

      // Ajuster les poids pour les plans premium
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

      // Simuler un apport calorique basé sur les données utilisateur
      const estimatedDailyCalories = Math.round(
        (userData?.gender === 'Homme' ? 2200 : 1800) * 
        (userData?.activityLevel === 'sedentaire' ? 1.2 : 
         userData?.activityLevel === 'leger' ? 1.375 :
         userData?.activityLevel === 'modere' ? 1.55 :
         userData?.activityLevel === 'intense' ? 1.725 : 1.9)
      );

      // Score basé sur un apport théorique optimal
      caloriesScore = Math.min(100, Math.max(30, 
        100 - Math.abs(estimatedDailyCalories - (estimatedDailyCalories * 0.95)) / 50
      ));

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
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Ma Forme</Text>
          <Text style={styles.subtitle}>Score: {formeScore}/100</Text>
        </View>

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
          <Text style={styles.scoreDescription}>
            {userData?.gender === 'Femme' ? 
              'Basé sur votre cycle hormonal, sommeil, stress' + (isPremium ? ', FC et RPE' : '') :
              'Basé sur votre sommeil, stress' + (isPremium ? ', FC et RPE' : '')
            }
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
                  hours: formeData.sleep.hours.toString(),
                  quality: formeData.sleep.quality,
                  bedTime: formeData.sleep.bedTime,
                  wakeTime: formeData.sleep.wakeTime
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
                  {formatSleepHours(formeData.sleep.hours)}
                </Text>
                <Text style={styles.metricDetail}>
                  {formeData.sleep.quality}
                </Text>
              </View>
              <Text style={styles.updateHint}>Appuyez pour modifier</Text>
            </TouchableOpacity>

            {/* Stress */}
            <TouchableOpacity 
              style={styles.metricCard}
              onPress={() => {
                setTempStress({
                  level: formeData.stress.level,
                  factors: formeData.stress.factors,
                  notes: formeData.stress.notes
                });
                setShowStressModal(true);
              }}
            >
              <View style={styles.metricIcon}>
                <Text style={styles.iconText}>😤</Text>
              </View>
              <View style={styles.metricInfo}>
                <Text style={styles.metricLabel}>Niveau de stress</Text>
                <Text style={styles.metricValue}>{formeData.stress.level}/10</Text>
                <Text style={styles.metricDetail}>
                  {formeData.stress.level <= 3 ? 'Faible' : 
                   formeData.stress.level <= 6 ? 'Modéré' : 'Élevé'}
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
                  RPE Post-Entraînement {!isPremium && '👑'}
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
                      'Aucune séance aujourd\'hui'
                    ) :
                    'Évaluation fatigue'
                  }
                </Text>
              </View>
              <Text style={styles.updateHint}>
                {isPremium ? 'Appuyez pour synchroniser' : 'Mise à niveau requise'}
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
                  • Excellente forme ! C'est le moment idéal pour un entraînement intensif
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