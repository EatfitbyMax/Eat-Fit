import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Dimensions, Alert, TextInput, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring } from 'react-native-reanimated';
import { useFocusEffect } from 'expo-router';
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
    averageHydration: 0,
    daysWithData: 0,
    weeklyHydration: []
  });
  const [selectedNutritionPeriod, setSelectedNutritionPeriod] = useState('Jours');
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

  // Recharger les données utilisateur et nutritionnelles quand l'écran est focalisé
  useFocusEffect(
    React.useCallback(() => {
      loadUserData();
      loadNutritionData(); // Forcer le rechargement des données nutrition
    }, [])
  );

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

          // Synchroniser avec l'objectif du profil utilisateur si disponible
          const userTargetWeight = user.targetWeight || 0;
          if (userTargetWeight > 0 && userTargetWeight !== saved.targetWeight) {
            saved.targetWeight = userTargetWeight;
            saved.targetAsked = true;
            await saveWeightData(saved);
            console.log('Objectif synchronisé depuis le profil utilisateur:', userTargetWeight);
          }

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
          // Vérifier si l'utilisateur a déjà un objectif dans son profil
          const existingTargetWeight = user.targetWeight || 0;

          const initialData = {
            startWeight: startWeight,
            currentWeight: startWeight,
            targetWeight: existingTargetWeight,
            lastWeightUpdate: null,
            targetAsked: existingTargetWeight > 0, // Marquer comme demandé si déjà défini
            weightHistory: startWeight > 0 ? [{ weight: startWeight, date: user.createdAt || new Date().toISOString() }] : [],
          };
          setWeightData(initialData);
          await saveWeightData(initialData);

          // Calculer le pourcentage de progression si objectif déjà défini
          if (existingTargetWeight > 0 && startWeight > 0) {
            const totalLoss = startWeight - existingTargetWeight;
            const currentLoss = startWeight - startWeight; // Pas encore de perte au début
            const progress = Math.max(0, Math.min(1, currentLoss / totalLoss));
            progressAnimation.value = withSpring(progress);
          }

          // Demander de définir l'objectif seulement si jamais défini
          if (existingTargetWeight === 0) {
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
    const nowISO = now.toISOString();

    // Ajouter la nouvelle pesée à l'historique
    const newWeightHistory = [...(weightData.weightHistory || [])];
    newWeightHistory.push({ weight: weight, date: nowISO });

    const newData = {
      ...weightData,
      currentWeight: weight,
      lastWeightUpdate: nowISO,
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

    // Sauvegarder l'objectif dans le profil utilisateur sur le serveur
    try {
      if (userData) {
        const updatedUser = {
          ...userData,
          targetWeight: target
        };

        // Sauvegarder sur le serveur
        const users = await PersistentStorage.getUsers();
        const userIndex = users.findIndex(u => u.id === userData.id);
        if (userIndex !== -1) {
          users[userIndex] = updatedUser;
          await PersistentStorage.saveUsers(users);
        }

        // Mettre à jour l'utilisateur local
        await AsyncStorage.setItem('currentUser', JSON.stringify(updatedUser));
        setUserData(updatedUser);

        console.log('Objectif de poids sauvegardé dans le profil utilisateur');
      }
    } catch (error) {
      console.error('Erreur sauvegarde objectif utilisateur:', error);
    }

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

    // Calculer le début de la semaine courante (lundi)
    const startOfCurrentWeek = new Date(today);
    const dayOfWeek = today.getDay();
    const daysToMonday = (dayOfWeek === 0 ? 6 : dayOfWeek - 1); // Dimanche = 6 jours avant lundi
    startOfCurrentWeek.setDate(today.getDate() - daysToMonday);
    startOfCurrentWeek.setHours(0, 0, 0, 0);

    // Calculer le début de la semaine de la dernière mise à jour
    const lastUpdate = new Date(weightData.lastWeightUpdate);
    const startOfLastUpdateWeek = new Date(lastUpdate);
    const lastUpdateDayOfWeek = lastUpdate.getDay();
    const daysToMondayLastUpdate = (lastUpdateDayOfWeek === 0 ? 6 : lastUpdateDayOfWeek - 1);
    startOfLastUpdateWeek.setDate(lastUpdate.getDate() - daysToMondayLastUpdate);
    startOfLastUpdateWeek.setHours(0, 0, 0, 0);

    // Si on est dans une nouvelle semaine, on peut mettre à jour
    if (startOfCurrentWeek.getTime() > startOfLastUpdateWeek.getTime()) {
      return { canUpdate: true, reason: '' };
    }

    // Sinon, on a déjà mis à jour cette semaine
    const nextMonday = new Date(startOfCurrentWeek);
    nextMonday.setDate(startOfCurrentWeek.getDate() + 7);
    const daysUntilNextWeek = Math.ceil((nextMonday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    return { 
      canUpdate: false, 
      reason: `Vous avez déjà mis à jour votre poids cette semaine. Prochaine mise à jour possible dans ${daysUntilNextWeek} jour${daysUntilNextWeek > 1 ? 's' : ''}.` 
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

    // Générer les points de données basés sur les données traitées avec leurs labels
    processedData.forEach((entry, index) => {
      const position = getDataPointPosition(entry.weight, index, processedData.length, allLabels);
      const label = allLabels[index] || '';
      
      dataPoints.push(
        <View 
          key={`weight-${entry.date.toISOString()}-${index}`} 
          style={[styles.dataPointContainer, position]}
        >
          <View style={styles.dataPoint} />
          <Text style={styles.dataPointLabel}>{label}</Text>
        </View>
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
    // Utiliser la même logique que generateYAxisLabels pour obtenir la plage exacte
    const processedData = getProcessedWeightData();
    const weights = [weightData.startWeight, weightData.currentWeight];
    if (weightData.targetWeight) weights.push(weightData.targetWeight);

    // Ajouter les poids des données traitées
    processedData.forEach(entry => {
      if (entry.weight > 0) weights.push(entry.weight);
    });

    const minDataWeight = Math.min(...weights.filter(w => w > 0));
    const maxDataWeight = Math.max(...weights.filter(w => w > 0));

    // Utiliser exactement la même logique que generateYAxisLabels
    const centerWeight = (minDataWeight + maxDataWeight) / 2;
    const minWeight = Math.floor((centerWeight - 10) / 5) * 5;
    const maxWeight = minWeight + 20;

    // Générer les mêmes 5 labels que dans generateYAxisLabels
    const yAxisValues = [];
    for (let i = 0; i < 5; i++) {
      const weight = maxWeight - (i * 5);
      yAxisValues.push(weight);
    }

    // Le premier label est le maximum, le dernier est le minimum
    const actualMaxWeight = yAxisValues[0];
    const actualMinWeight = yAxisValues[4];
    const actualRange = actualMaxWeight - actualMinWeight;

    // Calculer la position Y en fonction de la plage réelle de l'axe Y
    const weightPercentage = actualRange > 0 ? 
      Math.max(0, Math.min(1, (actualMaxWeight - weight) / actualRange)) : 0.5;

    // Calculer la position horizontale
    const totalLabels = allLabels.length;
    let leftPercentage = 0;

    if (totalLabels > 1) {
      const marginPercentage = 5;
      const usableWidth = 100 - (2 * marginPercentage);
      const labelIndex = Math.min(dataIndex, totalLabels - 1);
      leftPercentage = marginPercentage + (labelIndex / (totalLabels - 1)) * usableWidth;
    } else {
      leftPercentage = 50;
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

    // Déterminer l'objectif de l'utilisateur en temps réel
    const currentUserGoals = userData?.goals || [];
    const isWeightLoss = currentUserGoals.includes('Perdre du poids');
    const isMuscleGain = currentUserGoals.includes('Me muscler') || currentUserGoals.includes('Prendre du muscle');

    let minWeight, maxWeight;

    if (isWeightLoss) {
      // Pour la perte de poids : commencer à +5kg au-dessus du poids de départ
      const startReference = weightData.startWeight;
      maxWeight = Math.ceil((startReference + 5) / 5) * 5; // Arrondir au multiple de 5 supérieur
      minWeight = maxWeight - 20; // Plage de 20kg vers le bas
    } else if (isMuscleGain) {
      // Pour la prise de masse : commencer à -5kg en-dessous du poids de départ
      const startReference = weightData.startWeight;
      minWeight = Math.floor((startReference - 5) / 5) * 5; // Arrondir au multiple de 5 inférieur
      maxWeight = minWeight + 20; // Plage de 20kg vers le haut
    } else {
      // Comportement par défaut (maintien ou autre objectif)
      const centerWeight = (minDataWeight + maxDataWeight) / 2;
      minWeight = Math.floor((centerWeight - 10) / 5) * 5;
      maxWeight = minWeight + 20;
    }

    // Générer exactement 5 labels avec 5kg d'écart
    const labels = [];
    for (let i = 0; i < 5; i++) {
      const weight = maxWeight - (i * 5);
      labels.push(weight.toString());
    }

    return labels;
  };

  const generateNutritionYAxisLabels = () => {
    const currentData = selectedNutritionPeriod === 'Jours' ? nutritionStats.weeklyCalories : 
                       selectedNutritionPeriod === 'Semaine' ? nutritionStats.weeklyCalories : 
                       selectedNutritionPeriod === 'Mois' ? nutritionStats.monthlyCalories : 
                       nutritionStats.weeklyCalories; // fallback

    if (currentData.length === 0) {
      return ['3000', '2500', '2000', '1500', '1000'];
    }

    // Trouver les valeurs min et max des calories
    const calorieValues = currentData.map(d => d.calories).filter(c => c > 0);
    const minCalories = Math.min(...calorieValues, calorieGoals.calories * 0.5);
    const maxCalories = Math.max(...calorieValues, calorieGoals.calories * 1.2);

    // Déterminer l'objectif de l'utilisateur
    const currentUserGoals = userData?.goals || [];
    const isWeightLoss = currentUserGoals.includes('Perdre du poids');
    const isMuscleGain = currentUserGoals.includes('Me muscler') || currentUserGoals.includes('Prendre du muscle');

    let minAxis, maxAxis;

    if (isWeightLoss) {
      // Pour la perte de poids : axe centré sur un déficit
      const targetCalories = calorieGoals.calories;
      maxAxis = Math.ceil((targetCalories + 500) / 250) * 250;
      minAxis = maxAxis - 2000; // Plage de 2000 kcal
    } else if (isMuscleGain) {
      // Pour la prise de masse : axe centré sur un surplus
      const targetCalories = calorieGoals.calories;
      minAxis = Math.floor((targetCalories - 500) / 250) * 250;
      maxAxis = minAxis + 2000; // Plage de 2000 kcal
    } else {
      // Comportement par défaut
      const center = (minCalories + maxCalories) / 2;
      minAxis = Math.floor((center - 1000) / 250) * 250;
      maxAxis = minAxis + 2000;
    }

    // S'assurer que les valeurs sont positives et réalistes
    minAxis = Math.max(500, minAxis);
    maxAxis = Math.max(minAxis + 2000, maxAxis);

    // Générer 5 labels avec écart de 500 kcal
    const labels = [];
    for (let i = 0; i < 5; i++) {
      const value = maxAxis - (i * 500);
      labels.push(value.toString());
    }

    return labels;
  };

  const renderNutritionChart = () => {
    const processedData = getProcessedNutritionData();
    const allLabels = generateNutritionPeriodLabels();
    const dataPoints = [];

    console.log('=== RENDER NUTRITION CHART ===');
    console.log('Données traitées:', processedData.map(d => ({ date: d.date.toISOString().split('T')[0], calories: d.calories })));
    console.log('Labels générés:', allLabels);

    // Générer les points de données seulement pour les entrées avec des calories > 0
    processedData.forEach((entry, index) => {
      if (entry.calories > 0) {
        const position = getNutritionDataPointPosition(entry.calories, index, processedData.length, allLabels);
        const label = allLabels[index] || '';
        
        console.log(`Point ${index}: ${entry.calories} kcal à la position`, position);
        
        dataPoints.push(
          <View 
            key={`nutrition-${entry.date.toISOString()}-${index}`} 
            style={[styles.dataPointContainer, position]}
          >
            <View style={[styles.dataPoint, { backgroundColor: '#4ECDC4' }]} />
            <Text style={styles.dataPointLabel}>{label}</Text>
          </View>
        );
      }
    });

    console.log(`Total points à afficher: ${dataPoints.length}`);

    return (
      <>
        <LinearGradient
          colors={['rgba(78, 205, 196, 0.3)', 'rgba(78, 205, 196, 0.1)']}
          style={styles.weightLineGradient}
        />
        <View style={styles.dataPoints}>
          {dataPoints}
        </View>
      </>
    );
  };

  const getNutritionDataPointPosition = (calories: number, dataIndex: number, totalDataPoints: number, allLabels: string[]) => {
    // Utiliser la même logique que generateNutritionYAxisLabels
    const yAxisValues = generateNutritionYAxisLabels().map(label => parseInt(label));
    const actualMaxCalories = yAxisValues[0];
    const actualMinCalories = yAxisValues[4];
    const actualRange = actualMaxCalories - actualMinCalories;

    // Calculer la position Y
    const caloriePercentage = actualRange > 0 ? 
      Math.max(0, Math.min(1, (actualMaxCalories - calories) / actualRange)) : 0.5;

    // Calculer la position horizontale
    const totalLabels = allLabels.length;
    let leftPercentage = 0;

    if (totalLabels > 1) {
      const marginPercentage = 5;
      const usableWidth = 100 - (2 * marginPercentage);
      const labelIndex = Math.min(dataIndex, totalLabels - 1);
      leftPercentage = marginPercentage + (labelIndex / (totalLabels - 1)) * usableWidth;
    } else {
      leftPercentage = 50;
    }

    return {
      left: `${leftPercentage}%`,
      top: `${caloriePercentage * 80 + 10}%`
    };
  };

  const generateNutritionPeriodLabels = () => {
    const labels = [];
    const monthNames = ['Janv', 'Févr', 'Mars', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'];

    if (selectedNutritionPeriod === 'Jours') {
      // Toujours générer les labels pour les 7 derniers jours
      const currentDate = new Date();
      
      for (let i = 6; i >= 0; i--) {
        const targetDate = new Date(currentDate);
        targetDate.setDate(currentDate.getDate() - i);
        const dayMonth = targetDate.toLocaleDateString('fr-FR', { 
          day: 'numeric', 
          month: 'numeric' 
        });
        labels.push(dayMonth);
      }
      
      console.log('Labels générés pour les jours:', labels);
      return labels;
      
    } else if (selectedNutritionPeriod === 'Semaine') {
      const processedData = getProcessedNutritionData();
      
      processedData.forEach(entry => {
        const weekNumber = getISOWeekNumber(entry.date);
        labels.push(`S${weekNumber}`);
      });

      if (labels.length < 6) {
        const currentDate = new Date();
        const existingWeeks = new Set(labels.map(l => l.substring(1)));
        
        let weeksToAdd = 6 - labels.length;
        let dateOffset = 0;
        
        while (weeksToAdd > 0) {
          const targetDate = new Date(currentDate);
          targetDate.setDate(currentDate.getDate() - (dateOffset * 7));
          
          const weekNumber = getISOWeekNumber(targetDate);
          const weekLabel = `S${weekNumber}`;
          
          if (!existingWeeks.has(weekNumber.toString())) {
            labels.unshift(weekLabel);
            weeksToAdd--;
          }
          
          dateOffset++;
          if (dateOffset > 52) break;
        }
      }

      return labels.slice(-6);
      
    } else if (selectedNutritionPeriod === 'Mois') {
      const processedData = getProcessedNutritionData();
      
      processedData.forEach(entry => {
        const monthName = monthNames[entry.date.getMonth()];
        if (!labels.includes(monthName)) {
          labels.push(monthName);
        }
      });

      if (labels.length < 6) {
        const currentDate = new Date();
        const existingMonths = new Set(labels);
        
        for (let i = 5; i >= 0; i--) {
          const targetDate = new Date(currentDate);
          targetDate.setMonth(currentDate.getMonth() - i);
          const monthName = monthNames[targetDate.getMonth()];
          
          if (!existingMonths.has(monthName)) {
            labels.push(monthName);
          }
        }
      }

      return labels.slice(-6);
    }

    return labels;
  };

  const getProcessedNutritionData = () => {
    const currentDate = new Date();
    let filteredData = [...(nutritionStats.weeklyCalories || [])];

    console.log('=== GET PROCESSED NUTRITION DATA ===');
    console.log('Période sélectionnée:', selectedNutritionPeriod);
    console.log('Données brutes nutrition:', filteredData);

    // Convertir les données en format compatible
    const processedData = filteredData.map(entry => ({
      calories: entry.calories,
      date: new Date(entry.date)
    }));

    // Filtrer selon la période
    if (selectedNutritionPeriod === 'Jours') {
      // Pour les 7 derniers jours, garantir qu'on a tous les jours même avec 0 calories
      const last7Days = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(currentDate);
        date.setDate(currentDate.getDate() - i);
        date.setHours(0, 0, 0, 0);
        
        // Chercher les données existantes pour ce jour
        const existingData = processedData.find(entry => {
          const entryDate = new Date(entry.date);
          entryDate.setHours(0, 0, 0, 0);
          return entryDate.getTime() === date.getTime();
        });
        
        last7Days.push({
          calories: existingData ? existingData.calories : 0,
          date: new Date(date)
        });
      }
      
      console.log('Données des 7 derniers jours:', last7Days.map(d => ({ date: d.date.toISOString().split('T')[0], calories: d.calories })));
      return last7Days;
      
    } else if (selectedNutritionPeriod === 'Semaine') {
      const sixWeeksAgo = new Date(currentDate.getTime() - (6 * 7 * 24 * 60 * 60 * 1000));
      return processedData.filter(entry => entry.date >= sixWeeksAgo).slice(-6);
    } else if (selectedNutritionPeriod === 'Mois') {
      // Traiter par semaine puis regrouper par mois
      const sixMonthsAgo = new Date(currentDate.getTime() - (6 * 30 * 24 * 60 * 60 * 1000));
      const monthlyData = processedData.filter(entry => entry.date >= sixMonthsAgo);
      
      // Regrouper par mois
      const monthlyAverages = new Map();
      monthlyData.forEach(entry => {
        const monthKey = `${entry.date.getFullYear()}-${entry.date.getMonth()}`;
        if (!monthlyAverages.has(monthKey)) {
          monthlyAverages.set(monthKey, { 
            total: 0, 
            count: 0, 
            date: new Date(entry.date.getFullYear(), entry.date.getMonth(), 1) 
          });
        }
        const monthData = monthlyAverages.get(monthKey);
        monthData.total += entry.calories;
        monthData.count += 1;
      });

      return Array.from(monthlyAverages.values())
        .map(month => ({
          calories: month.total / month.count,
          date: month.date
        }))
        .sort((a, b) => a.date.getTime() - b.date.getTime())
        .slice(-6);
    }

    return processedData;
  };

  // Fonction pour calculer le numéro de semaine ISO 8601
  const getISOWeekNumber = (date: Date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  };

  const generatePeriodLabels = () => {
    const labels = [];
    const monthNames = ['Janv', 'Févr', 'Mars', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'];

    if (selectedPeriod === 'Semaines') {
      // Utiliser les vraies semaines des données de poids
      const processedData = getProcessedWeightData();
      
      // Générer les labels basés sur les vraies dates des données
      processedData.forEach(entry => {
        const weekNumber = getISOWeekNumber(entry.date);
        labels.push(`S${weekNumber}`);
      });

      // Si pas assez de données, compléter avec les semaines récentes
      if (labels.length < 6) {
        const currentDate = new Date();
        const existingWeeks = new Set(labels.map(l => l.substring(1))); // Enlever le 'S'
        
        // Ajouter les semaines manquantes en remontant dans le temps
        let weeksToAdd = 6 - labels.length;
        let dateOffset = 0;
        
        while (weeksToAdd > 0) {
          const targetDate = new Date(currentDate);
          targetDate.setDate(currentDate.getDate() - (dateOffset * 7));
          
          const weekNumber = getISOWeekNumber(targetDate);
          const weekLabel = `S${weekNumber}`;
          
          if (!existingWeeks.has(weekNumber.toString())) {
            labels.unshift(weekLabel);
            weeksToAdd--;
          }
          
          dateOffset++;
          
          // Sécurité pour éviter une boucle infinie
          if (dateOffset > 52) break;
        }
      }

      // Garder seulement les 6 derniers
      return labels.slice(-6);
      
    } else if (selectedPeriod === 'Mois') {
      const processedData = getProcessedWeightData();
      
      // Générer les labels basés sur les vraies dates des données
      processedData.forEach(entry => {
        const monthName = monthNames[entry.date.getMonth()];
        if (!labels.includes(monthName)) {
          labels.push(monthName);
        }
      });

      // Si pas assez de données, compléter avec les mois récents
      if (labels.length < 6) {
        const currentDate = new Date();
        const existingMonths = new Set(labels);
        
        for (let i = 5; i >= 0; i--) {
          const targetDate = new Date(currentDate);
          targetDate.setMonth(currentDate.getMonth() - i);
          const monthName = monthNames[targetDate.getMonth()];
          
          if (!existingMonths.has(monthName)) {
            labels.push(monthName);
          }
        }
      }

      return labels.slice(-6);
      
    } else { // Années
      const processedData = getProcessedWeightData();
      
      // Générer les labels basés sur les vraies dates des données
      processedData.forEach(entry => {
        const year = entry.date.getFullYear().toString();
        if (!labels.includes(year)) {
          labels.push(year);
        }
      });

      // Si pas assez de données, compléter avec les années récentes
      if (labels.length < 6) {
        const currentYear = new Date().getFullYear();
        const existingYears = new Set(labels);
        
        for (let i = 5; i >= 0; i--) {
          const year = (currentYear - i).toString();
          if (!existingYears.has(year)) {
            labels.push(year);
          }
        }
      }

      return labels.slice(-6);
    }
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
        .slice(-6); // Garder les derniers mois

      return monthlyData

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
        .slice(-6); // Garder les 6 dernières années

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

      // Charger les données nutritionnelles réelles avec priorité sur le serveur VPS
      let nutritionEntries = [];
      
      // Essayer le serveur VPS d'abord avec timeout plus court
      try {
        const VPS_URL = process.env.EXPO_PUBLIC_VPS_URL || 'https://eatfitbymax.replit.app';
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 secondes timeout

        const response = await fetch(`${VPS_URL}/api/nutrition/${user.id}`, {
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          nutritionEntries = await response.json();
          console.log('Données nutrition chargées depuis le serveur VPS pour les progrès:', nutritionEntries.length, 'entrées');
          
          // Sauvegarder en local comme backup
          await AsyncStorage.setItem(`food_entries_${user.id}`, JSON.stringify(nutritionEntries));
        } else {
          throw new Error('Réponse serveur non-OK');
        }
      } catch (serverError) {
        console.log('Erreur serveur VPS nutrition (progrès):', serverError.message);
        
        // Fallback vers le stockage local
        console.log('Fallback vers le stockage local pour nutrition (progrès)');
        const stored = await AsyncStorage.getItem(`food_entries_${user.id}`);
        if (stored) {
          nutritionEntries = JSON.parse(stored);
          console.log('Données nutrition chargées depuis le stockage local:', nutritionEntries.length, 'entrées');
        } else {
          console.log('Aucune donnée nutritionnelle trouvée en local');
        }
      }

      // Calculer les statistiques de la semaine courante (lundi à dimanche)
      const last7DaysNutrition = [];
      const last7DaysHydration = [];
      let totalCaloriesWeek = 0;
      let totalProteinsWeek = 0;
      let totalCarbsWeek = 0;
      let totalFatWeek = 0;
      let totalHydrationWeek = 0;
      let daysWithData = 0;
      let daysWithHydration = 0;

      // Calculer le début de la semaine courante (lundi)
      const today = new Date();
      const currentDay = today.getDay(); // 0 = dimanche, 1 = lundi, etc.
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - (currentDay === 0 ? 6 : currentDay - 1)); // Ajuster pour commencer le lundi
      startOfWeek.setHours(0, 0, 0, 0);

      console.log(`=== ANALYSE DONNÉES NUTRITION (${nutritionEntries.length} entrées) ===`);
      console.log('Début de semaine:', startOfWeek.toISOString().split('T')[0]);
      
      // Afficher toutes les dates disponibles
      const availableDates = [...new Set(nutritionEntries.map((entry: any) => entry.date))].sort();
      console.log('Dates disponibles dans les données:', availableDates);

      for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + i);
        const dateString = date.toISOString().split('T')[0];

        // Données nutritionnelles
        const dayEntries = nutritionEntries.filter((entry: any) => 
          entry.date === dateString
        );

        console.log(`Jour ${i + 1} (${dateString}): ${dayEntries.length} entrées trouvées`);
        if (dayEntries.length > 0) {
          console.log('  - Entrées:', dayEntries.map(e => `${e.product?.name || 'Inconnu'} (${e.calories}kcal)`));
        }

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

      console.log('=== RÉSUMÉ NUTRITION SEMAINE ===');
      console.log(`Jours avec données: ${daysWithData}/7`);
      console.log(`Total calories semaine: ${totalCaloriesWeek}`);
      console.log(`Moyenne calories: ${avgCalories}`);
      console.log(`Moyenne protéines: ${avgProteins}g`);
      console.log(`Hydratation moyenne: ${avgHydration}ml`);
      console.log('=== FIN RÉSUMÉ ===');

      setNutritionStats({
        weeklyCalories: last7DaysNutrition,
        monthlyCalories: last30DaysNutrition,
        averageCalories: avgCalories,
        averageProteins: avgProteins,
        averageCarbs: avgCarbs,
        averageFat: avgFat,
        averageHydration: avgHydration,
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
            {/* Stats de la semaine */}
            <View style={styles.sportStatsContainer}>
              <View style={styles.sportStatCard}>
                <View style={styles.statIcon}>
                  <Text style={styles.iconText}>🏃</Text>
                </View>
                <Text style={styles.statLabel}>Séances terminées</Text>
                <Text style={styles.statValue}>{weeklyData.filter(d => d.workouts > 0).length}</Text>
              </View>

              <View style={styles.sportStatCard}>
                <View style={styles.statIcon}>
                  <Text style={styles.iconText}>⏱️</Text>
                </View>
                <Text style={styles.statLabel}>Temps total</Text>
                <Text style={styles.statValue}>
                  {Math.floor(weeklyData.reduce((sum, day) => sum + day.minutes, 0) / 60)}h{' '}
                  {weeklyData.reduce((sum, day) => sum + day.minutes, 0) % 60}min
                </Text>
              </View>

              <View style={styles.sportStatCard}>
                <View style={styles.statIcon}>
                  <Text style={styles.iconText}>🔥</Text>
                </View>
                <Text style={styles.statLabel}>Calories brûlées</Text>
                <Text style={styles.statValue}>
                  {Math.round(weeklyData.reduce((sum, day) => sum + day.minutes, 0) * 6.5)}
                </Text>
              </View>
            </View>

            {/* Graphique d'évolution calorique */}
            <View style={styles.nutritionChartContainer}>
              <View style={styles.chartHeader}>
                <Text style={styles.chartTitle}>Évolution de l'apport calorique</Text>
              </View>

              {/* Onglets de période */}
              <View style={styles.periodTabsContainer}>
                {['Jours', 'Semaine', 'Mois'].map((period) => (
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

              {/* Graphique avec scroll horizontal */}
              <View style={styles.chartArea}>
                <View style={styles.nutritionYAxis}>
                  {generateNutritionYAxisLabels().map((label, index) => (
                    <Text key={index} style={styles.nutritionYAxisLabel}>{label}</Text>
                  ))}
                </View>

                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={true}
                  style={styles.chartScrollView}
                  contentContainerStyle={styles.chartScrollContent}
                >
                  <View style={styles.chartContent}>
                    {/* Grille */}
                    <View style={styles.gridContainer}>
                      {[...Array(5)].map((_, i) => (
                        <View key={i} style={styles.gridLine} />
                      ))}
                    </View>

                    {/* Ligne et points de calories */}
                    {renderNutritionChart()}
                  </View>
                </ScrollView>
              </View>
            </View>

            {/* Progression des objectifs sportifs */}
            <View style={styles.sportObjectivesCard}>
              <Text style={styles.chartTitle}>🎯 Objectifs de la semaine</Text>

              <View style={styles.objectiveItem}>
                <View style={styles.objectiveHeader}>
                  <Text style={styles.objectiveLabel}>Séances par semaine</Text>
                  <Text style={styles.objectiveProgress}>
                    {weeklyData.filter(d => d.workouts > 0).length}/3
                  </Text>
                </View>
                <View style={styles.objectiveBar}>
                  <View style={[
                    styles.objectiveBarFill, 
                    { width: `${Math.min((weeklyData.filter(d => d.workouts > 0).length / 3) * 100, 100)}%` }
                  ]} />
                </View>
              </View>

              <View style={styles.objectiveItem}>
                <View style={styles.objectiveHeader}>
                  <Text style={styles.objectiveLabel}>Temps d'entraînement</Text>
                  <Text style={styles.objectiveProgress}>
                    {Math.floor(weeklyData.reduce((sum, day) => sum + day.minutes, 0) / 60)}h{weeklyData.reduce((sum, day) => sum + day.minutes, 0) % 60}min/2h30
                  </Text>
                </View>
                <View style={styles.objectiveBar}>
                  <View style={[
                    styles.objectiveBarFill, 
                    { width: `${Math.min((weeklyData.reduce((sum, day) => sum + day.minutes, 0) / 150) * 100, 100)}%` }
                  ]} />
                </View>
              </View>

              <View style={styles.objectiveItem}>
                <View style={styles.objectiveHeader}>
                  <Text style={styles.objectiveLabel}>Régularité</Text>
                  <Text style={styles.objectiveProgress}>
                    {Math.round((weeklyData.filter(d => d.workouts > 0).length / 7) * 100)}%
                  </Text>
                </View>
                <View style={styles.objectiveBar}>
                  <View style={[
                    styles.objectiveBarFill, 
                    { width: `${(weeklyData.filter(d => d.workouts > 0).length / 7) * 100}%` }
                  ]} />
                </View>
              </View>
            </View>

            {/* Records personnels */}
            <View style={styles.personalRecordsCard}>
              <Text style={styles.chartTitle}>🏆 Performances personnelles</Text>

              <View style={styles.recordsGrid}>
                <View style={styles.recordItem}>
                  <Text style={styles.recordLabel}>Séance la plus longue</Text>
                  <Text style={styles.recordValue}>
                    {Math.max(...weeklyData.map(d => d.minutes)) > 0 ? 
                      `${Math.max(...weeklyData.map(d => d.minutes))} min` : 
                      'Aucune'
                    }
                  </Text>
                  <Text style={styles.recordDate}>Cette semaine</Text>
                </View>

                <View style={styles.recordItem}>
                  <Text style={styles.recordLabel}>Total entraînements</Text>
                  <Text style={styles.recordValue}>{personalRecords.totalWorkouts}</Text>
                  <Text style={styles.recordDate}>Depuis le début</Text>
                </View>

                <View style={styles.recordItem}>
                  <Text style={styles.recordLabel}>Jours consécutifs</Text>
                  <Text style={styles.recordValue}>
                    {(() => {
                      let streak = 0;
                      for (let i = weeklyData.length - 1; i >= 0; i--) {
                        if (weeklyData[i].workouts > 0) {
                          streak++;
                        } else {
                          break;
                        }
                      }
                      return streak;
                    })()}
                  </Text>
                  <Text style={styles.recordDate}>Record actuel</Text>
                </View>

                <View style={styles.recordItem}>
                  <Text style={styles.recordLabel}>Moyenne hebdo</Text>
                  <Text style={styles.recordValue}>
                    {Math.round(weeklyData.reduce((sum, day) => sum + day.minutes, 0) / 7)} min/j
                  </Text>
                  <Text style={styles.recordDate}>Cette semaine</Text>
                </View>
              </View>
            </View>

            {/* Résumé motivationnel */}
            <View style={styles.motivationalSummaryCard}>
              <Text style={styles.summaryTitle}>Résumé de la semaine</Text>
              <View style={styles.summaryStats}>
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryValue, { 
                    color: weeklyData.filter(d => d.workouts > 0).length >= 3 ? '#28A745' : 
                           weeklyData.filter(d => d.workouts > 0).length >= 1 ? '#F5A623' : '#DC3545' 
                  }]}>
                    {weeklyData.filter(d => d.workouts > 0).length}/7
                  </Text>
                  <Text style={styles.summaryLabel}>Jours actifs</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryValue, { 
                    color: weeklyData.reduce((sum, day) => sum + day.minutes, 0) >= 150 ? '#28A745' : '#F5A623'
                  }]}>
                    {weeklyData.reduce((sum, day) => sum + day.minutes, 0)}
                  </Text>
                  <Text style={styles.summaryLabel}>Minutes totales</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryValue, { color: '#F5A623' }]}>
                    {Math.round((weeklyData.filter(d => d.workouts > 0).length / 7) * 100)}%
                  </Text>
                  <Text style={styles.summaryLabel}>Régularité</Text>
                </View>
              </View>

              {/* Message motivationnel */}
              <View style={styles.motivationalMessage}>
                <Text style={styles.motivationalTitle}>💪 Votre bilan</Text>
                <Text style={styles.motivationalText}>
                  {(() => {
                    const activeDays = weeklyData.filter(d => d.workouts > 0).length;
                    const totalMinutes = weeklyData.reduce((sum, day) => sum + day.minutes, 0);
                    
                    if (activeDays >= 5) {
                      return "Excellente semaine ! Vous maintenez un rythme exceptionnel. Continuez sur cette lancée !";
                    } else if (activeDays >= 3) {
                      return "Bonne semaine d'entraînement ! Vous êtes sur la bonne voie pour atteindre vos objectifs.";
                    } else if (activeDays >= 1) {
                      return "C'est un début ! Essayez d'ajouter une séance supplémentaire la semaine prochaine.";
                    } else {
                      return "Il n'est jamais trop tard pour commencer ! Planifiez votre première séance dès maintenant.";
                    }
                  })()}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Statistiques selon l'onglet sélectionné */}
        {selectedTab === 'Nutrition' && (
          <View style={styles.nutritionContainer}>
            {/* Graphique d'évolution calorique */}
            <View style={styles.nutritionChartContainer}>
              <View style={styles.chartHeader}>
                <Text style={styles.chartTitle}>Évolution de l'apport calorique</Text>
              </View>

              {/* Onglets de période */}
              <View style={styles.periodTabsContainer}>
                {['Jours', 'Semaine', 'Mois'].map((period) => (
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

              {/* Graphique avec scroll horizontal */}
              <View style={styles.chartArea}>
                <View style={styles.nutritionYAxis}>
                  {generateNutritionYAxisLabels().map((label, index) => (
                    <Text key={index} style={styles.nutritionYAxisLabel}>{label}</Text>
                  ))}
                </View>

                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={true}
                  style={styles.chartScrollView}
                  contentContainerStyle={styles.chartScrollContent}
                >
                  <View style={styles.chartContent}>
                    {/* Grille */}
                    <View style={styles.gridContainer}>
                      {[...Array(5)].map((_, i) => (
                        <View key={i} style={styles.gridLine} />
                      ))}
                    </View>

                    {/* Ligne et points de calories */}
                    {renderNutritionChart()}
                  </View>
                </ScrollView>
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
                {nutritionStats.averageCalories > 0 && (
                  <Text style={[styles.statTrend, { 
                    color: nutritionStats.averageCalories >= 1800 ? '#28A745' : '#F5A623'
                  }]}>
                    {nutritionStats.averageCalories >= 1800 ? 
                      `✓ Objectif atteint (${Math.round((nutritionStats.averageCalories / 2200) * 100)}%)` : 
                      `${Math.round((nutritionStats.averageCalories / 2200) * 100)}% de l'objectif`
                    }
                  </Text>
                )}
              </View>

              <View style={styles.nutritionStatCard}>
                <View style={styles.statIcon}>
                  <Text style={styles.iconText}>💪</Text>
                </View>
                <Text style={styles.statLabel}>Protéines moyennes</Text>
                <Text style={styles.statValue}>{nutritionStats.averageProteins}g</Text>
                {nutritionStats.averageProteins > 0 && (
                  <Text style={[styles.statTrend, { 
                    color: nutritionStats.averageProteins >= 100 ? '#28A745' : '#F5A623'
                  }]}>
                    {nutritionStats.averageProteins >= 100 ? 
                      `✓ Excellent apport (${Math.round((nutritionStats.averageProteins / 120) * 100)}%)` : 
                      `${Math.round((nutritionStats.averageProteins / 120) * 100)}% de l'objectif`
                    }
                  </Text>
                )}
              </View>

              <View style={styles.nutritionStatCard}>
                <View style={styles.statIcon}>
                  <Text style={styles.iconText}>🌾</Text>
                </View>
                <Text style={styles.statLabel}>Glucides moyens</Text>
                <Text style={styles.statValue}>{nutritionStats.averageCarbs}g</Text>
                {nutritionStats.averageCarbs > 0 && (
                  <Text style={[styles.statTrend, { 
                    color: nutritionStats.averageCarbs >= 200 && nutritionStats.averageCarbs <= 350 ? '#28A745' : '#F5A623'
                  }]}>
                    {nutritionStats.averageCarbs >= 200 && nutritionStats.averageCarbs <= 350 ? 
                      '✓ Équilibre optimal' : 
                      nutritionStats.averageCarbs < 200 ? 'Apport faible' : 'Apport élevé'
                    }
                  </Text>
                )}
              </View>

              <View style={styles.nutritionStatCard}>
                <View style={styles.statIcon}>
                  <Text style={styles.iconText}>🥑</Text>
                </View>
                <Text style={styles.statLabel}>Lipides moyens</Text>
                <Text style={styles.statValue}>{nutritionStats.averageFat}g</Text>
                {nutritionStats.averageFat > 0 && (
                  <Text style={[styles.statTrend, { 
                    color: nutritionStats.averageFat >= 50 && nutritionStats.averageFat <= 100 ? '#28A745' : '#F5A623'
                  }]}>
                    {nutritionStats.averageFat >= 50 && nutritionStats.averageFat <= 100 ? 
                      '✓ Équilibre optimal' : 
                      nutritionStats.averageFat < 50 ? 'Apport insuffisant' : 'Apport élevé'
                    }
                  </Text>
                )}
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
              </View>

              <View style={styles.hydrationBars}>
                {nutritionStats.weeklyHydration.map((dayData, index) => {
                  // Calculer l'objectif personnalisé pour chaque jour (même logique que nutrition)
                  const calculateDailyGoal = () => {
                    if (!userData?.weight || !userData?.age) return 2000;
                    
                    let baseGoal = userData.weight * 35;
                    
                    if (userData.age > 65) {
                      baseGoal += 300;
                    } else if (userData.age > 50) {
                      baseGoal += 200;
                    }
                    
                    // Arrondir au multiple de 250ml supérieur comme dans nutrition
                    return Math.ceil(baseGoal / 250) * 250;
                  };

                  const dailyGoal = calculateDailyGoal();
                  
                  const percentage = dailyGoal > 0 ? (dayData.water / dailyGoal) * 100 : 0;
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

              {/* Objectif personnalisé centré sous les jours */}
              <View style={styles.hydrationObjectiveContainer}>
                <Text style={styles.hydrationObjectiveText}>
                  Objectif: {(() => {
                    // Utiliser la même logique que dans nutrition pour calculer l'objectif
                    if (!userData?.weight || !userData?.age) return '2000ml/jour';
                    
                    let baseGoal = userData.weight * 35;
                    
                    if (userData.age > 65) {
                      baseGoal += 300;
                    } else if (userData.age > 50) {
                      baseGoal += 200;
                    }
                    
                    // Arrondir au multiple de 250ml supérieur comme dans nutrition
                    const finalGoal = Math.ceil(baseGoal / 250) * 250;
                    
                    return `${finalGoal}ml/jour`;
                  })()}
                </Text>
                {(!userData?.weight || !userData?.age) && (
                  <Text style={styles.hydrationObjectiveSubtext}>
                    Objectif standard
                  </Text>
                )}
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
                  <Text style={[styles.summaryValue, { color: '#4ECDC4' }]}>
                    {(() => {
                      // Calculer l'objectif personnalisé pour la moyenne (même logique que nutrition)
                      if (!userData?.weight || !userData?.age) return nutritionStats.averageHydration > 0 ? Math.round((nutritionStats.averageHydration / 2000) * 100) : 0;
                      
                      let personalGoal = userData.weight * 35;
                      
                      if (userData.age > 65) {
                        personalGoal += 300;
                      } else if (userData.age > 50) {
                        personalGoal += 200;
                      }
                      
                      const finalGoal = Math.ceil(personalGoal / 250) * 250;
                      
                      return nutritionStats.averageHydration > 0 ? Math.round((nutritionStats.averageHydration / finalGoal) * 100) : 0;
                    })()}%
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

          {/* Improved Chart with Horizontal Scroll */}
          <View style={styles.chartArea}>
            <View style={styles.yAxis}>
            {generateYAxisLabels().map((label, index) => (
                <Text key={index} style={styles.yAxisLabel}>{label}</Text>
              ))}
            </View>

            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={true}
              style={styles.chartScrollView}
              contentContainerStyle={styles.chartScrollContent}
            >
              <View style={styles.chartContent}>
                {/* Grid */}
                <View style={styles.gridContainer}>
                  {[...Array(5)].map((_, i) => (
                    <View key={i} style={styles.gridLine} />
                  ))}
                </View>

                {/* Enhanced Weight Line with Gradient */}
                {renderWeightChart()}

                
              </View>
            </ScrollView>
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
              Une mise à jour par semaine (du lundi au dimanche)
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

                  // Sauvegarder dans le profil utilisateur pour éviter de redemander
                  try {
                    if (userData) {
                      const updatedUser = {
                        ...userData,
                        targetWeightAsked: true // Flag pour indiquer que la question a été posée
                      };

                      const users = await PersistentStorage.getUsers();
                      const userIndex = users.findIndex(u => u.id === userData.id);
                      if (userIndex !== -1) {
                        users[userIndex] = updatedUser;
                        await PersistentStorage.saveUsers(users);
                      }

                      await AsyncStorage.setItem('currentUser', JSON.stringify(updatedUser));
                      setUserData(updatedUser);
                    }
                  } catch (error) {
                    console.error('Erreur sauvegarde flag utilisateur:', error);
                  }

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
    height: 220,
    paddingBottom: 20,
  },
  yAxis: {
    justifyContent: 'space-between',
    width: 50,
    paddingRight: 8,
    paddingLeft: 4,
    paddingTop: 0,
    paddingBottom: 0,
  },
  yAxisLabel: {
    fontSize: 12,
    color: '#8B949E',
    textAlign: 'left',
    lineHeight: 12,
    height: 12,
  },
  chartScrollView: {
    flex: 1,
  },
  chartScrollContent: {
    minWidth: width - 120, // Largeur minimale pour permettre le scroll
  },
  chartContent: {
    width: Math.max(width - 120, 400), // Largeur minimum pour garantir le scroll
    position: 'relative',
    height: '100%',
  },
  gridContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
    paddingVertical: 6,
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
  dataPointContainer: {
    position: 'absolute',
    alignItems: 'center',
  },
  dataPoint: {
    width: 8,
    height: 8,
    backgroundColor: '#F5A623',
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    marginBottom: 6,
  },
  dataPointLabel: {
    fontSize: 10,
    color: '#8B949E',
    fontWeight: '500',
    textAlign: 'center',
  },
  xAxis: {
    position: 'absolute',
    bottom: 0, // Position en bas du conteneur
    left: 0,
    right: 0,
    height: 25,
  },
  xAxisLabel: {
    fontSize: 11,
    color: '#8B949E',
    fontWeight: '500',
    textAlign: 'center',
    width: 24,
  },
  xAxisLabelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 60, // Aligner avec le graphique
    paddingTop: 10,
    paddingBottom: 5,
  },
  xAxisLabelBottom: {
    fontSize: 11,
    color: '#8B949E',
    fontWeight: '500',
    textAlign: 'center',
    flex: 1,
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
    paddingHorizontal: 8,
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 8,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F5A623',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#8B949E',
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 4,
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
  favoriteSportCard: {
    backgroundColor: '#161B22',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F5A623',
    marginBottom: 25,
    shadowColor: '#F5A623',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  favoriteSportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  favoriteSportEmoji: {
    fontSize: 40,
    marginRight: 16,
  },
  favoriteSportInfo: {
    flex: 1,
  },
  favoriteSportTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  favoriteSportSubtitle: {
    fontSize: 14,
    color: '#F5A623',
    fontWeight: '500',
  },
  sportStatsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 25,
  },
  sportStatCard: {
    flex: 1,
    backgroundColor: '#161B22',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#21262D',
    alignItems: 'center',
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
  sportBarText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
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
  motivationalSummaryCard: {
    backgroundColor: '#161B22',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#21262D',
    marginBottom: 25,
  },
  motivationalMessage: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#21262D',
  },
  motivationalTitle: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
    marginBottom: 8,
  },
  motivationalText: {
    fontSize: 14,
    color: '#8B949E',
    lineHeight: 20,
    textAlign: 'center',
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
    paddingBottom: 35,
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
  hydrationObjectiveContainer: {
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#21262D',
  },
  hydrationObjectiveText: {
    fontSize: 14,
    color: '#4ECDC4',
    fontWeight: '600',
    marginBottom: 4,
  },
  hydrationObjectiveSubtext: {
    fontSize: 12,
    color: '#8B949E',
    fontStyle: 'italic',
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
    paddingTop: 0,
    paddingBottom: 0,
    height: '100%',
  },
  nutritionYAxisLabel: {
    fontSize: 12,
    color: '#8B949E',
    textAlign: 'left',
    lineHeight: 12,
    height: 12,
  },
});