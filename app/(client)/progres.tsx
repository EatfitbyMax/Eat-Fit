import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Dimensions, Alert, TextInput, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring } from 'react-native-reanimated';
import { checkSubscriptionStatus } from '@/utils/subscription';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PersistentStorage } from '@/utils/storage';

const { width } = Dimensions.get('window');

export default function ProgresScreen() {
  const [selectedTab, setSelectedTab] = useState('Mesures');
  const [isPremium, setIsPremium] = useState(false);
  const [selectedMeasurementTab, setSelectedMeasurementTab] = useState('Poids');
  const [selectedPeriod, setSelectedPeriod] = useState('Mois');
  const progressAnimation = useSharedValue(0);
  const [userData, setUserData] = useState<any>(null);
  const [weightData, setWeightData] = useState({
    startWeight: 0,
    currentWeight: 0,
    targetWeight: 0,
    lastWeightUpdate: null as string | null,
    weeklyUpdates: 0,
    lastWeekReset: null as string | null,
    targetAsked: false,
    weightHistory: [] as Array<{ weight: number; date: string }>,
  });

  // Fonction pour formater le poids avec la précision appropriée
  const formatWeight = (weight: number) => {
    if (weight % 1 === 0) {
      return weight.toFixed(0); // Pas de décimales si c'est un nombre entier
    } else if ((weight * 10) % 1 === 0) {
      return weight.toFixed(1); // Une décimale si nécessaire
    } else {
      return weight.toFixed(2); // Deux décimales si nécessaire
    }
  };
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [tempWeight, setTempWeight] = useState('');
  const [tempTarget, setTempTarget] = useState('');

  // États pour les mensurations
  const [showMensurationModal, setShowMensurationModal] = useState(false);
  const [selectedMuscle, setSelectedMuscle] = useState<string>('');
  const [mensurationData, setMensurationData] = useState({
    biceps: { start: 0, current: 0 },
    bicepsGauche: { start: 0, current: 0 },
    bicepsDroit: { start: 0, current: 0 },
    cuisses: { start: 0, current: 0 },
    cuissesGauche: { start: 0, current: 0 },
    cuissesDroit: { start: 0, current: 0 },
    pectoraux: { start: 0, current: 0 },
    taille: { start: 0, current: 0 },
    avantBras: { start: 0, current: 0 },
    avantBrasGauche: { start: 0, current: 0 },
    avantBrasDroit: { start: 0, current: 0 },
    mollets: { start: 0, current: 0 },
    molletsGauche: { start: 0, current: 0 },
    molletsDroit: { start: 0, current: 0 },
  });
  const [tempMensuration, setTempMensuration] = useState({
    start: '',
    current: '',
    startGauche: '',
    currentGauche: '',
    startDroit: '',
    currentDroit: '',
  });
  const [weeklyData, setWeeklyData] = useState([]);
  const [personalRecords, setPersonalRecords] = useState({
    maxWeight: { value: 0, date: '', exercise: '' },
    longestRun: { value: 0, date: '', unit: 'km' },
    bestTime5k: { value: '', date: '' },
    totalWorkouts: 0
  });

  const [nutritionStats, setNutritionStats] = useState({
    weeklyCalories: [],
    monthlyCalories: [],
    averageCalories: 0,
    averageProteins: 0,
    averageCarbs: 0,
    averageFat: 0,
    daysWithData: 0,
    weeklyHydration: []
  });
  const [selectedNutritionPeriod, setSelectedNutritionPeriod] = useState('Semaine');
  const [calorieGoals, setCalorieGoals] = useState({
    calories: 2200,
    proteins: 110,
    carbohydrates: 275,
    fat: 73,
  });

  useEffect(() => {
    loadUserData();
    loadProgressData();
    loadNutritionData();
  }, []);

  // Charger les données de mensurations
  useEffect(() => {
    loadMensurationData();
  }, [userData]);

  const loadUserData = async () => {
    try {
      // Récupérer les données utilisateur
      const currentUserString = await AsyncStorage.getItem('currentUser');
      if (currentUserString) {
        const user = JSON.parse(currentUserString);
        setUserData(user);

        // Charger les données de poids
        const weightDataString = await AsyncStorage.getItem(`weight_data_${user.id}`);
        if (weightDataString) {
          const saved = JSON.parse(weightDataString);
          setWeightData(saved);
          // Calculer le pourcentage de progression
          if (saved.targetWeight && saved.startWeight) {
            const totalLoss = saved.startWeight - saved.targetWeight;
            const currentLoss = saved.startWeight - saved.currentWeight;
            const progress = Math.max(0, Math.min(1, currentLoss / totalLoss));
            progressAnimation.value = withSpring(progress);
          }
        } else {
          // Première utilisation - définir le poids de départ depuis l'inscription
          const startWeight = user.weight || 0;
          const initialData = {
            startWeight: startWeight,
            currentWeight: startWeight,
            targetWeight: 0,
            lastWeightUpdate: null,
            weeklyUpdates: 0,
            lastWeekReset: null,
            targetAsked: false, // Nouveau flag pour savoir si l'objectif a déjà été demandé
            weightHistory: startWeight > 0 ? [{ weight: startWeight, date: user.createdAt || new Date().toISOString() }] : [],
          };
          setWeightData(initialData);
          await saveWeightData(initialData);
          // Demander de définir l'objectif seulement si jamais demandé ET si pas d'objectif défini
          // Également vérifier si l'utilisateur n'a pas déjà un objectif dans ses données de profil
          const hasExistingGoal = user.targetWeight && user.targetWeight > 0;
          if (!initialData.targetAsked && initialData.targetWeight === 0 && !hasExistingGoal) {
            setTimeout(() => setShowTargetModal(true), 1000);
          }
        }
      }
    } catch (error) {
      console.error('Erreur chargement données utilisateur:', error);
    }
  };

  const saveWeightData = async (newData: any) => {
    try {
      if (userData) {
        await AsyncStorage.setItem(`weight_data_${userData.id}`, JSON.stringify(newData));
        setWeightData(newData);
      }
    } catch (error) {
      console.error('Erreur sauvegarde données poids:', error);
    }
  };

  const handleWeightUpdate = async () => {
    // Remplacer la virgule par un point pour la conversion
    const normalizedWeight = tempWeight.replace(',', '.');
    const weight = parseFloat(normalizedWeight);
    if (isNaN(weight) || weight <= 0) {
      Alert.alert('Erreur', 'Veuillez entrer un poids valide');
      return;
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const nowISO = now.toISOString();

    // Vérifier si on doit réinitialiser le compteur hebdomadaire
    const lastWeekReset = weightData.lastWeekReset ? new Date(weightData.lastWeekReset) : null;
    const daysSinceReset = lastWeekReset ? Math.floor((today.getTime() - lastWeekReset.getTime()) / (1000 * 60 * 60 * 24)) : 7;

    let newWeeklyUpdates = weightData.weeklyUpdates;
    let newLastWeekReset = weightData.lastWeekReset;

    // Si plus de 7 jours, réinitialiser le compteur
    if (daysSinceReset >= 7) {
      newWeeklyUpdates = 1;
      newLastWeekReset = today.toISOString();
    } else {
      newWeeklyUpdates = weightData.weeklyUpdates + 1;
    }

    // Ajouter la nouvelle pesée à l'historique
    const newWeightHistory = [...(weightData.weightHistory || [])];
    newWeightHistory.push({ weight: weight, date: nowISO });

    const newData = {
      ...weightData,
      currentWeight: weight,
      lastWeightUpdate: nowISO,
      weeklyUpdates: newWeeklyUpdates,
      lastWeekReset: newLastWeekReset,
      weightHistory: newWeightHistory,
    };

    await saveWeightData(newData);

    // Mettre à jour l'animation de progression
    if (newData.targetWeight && newData.startWeight) {
      const totalLoss = newData.startWeight - newData.targetWeight;
      const currentLoss = newData.startWeight - newData.currentWeight;
      const progress = Math.max(0, Math.min(1, currentLoss / totalLoss));
      progressAnimation.value = withSpring(progress);
    }

    setTempWeight('');
    setShowWeightModal(false);
    Alert.alert('Succès', 'Votre poids a été mis à jour !');
  };

  const handleTargetUpdate = async () => {
    // Remplacer la virgule par un point pour la conversion
    const normalizedTarget = tempTarget.replace(',', '.');
    const target = parseFloat(normalizedTarget);
    if (isNaN(target) || target <= 0) {
      Alert.alert('Erreur', 'Veuillez entrer un objectif valide');
      return;
    }

    const newData = {
      ...weightData,
      targetWeight: target,
      targetAsked: true, // Marquer comme demandé
    };

    await saveWeightData(newData);

    // Mettre à jour l'animation de progression
    if (newData.currentWeight && newData.startWeight) {
      const totalLoss = newData.startWeight - newData.targetWeight;
      const currentLoss = newData.startWeight - newData.currentWeight;
      const progress = Math.max(0, Math.min(1, currentLoss / totalLoss));
      progressAnimation.value = withSpring(progress);
    }

    setTempTarget('');
    setShowTargetModal(false);
    Alert.alert('Succès', 'Votre objectif a été défini !');
  };

  const loadMensurationData = async () => {
    try {
      if (userData) {
        const mensurationDataString = await AsyncStorage.getItem(`mensuration_data_${userData.id}`);
        if (mensurationDataString) {
          const saved = JSON.parse(mensurationDataString);
          setMensurationData(saved);
        }
      }
    } catch (error) {
      console.error('Erreur chargement données mensurations:', error);
    }
  };

  const saveMensurationData = async (newData: any) => {
    try {
      if (userData) {
        await AsyncStorage.setItem(`mensuration_data_${userData.id}`, JSON.stringify(newData));
        setMensurationData(newData);
      }
    } catch (error) {
      console.error('Erreur sauvegarde données mensurations:', error);
    }
  };

  const getMuscleConfig = (muscle: string) => {
    const configs = {
      biceps: { name: 'Biceps', icon: '💪', hasLeftRight: true },
      cuisses: { name: 'Cuisses', icon: '🦵', hasLeftRight: true },
      pectoraux: { name: 'Pectoraux', icon: '🫸', hasLeftRight: false },
      taille: { name: 'Taille', icon: '🤏', hasLeftRight: false },
      avantBras: { name: 'Avant-bras', icon: '🦾', hasLeftRight: true },
      mollets: { name: 'Mollets', icon: '🦵', hasLeftRight: true },
    };
    return configs[muscle] || { name: muscle, icon: '📏', hasLeftRight: false };
  };

  const formatMensuration = (value: number) => {
    if (value === 0) return '0.0';
    return value % 1 === 0 ? value.toFixed(1) : value.toFixed(1);
  };

  const getMensurationTrend = (muscle: string) => {
    const config = getMuscleConfig(muscle);
    const data = mensurationData[muscle];

    if (!data || data.start === 0 || data.current === 0) {
      return { text: 'Non défini', color: '#8B949E' };
    }

    const diff = data.current - data.start;
    if (diff > 0) {
      return { text: `↑ +${formatMensuration(diff)} cm`, color: '#28A745' };
    } else if (diff < 0) {
      return { text: `↓ ${formatMensuration(diff)} cm`, color: '#DC3545' };
    }
    return { text: 'Aucun changement', color: '#8B949E' };
  };

  const handleOpenMensurationModal = (muscle: string) => {
    setSelectedMuscle(muscle);
    const config = getMuscleConfig(muscle);
    const data = mensurationData[muscle] || { start: 0, current: 0 };

    if (config.hasLeftRight) {
      const dataGauche = mensurationData[muscle + 'Gauche'] || { start: 0, current: 0 };
      const dataDroit = mensurationData[muscle + 'Droit'] || { start: 0, current: 0 };

      setTempMensuration({
        start: data.start ? data.start.toString() : '',
        current: data.current ? data.current.toString() : '',
        startGauche: dataGauche.start ? dataGauche.start.toString() : '',
        currentGauche: dataGauche.current ? dataGauche.current.toString() : '',
        startDroit: dataDroit.start ? dataDroit.start.toString() : '',
        currentDroit: dataDroit.current ? dataDroit.current.toString() : '',
      });
    } else {
      setTempMensuration({
        start: data.start ? data.start.toString() : '',
        current: data.current ? data.current.toString() : '',
        startGauche: '',
        currentGauche: '',
        startDroit: '',
        currentDroit: '',
      });
    }

    setShowMensurationModal(true);
  };

  const handleSaveMensuration = async () => {
    const config = getMuscleConfig(selectedMuscle);

    // Validation des données
    const start = parseFloat(tempMensuration.start.replace(',', '.')) || 0;
    const current = parseFloat(tempMensuration.current.replace(',', '.')) || 0;

    if (start < 0 || current < 0) {
      Alert.alert('Erreur', 'Veuillez entrer des valeurs positives');
      return;
    }

    const newData = { ...mensurationData };

    // Sauvegarder les données principales
    newData[selectedMuscle] = {
      start: start,
      current: current,
    };

    // Si le muscle a des côtés gauche/droit
    if (config.hasLeftRight) {
      const startGauche = parseFloat(tempMensuration.startGauche.replace(',', '.')) || 0;
      const currentGauche = parseFloat(tempMensuration.currentGauche.replace(',', '.')) || 0;
      const startDroit = parseFloat(tempMensuration.startDroit.replace(',', '.')) || 0;
      const currentDroit = parseFloat(tempMensuration.currentDroit.replace(',', '.')) || 0;

      newData[selectedMuscle + 'Gauche'] = {
        start: startGauche,
        current: currentGauche,
      };

      newData[selectedMuscle + 'Droit'] = {
        start: startDroit,
        current: currentDroit,
      };
    }

    await saveMensurationData(newData);
    setShowMensurationModal(false);
    Alert.alert('Succès', 'Vos mensurations ont été mises à jour !');
  };

  const canUpdateWeight = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Si pas de dernière mise à jour, on peut toujours mettre à jour
    if (!weightData.lastWeightUpdate) return { canUpdate: true, reason: '' };

    // Vérifier si on doit réinitialiser le compteur hebdomadaire
    const lastWeekReset = weightData.lastWeekReset ? new Date(weightData.lastWeekReset) : null;
    const daysSinceReset = lastWeekReset ? Math.floor((today.getTime() - lastWeekReset.getTime()) / (1000 * 60 * 60 * 24)) : 7;

    // Si plus de 7 jours depuis le dernier reset, on peut remettre à jour
    if (daysSinceReset >= 7) {
      return { canUpdate: true, reason: '' };
    }

    // Sinon, vérifier si on a encore des mises à jour disponibles cette semaine
    if (weightData.weeklyUpdates < 7) {
      return { canUpdate: true, reason: '' };
    }

    return { 
      canUpdate: false, 
      reason: 'Vous avez atteint la limite de 7 mises à jour par semaine.' 
    };
  };

  const getWeightTrend = () => {
    if (!weightData.lastWeightUpdate) return { text: '', color: '#28A745' };

    const weightDiff = weightData.startWeight - weightData.currentWeight;
    const progressPercentage = weightData.targetWeight && weightData.startWeight ? 
      Math.round(((weightData.startWeight - weightData.currentWeight) / (weightData.startWeight - weightData.targetWeight)) * 100) : 0;

    // Couleur basée sur la progression vers l'objectif
    const color = progressPercentage < 0 ? '#DC3545' : '#28A745'; // Rouge si négatif, vert si positif

    if (weightDiff > 0) {
      return { 
        text: `↓ -${formatWeight(weightDiff)} kg depuis le début`,
        color: color
      };
    } else if (weightDiff < 0) {
      return { 
        text: `↑ +${formatWeight(Math.abs(weightDiff))} kg depuis le début`,
        color: color
      };
    }
    return { text: 'Aucun changement', color: '#8B949E' };
  };

  const animatedProgressStyle = useAnimatedStyle(() => {
    return {
      width: `${progressAnimation.value * 100}%`,
    };
  });

  const renderWeightChart = () => {
    if (!weightData.startWeight) return null;

    const processedData = getProcessedWeightData();
    const allLabels = generatePeriodLabels();
    const dataPoints = [];

    // Générer les points de données basés sur les données traitées
    processedData.forEach((entry, index) => {
      const position = getDataPointPosition(entry.weight, index, processedData.length, allLabels);
      dataPoints.push(
        <View 
          key={`weight-${entry.date.toISOString()}-${index}`} 
          style={[styles.dataPoint, position]} 
        />
      );
    });

    return (
      <>
        <LinearGradient
          colors={['rgba(245, 166, 35, 0.3)', 'rgba(245, 166, 35, 0.1)']}
          style={styles.weightLineGradient}
        />
        <View style={styles.dataPoints}>
          {dataPoints}
        </View>
      </>
    );
  };

  const getDataPointPosition = (weight: number, dataIndex: number, totalDataPoints: number, allLabels: string[]) => {
    // Déterminer la plage de poids pour correspondre aux labels
    const weights = [weightData.startWeight, weightData.currentWeight];
    if (weightData.targetWeight) weights.push(weightData.targetWeight);

    const minDataWeight = Math.min(...weights.filter(w => w > 0));
    const maxDataWeight = Math.max(...weights.filter(w => w > 0));

    // Utiliser la même logique que generateYAxisLabels
    const minWeight = Math.floor((minDataWeight - 10) / 5) * 5;
    const maxWeight = Math.ceil((maxDataWeight + 10) / 5) * 5;
    const weightRange = maxWeight - minWeight;

    const weightPercentage = Math.max(0, Math.min(1, (maxWeight - weight) / weightRange));

    // Calculer la position horizontale en fonction des labels disponibles
    // Les labels sont espacés uniformément, donc chaque point doit s'aligner avec son label correspondant
    const totalLabels = allLabels.length;
    let leftPercentage = 0;

    if (totalLabels > 1) {
      // Calculer la position basée sur l'index du point parmi les labels disponibles
      const labelIndex = Math.min(dataIndex, totalLabels - 1);
      leftPercentage = (labelIndex / (totalLabels - 1)) * 100;
    } else {
      leftPercentage = 50; // Point unique au centre
    }

    return {
      left: `${leftPercentage}%`,
      top: `${weightPercentage * 80 + 10}%` // 10% de marge en haut et en bas
    };
  };

  const generateYAxisLabels = () => {
    if (!weightData.startWeight && !weightData.currentWeight) {
      return ['90', '85', '80', '75', '70', '65'];
    }

    const processedData = getProcessedWeightData();

    // Déterminer la plage de poids basée sur les données traitées + données de base
    const weights = [weightData.startWeight, weightData.currentWeight];
    if (weightData.targetWeight) weights.push(weightData.targetWeight);

    // Ajouter les poids des données traitées
    processedData.forEach(entry => {
      if (entry.weight > 0) weights.push(entry.weight);
    });

    const minDataWeight = Math.min(...weights.filter(w => w > 0));
    const maxDataWeight = Math.max(...weights.filter(w => w > 0));

    // Arrondir vers le bas pour min et vers le haut pour max, par tranches de 5
    const minWeight = Math.floor((minDataWeight - 10) / 5) * 5;
    const maxWeight = Math.ceil((maxDataWeight + 10) / 5) * 5;

    // Générer 6 labels avec des intervalles de 5 kg
    const labels = [];
    const step = (maxWeight - minWeight) / 5;

    for (let i = 0; i < 6; i++) {
      const weight = maxWeight - (i * step);
      // Arrondir au multiple de 5 le plus proche
      const roundedWeight = Math.round(weight / 5) * 5;
      labels.push(roundedWeight.toString());
    }

    return labels;
  };

  const generatePeriodLabels = () => {
    if (!weightData.startWeight) {
      if (selectedPeriod === 'Semaines') return ['S1', 'S2', 'S3', 'S4', 'S5', 'S6'];
      if (selectedPeriod === 'Mois') return ['Janv', 'Mars', 'Mai', 'Juil', 'Sept', 'Déc'];
      return ['2023', '2024', '2025'];
    }

    const processedData = getProcessedWeightData();
    const labels = [];
    const monthNames = ['Janv', 'Févr', 'Mars', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'];

    if (selectedPeriod === 'Semaines') {
      // Pour les semaines, générer 6 labels en incluant la semaine actuelle
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const startOfYear = new Date(currentYear, 0, 1);
      const currentWeekNum = Math.ceil(((currentDate.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);

      // Générer les 6 dernières semaines en terminant par la semaine actuelle
      for (let i = 5; i >= 0; i--) {
        const weekNum = Math.max(1, currentWeekNum - i);
        labels.push(`S${weekNum}`);
      }
    } else {
      processedData.forEach((entry, index) => {
        if (selectedPeriod === 'Mois') {
          labels.push(monthNames[entry.date.getMonth()]);
        } else { // Années
          labels.push(entry.date.getFullYear().toString());
        }
      });

      // Compléter avec des labels vides si nécessaire
      while (labels.length < 6) {
        labels.push('');
      }
    }

    return labels.slice(0, 6);
  };

  // Nouvelle fonction pour traiter les données selon la période
  const getProcessedWeightData = () => {
    const history = weightData.weightHistory || [];

    // Créer l'historique complet en s'assurant que le poids de départ est inclus
    let completeHistory = [...history];

    // Vérifier si le poids de départ est déjà dans l'historique
    const hasStartWeight = history.some(entry => 
      Math.abs(entry.weight - weightData.startWeight) < 0.1 && 
      new Date(entry.date).getTime() <= new Date(userData?.createdAt || new Date()).getTime() + 24 * 60 * 60 * 1000
    );

    // Si le poids de départ n'est pas dans l'historique, l'ajouter au début
    if (!hasStartWeight && userData?.createdAt) {
      completeHistory.unshift({
        weight: weightData.startWeight,
        date: userData.createdAt
      });
    }

    // Trier par date
    completeHistory.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const currentDate = new Date();
    let filteredHistory = [...completeHistory];

    // Filtrer l'historique selon la période
    if (selectedPeriod === 'Semaines') {
      const sixWeeksAgo = new Date(currentDate.getTime() - (6 * 7 * 24 * 60 * 60 * 1000));
      filteredHistory = completeHistory.filter(entry => new Date(entry.date) >= sixWeeksAgo);
    } else if (selectedPeriod === 'Mois') {
      const sixMonthsAgo = new Date(currentDate.getTime() - (6 * 30 * 24 * 60 * 60 * 1000));
      filteredHistory = completeHistory.filter(entry => new Date(entry.date) >= sixMonthsAgo);
    } else { // Années
      const sixYearsAgo = new Date(currentDate.getTime() - (6 * 365 * 24 * 60 * 60 * 1000));
      filteredHistory = completeHistory.filter(entry => new Date(entry.date) >= sixYearsAgo);
    }

    // S'assurer qu'on a au moins le poids de départ si la période le permet
    if (filteredHistory.length === 0 && userData?.createdAt) {
      const startDate = new Date(userData.createdAt);
      const periodStart = selectedPeriod === 'Semaines' ? 
        new Date(currentDate.getTime() - (6 * 7 * 24 * 60 * 60 * 1000)) :
        selectedPeriod === 'Mois' ?
        new Date(currentDate.getTime() - (6 * 30 * 24 * 60 * 60 * 1000)) :
        new Date(currentDate.getTime() - (6 * 365 * 24 * 60 * 60 * 1000));

      if (startDate >= periodStart) {
        filteredHistory.push({
          weight: weightData.startWeight,
          date: userData.createdAt
        });
      }
    }

    // Traitement selon la période sélectionnée
    if (selectedPeriod === 'Semaines') {
      // Pour les semaines, on garde les données individuelles (échantillonnage si nécessaire)
      if (filteredHistory.length > 6) {
        const step = Math.floor(filteredHistory.length / 6);
        const sampledHistory = [];

        sampledHistory.push(filteredHistory[0]);
        for (let i = step; i < filteredHistory.length; i += step) {
          if (sampledHistory.length < 5) {
            sampledHistory.push(filteredHistory[i]);
          }
        }

        if (filteredHistory.length > 1 && sampledHistory[sampledHistory.length - 1] !== filteredHistory[filteredHistory.length - 1]) {
          if (sampledHistory.length === 6) {
            sampledHistory[5] = filteredHistory[filteredHistory.length - 1];
          } else {
            sampledHistory.push(filteredHistory[filteredHistory.length - 1]);
          }
        }

        filteredHistory = sampledHistory;
      }

      return filteredHistory.map(entry => ({
        weight: entry.weight,
        date: new Date(entry.date)
      }));

    } else if (selectedPeriod === 'Mois') {
      // Pour les mois, faire la moyenne par semaine puis regrouper par mois
      const weeklyAverages = new Map();

      filteredHistory.forEach(entry => {
        const date = new Date(entry.date);
        const startOfWeek = new Date(date);
        startOfWeek.setDate(date.getDate() - date.getDay()); // Début de la semaine (dimanche)
        const weekKey = startOfWeek.toISOString().split('T')[0];

        if (!weeklyAverages.has(weekKey)) {
          weeklyAverages.set(weekKey, { total: 0, count: 0, date: startOfWeek });
        }

        const weekData = weeklyAverages.get(weekKey);
        weekData.total += entry.weight;
        weekData.count += 1;
      });

      // Convertir en moyennes hebdomadaires
      const weeklyData = Array.from(weeklyAverages.values()).map(week => ({
        weight: week.total / week.count,
        date: week.date
      }));

      // Regrouper par mois et faire la moyenne des semaines
      const monthlyAverages = new Map();

      weeklyData.forEach(week => {
        const monthKey = `${week.date.getFullYear()}-${week.date.getMonth()}`;

        if (!monthlyAverages.has(monthKey)) {
          monthlyAverages.set(monthKey, { 
            total: 0, 
            count: 0, 
            date: new Date(week.date.getFullYear(), week.date.getMonth(), 1) 
          });
        }

        const monthData = monthlyAverages.get(monthKey);
        monthData.total += week.weight;
        monthData.count += 1;
      });

      const monthlyData = Array.from(monthlyAverages.values())
        .map(month => ({
          weight: month.total / month.count,
          date: month.date
        }))
        .sort((a, b) => a.date.getTime() - b.date.getTime())
        .slice(-6); // Garder les 6 derniers mois

      return monthlyData;

    } else { // Années
      // Pour les années, faire la moyenne par mois puis regrouper par année
      const monthlyAverages = new Map();

      filteredHistory.forEach(entry => {
        const date = new Date(entry.date);
        const monthKey = `${date.getFullYear()}-${date.getMonth()}`;

        if (!monthlyAverages.has(monthKey)) {
          monthlyAverages.set(monthKey, { 
            total: 0, 
            count: 0, 
            date: new Date(date.getFullYear(), date.getMonth(), 1) 
          });
        }

        const monthData = monthlyAverages.get(monthKey);
        monthData.total += entry.weight;
        monthData.count += 1;
      });

      // Convertir en moyennes mensuelles
      const monthlyData = Array.from(monthlyAverages.values()).map(month => ({
        weight: month.total / month.count,
        date: month.date
      }));

      // Regrouper par année et faire la moyenne des mois
      const yearlyAverages = new Map();

      monthlyData.forEach(month => {
        const yearKey = month.date.getFullYear().toString();

        if (!yearlyAverages.has(yearKey)) {
          yearlyAverages.set(yearKey, { 
            total: 0, 
            count: 0, 
            date: new Date(month.date.getFullYear(), 0, 1) 
          });
        }

        const yearData = yearlyAverages.get(yearKey);
        yearData.total += month.weight;
        yearData.count += 1;
      });

      const yearlyData = Array.from(yearlyAverages.values())
        .map(year => ({
          weight: year.total / year.count,
          date: year.date
        }))
        .sort((a, b) => a.date.getTime() - b.date.getTime())
        .slice(-6); // Garder les 6 dernières années```python

      return yearlyData;
    }
  };

  const loadProgressData = async () => {
    try {
      const user = await PersistentStorage.getCurrentUser();
      if (!user) return;

      // Charger les données d'entraînement
      const workouts = await PersistentStorage.getWorkouts(user.id);

      // Calculer les statistiques des 7 derniers jours
      const last7Days = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateString = date.toISOString().split('T')[0];

        const dayWorkouts = workouts.filter((workout: any) => 
          workout.date === dateString
        );

        const totalMinutes = dayWorkouts.reduce((sum: number, workout: any) => 
          sum + (workout.duration || 0), 0
        );

        last7Days.push({
          date: dateString,
          day: date.toLocaleDateString('fr-FR', { weekday: 'short' }),
          minutes: totalMinutes,
          workouts: dayWorkouts.length
        });
      }

      setWeeklyData(last7Days);

      // Calculer les records personnels (données simulées pour l'exemple)
      setPersonalRecords({
        maxWeight: { value: 85, date: '2024-01-15', exercise: 'Développé couché' },
        longestRun: { value: 12.5, date: '2024-01-20', unit: 'km' },
        bestTime5k: { value: '22:45', date: '2024-01-18' },
        totalWorkouts: workouts.length
      });

    } catch (error) {
      console.error('Erreur chargement données de progrès:', error);
    }
  };

  const loadNutritionData = async () => {
    try {
      const user = await PersistentStorage.getCurrentUser();
      if (!user) return;

      // Charger les données nutritionnelles réelles
      let nutritionEntries = [];
      try {
        // Essayer de charger depuis le serveur VPS d'abord
        const VPS_URL = process.env.EXPO_PUBLIC_VPS_URL || 'https://eatfitbymax.replit.app';
        const response = await fetch(`${VPS_URL}/api/nutrition/${user.id}`);

        if (response.ok) {
          nutritionEntries = await response.json();
          console.log('Données nutrition chargées depuis le serveur VPS pour les progrès');
        } else {
          throw new Error('Serveur indisponible');
        }
      } catch (serverError) {
        console.log('Fallback vers le stockage local pour nutrition (progrès)');
        const stored = await AsyncStorage.getItem(`food_entries_${user.id}`);
        if (stored) {
          nutritionEntries = JSON.parse(stored);
        }
      }

      // Calculer les statistiques des 7 derniers jours
      const last7DaysNutrition = [];
      const last7DaysHydration = [];
      let totalCaloriesWeek = 0;
      let totalProteinsWeek = 0;
      let totalCarbsWeek = 0;
      let totalFatWeek = 0;
      let totalHydrationWeek = 0;
      let daysWithData = 0;
      let daysWithHydration = 0;

      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateString = date.toISOString().split('T')[0];

        // Données nutritionnelles
        const dayEntries = nutritionEntries.filter((entry: any) => 
          entry.date === dateString
        );

        const dayCalories = dayEntries.reduce((sum: number, entry: any) => 
          sum + (entry.calories || 0), 0
        );

        const dayProteins = dayEntries.reduce((sum: number, entry: any) => 
          sum + (entry.proteins || 0), 0
        );

        const dayCarbonhydrates = dayEntries.reduce((sum: number, entry: any) => 
          sum + (entry.carbohydrates || 0), 0
        );

        const dayFat = dayEntries.reduce((sum: number, entry: any) => 
          sum + (entry.fat || 0), 0
        );

        if (dayCalories > 0) {
          totalCaloriesWeek += dayCalories;
          totalProteinsWeek += dayProteins;
          totalCarbsWeek += dayCarbonhydrates;
          totalFatWeek += dayFat;
          daysWithData++;
        }

        last7DaysNutrition.push({
          date: dateString,
          day: date.toLocaleDateString('fr-FR', { weekday: 'short' }),
          calories: dayCalories,
          proteins: dayProteins,
          carbohydrates: dayCarbonhydrates,
          fat: dayFat
        });

        // Données d'hydratation
        try {
          const waterStored = await AsyncStorage.getItem(`water_intake_${user.id}_${dateString}`);
          const dayWater = waterStored ? parseInt(waterStored) : 0;

          if (dayWater > 0) {
            totalHydrationWeek += dayWater;
            daysWithHydration++;
          }

          last7DaysHydration.push({
            date: dateString,
            day: date.toLocaleDateString('fr-FR', { weekday: 'short' }),
            water: dayWater,
            goal: 2000 // Objectif de base, sera calculé dynamiquement dans l'affichage
          });
        } catch (error) {
          console.error('Erreur récupération hydratation pour', dateString, error);
          last7DaysHydration.push({
            date: dateString,
            day: date.toLocaleDateString('fr-FR', { weekday: 'short' }),
            water: 0,
            goal: 2000
          });
        }
      }

       // Calculer les statistiques des 30 derniers jours
       const last30DaysNutrition = [];
       for (let i = 29; i >= 0; i--) {
         const date = new Date();
         date.setDate(date.getDate() - i);
         const dateString = date.toISOString().split('T')[0];
 
         // Données nutritionnelles
         const dayEntries = nutritionEntries.filter((entry: any) => 
           entry.date === dateString
         );
 
         const dayCalories = dayEntries.reduce((sum: number, entry: any) => 
           sum + (entry.calories || 0), 0
         );
 
         last30DaysNutrition.push({
           date: dateString,
           day: date.toLocaleDateString('fr-FR', { weekday: 'short' }),
           calories: dayCalories,
         });
       }

      // Calculer les moyennes
      const avgCalories = daysWithData > 0 ? Math.round(totalCaloriesWeek / daysWithData) : 0;
      const avgProteins = daysWithData > 0 ? Math.round(totalProteinsWeek / daysWithData) : 0;
      const avgCarbs = daysWithData > 0 ? Math.round(totalCarbsWeek / daysWithData) : 0;
      const avgFat = daysWithData > 0 ? Math.round(totalFatWeek / daysWithData) : 0;
      const avgHydration = daysWithHydration > 0 ? Math.round(totalHydrationWeek / daysWithHydration) : 0;

      setNutritionStats({
        weeklyCalories: last7DaysNutrition,
        monthlyCalories: last30DaysNutrition,
        averageCalories: avgCalories,
        averageProteins: avgProteins,
        averageCarbs: avgCarbs,
        averageFat: avgFat,
        daysWithData,
        weeklyHydration: last7DaysHydration
      });

      // Charger les objectifs caloriques personnalisés
      await loadPersonalizedGoals(user);

    } catch (error) {
      console.error('Erreur chargement données nutrition:', error);
    }
  };

  const loadPersonalizedGoals = async (user: any) => {
    try {
      if (!user || !user.age || !user.weight || !user.height || !user.gender) {
        return;
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
        totalCalories -= 300; // Déficit de 300 kcal
      } else if (goals.includes('Prendre du muscle')) {
        totalCalories += 200; // Surplus de 200 kcal
      } else if (goals.includes('Maintenir mon poids')) {
        totalCalories -= 0; // Maintien
      }

      // Calcul des macronutriments
      let proteinRatio = 0.20; // 20% par défaut
      let carbRatio = 0.50;    // 50% par défaut
      let fatRatio = 0.30;     // 30% par défaut

      if (goals.includes('Prendre du muscle')) {
        proteinRatio = 0.25;
        carbRatio = 0.45;
        fatRatio = 0.30;
      } else if (goals.includes('Perdre du poids')) {
        proteinRatio = 0.30;
        carbRatio = 0.40;
        fatRatio = 0.30;
      }

      const proteins = Math.round((totalCalories * proteinRatio) / 4);
      const carbohydrates = Math.round((totalCalories * carbRatio) / 4);
      const fat = Math.round((totalCalories * fatRatio) / 9);

      setCalorieGoals({
        calories: totalCalories,
        proteins: proteins,
        carbohydrates: carbohydrates,
        fat: fat,
      });

    } catch (error) {
      console.error('Erreur chargement données nutrition:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header sans gradient */}
        <View style={styles.header}>
          <Text style={styles.title}>Mes progrès</Text>
        </View>

        {/* Tabs with improved design */}
        <View style={styles.tabsContainer}>
          {['Mesures', 'Nutrition', 'Sport'].map((tab) => (
            <TouchableOpacity 
              key={tab}
              style={[styles.tab, selectedTab === tab && styles.activeTab]}
              onPress={() => setSelectedTab(tab)}
              activeOpacity={0.8}
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

        {/* Onglets de mesures */}
        {selectedTab === 'Mesures' && (
          <View style={styles.measurementTabsContainer}>
            <TouchableOpacity 
              style={[styles.measurementTab, selectedMeasurementTab === 'Poids' && styles.activeMeasurementTab]}
              onPress={() => setSelectedMeasurementTab('Poids')}
            >
              <Text style={[styles.measurementTabText, selectedMeasurementTab === 'Poids' && styles.activeMeasurementTabText]}>
                Poids
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.measurementTab, selectedMeasurementTab === 'Mensurations' && styles.activeMeasurementTab]}
              onPress={() => {
                if (!isPremium) {
                  Alert.alert(
                    'Fonctionnalité Premium',
                    'Le suivi des mensurations musculaires est réservé aux abonnés premium.',
                    [{ text: 'OK' }]
                  );
                  return;
                }
                setSelectedMeasurementTab('Mensurations');
              }}
            >
              <View style={styles.measurementTabContent}>
                <Text style={[styles.measurementTabText, selectedMeasurementTab === 'Mensurations' && styles.activeMeasurementTabText]}>
                  Mensurations
                </Text>
                {!isPremium && <Text style={styles.premiumBadge}>👑</Text>}
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Onglet Sport */}
        {selectedTab === 'Sport' && (
          <View style={styles.sportContainer}>
            {/* Résumé de la semaine */}
            <View style={styles.sportSummaryCard}>
              <Text style={styles.chartTitle}>📈 Résumé de la semaine</Text>
              <View style={styles.sportSummaryStats}>
                <View style={styles.sportSummaryItem}>
                  <Text style={styles.sportSummaryValue}>4</Text>
                  <Text style={styles.sportSummaryLabel}>Séances</Text>
                </View>
                <View style={styles.sportSummaryItem}>
                  <Text style={styles.sportSummaryValue}>5h 30min</Text>
                  <Text style={styles.sportSummaryLabel}>Temps total</Text>
                </View>
                <View style={styles.sportSummaryItem}>
                  <Text style={styles.sportSummaryValue}>1,247</Text>
                  <Text style={styles.sportSummaryLabel}>Calories brûlées</Text>
                </View>
              </View>
            </View>

            {/* Graphique d'activité hebdomadaire */}
            <View style={styles.chartContainer}>
              <View style={styles.chartHeader}>
                <Text style={styles.chartTitle}>Activité sportive</Text>
                <View style={styles.chartPeriod}>
                  <Text style={styles.chartPeriodText}>7 jours</Text>
                </View>
              </View>

              <View style={styles.sportChartArea}>
                {/* Axe Y pour les séances */}
                <View style={styles.yAxis}>
                  {['3', '2.5', '2', '1.5', '1', '0.5', '0'].map((label, index) => (
                    <Text key={index} style={styles.yAxisLabel}>{label}</Text>
                  ))}
                </View>

                <View style={styles.chartContent}>
                  {/* Grille */}
                  <View style={styles.gridContainer}>
                    {[...Array(7)].map((_, i) => (
                      <View key={i} style={styles.gridLine} />
                    ))}
                  </View>

                  {/* Barres d'activité */}
                  <View style={styles.sportBars}>
                    {[
                      { day: 'Lun', sessions: 1, calories: 320 },
                      { day: 'Mar', sessions: 0, calories: 0 },
                      { day: 'Mer', sessions: 2, calories: 480 },
                      { day: 'Jeu', sessions: 1, calories: 275 },
                      { day: 'Ven', sessions: 0, calories: 0 },
                      { day: 'Sam', sessions: 1, calories: 380 },
                      { day: 'Dim', sessions: 2, calories: 520 }
                    ].map((data, index) => {
                      const height = (data.sessions / 3) * 80;
                      return (
                        <View key={data.day} style={styles.sportBarContainer}>
                          <View style={[styles.sportBar, { height: `${height}%` }]} />
                          <Text style={styles.caloriesText}>{data.calories}</Text>
                          <Text style={styles.dayLabel}>{data.day}</Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              </View>
            </View>

            {/* Statistiques par type de sport */}
            <View style={styles.sportTypeContainer}>
              <Text style={styles.chartTitle}>Répartition par activité</Text>

              <View style={styles.sportTypeGrid}>
                <View style={styles.sportTypeCard}>
                  <View style={styles.sportTypeIcon}>
                    <Text style={styles.sportTypeEmoji}>💪</Text>
                  </View>
                  <Text style={styles.sportTypeLabel}>Musculation</Text>
                  <Text style={styles.sportTypeValue}>2 séances</Text>
                  <Text style={styles.sportTypeTime}>2h 30min</Text>
                </View>

                <View style={styles.sportTypeCard}>
                  <View style={styles.sportTypeIcon}>
                    <Text style={styles.sportTypeEmoji}>🏃‍♂️</Text>
                  </View>
                  <Text style={styles.sportTypeLabel}>Course</Text>
                  <Text style={styles.sportTypeValue}>1 séance</Text>
                  <Text style={styles.sportTypeTime}>45min</Text>
                </View>

                <View style={styles.sportTypeCard}>
                  <View style={styles.sportTypeIcon}>
                    <Text style={styles.sportTypeEmoji}>🧘‍♀️</Text>
                  </View>
                  <Text style={styles.sportTypeLabel}>Yoga</Text>
                  <Text style={styles.sportTypeValue}>1 séance</Text>
                  <Text style={styles.sportTypeTime}>1h 15min</Text>
                </View>

                <View style={styles.sportTypeCard}>
                  <View style={styles.sportTypeIcon}>
                    <Text style={styles.sportTypeEmoji}>🚴‍♂️</Text>
                  </View>
                  <Text style={styles.sportTypeLabel}>Cyclisme</Text>
                  <Text style={styles.sportTypeValue}>0 séance</Text>
                  <Text style={styles.sportTypeTime}>0min</Text>
                </View>
              </View>
            </View>

            {/* Progression des objectifs sportifs */}
            <View style={styles.sportObjectivesCard}>
              <Text style={styles.chartTitle}>🎯 Objectifs de la semaine</Text>

              <View style={styles.objectiveItem}>
                <View style={styles.objectiveHeader}>
                  <Text style={styles.objectiveLabel}>Séances par semaine</Text>
                  <Text style={styles.objectiveProgress}>4/5</Text>
                </View>
                <View style={styles.objectiveBar}>
                  <View style={[styles.objectiveBarFill, { width: '80%' }]} />
                </View>
              </View>

              <View style={styles.objectiveItem}>
                <View style={styles.objectiveHeader}>
                  <Text style={styles.objectiveLabel}>Temps d'entraînement</Text>
                  <Text style={styles.objectiveProgress}>5h30/6h</Text>
                </View>
                <View style={styles.objectiveBar}>
                  <View style={[styles.objectiveBarFill, { width: '92%' }]} />
                </View>
              </View>

              <View style={styles.objectiveItem}>
                <View style={styles.objectiveHeader}>
                  <Text style={styles.objectiveLabel}>Calories brûlées</Text>
                  <Text style={styles.objectiveProgress}>1,247/1,500</Text>
                </View>
                <View style={styles.objectiveBar}>
                  <View style={[styles.objectiveBarFill, { width: '83%' }]} />
                </View>
              </View>
            </View>

            {/* Records personnels */}
            <View style={styles.personalRecordsCard}>
              <Text style={styles.chartTitle}>🏆 Records personnels</Text>

              <View style={styles.recordsGrid}>
                <View style={styles.recordItem}>
                  <Text style={styles.recordLabel}>Développé couché</Text>
                  <Text style={styles.recordValue}>85 kg</Text>
                  <Text style={styles.recordDate}>Il y a 3 jours</Text>
                </View>

                <View style={styles.recordItem}>
                  <Text style={styles.recordLabel}>Course 5km</Text>
                  <Text style={styles.recordValue}>24:32</Text>
                  <Text style={styles.recordDate}>Il y a 1 semaine</Text>
                </View>

                <View style={styles.recordItem}>
                  <Text style={styles.recordLabel}>Squat</Text>
                  <Text style={styles.recordValue}>95 kg</Text>
                  <Text style={styles.recordDate}>Il y a 5 jours</Text>
                </View>

                <View style={styles.recordItem}>
                  <Text style={styles.recordLabel}>Planche</Text>
                  <Text style={styles.recordValue}>2:45</Text>
                  <Text style={styles.recordDate}>Hier</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Statistiques selon l'onglet sélectionné */}
        {selectedTab === 'Nutrition' && (
          <View style={styles.nutritionContainer}>
            {/* Graphique des calories */}
            <View style={styles.nutritionChartContainer}>
              <View style={styles.chartHeader}>
                <Text style={styles.chartTitle}>Apport calorique journalier</Text>
              </View>

              {/* Onglets de période */}
              <View style={styles.periodTabsContainer}>
                {['Semaine', 'Mois'].map((period) => (
                  <TouchableOpacity 
                    key={period}
                    style={[styles.periodTab, selectedNutritionPeriod === period && styles.activePeriodTab]}
                    onPress={() => setSelectedNutritionPeriod(period)}
                  >
                    <Text style={[styles.periodTabText, selectedNutritionPeriod === period && styles.activePeriodTabText]}>
                      {period}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.nutritionChartArea}>
                {/* Axe Y pour les calories */}
                <View style={styles.nutritionYAxis}>
                  {(() => {
                    // Générer l'axe Y adapté aux données du client avec minimum 1000 kcal et paliers de 500
                    const currentData = selectedNutritionPeriod === 'Semaine' ? nutritionStats.weeklyCalories : nutritionStats.monthlyCalories;
                    const maxDataCalories = Math.max(...currentData.map(d => d.calories), nutritionStats.averageCalories);
                    
                    // Utiliser l'objectif calorique du client comme référence principale
                    const clientGoal = calorieGoals?.calories || 2200;
                    
                    // Déterminer la valeur max de l'axe Y
                    const maxAxisValue = Math.max(maxDataCalories, clientGoal * 1.2, 1000);
                    
                    // Arrondir au multiple de 500 supérieur, avec minimum 1000
                    const roundedMax = Math.max(1000, Math.ceil(maxAxisValue / 500) * 500);
                    
                    // Générer 6 labels par paliers de 500, en partant du maximum vers 1000
                    const labels = [];
                    const step = 500;
                    const numberOfSteps = Math.max(5, Math.floor((roundedMax - 1000) / step));
                    
                    for (let i = 0; i < 6; i++) {
                      const value = roundedMax - (i * (roundedMax - 1000) / 5);
                      // Arrondir au multiple de 500 le plus proche, avec minimum 1000
                      const roundedValue = Math.max(1000, Math.round(value / 500) * 500);
                      labels.push(roundedValue.toString());
                    }
                    
                    return labels.map((label, index) => (
                      <Text key={index} style={styles.nutritionYAxisLabel}>{label}</Text>
                    ));
                  })()}
                </View>

                <View style={styles.chartContent}>
                  {/* Grille */}
                  <View style={styles.gridContainer}>
                    {[...Array(6)].map((_, i) => (
                      <View key={i} style={styles.gridLine} />
                    ))}
                  </View>

                  {/* Barres de calories */}
                  <View style={styles.caloriesBars}>
                    {(selectedNutritionPeriod === 'Semaine' ? nutritionStats.weeklyCalories : nutritionStats.monthlyCalories).map((dayData, index) => {
                      const currentData = selectedNutritionPeriod === 'Semaine' ? nutritionStats.weeklyCalories : nutritionStats.monthlyCalories;
                      const maxDataCalories = Math.max(...currentData.map(d => d.calories), nutritionStats.averageCalories);
                      
                      // Utiliser la même logique que pour l'axe Y avec minimum 1000 et paliers de 500
                      const clientGoal = calorieGoals?.calories || 2200;
                      const maxAxisValue = Math.max(maxDataCalories, clientGoal * 1.2, 1000);
                      const roundedMax = Math.max(1000, Math.ceil(maxAxisValue / 500) * 500);
                      const minAxisValue = 1000;
                      
                      // Calculer la hauteur relative entre min et max
                      let barHeight = 5; // Hauteur minimale si pas de données
                      if (dayData.calories > 0) {
                        // Calculer le pourcentage entre la valeur min (1000) et max de l'axe
                        const adjustedCalories = Math.max(minAxisValue, dayData.calories);
                        const percentage = (adjustedCalories - minAxisValue) / (roundedMax - minAxisValue);
                        barHeight = percentage * 80 + 10; // 10% minimum, 90% maximum
                      }
                      return (
                        <View key={`${dayData.day}-${index}`} style={[
                          styles.barContainer,
                          selectedNutritionPeriod === 'Mois' && styles.monthlyBarContainer
                        ]}>
                          <View style={[
                            styles.calorieBar, 
                            { height: `${Math.min(barHeight, 85)}%` },
                            selectedNutritionPeriod === 'Mois' && styles.monthlyBar
                          ]}
                          />
                          <Text style={[
                            styles.dayLabel,
                            selectedNutritionPeriod === 'Mois' && styles.monthlyDayLabel
                          ]}>
                            {dayData.day}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              </View>
            </View>

            {/* Statistiques nutritionnelles */}
            <View style={styles.nutritionStatsContainer}>
              <View style={styles.nutritionStatCard}>
                <View style={styles.statIcon}>
                  <Text style={styles.iconText}>🔥</Text>
                </View>
                <Text style={styles.statLabel}>Calories moyennes</Text>
                <Text style={styles.statValue}>{nutritionStats.averageCalories} kcal</Text>
                <Text style={[styles.statTrend, { 
                  color: nutritionStats.averageCalories > 0 ? 
                    (nutritionStats.averageCalories >= 1800 ? '#28A745' : '#F5A623') : 
                    '#8B949E' 
                }]}>
                  {nutritionStats.averageCalories > 0 ? 
                    (nutritionStats.averageCalories >= 1800 ? 
                      `✓ Objectif atteint (${Math.round((nutritionStats.averageCalories / 2200) * 100)}%)` : 
                      `${Math.round((nutritionStats.averageCalories / 2200) * 100)}% de l'objectif`) :
                    'Aucune donnée disponible'
                  }
                </Text>
              </View>

              <View style={styles.nutritionStatCard}>
                <View style={styles.statIcon}>
                  <Text style={styles.iconText}>💪</Text>
                </View>
                <Text style={styles.statLabel}>Protéines moyennes</Text>
                <Text style={styles.statValue}>{nutritionStats.averageProteins}g</Text>
                <Text style={[styles.statTrend, { 
                  color: nutritionStats.averageProteins > 0 ? 
                    (nutritionStats.averageProteins >= 100 ? '#28A745' : '#F5A623') : 
                    '#8B949E' 
                }]}>
                  {nutritionStats.averageProteins > 0 ? 
                    (nutritionStats.averageProteins >= 100 ? 
                      `✓ Excellent apport (${Math.round((nutritionStats.averageProteins / 120) * 100)}%)` : 
                      `${Math.round((nutritionStats.averageProteins / 120) * 100)}% de l'objectif`) :
                    'Aucune donnée disponible'
                  }
                </Text>
              </View>

              <View style={styles.nutritionStatCard}>
                <View style={styles.statIcon}>
                  <Text style={styles.iconText}>🌾</Text>
                </View>
                <Text style={styles.statLabel}>Glucides moyens</Text>
                <Text style={styles.statValue}>{nutritionStats.averageCarbs}g</Text>
                <Text style={[styles.statTrend, { 
                  color: nutritionStats.averageCarbs > 0 ? 
                    (nutritionStats.averageCarbs >= 200 && nutritionStats.averageCarbs <= 350 ? '#28A745' : '#F5A623') : 
                    '#8B949E' 
                }]}>
                  {nutritionStats.averageCarbs > 0 ? 
                    (nutritionStats.averageCarbs >= 200 && nutritionStats.averageCarbs <= 350 ? 
                      '✓ Équilibre optimal' : 
                      nutritionStats.averageCarbs < 200 ? 'Apport faible' : 'Apport élevé') :
                    'Aucune donnée disponible'
                  }
                </Text>
              </View>

              <View style={styles.nutritionStatCard}>
                <View style={styles.statIcon}>
                  <Text style={styles.iconText}>🥑</Text>
                </View>
                <Text style={styles.statLabel}>Lipides moyens</Text>
                <Text style={styles.statValue}>{nutritionStats.averageFat}g</Text>
                <Text style={[styles.statTrend, { 
                  color: nutritionStats.averageFat > 0 ? 
                    (nutritionStats.averageFat >= 50 && nutritionStats.averageFat <= 100 ? '#28A745' : '#F5A623') : 
                    '#8B949E' 
                }]}>
                  {nutritionStats.averageFat > 0 ? 
                    (nutritionStats.averageFat >= 50 && nutritionStats.averageFat <= 100 ? 
                      '✓ Équilibre optimal' : 
                      nutritionStats.averageFat < 50 ? 'Apport insuffisant' : 'Apport élevé') :
                    'Aucune donnée disponible'
                  }
                </Text>
              </View>
            </View>

            {/* Répartition des macronutriments */}
            <View style={styles.macroDistributionCard}>
              <Text style={styles.chartTitle}>Répartition des macronutriments</Text>
              <Text style={styles.chartSubtitle}>Moyenne des 7 derniers jours</Text>

              <View style={styles.macroCircularChart}>
                <View style={styles.macroCircle}>
                  <Text style={styles.macroMainText}>{nutritionStats.averageCalories.toLocaleString()}</Text>
                  <Text style={styles.macroSubText}>kcal moy.</Text>
                </View>
              </View>

              <View style={styles.macroLegend}>
                <View style={styles.macroLegendItem}>
                  <View style={[styles.macroLegendColor, { backgroundColor: '#FF6B6B' }]} />
                  <Text style={styles.macroLegendText}>
                    Protéines {nutritionStats.averageCalories > 0 ? 
                      Math.round((nutritionStats.averageProteins * 4 / nutritionStats.averageCalories) * 100) : 0}%
                  </Text>
                </View>
                <View style={styles.macroLegendItem}>
                  <View style={[styles.macroLegendColor, { backgroundColor: '#4ECDC4' }]} />
                  <Text style={styles.macroLegendText}>
                    Glucides {nutritionStats.averageCalories > 0 ? 
                      Math.round((nutritionStats.averageCarbs * 4 / nutritionStats.averageCalories) * 100) : 0}%
                  </Text>
                </View>
                <View style={styles.macroLegendItem}>
                  <View style={[styles.macroLegendColor, { backgroundColor: '#FFE66D' }]} />
                  <Text style={styles.macroLegendText}>
                    Lipides {nutritionStats.averageCalories > 0 ? 
                      Math.round((nutritionStats.averageFat * 9 / nutritionStats.averageCalories) * 100) : 0}%
                  </Text>
                </View>
              </View>
            </View>

            {/* Hydratation */}
            <View style={styles.hydrationProgressCard}>
              <View style={styles.chartHeader}>
                <Text style={styles.chartTitle}>💧 Hydratation hebdomadaire</Text>
                <Text style={styles.chartSubtitle}>Objectif: 2L/jour</Text>
              </View>

              <View style={styles.hydrationBars}>
                {nutritionStats.weeklyHydration.map((dayData, index) => {
                  const percentage = dayData.goal > 0 ? (dayData.water / dayData.goal) * 100 : 0;
                  const achieved = percentage >= 100;
                  return (
                    <View key={dayData.day} style={styles.hydrationBarContainer}>
                      <View style={styles.hydrationBarBackground}>
                        <View 
                          style={[
                            styles.hydrationBarFill, 
                            { 
                              height: `${Math.min(percentage, 100)}%`,
                              backgroundColor: achieved ? '#4ECDC4' : '#F5A623'
                            }
                          ]} 
                        />
                      </View>
                      <Text style={styles.hydrationBarText}>{Math.round(percentage)}%</Text>
                      <Text style={styles.dayLabel}>{dayData.day}</Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Résumé nutritionnel */}
            <View style={styles.nutritionSummaryCard}>
              <Text style={styles.summaryTitle}>Résumé de la semaine</Text>
              <View style={styles.summaryStats}>
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryValue, { color: nutritionStats.daysWithData >= 5 ? '#28A745' : nutritionStats.daysWithData >= 3 ? '#F5A623' : '#DC3545' }]}>
                    {nutritionStats.daysWithData}/7
                  </Text>
                  <Text style={styles.summaryLabel}>Jours avec données</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryValue, { 
                    color: nutritionStats.weeklyCalories.reduce((sum, day) => sum + day.calories, 0) >= 12000 ? '#28A745' : '#F5A623'
                  }]}>
                    {Math.round(nutritionStats.weeklyCalories.reduce((sum, day) => sum + day.calories, 0)).toLocaleString()}
                  </Text>
                  <Text style={styles.summaryLabel}>Calories totales</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryValue, { color: nutritionStats.averageHydration >= 1600 ? '#4ECDC4' : '#F5A623' }]}>
                    {nutritionStats.averageHydration > 0 ? Math.round((nutritionStats.averageHydration / 2000) * 100) : 0}%
                  </Text>
                  <Text style={styles.summaryLabel}>Hydratation moyenne</Text>
                </View>
              </View>

              {/* Indicateur de régularité */}
              <View style={styles.regularityIndicator}>
                <Text style={styles.regularityTitle}>📊 Régularité du suivi</Text>
                <View style={styles.regularityBar}>
                  <View style={[styles.regularityBarFill, { 
                    width: `${Math.round((nutritionStats.daysWithData / 7) * 100)}%`,
                    backgroundColor: nutritionStats.daysWithData >= 5 ? '#28A745' : nutritionStats.daysWithData >= 3 ? '#F5A623' : '#DC3545'
                  }]} />
                </View>
                <Text style={styles.regularityText}>
                  {nutritionStats.daysWithData >= 5 ? 'Excellent suivi !' : 
                   nutritionStats.daysWithData >= 3 ? 'Suivi correct, continuez !' : 
                   'Pensez à enregistrer vos repas plus régulièrement'}
                </Text>
              </View>
            </View>
          </View>
        )}

        {selectedTab === 'Mesures' && selectedMeasurementTab === 'Poids' && (
          <View style={styles.statsContainer}>
            <TouchableOpacity 
              style={[styles.statCard, styles.currentWeightCard]}
              onPress={() => {
                const updateStatus = canUpdateWeight();
                if (updateStatus.canUpdate) {
                  setShowWeightModal(true);
                } else {
                  Alert.alert(
                    'Mise à jour limitée',
                    updateStatus.reason,
                    [{ text: 'OK' }]
                  );
                }
              }}
            >
              <View style={styles.statIcon}>
                <Text style={styles.iconText}>⚖️</Text>
              </View>
              <Text style={styles.statLabel}>Poids actuel</Text>
              <Text style={styles.statValue}>{formatWeight(weightData.currentWeight)} kg</Text>
              <Text style={styles.updateHint}>
                Appuyez pour mettre à jour
              </Text>
            </TouchableOpacity>

            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <Text style={styles.iconText}>🎯</Text>
              </View>
              <Text style={styles.statLabel}>Poids de départ</Text>
              <Text style={styles.statValue}>{formatWeight(weightData.startWeight)} kg</Text>
            </View>

            <TouchableOpacity 
              style={styles.statCard}
              onPress={() => setShowTargetModal(true)}
            >
              <View style={styles.statIcon}>
                <Text style={styles.iconText}>🏆</Text>
              </View>
              <Text style={styles.statLabel}>Objectif</Text>
              <Text style={styles.statValue}>
                {weightData.targetWeight ? `${formatWeight(weightData.targetWeight)} kg` : 'À définir'}
              </Text>
              {weightData.targetWeight > 0 && (
                <Text style={styles.statSubtext}>
                  {formatWeight(Math.abs(weightData.currentWeight - weightData.targetWeight))} kg restants
                </Text>
              )}
              <Text style={styles.updateHint}>Appuyez pour modifier</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Mensurations musculaires (Premium uniquement) */}
        {selectedTab === 'Mesures' && selectedMeasurementTab === 'Mensurations' && isPremium && (
          <View style={styles.measurementsContainer}>
            <View style={styles.measurementRow}>
              <TouchableOpacity 
                style={styles.measurementCard}
                onPress={() => handleOpenMensurationModal('biceps')}
              >
                <View style={styles.statIcon}>
                  <Text style={styles.iconText}>💪</Text>
                </View>
                <Text style={styles.statLabel}>Biceps</Text>
                <Text style={styles.statValue}>
                  {mensurationData.biceps?.current ? `${formatMensuration(mensurationData.biceps.current)} cm` : 'Non défini'}
                </Text>
                <Text style={[styles.statTrend, { color: getMensurationTrend('biceps').color }]}>
                  {getMensurationTrend('biceps').text}
                </Text>
                <Text style={styles.updateHint}>Appuyez pour modifier</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.measurementCard}
                onPress={() => handleOpenMensurationModal('avantBras')}
              >
                <View style={styles.statIcon}>
                  <Text style={styles.iconText}>🦾</Text>
                </View>
                <Text style={styles.statLabel}>Avant-bras</Text>
                <Text style={styles.statValue}>
                  {mensurationData.avantBras?.current ? `${formatMensuration(mensurationData.avantBras.current)} cm` : 'Non défini'}
                </Text>
                <Text style={[styles.statTrend, { color: getMensurationTrend('avantBras').color }]}>
                  {getMensurationTrend('avantBras').text}
                </Text>
                <Text style={styles.updateHint}>Appuyez pour modifier</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.measurementRow}>
              <TouchableOpacity 
                style={styles.measurementCard}
                onPress={() => handleOpenMensurationModal('pectoraux')}
              >
                <View style={styles.statIcon}>
                  <Text style={styles.iconText}>🫸</Text>
                </View>
                <Text style={styles.statLabel}>Pectoraux</Text>
                <Text style={styles.statValue}>
                  {mensurationData.pectoraux?.current ? `${formatMensuration(mensurationData.pectoraux.current)} cm` : 'Non défini'}
                </Text>
                <Text style={[styles.statTrend, { color: getMensurationTrend('pectoraux').color }]}>
                  {getMensurationTrend('pectoraux').text}
                </Text>
                <Text style={styles.updateHint}>Appuyez pour modifier</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.measurementCard}
                onPress={() => handleOpenMensurationModal('taille')}
              >
                <View style={styles.statIcon}>
                  <Text style={styles.iconText}>🤏</Text>
                </View>
                <Text style={styles.statLabel}>Taille</Text>
                <Text style={styles.statValue}>
                  {mensurationData.taille?.current ? `${formatMensuration(mensurationData.taille.current)} cm` : 'Non défini'}
                </Text>
                <Text style={[styles.statTrend, { color: getMensurationTrend('taille').color }]}>
                  {getMensurationTrend('taille').text}
                </Text>
                <Text style={styles.updateHint}>Appuyez pour modifier</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.measurementRow}>
              <TouchableOpacity 
                style={styles.measurementCard}
                onPress={() => handleOpenMensurationModal('cuisses')}
              >
                <View style={styles.statIcon}>
                  <Text style={styles.iconText}>🦵</Text>
                </View>
                <Text style={styles.statLabel}>Cuisses</Text>
                <Text style={styles.statValue}>
                  {mensurationData.cuisses?.current ? `${formatMensuration(mensurationData.cuisses.current)} cm` : 'Non défini'}
                </Text>
                <Text style={[styles.statTrend, { color: getMensurationTrend('cuisses').color }]}>
                  {getMensurationTrend('cuisses').text}
                </Text>
                <Text style={styles.updateHint}>Appuyez pour modifier</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.measurementCard}
                onPress={() => handleOpenMensurationModal('mollets')}
              >
                <View style={styles.statIcon}>
                  <Text style={styles.iconText}>🦵</Text>
                </View>
                <Text style={styles.statLabel}>Mollets</Text>
                <Text style={styles.statValue}>
                  {mensurationData.mollets?.current ? `${formatMensuration(mensurationData.mollets.current)} cm` : 'Non défini'}
                </Text>
                <Text style={[styles.statTrend, { color: getMensurationTrend('mollets').color }]}>
                  {getMensurationTrend('mollets').text}
                </Text>
                <Text style={styles.updateHint}>Appuyez pour modifier</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Progress Card - Affiché seulement pour le suivi du poids */}
        {selectedTab === 'Mesures' && selectedMeasurementTab === 'Poids' && weightData.targetWeight > 0 && (
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Progression vers l'objectif</Text>
            <Text style={styles.progressPercentage}>
              {Math.round(((weightData.startWeight - weightData.currentWeight) / (weightData.startWeight - weightData.targetWeight)) * 100)}%
            </Text>
          </View>

          <Text style={[styles.progressTrend, { color: getWeightTrend().color }]}>
            {getWeightTrend().text}
          </Text>

          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBackground}>
              <Animated.View style={[styles.progressBarFill, animatedProgressStyle]} />
            </View>
          </View>

          <View style={styles.progressLabels}>
            <Text style={styles.progressLabel}>{formatWeight(weightData.startWeight)} kg</Text>
            <Text style={styles.progressLabel}>{formatWeight(weightData.targetWeight)} kg</Text>
          </View>
        </View>
        )}

        {/* Enhanced Chart Section - Affiché seulement pour le suivi du poids */}
        {selectedTab === 'Mesures' && selectedMeasurementTab === 'Poids' && (
        <View style={styles.chartContainer}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Évolution du poids</Text>
          </View>

          {/* Onglets de période */}
          <View style={styles.periodTabsContainer}>
            {['Semaines', 'Mois', 'Années'].map((period) => (
              <TouchableOpacity 
                key={period}
                style={[styles.periodTab, selectedPeriod === period && styles.activePeriodTab]}
                onPress={() => setSelectedPeriod(period)}
              >
                <Text style={[styles.periodTabText, selectedPeriod === period && styles.activePeriodTabText]}>
                  {period}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Improved Chart */}
          <View style={styles.chartArea}>
            <View style={styles.yAxis}>
            {generateYAxisLabels().map((label, index) => (
                <Text key={index} style={styles.yAxisLabel}>{label}</Text>
              ))}
            </View>

            <View style={styles.chartContent}>
              {/* Grid */}
              <View style={styles.gridContainer}>
                {[...Array(6)].map((_, i) => (
                  <View key={i} style={styles.gridLine} />
                ))}
              </View>

              {/* Enhanced Weight Line with Gradient */}
              {renderWeightChart()}

              {/* X-axis labels */}
              <View style={styles.xAxis}>
              {generatePeriodLabels().map((label, index) => (
                  <Text key={index} style={styles.xAxisLabel}>{label}</Text>
                ))}
              </View>
            </View>
          </View>
        </View>
        )}

        {/* Statistics Summary - Affiché seulement pour le suivi du poids */}
        {selectedTab === 'Mesures' && selectedMeasurementTab === 'Poids' && (
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>Résumé de la période</Text>
          <View style={styles.summaryStats}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: getWeightTrend().color }]}>
                {weightData.startWeight > weightData.currentWeight ? 
                  `-${formatWeight(weightData.startWeight - weightData.currentWeight)} kg` :
                  weightData.currentWeight > weightData.startWeight ?
                    `+${formatWeight(weightData.currentWeight - weightData.startWeight)} kg` :
                    '0 kg'
                }
              </Text>
              <Text style={styles.summaryLabel}>Évolution totale</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>
                {(() => {
                  if (!userData?.createdAt) return '0 kg';
                  const startDate = new Date(userData.createdAt);
                  const currentDate = new Date();
                  const monthsDiff = Math.max(1, Math.ceil((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30)));
                  const weightChange = Math.abs(weightData.startWeight - weightData.currentWeight);
                  const avgPerMonth = weightChange / monthsDiff;
                  return `${formatWeight(avgPerMonth)} kg`;
                })()}
              </Text>
              <Text style={styles.summaryLabel}>Évolution moyenne/mois</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>
                {(() => {
                  // Calculer la régularité basée sur les mises à jour
                  const totalWeeks = Math.max(1, Math.floor((new Date().getTime() - new Date(userData?.createdAt || new Date()).getTime()) / (1000 * 60 * 60 * 24 * 7)));
                  const updatesCount = weightData.lastWeightUpdate ? 1 : 0; // Simplification - en réalité il faudrait compter toutes les mises à jour
                  const regularity = Math.min(100, Math.round((updatesCount / totalWeeks) * 100));
                  return `${regularity}%`;
                })()}
              </Text>
              <Text style={styles.summaryLabel}>Régularité</Text>
            </View>
          </View>
        </View>
        )}
      </ScrollView>

      {/* Modal de mise à jour du poids */}
      <Modal
        visible={showWeightModal}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Mettre à jour votre poids</Text>
            <Text style={styles.modalSubtitle}>
              Dernière mise à jour : {weightData.lastWeightUpdate ? 
                new Date(weightData.lastWeightUpdate).toLocaleDateString('fr-FR') : 
                'Jamais'
              }
            </Text>
            <Text style={styles.modalUpdateInfo}>
              {7 - (weightData.weeklyUpdates || 0)} mises à jour restantes cette semaine
            </Text>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.modalInput}
                value={tempWeight}
                onChangeText={setTempWeight}
                placeholder="Votre poids actuel en kg"
                placeholderTextColor="#8B949E"
                keyboardType="numeric"
                autoFocus
              />
              <Text style={styles.inputUnit}>kg</Text>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalButtonSecondary}
                onPress={() => {
                  setTempWeight('');
                  setShowWeightModal(false);
                }}
              >
                <Text style={styles.modalButtonSecondaryText}>Annuler</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.modalButtonPrimary}
                onPress={handleWeightUpdate}
              >
                <Text style={styles.modalButtonPrimaryText}>Confirmer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de définition de l'objectif */}
      <Modal
        visible={showTargetModal}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Définir votre objectif de poids</Text>
            <Text style={styles.modalSubtitle}>
              Poids actuel : {formatWeight(weightData.currentWeight)} kg
            </Text>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.modalInput}
                value={tempTarget}
                onChangeText={setTempTarget}
                placeholder="Votre objectif en kg"
                placeholderTextColor="#8B949E"
                keyboardType="numeric"
                autoFocus
              />
              <Text style={styles.inputUnit}>kg</Text>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalButtonSecondary}
                onPress={async () => {
                  // Marquer comme demandé même si annulé pour éviter de redemander
                  const newData = {
                    ...weightData,
                    targetAsked: true,
                  };
                  await saveWeightData(newData);
                  setTempTarget('');
                  setShowTargetModal(false);
                }}
              >
                <Text style={styles.modalButtonSecondaryText}>Annuler</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.modalButtonPrimary}
                onPress={handleTargetUpdate}
              >
                <Text style={styles.modalButtonPrimaryText}>Confirmer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de mensuration */}
      <Modal
        visible={showMensurationModal}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Modifier {getMuscleConfig(selectedMuscle).name}
            </Text>
            <Text style={styles.modalSubtitle}>
              Entrez vos mensurations en centimètres
            </Text>

            {/* Mesures globales */}
            <View style={styles.mensurationSection}>
              <Text style={styles.mensurationSectionTitle}>Mesure globale</Text>

              <View style={styles.inputRow}>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Valeur de départ</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={tempMensuration.start}
                    onChangeText={(text) => setTempMensuration({...tempMensuration, start: text})}
                    placeholder="0.0"
                    placeholderTextColor="#8B949E"
                    keyboardType="numeric"
                  />
                  <Text style={styles.inputUnit}>cm</Text>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Valeur actuelle</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={tempMensuration.current}
                    onChangeText={(text) => setTempMensuration({...tempMensuration, current: text})}
                    placeholder="0.0"
                    placeholderTextColor="#8B949E"
                    keyboardType="numeric"
                  />
                  <Text style={styles.inputUnit}>cm</Text>
                </View>
              </View>
            </View>

            {/* Mesures gauche/droite si applicable */}
            {getMuscleConfig(selectedMuscle).hasLeftRight && (
              <>
                <View style={styles.mensurationSection}>
                  <Text style={styles.mensurationSectionTitle}>Côté gauche</Text>

                  <View style={styles.inputRow}>
                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>Valeur de départ</Text>
                      <TextInput
                        style={styles.modalInput}
                        value={tempMensuration.startGauche}
                        onChangeText={(text) => setTempMensuration({...tempMensuration, startGauche: text})}
                        placeholder="0.0"
                        placeholderTextColor="#8B949E"
                        keyboardType="numeric"
                      />
                      <Text style={styles.inputUnit}>cm</Text>
                    </View>

                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>Valeur actuelle</Text>
                      <TextInput
                        style={styles.modalInput}
                        value={tempMensuration.currentGauche}
                        onChangeText={(text) => setTempMensuration({...tempMensuration, currentGauche: text})}
                        placeholder="0.0"
                        placeholderTextColor="#8B949E"
                        keyboardType="numeric"
                      />
                      <Text style={styles.inputUnit}>cm</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.mensurationSection}>
                  <Text style={styles.mensurationSectionTitle}>Côté droit</Text>

                  <View style={styles.inputRow}>
                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>Valeur de départ</Text>
                      <TextInput
                        style={styles.modalInput}
                        value={tempMensuration.startDroit}
                        onChangeText={(text) => setTempMensuration({...tempMensuration, startDroit: text})}
                        placeholder="0.0"
                        placeholderTextColor="#8B949E"
                        keyboardType="numeric"
                      />
                      <Text style={styles.inputUnit}>cm</Text>
                    </View>

                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>Valeur actuelle</Text>
                      <TextInput
                        style={styles.modalInput}
                        value={tempMensuration.currentDroit}
                        onChangeText={(text) => setTempMensuration({...tempMensuration, currentDroit: text})}
                        placeholder="0.0"
                        placeholderTextColor="#8B949E"
                        keyboardType="numeric"
                      />
                      <Text style={styles.inputUnit}>cm</Text>
                    </View>
                  </View>
                </View>
              </>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalButtonSecondary}
                onPress={() => {
                  setShowMensurationModal(false);
                  setTempMensuration({
                    start: '',
                    current: '',
                    startGauche: '',
                    currentGauche: '',
                    startDroit: '',
                    currentDroit: '',
                  });
                }}
              >
                <Text style={styles.modalButtonSecondaryText}>Annuler</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.modalButtonPrimary}
                onPress={handleSaveMensuration}
              >
                <Text style={styles.modalButtonPrimaryText}>Sauvegarder</Text>
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
    marginBottom: 2,
  },

  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 25,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 12,
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
    elevation: 4,
    shadowColor: '#F5A623',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  tabGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  tabText: {
    fontSize: 13,
    color: '#8B949E',
    fontWeight: '600',
    zIndex: 1,
  },
  activeTabText: {
    color: '#FFFFFF',
  },

  measurementTabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 25,
    gap: 12,
  },
  measurementTab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#21262D',
    alignItems: 'center',
  },
  activeMeasurementTab: {
    backgroundColor: 'transparent',
    borderColor: '#F5A623',
  },
  measurementTabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  measurementTabText: {
    fontSize: 14,
    color: '#8B949E',
    fontWeight: '600',
  },
  activeMeasurementTabText: {
    color: '#FFFFFF',
  },
  premiumBadge: {
    fontSize: 12,
  },

  periodTabsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: '#0D1117',
    borderRadius: 8,
    padding: 4,
  },
  periodTab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  activePeriodTab: {
    backgroundColor: '#F5A623',
  },
  periodTabText: {
    fontSize: 13,
    color: '#8B949E',
    fontWeight: '600',
  },
  activePeriodTabText: {
    color: '#000000',
  },

  measurementsContainer: {
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  measurementRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  measurementCard: {
    flex: 1,
    backgroundColor: '#161B22',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#21262D',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 25,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#161B22',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#21262D',
    alignItems: 'center',
  },
  currentWeightCard: {
    borderColor: '#F5A623',
    borderWidth: 2,
  },
  statIcon: {
    width: 32,
    height: 32,
    backgroundColor: '#21262D',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconText: {
    fontSize: 16,
  },
  statLabel: {
    fontSize: 12,
    color: '#8B949E',
    marginBottom: 6,
    textAlign: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statTrend: {
    fontSize: 11,
    color: '#28A745',
    fontWeight: '600',
  },
  statSubtext: {
    fontSize: 11,
    color: '#8B949E',
  },
  progressCard: {
    marginHorizontal: 20,
    backgroundColor: '#161B22',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#21262D',
    marginBottom: 25,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  progressPercentage: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F5A623',
  },
  progressTrend: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  progressBarContainer: {
    marginBottom: 12,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#21262D',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#F5A623',
    borderRadius: 4,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    fontSize: 12,
    color: '#8B949E',
  },
  chartContainer: {
    marginHorizontal: 20,
    marginVertical: 20,
    backgroundColor: '#161B22',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#21262D',
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#21262D',
    borderRadius: 12,
    padding: 2,
    borderWidth: 1,
    borderColor: '#30363D',
  },
  periodButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    minWidth: 40,
    alignItems: 'center',
  },
  activePeriodButton: {
    backgroundColor: '#F5A623',
  },
  periodButtonText: {
    fontSize: 12,
    color: '#8B949E',
    fontWeight: '600',
  },
  activePeriodButtonText: {
    color: '#FFFFFF',
  },
  
  chartArea: {
    flexDirection: 'row',
    height: 200,
  },
  yAxis: {
    justifyContent: 'space-between',
    width: 50,
    paddingRight: 8,
    paddingLeft: 4,
    paddingTop: -10,
    paddingBottom: 20,
  },
  yAxisLabel: {
    fontSize: 12,
    color: '#8B949E',
    textAlign: 'left',
    lineHeight: 12,
  },
  chartContent: {
    flex: 1,
    position: 'relative',
  },
  gridContainer: {
    position: 'absolute',
    top: 5,
    left: 0,
    right: 0,
    bottom: 25,
    justifyContent: 'space-between',
  },
  gridLine: {
    height: 1,
    backgroundColor: '#21262D',
  },
  weightLineGradient: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    height: 120,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  weightLine: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#F5A623',
    borderRadius: 2,
  },
  dataPoints: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 15,
    bottom: 25,
  },
  dataPoint: {
    position: 'absolute',
    width: 8,
    height: 8,
    backgroundColor: '#F5A623',
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  xAxis: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  xAxisLabel: {
    fontSize: 11,
    color: '#8B949E',
    fontWeight: '500',
  },
  summaryContainer: {
    marginHorizontal: 20,
    backgroundColor: '#161B22',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#21262D',
    marginBottom: 100,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F5A623',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#8B949E',
    textAlign: 'center',
  },

  updateHint: {
    fontSize: 10,
    color: '#F5A623',
    marginTop: 4,
    fontStyle: 'italic',
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
    marginBottom: 8,
  },
  modalUpdateInfo: {
    fontSize: 13,
    color: '#F5A623',
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '500',
  },
  inputContainer: {
    position: 'relative',
    marginBottom: 24,
  },
  modalInput: {
    backgroundColor: '#0D1117',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingRight: 50,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#21262D',
    textAlign: 'center',
  },
  inputUnit: {
    position: 'absolute',
    right: 16,
    top: 16,
    fontSize: 16,
    color: '#8B949E',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButtonSecondary: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#21262D',
    borderRadius: 12,
    paddingVertical: 14,
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
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalButtonPrimaryText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
  mensurationSection: {
    marginBottom: 20,
  },
  mensurationSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputLabel: {
    fontSize: 12,
    color: '#8B949E',
    marginBottom: 6,
    fontWeight: '500',
  },

  // Styles pour l'onglet Sport
  sportContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  sportSummaryCard: {
    backgroundColor: '#161B22',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#21262D',
    marginBottom: 25,
  },
  sportSummaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  sportSummaryItem: {
    alignItems: 'center',
  },
  sportSummaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F5A623',
    marginBottom: 4,
  },
  sportSummaryLabel: {
    fontSize: 12,
    color: '#8B949E',
    textAlign: 'center',
  },
  sportChartArea: {
    flexDirection: 'row',
    height: 200,
  },
  sportBars: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingBottom: 25,
    paddingHorizontal: 10,
  },
  sportBarContainer: {
    alignItems: 'center',
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
  },
  sportBar: {
    width: 20,
    backgroundColor: '#F5A623',
    borderRadius: 10,
    marginBottom: 8,
    minHeight: 4,
  },
  caloriesText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
    marginBottom: 4,
  },
  sportTypeContainer: {
    backgroundColor: '#161B22',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#21262D',
    marginBottom: 25,
  },
  sportTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
  },
  sportTypeCard: {
    width: (width - 64) / 2,
    backgroundColor: '#0D1117',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#21262D',
    alignItems: 'center',
  },
  sportTypeIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#21262D',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  sportTypeEmoji: {
    fontSize: 20,
  },
  sportTypeLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
    marginBottom: 6,
  },
  sportTypeValue: {
    fontSize: 16,
    color: '#F5A623',
    fontWeight: 'bold',
    marginBottom: 2,
  },
  sportTypeTime: {
    fontSize: 12,
    color: '#8B949E',
  },
  sportObjectivesCard: {
    backgroundColor: '#161B22',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#21262D',
    marginBottom: 25,
  },
  objectiveItem: {
    marginBottom: 20,
  },
  objectiveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  objectiveLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  objectiveProgress: {
    fontSize: 14,
    color: '#F5A623',
    fontWeight: '600',
  },
  objectiveBar: {
    height: 8,
    backgroundColor: '#21262D',
    borderRadius: 4,
    overflow: 'hidden',
  },
  objectiveBarFill: {
    height: '100%',
    backgroundColor: '#F5A623',
    borderRadius: 4,
  },
  personalRecordsCard: {
    backgroundColor: '#161B22',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#21262D',
    marginBottom: 25,
  },
  recordsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
  },
  recordItem: {
    width: (width - 64) / 2,
    backgroundColor: '#0D1117',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#21262D',
    alignItems: 'center',
  },
  recordLabel: {
    fontSize: 12,
    color: '#8B949E',
    marginBottom: 6,
    textAlign: 'center',
  },
  recordValue: {
    fontSize: 18,
    color: '#28A745',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  recordDate: {
    fontSize: 10,
    color: '#8B949E',
    fontStyle: 'italic',
  },

  // Styles pour l'onglet Nutrition
  nutritionContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  nutritionChartContainer: {
    marginBottom: 25,
    backgroundColor: '#161B22',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#21262D',
  },
  nutritionChartArea: {
    flexDirection: 'row',
    height: 180,
  },
  caloriesBars: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingBottom: 0,
    paddingHorizontal: 5,
  },
  barContainer: {
    alignItems: 'center',
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
  },
  calorieBar: {
    width: 18,
    backgroundColor: '#F5A623',
    borderRadius: 9,
    marginBottom: 8,
    minHeight: 4,
  },
  dayLabel: {
    fontSize: 11,
    color: '#8B949E',
    fontWeight: '500',
  },
  nutritionStatsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 25,
  },
  nutritionStatCard: {
    width: (width - 52) / 2,
    backgroundColor: '#161B22',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#21262D',
    alignItems: 'center',
  },
  macroDistributionCard: {
    backgroundColor: '#161B22',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#21262D',
    marginBottom: 25,
    alignItems: 'center',
  },
  chartSubtitle: {
    fontSize: 12,
    color: '#8B949E',
    textAlign: 'center',
    marginBottom: 20,
  },
  macroCircularChart: {
    alignItems: 'center',
    marginBottom: 20,
  },
  macroCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#21262D',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 8,
    borderColor: '#F5A623',
  },
  macroMainText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  macroSubText: {
    fontSize: 12,
    color: '#8B949E',
  },
  macroLegend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  macroLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  macroLegendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  macroLegendText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  hydrationProgressCard: {
    backgroundColor: '#161B22',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#21262D',
    marginBottom: 25,
  },
  hydrationBars: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 100,
    paddingHorizontal: 10,
  },
  hydrationBarContainer: {
    alignItems: 'center',
    flex: 1,
  },
  hydrationBarBackground: {
    width: 16,
    height: 60,
    backgroundColor: '#21262D',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 6,
    justifyContent: 'flex-end',
  },
  hydrationBarFill: {
    width: '100%',
    borderRadius: 8,
  },
  hydrationBarText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
    marginBottom: 4,
  },
  nutritionSummaryCard: {
    backgroundColor: '#161B22',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#21262D',
  },
  regularityIndicator: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#21262D',
  },
  regularityTitle: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
    marginBottom: 12,
  },
  regularityBar: {
    height: 8,
    backgroundColor: '#21262D',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  regularityBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  regularityText: {
    fontSize: 12,
    color: '#8B949E',
    textAlign: 'center',
    fontStyle: 'italic',
  },

  monthlyBarContainer: {
    width: '3%', // Ajustez selon le nombre de jours affichés
  },
  monthlyBar: {
    borderRadius: 4,
  },
  monthlyDayLabel: {
    fontSize: 8,
  },

  // Styles spécifiques pour l'axe Y du graphique nutrition
  nutritionYAxis: {
    justifyContent: 'space-between',
    width: 50,
    paddingRight: 8,
    paddingLeft: 4,
    paddingTop: 5,
    paddingBottom: 25,
    height: '100%',
  },
  nutritionYAxisLabel: {
    fontSize: 12,
    color: '#8B949E',
    textAlign: 'left',
    lineHeight: 14,
    height: 14,
  },
});