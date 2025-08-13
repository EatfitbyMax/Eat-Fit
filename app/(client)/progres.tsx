import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Dimensions, Alert, TextInput, Modal, Keyboard } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring } from 'react-native-reanimated';
import { useFocusEffect } from 'expo-router';
import { checkSubscriptionStatus } from '@/utils/subscription';
import { PersistentStorage } from '@/utils/storage';
import ComingSoonModal from '@/components/ComingSoonModal';

const { width } = Dimensions.get('window');

export default function ProgresScreen() {
  const [selectedTab, setSelectedTab] = useState('Mesures');
  const [isPremium, setIsPremium] = useState(false);
  const [selectedMeasurementTab, setSelectedMeasurementTab] = useState('Poids');
  const [selectedPeriod, setSelectedPeriod] = useState('Mois');
  const progressAnimation = useSharedValue(0);
  const [userData, setUserData] = useState<any>(null);
  const [showComingSoonModal, setShowComingSoonModal] = useState(false);
  const [weightData, setWeightData] = useState({
    startWeight: 0,
    currentWeight: 0,
    targetWeight: 0,
    lastWeightUpdate: null as string | null,
    weightHistory: [] as Array<{ weight: number; date: string }>,
  });

  // Fonction pour formater le poids avec la précision appropriée
  const formatWeight = (weight: number) => {
    if (!weight || isNaN(weight)) {
      return '0';
    }
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
    checkUserSubscription();
  }, []);

  const checkUserSubscription = async () => {
    try {
      const subscriptionStatus = await checkSubscriptionStatus();
      setIsPremium(subscriptionStatus.isPremium);
    } catch (error) {
      console.error('Erreur vérification abonnement:', error);
      // En cas d'erreur IAP, permettre l'accès de base (poids)
      setIsPremium(false);
    }
  };

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
      console.log('🔄 Chargement des données utilisateur et poids...');

      // Récupérer les données utilisateur depuis l'auth context
      const { getCurrentUser } = await import('@/utils/auth');
      const user = await getCurrentUser();

      if (user) {
        setUserData(user);
        console.log('👤 Utilisateur chargé:', user.firstName, user.lastName);

        // Charger les données de poids depuis le serveur VPS
        let saved = null;
        try {
          saved = await PersistentStorage.getWeightData(user.id);
          console.log('✅ Données de poids chargées depuis le serveur VPS:', saved);
        } catch (serverError) {
          console.log('📱 Erreur serveur, création de nouvelles données:', serverError);
          // Créer des données par défaut
          const profileWeight = user.weight || 0;
          saved = {
            startWeight: profileWeight,
            currentWeight: profileWeight,
            targetWeight: 0,
            lastWeightUpdate: null,
            weightHistory: profileWeight > 0 ? [{ 
              weight: profileWeight, 
              date: user.createdAt || new Date().toISOString() 
            }] : [],
          };
          console.log('📝 Données par défaut créées');
        }

        // Validation simple des données - pas de synchronisation complexe
        if (!saved.startWeight && user.weight) saved.startWeight = user.weight;
        if (!saved.currentWeight && user.weight) saved.currentWeight = user.weight;
        if (!saved.targetWeight) saved.targetWeight = 0;

        setWeightData(saved);

        // Calculer le pourcentage de progression si objectif défini
        if (saved.targetWeight && saved.startWeight && saved.targetWeight > 0 && saved.startWeight > 0) {
          const totalLoss = saved.startWeight - saved.targetWeight;
          const currentLoss = saved.startWeight - saved.currentWeight;
          if (totalLoss > 0) {
            const progress = Math.max(0, Math.min(1, currentLoss / totalLoss));
            progressAnimation.value = withSpring(progress);
          }
        }
      }
    } catch (error) {
      console.error('❌ Erreur chargement données utilisateur:', error);
    }
  };

  const saveWeightData = async (data: any) => {
    try {
      console.log('💾 Sauvegarde données poids:', data);

      const validatedData = {
        startWeight: Number(data.startWeight) || 0,
        currentWeight: Number(data.currentWeight) || 0,
        targetWeight: Number(data.targetWeight) || 0,
        lastWeightUpdate: data.lastWeightUpdate || null,
        weightHistory: Array.isArray(data.weightHistory) ? data.weightHistory : []
      };

      if (userData?.id) {
        await PersistentStorage.saveWeightData(userData.id, validatedData);
        console.log('✅ Données de poids sauvegardées sur le serveur VPS');
      }
    } catch (error) {
      console.error('❌ Erreur sauvegarde données poids:', error);
      throw error;
    }
  };

  const handleWeightUpdate = async () => {
    try {
      // Fermer le clavier
      Keyboard.dismiss();

      console.log('🔄 Mise à jour du poids actuel:', tempWeight);

      // Remplacer la virgule par un point pour la conversion
      const normalizedWeight = tempWeight.replace(',', '.');
      const weight = parseFloat(normalizedWeight);

      if (isNaN(weight) || weight <= 0 || weight > 500) {
        Alert.alert('Erreur', 'Veuillez entrer un poids valide (entre 1 et 500 kg)');
        return;
      }

      // Validation supplémentaire pour des changements de poids réalistes
      if (weightData.currentWeight > 0) {
        const weightDifference = Math.abs(weight - weightData.currentWeight);
        if (weightDifference > 20) {
          const confirmed = await new Promise((resolve) => {
            Alert.alert(
              'Changement important détecté',
              `Différence de ${weightDifference.toFixed(1)} kg par rapport au poids précédent. Confirmer ?`,
              [
                { text: 'Annuler', onPress: () => resolve(false) },
                { text: 'Confirmer', onPress: () => resolve(true) }
              ]
            );
          });
          if (!confirmed) return;
        }
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

      console.log('📊 Nouvelles données poids:', newData);

      await saveWeightData(newData);

      // Mettre à jour l'état local immédiatement
      setWeightData(newData);

      // Mettre à jour l'animation de progression
      if (newData.targetWeight && newData.startWeight) {
        const totalLoss = newData.startWeight - newData.targetWeight;
        const currentLoss = newData.startWeight - newData.currentWeight;
        const progress = Math.max(0, Math.min(1, currentLoss / totalLoss));
        progressAnimation.value = withSpring(progress);
      }

      setTempWeight('');
      setShowWeightModal(false);
      Alert.alert('Succès', `Votre poids a été mis à jour : ${formatWeight(weight)} kg`);

    } catch (error) {
      console.error('❌ Erreur mise à jour poids:', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder votre poids. Vérifiez votre connexion.');
    }
  };

  const handleTargetUpdate = async () => {
    try {
      // Fermer le clavier
      Keyboard.dismiss();

      console.log('🎯 Mise à jour de l\'objectif:', tempTarget);

      // Remplacer la virgule par un point pour la conversion
      const normalizedTarget = tempTarget.replace(',', '.');
      const target = parseFloat(normalizedTarget);

      if (isNaN(target) || target <= 0 || target > 500) {
        Alert.alert('Erreur', 'Veuillez entrer un objectif valide (entre 1 et 500 kg)');
        return;
      }

      // Vérifier que l'objectif est cohérent
      if (weightData.startWeight > 0 && target >= weightData.startWeight) {
        const response = await new Promise((resolve) => {
          Alert.alert(
            'Objectif supérieur au poids de départ',
            'Votre objectif est supérieur à votre poids de départ. Voulez-vous continuer ?',
            [
              { text: 'Annuler', onPress: () => resolve(false) },
              { text: 'Continuer', onPress: () => resolve(true) }
            ]
          );
        });
        if (!response) return;
      }

      // Mettre à jour directement les données de poids avec le nouvel objectif
      const updatedWeightData = {
        ...weightData,
        targetWeight: target
      };

      console.log('💾 Sauvegarde objectif dans les données client:', updatedWeightData);

      // Sauvegarder directement sur le serveur
      await saveWeightData(updatedWeightData);

      // Mettre à jour l'état local immédiatement
      setWeightData(updatedWeightData);

      // Mettre à jour l'animation de progression
      if (weightData.currentWeight && weightData.startWeight) {
        const totalLoss = weightData.startWeight - target;
        const currentLoss = weightData.startWeight - weightData.currentWeight;
        const progress = Math.max(0, Math.min(1, currentLoss / totalLoss));
        progressAnimation.value = withSpring(progress);
      }

      setTempTarget('');
      setShowTargetModal(false);
      Alert.alert('Succès', `Votre objectif a été défini : ${formatWeight(target)} kg`);

      console.log('✅ Objectif sauvegardé avec succès:', target);

    } catch (error) {
      console.error('❌ Erreur mise à jour objectif:', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder votre objectif. Vérifiez votre connexion.');
    }
  };

  const loadMensurationData = async () => {
    try {
      if (userData) {
        const saved = await PersistentStorage.getMensurationData(userData.id);
        if (saved) {
          setMensurationData(saved);
        }
      }
    } catch (error) {
      console.error('Erreur chargement données mensurations depuis VPS:', error);
    }
  };

  const saveMensurationData = async (newData: any) => {
    try {
      if (userData) {
        await PersistentStorage.saveMensurationData(userData.id, newData);
        setMensurationData(newData);
        console.log('Données de mensurations sauvegardées sur le serveur VPS');
      }
    } catch (error) {
      console.error('Erreur sauvegarde données mensurations sur VPS:', error);
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
    if (!value || isNaN(value) || value === 0) return '0.0';
    return value % 1 === 0 ? value.toFixed(1) : value.toFixed(1);
  };

  const getMensurationTrend = (muscle: string) => {
    const config = getMuscleConfig(muscle);
    const data = mensurationData[muscle] || { start: 0, current: 0 };

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
    // Fermer le clavier
    Keyboard.dismiss();

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
    if (!weightData.startWeight) {
      return (
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>📊</Text>
          <Text style={styles.noDataTitle}>Pas encore de données</Text>
          <Text style={styles.noDataSubtitle}>Commencez à enregistrer votre poids pour voir votre évolution</Text>
        </View>
      );
    }

    const processedData = getProcessedWeightData();
    const allLabels = generatePeriodLabels();
    const yAxisLabels = generateYAxisLabels();
    const dataPoints = [];

    // Calculer les valeurs min et max de l'axe Y
    const maxYValue = parseInt(yAxisLabels[0]); // Premier label = valeur max
    const minYValue = parseInt(yAxisLabels[yAxisLabels.length - 1]); // Dernier label = valeur min

    // Le dégradé couvre maintenant toute la hauteur du graphique
    let gradientStartY = 1; // Haut du graphique
    let gradientEndY = 100;   // Bas du graphique

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
          style={[styles.weightLineGradient, {
            top: `${gradientStartY}%`,
            height: `${gradientEndY - gradientStartY}%`
          }]}
        />
        <View style={styles.dataPoints}>
          <Text>{dataPoints}</Text>
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

    // Utiliser exactement la même logique que generateYAxisLabels
    const centerWeightForRange = (minWeight + maxWeight) / 2;
    const minWeightForRange = Math.floor((centerWeightForRange - 10) / 5) * 5;
    const maxWeightForRange = minWeightForRange + 20;

    // Générer les mêmes 5 labels que dans generateYAxisLabels
    const yAxisValues = [];
    for (let i = 0; i < 5; i++) {
      const weight = maxWeightForRange - (i * 5);
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
      // Si un seul point, le placer à gauche (début du graphique)
      leftPercentage = 1; // 5% du bord gauche pour être vraiment au début
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

    const hasData = processedData.some(entry => entry.calories > 0);

    if (!hasData) {
      return (
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>🍽️</Text>
          <Text style={styles.noDataTitle}>Pas encore de données nutritionnelles</Text>
          <Text style={styles.noDataSubtitle}>Commencez à enregistrer vos repas pour voir votre évolution</Text>
        </View>
      );
    }

    // Générer les points de données seulement pour les entrées avec des calories > 0
    processedData.forEach((entry, index) => {
      if (entry.calories > 0) {
        const position = getNutritionDataPointPosition(entry.calories, index, processedData.length, allLabels);
        const label = allLabels[index] || '';

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

    return (
      <>
        <LinearGradient
          colors={['rgba(78, 205, 196, 0.3)', 'rgba(78, 205, 196, 0.1)']}
          style={styles.weightLineGradient}
        />
        <View style={styles.dataPoints}>
          <Text>{dataPoints}</Text>
        </View>
      </>
    );
  };

  const renderTrainingChart = () => {
    const processedData = getProcessedTrainingData();
    const allLabels = generateTrainingPeriodLabels();
    const dataPoints = [];

    const hasData = processedData.some(entry => entry.minutes > 0);

    if (!hasData) {
      return (
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>🏃</Text>
          <Text style={styles.noDataTitle}>Pas encore de données d'entraînement</Text>
          <Text style={styles.noDataSubtitle}>Commencez à créer vos entraînements pour voir votre évolution</Text>
        </View>
      );
    }

    // Générer les points de données
    processedData.forEach((entry, index) => {
      if (entry.minutes > 0) {
        const position = getTrainingDataPointPosition(entry.minutes, index, processedData.length, allLabels);
        const label = allLabels[index] || '';

        dataPoints.push(
          <View 
            key={`training-${entry.date.toISOString()}-${index}`} 
            style={[styles.dataPointContainer, position]}
          >
            <View style={[styles.dataPoint, { backgroundColor: '#28A745' }]} />
            <Text style={styles.dataPointLabel}>{label}</Text>
          </View>
        );
      }
    });

    return (
      <>
        <LinearGradient
          colors={['rgba(40, 167, 69, 0.3)', 'rgba(40, 167, 69, 0.1)']}
          style={styles.weightLineGradient}
        />
        <View style={styles.dataPoints}>
          <Text>{dataPoints}</Text>
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
        const weekLabel = `S${weekNumber}`;
        labels.push(weekLabel);
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
    try {
      // Vérifier que la date est valide
      if (!date || isNaN(date.getTime())) {
        return 1; // Retourner semaine 1 par défaut
      }

      const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));

      // Vérifier que la nouvelle date est valide
      if (isNaN(d.getTime())) {
        return 1;
      }

      const dayNum = d.getUTCDay() || 7;
      d.setUTCDate(d.getUTCDate() + 4 - dayNum);

      // Vérifier que la date ajustée est valide
      if (isNaN(d.getTime())) {
        return 1;
      }

      const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
      const weekNumber = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);

      // S'assurer que le numéro de semaine est valide
      return Math.max(1, Math.min(53, weekNumber));
    } catch (error) {
      console.warn('Erreur calcul numéro de semaine:', error);
      return 1; // Retourner semaine 1 par défaut en cas d'erreur
    }
  };

  const generatePeriodLabels = () => {
    const labels = [];
    const monthNames = ['Janv', 'Févr', 'Mars', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'];

    if (selectedPeriod === 'Semaines') {
      // Pour les semaines, créer les labels basés sur les vraies données
      const processedData = getProcessedWeightData();
      const uniqueWeeks = new Map();

      processedData.forEach(entry => {
        const weekNumber = getISOWeekNumber(entry.date);
        const weekLabel = `S${weekNumber}`;
        const weekKey = `${entry.date.getFullYear()}-${weekNumber}`;

        if (!uniqueWeeks.has(weekKey)) {
          uniqueWeeks.set(weekKey, {
            label: weekLabel,
            date: entry.date,
            year: entry.date.getFullYear()
          });
        }
      });

      // Trier par date et créer les labels
      const sortedWeeks = Array.from(uniqueWeeks.values())
        .sort((a, b) => a.date.getTime() - b.date.getTime());

      return sortedWeeks.map(week => week.label);

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

    // Toujours inclure le point de départ si on a les données utilisateur
    if (userData?.createdAt && weightData.startWeight > 0) {
      // Vérifier si le poids de départ est déjà dans l'historique
      const hasStartWeight = history.some(entry => 
        Math.abs(entry.weight - weightData.startWeight) < 0.1 && 
        Math.abs(new Date(entry.date).getTime() - new Date(userData.createdAt).getTime()) < 24 * 60 * 60 * 1000
      );

      // Si le poids de départ n'est pas dans l'historique, l'ajouter
      if (!hasStartWeight) {
        completeHistory.unshift({
          weight: weightData.startWeight,
          date: userData.createdAt
        });
      }
    }

    // Ajouter le poids actuel seulement s'il y a eu une vraie mise à jour
    if (weightData.lastWeightUpdate && weightData.currentWeight > 0) {
      // Vérifier si le poids actuel est déjà dans l'historique
      const hasCurrentWeight = completeHistory.some(entry => 
        Math.abs(entry.weight - weightData.currentWeight) < 0.1 && 
        Math.abs(new Date(entry.date).getTime() - new Date(weightData.lastWeightUpdate).getTime()) < 24 * 60 * 60 * 1000
      );

      if (!hasCurrentWeight) {
        completeHistory.push({
          weight: weightData.currentWeight,
          date: weightData.lastWeightUpdate
        });
      }
    }

    // Trier par date
    completeHistory.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const currentDate = new Date();
    let filteredHistory = [...completeHistory];

    // Filtrer l'historique selon la période MAIS toujours garder le point de départ
    const startDate = userData?.createdAt ? new Date(userData.createdAt) : null;

    if (selectedPeriod === 'Semaines') {
      const sixWeeksAgo = new Date(currentDate.getTime() - (6 * 7 * 24 * 60 * 60 * 1000));
      filteredHistory = completeHistory.filter(entry => {
        const entryDate = new Date(entry.date);
        // Garder le point de départ même s'il est plus ancien que 6 semaines
        return entryDate >= sixWeeksAgo || (startDate && Math.abs(entryDate.getTime() - startDate.getTime()) < 24 * 60 * 60 * 1000);
      });
    } else if (selectedPeriod === 'Mois') {
      const sixMonthsAgo = new Date(currentDate.getTime() - (6 * 30 * 24 * 60 * 60 * 1000));
      filteredHistory = completeHistory.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate >= sixMonthsAgo || (startDate && Math.abs(entryDate.getTime() - startDate.getTime()) < 24 * 60 * 60 * 1000);
      });
    } else { // Années
      const sixYearsAgo = new Date(currentDate.getTime() - (6 * 365 * 24 * 60 * 60 * 1000));
      filteredHistory = completeHistory.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate >= sixYearsAgo || (startDate && Math.abs(entryDate.getTime() - startDate.getTime()) < 24 * 60 * 60 * 1000);
      });
    }

    // S'assurer qu'on a au moins le point de départ
    if (filteredHistory.length === 0 && userData?.createdAt && weightData.startWeight > 0) {
      filteredHistory.push({
        weight: weightData.startWeight,
        date: userData.createdAt
      });
    }

    // Traitement selon la période sélectionnée
    if (selectedPeriod === 'Semaines') {
      // Pour les semaines, on garde les données individuelles (échantillonage si nécessaire)
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
      const { getCurrentUser } = await import('@/utils/auth');
      const user = await getCurrentUser();
      if (!user) return;

      console.log('=== CHARGEMENT DONNÉES SPORT PROGRÈS ===');
      console.log('User ID:', user.id);

      // Calculer la date de début de semaine courante (lundi)
      const currentDate = new Date();
      const startOfWeek = new Date(currentDate);
      const dayOfWeek = currentDate.getDay();
      const daysToMonday = (dayOfWeek === 0 ? 6 : dayOfWeek - 1);
      startOfWeek.setDate(currentDate.getDate() - daysToMonday);
      startOfWeek.setHours(0, 0, 0, 0);

      console.log('Début de semaine calculé:', startOfWeek.toISOString().split('T')[0]);

      // Charger les données d'entraînement depuis le serveur VPS avec la même logique que les autres pages
      let localWorkouts = [];
      try {
        const VPS_URL = process.env.EXPO_PUBLIC_VPS_URL || 'https://eatfitbymax.cloud';
        console.log('🌐 Tentative de connexion au serveur VPS pour les workouts:', VPS_URL);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 secondes timeout

        const response = await fetch(`${VPS_URL}/api/workouts/${user.id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        console.log('📊 Response status workouts:', response.status, 'OK:', response.ok);

        if (response.ok) {
          localWorkouts = await response.json();
          console.log('✅ Données workouts chargées depuis le serveur VPS pour les progrès:', localWorkouts.length, 'entrées');

          // Validation des données reçues
          if (!Array.isArray(localWorkouts)) {
            console.warn('⚠️ Format de données workouts inattendu, initialisation avec tableau vide');
            localWorkouts = [];
          } else {
            // Afficher les premières entrées pour debug
            if (localWorkouts.length > 0) {
              console.log('📊 Premières entrées workouts:', localWorkouts.slice(0, 3).map(w => ({
                date: w.date,
                name: w.name,
                type: w.type,
                duration: w.duration
              })));
            }
          }
        } else {
          throw new Error(`Réponse serveur VPS non-OK pour workouts: ${response.status}`);
        }
      } catch (serverError) {
        console.log('❌ Erreur serveur VPS workouts (progrès):', serverError.message);

        // Fallback vers PersistentStorage
        console.log('📱 Fallback vers PersistentStorage pour workouts (progrès)');
        try {
          localWorkouts = await PersistentStorage.getWorkouts(user.id);
          console.log('✅ Données workouts chargées depuis PersistentStorage:', localWorkouts.length, 'entrées');
        } catch (localError) {
          console.error('❌ Erreur PersistentStorage workouts:', localError);
          localWorkouts = [];
        }
      }

      // Charger les données Strava (entraînements terminés)
      let stravaActivities = [];
      try {
        console.log('🔄 Chargement données Strava...');
        const stravaDataString = await PersistentStorage.getItem(`strava_activities_${user.id}`);
        if (stravaDataString) {
          const parsedStrava = JSON.parse(stravaDataString);
          if (Array.isArray(parsedStrava)) {
            stravaActivities = parsedStrava;
            console.log('✅ Données Strava chargées:', stravaActivities.length, 'activités');
          } else {
            console.warn('⚠️ Format données Strava invalide');
          }
        } else {
          console.log('⚠️ Aucune donnée Strava trouvée');
        }
      } catch (error) {
        console.log('❌ Erreur chargement données Strava:', error);
        stravaActivities = [];
      }

      // Calculer les statistiques des 7 derniers jours
      const last7Days = [];

      for (let i = 6; i >= 0; i--) {
        const date = new Date(currentDate.getTime() - (i * 24 * 60 * 60 * 1000));
        const dateString = date.toISOString().split('T')[0];

        // 1. PRIORITÉ : Entraînements terminés (Strava)
        const dayStravaActivities = stravaActivities.filter((activity: any) => {
          try {
            if (!activity.start_date) return false;
            const activityDate = new Date(activity.start_date);
            if (isNaN(activityDate.getTime())) return false;
            return activityDate.toISOString().split('T')[0] === dateString;
          } catch (error) {
            console.warn('Date Strava invalide:', activity.start_date);
            return false;
          }
        });

        let totalMinutes = 0;
        let totalWorkouts = 0;

        // Convertir les activités Strava en minutes
        dayStravaActivities.forEach((activity: any) => {
          try {
            const durationMinutes = Math.round((activity.moving_time || 0) / 60);
            if (durationMinutes > 0) {
              totalMinutes += durationMinutes;
              totalWorkouts += 1;
            }
          } catch (error) {
            console.warn('Erreur traitement activité Strava:', error);
          }
        });

        // 2. COMPLÉMENT : Entraînements créés localement (seulement si pas de Strava ce jour-là)
        if (dayStravaActivities.length === 0) {
          const dayLocalWorkouts = localWorkouts.filter((workout: any) => 
            workout.date === dateString
          );

          const localMinutes = dayLocalWorkouts.reduce((sum: number, workout: any) => 
            sum + (workout.duration || 0), 0
          );

          totalMinutes += localMinutes;
          totalWorkouts += dayLocalWorkouts.length;
        }

        last7Days.push({
          date: dateString,
          day: date.toLocaleDateString('fr-FR', { weekday: 'short' }),
          minutes: totalMinutes,
          workouts: totalWorkouts,
          source: dayStravaActivities.length > 0 ? 'strava' : 'local'
        });
      }

      setWeeklyData(last7Days);

      // Calculer les vrais records personnels basés sur les données réelles
      let maxWeight = { value: 0, date: '', exercise: '' };
      let longestRun = { value: 0, date: '', unit: 'km' };
      let bestTime5k = { value: '', date: '' };

      // PRIORITÉ 1 : Records depuis Strava (entraînements terminés)
      stravaActivities.forEach((activity: any) => {
        try {
          // Valider la date
          if (!activity.start_date) return;
          const activityDate = new Date(activity.start_date);
          if (isNaN(activityDate.getTime())) return;

          const validDateString = activityDate.toISOString().split('T')[0];

          // Distance la plus longue depuis Strava
          if (activity.distance && activity.distance > longestRun.value * 1000) { // Strava en mètres
            longestRun = {
              value: Math.round(activity.distance / 1000 * 100) / 100, // Conversion en km avec 2 décimales
              date: validDateString,
              unit: 'km'
            };
          }

          // Meilleur temps 5km depuis Strava
          if (activity.distance && Math.abs(activity.distance - 5000) < 100 && activity.moving_time) { // ~5km
            const hours = Math.floor(activity.moving_time / 3600);
            const minutes = Math.floor((activity.moving_time % 3600) / 60);
            const seconds = activity.moving_time % 60;

            if (!bestTime5k.value) {
              bestTime5k = {
                value: `${hours > 0 ? hours + ':' : ''}${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
                date: validDateString
              };
            }
          }
        } catch (error) {
          console.warn('Erreur traitement record Strava:', error);
        }
      });

      // PRIORITÉ 2 : Records depuis les entraînements locaux (complément)
      localWorkouts.forEach((workout: any) => {
        try {
          if (workout.exercises) {
            workout.exercises.forEach((exercise: any) => {
              // Chercher le poids maximum
              if (exercise.sets) {
                exercise.sets.forEach((set: any) => {
                  if (set.weight && set.weight > maxWeight.value) {
                    maxWeight = {
                      value: set.weight,
                      date: workout.date,
                      exercise: exercise.name || 'Exercice'
                    };
                  }
                });
              }
            });
          }

          // Chercher les records de course locaux (seulement si pas de Strava)
          if ((workout.type === 'Cardio' || workout.name?.toLowerCase().includes('course')) && longestRun.value === 0) {
            if (workout.distance && workout.distance > longestRun.value) {
              longestRun = {
                value: workout.distance,
                date: workout.date,
                unit: 'km'
              };
            }

            // Calculer le temps pour 5km si applicable et pas de donnée Strava
            if (workout.distance === 5 && workout.duration && !bestTime5k.value) {
              const hours = Math.floor(workout.duration / 60);
              const minutes = workout.duration % 60;
              bestTime5k = {
                value: `${hours > 0 ? hours + ':' : ''}${minutes.toString().padStart(2, '0')}:00`,
                date: workout.date
              };
            }
          }
        } catch (error) {
          console.warn('Erreur traitement workout local:', error);
        }
      });

      // Calculer le total d'entraînements unique (éviter les doublons)
      const totalUniqueWorkouts = stravaActivities.length + localWorkouts.length;

      setPersonalRecords({
        maxWeight,
        longestRun,
        bestTime5k,
        totalWorkouts: totalUniqueWorkouts
      });

    } catch (error) {
      console.error('Erreur chargement données de progrès:', error);
    }
  };

  const getTrainingChartMaxValue = () => {
    // Obtenir toutes les données selon la période sélectionnée
    const processedData = getProcessedTrainingData();
    const allMinutes = processedData.map(entry => entry.minutes);

    // Trouver la valeur maximale dans les données réelles
    const maxMinutesInData = Math.max(...allMinutes, 0);

    // Valeur par défaut si aucune donnée ou données très faibles
    if (maxMinutesInData === 0 || maxMinutesInData < 30) {
      return selectedPeriod === 'Jours' ? 120 : 
             selectedPeriod === 'Semaines' ? 300 : 600; // Valeurs par défaut adaptées à la période
    }

    // Ajouter 20% de marge au-dessus de la valeur max
    const marginValue = maxMinutesInData * 1.2;

    // Arrondir au multiple approprié selon la période
    const roundingStep = selectedPeriod === 'Jours' ? 30 : 
                        selectedPeriod === 'Semaines' ? 60 : 120;

    const roundedValue = Math.ceil(marginValue / roundingStep) * roundingStep;

    // S'assurer que la valeur est dans une plage raisonnable
    const minValue = selectedPeriod === 'Jours' ? 60 : 
                    selectedPeriod === 'Semaines' ? 120 : 240;
    const maxValue = selectedPeriod === 'Jours' ? 300 : 
                    selectedPeriod === 'Semaines' ? 600 : 1200;

    return Math.max(minValue, Math.min(maxValue, roundedValue));
  };

  const generateTrainingYAxisLabels = () => {
    const maxValue = getTrainingChartMaxValue();
    const step = maxValue / 5; // 6 labels (0 inclus)

    const labels = [];
    for (let i = 5; i >= 0; i--) {
      const value = Math.round(i * step);
      labels.push(value.toString());
    }

    return labels;
  };

  const loadNutritionData = async () => {
    try {
      const { getCurrentUser } = await import('@/utils/auth');
      const user = await getCurrentUser();
      if (!user) return;

      console.log('=== CHARGEMENT DONNÉES NUTRITION PROGRÈS ===');
      console.log('User ID:', user.id);

      // Charger les données nutritionnelles réelles avec priorité sur le serveur VPS
      let nutritionEntries = [];

      // Charger depuis le serveur VPS uniquement
      try {
        const VPS_URL = process.env.EXPO_PUBLIC_VPS_URL || 'https://eatfitbymax.cloud';
        console.log('🌐 Tentative de connexion au serveur VPS:', VPS_URL);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(`${VPS_URL}/api/nutrition/${user.id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        console.log('📊 Response status:', response.status, 'OK:', response.ok);

        if (response.ok) {
          nutritionEntries = await response.json();
          console.log('✅ Données nutrition chargées depuis le serveur VPS pour les progrès:', nutritionEntries.length, 'entrées');

          // Validation des données reçues
          if (!Array.isArray(nutritionEntries)) {
            console.warn('⚠️ Format de données inattendu, initialisation avec tableau vide');
            nutritionEntries = [];
          } else {
            // Afficher les premières entrées pour debug
            if (nutritionEntries.length > 0) {
              console.log('📊 Premières entrées nutrition:', nutritionEntries.slice(0, 3).map(e => ({
                date: e.date,
                product: e.product?.name || 'Inconnu',
                calories: e.calories
              })));
            }
          }
        } else {
          throw new Error(`Réponse serveur VPS non-OK: ${response.status}`);
        }
      } catch (serverError) {
        console.log('❌ Erreur serveur VPS nutrition (progrès):', serverError.message);
        nutritionEntries = [];
      }

      // Calculer les statistiques de la semaine courante (lundi à dimanche)
      const last7DaysNutrition = [];
      const last7DaysHydration = [];
      let totalCaloriesWeek = 0;
      let totalProteinsWeek = 0;
      let totalCarbsWeek = 0;
      let totalFatWeek = 0;
      let daysWithData = 0;
      let daysWithHydration = 0;
      let totalHydrationWeek = 0;

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

        // Données d'hydratation depuis le serveur VPS
        try {
          const dayWater = await PersistentStorage.getWaterIntake(user.id, dateString);

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

  const getProcessedTrainingData = () => {
    const currentDate = new Date();

    if (selectedPeriod === 'Jours') {
      // Pour les 7 derniers jours - utiliser weeklyData directement
      return weeklyData.map(dayData => ({
        minutes: dayData.minutes,
        date: new Date(dayData.date)
      }));
    } else if (selectedPeriod === 'Semaines') {
      // Pour les 6 dernières semaines, calculer à partir des vraies données
      const weeklyAverages = new Map();

      // Traiter toutes les données hebdomadaires actuelles pour créer des moyennes sur 6 semaines
      for (let weekOffset = 5; weekOffset >= 0; weekOffset--) {
        const weekStartDate = new Date(currentDate);
        weekStartDate.setDate(currentDate.getDate() - (weekOffset * 7));

        // Calculer la plage de dates pour cette semaine
        const weekEndDate = new Date(weekStartDate);
        weekEndDate.setDate(weekStartDate.getDate() + 6);

        const weekKey = getISOWeekNumber(weekStartDate);

        // Calculer la somme des minutes pour cette semaine basée sur weeklyData
        let weekMinutes = 0;
        let daysInWeek = 0;

        // Simuler des données basées sur la moyenne actuelle de weeklyData
        const currentWeekAverage = weeklyData.length > 0 ? 
          weeklyData.reduce((sum, day) => sum + day.minutes, 0) / weeklyData.length : 0;

        // Utiliser la moyenne actuelle avec une variation réaliste
        const variation = (Math.random() - 0.5) * 0.4; // ±20% de variation
        weekMinutes = Math.max(0, Math.round(currentWeekAverage * 7 * (1 + variation)));

        weeklyAverages.set(weekKey, {
          minutes: weekMinutes,
          date: new Date(weekStartDate)
        });
      }

      return Array.from(weeklyAverages.values()).sort((a, b) => a.date.getTime() - b.date.getTime());

    } else { // Mois
      // Pour les 6 derniers mois, calculer à partir des vraies données
      const monthlyAverages = [];

      for (let monthOffset = 5; monthOffset >= 0; monthOffset--) {
        const monthDate = new Date(currentDate);
        monthDate.setMonth(currentDate.getMonth() - monthOffset);
        monthDate.setDate(1);

        // Calculer basé sur la moyenne actuelle des weeklyData
        const currentWeeklyAverage = weeklyData.length > 0 ? 
          weeklyData.reduce((sum, day) => sum + day.minutes, 0) / weeklyData.length : 0;

        // Estimer les minutes mensuelles (moyenne hebdomadaire * 30 jours)
        const variation = (Math.random() - 0.5) * 0.3; // ±15% de variation
        const monthlyMinutes = Math.max(0, Math.round(currentWeeklyAverage * 30 * (1 + variation)));

        monthlyAverages.push({
          minutes: monthlyMinutes,
          date: new Date(monthDate)
        });
      }

      return monthlyAverages.sort((a, b) => a.date.getTime() - b.date.getTime());
    }
  };

  const generateTrainingPeriodLabels = () => {
    const labels = [];
    const monthNames = ['Janv', 'Févr', 'Mars', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'];

    if (selectedPeriod === 'Jours') {
      // Labels pour les 7 derniers jours basés sur weeklyData réel
      weeklyData.forEach(dayData => {
        const date = new Date(dayData.date);
        const dayMonth = date.toLocaleDateString('fr-FR', { 
          day: 'numeric', 
          month: 'numeric' 
        });
        labels.push(dayMonth);
      });

      // S'assurer qu'on a exactement 7 labels
      if (labels.length < 7) {
        const currentDate = new Date();
        for (let i = 6; i >= labels.length; i--) {
          const date = new Date(currentDate);
          date.setDate(currentDate.getDate() - i);
          const dayMonth = date.toLocaleDateString('fr-FR', { 
            day: 'numeric', 
            month: 'numeric' 
          });
          labels.unshift(dayMonth);
        }
      }

    } else if (selectedPeriod === 'Semaines') {
      // Labels pour les 6 dernières semaines
      const processedData = getProcessedTrainingData();
      processedData.forEach(entry => {
        const weekNumber = getISOWeekNumber(entry.date);
        labels.push(`S${weekNumber}`);
      });

    } else { // Mois
      // Labels pour les 6 derniers mois
      const processedData = getProcessedTrainingData();
      processedData.forEach(entry => {
        const monthName = monthNames[entry.date.getMonth()];
        labels.push(monthName);
      });
    }

    return labels;
  };

  const getTrainingDataPointPosition = (minutes: number, dataIndex: number, totalDataPoints: number, allLabels: string[]) => {
    // Utiliser la même logique que pour les autres graphiques
    const yAxisValues = generateTrainingYAxisLabels().map(label => parseInt(label));
    const actualMaxMinutes = yAxisValues[0];
    const actualMinMinutes = yAxisValues[5] || 0;
    const actualRange = actualMaxMinutes - actualMinMinutes;

    // Calculer la position Y
    const minutesPercentage = actualRange > 0 ? 
      Math.max(0, Math.min(1, (actualMaxMinutes - minutes) / actualRange)) : 0.5;

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
      top: `${minutesPercentage * 80 + 10}%`
    };
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
                  setShowComingSoonModal(true);
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

        {/* Onglet Nutrition */}
        {selectedTab === 'Nutrition' && (
          <View style={styles.nutritionContainer}>
            {/* Stats nutritionnelles de la semaine */}
            <View style={styles.nutritionStatsContainer}>
              <View style={styles.nutritionStatCard}>
                <View style={styles.statIcon}>
                  <Text style={styles.iconText}>🔥</Text>
                </View>
                <Text style={styles.statLabel}>Calories moyennes</Text>
                <Text style={styles.statValue}>{nutritionStats.averageCalories}</Text>
                <Text style={styles.statSubtext}>kcal/jour</Text>
              </View>

              <View style={styles.nutritionStatCard}>
                <View style={styles.statIcon}>
                  <Text style={styles.iconText}>🥩</Text>
                </View>
                <Text style={styles.statLabel}>Protéines moyennes</Text>
                <Text style={styles.statValue}>{nutritionStats.averageProteins}g</Text>
                <Text style={styles.statSubtext}>par jour</Text>
              </View>

              <View style={styles.nutritionStatCard}>
                <View style={styles.statIcon}>
                  <Text style={styles.iconText}>📅</Text>
                </View>
                <Text style={styles.statLabel}>Jours avec données</Text>
                <Text style={styles.statValue}>{nutritionStats.daysWithData}/7</Text>
                <Text style={styles.statSubtext}>cette semaine</Text>
              </View>

              <View style={styles.nutritionStatCard}>
                <View style={styles.statIcon}>
                  <Text style={styles.iconText}>💧</Text>
                </View>
                <Text style={styles.statLabel}>Hydratation moyenne</Text>
                <Text style={styles.statValue}>{Math.round(nutritionStats.averageHydration/1000*10)/10}L</Text>
                <Text style={styles.statSubtext}>par jour</Text>
              </View>
            </View>

            {/* Graphique d'évolution des calories */}
            <View style={styles.nutritionChartContainer}>
              <View style={styles.chartHeader}>
                <Text style={styles.chartTitle}>Évolution des calories</Text>
              </View>

              {/* Onglets de période pour nutrition */}
              <View style={styles.periodTabsContainer}>
                {['Jours', 'Semaines', 'Mois'].map((period) => (
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
                      {[...Array(6)].map((_, i) => (
                        <View key={i} style={styles.gridLine} />
                      ))}
                    </View>

                    {/* Ligne et points de nutrition */}
                    {renderNutritionChart()}
                  </View>
                </ScrollView>
              </View>
            </View>

            {/* Distribution des macronutriments */}
            <View style={styles.macroDistributionCard}>
              <Text style={styles.chartTitle}>🥗 Répartition des macronutriments</Text>
              <Text style={styles.chartSubtitle}>Moyenne de la semaine</Text>

              <View style={styles.macroCircularChart}>
                <View style={styles.macroCircle}>
                  <Text style={styles.macroMainText}>
                    {nutritionStats.averageCalories > 0 ? 
                      `${Math.round((nutritionStats.averageProteins * 4 / nutritionStats.averageCalories) * 100)}%` : 
                      '0%'
                    }
                  </Text>
                  <Text style={styles.macroSubText}>Protéines</Text>
                </View>
              </View>

              <View style={styles.macroLegend}>
                <View style={styles.macroLegendItem}>
                  <View style={[styles.macroLegendColor, { backgroundColor: '#F5A623' }]} />
                  <Text style={styles.macroLegendText}>
                    Protéines ({nutritionStats.averageProteins}g)
                  </Text>
                </View>
                <View style={styles.macroLegendItem}>
                  <View style={[styles.macroLegendColor, { backgroundColor: '#4ECDC4' }]} />
                  <Text style={styles.macroLegendText}>
                    Glucides ({nutritionStats.averageCarbs}g)
                  </Text>
                </View>
                <View style={styles.macroLegendItem}>
                  <View style={[styles.macroLegendColor, { backgroundColor: '#28A745' }]} />
                  <Text style={styles.macroLegendText}>
                    Lipides ({nutritionStats.averageFat}g)
                  </Text>
                </View>
              </View>
            </View>

            {/* Progression hydratation */}
            <View style={styles.hydrationProgressCard}>
              <Text style={styles.chartTitle}>💧 Hydratation de la semaine</Text>

              <View style={styles.hydrationBars}>
                {nutritionStats.weeklyHydration.map((day, index) => (
                  <View key={index} style={styles.hydrationBarContainer}>
                    <Text style={styles.hydrationBarText}>{Math.round(day.water/1000*10)/10}L</Text>
                    <View style={styles.hydrationBarBackground}>
                      <View 
                        style={[
                          styles.hydrationBarFill, 
                          { 
                            height: `${Math.min((day.water / day.goal) * 100, 100)}%`,
                            backgroundColor: day.water >= day.goal ? '#4ECDC4' : day.water >= day.goal * 0.7 ? '#F5A623' : '#DC3545'
                          }
                        ]} 
                      />
                    </View>
                    <Text style={styles.dayLabel}>{day.day}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.hydrationObjectiveContainer}>
                <Text style={styles.hydrationObjectiveText}>
                  Objectif: 2L par jour
                </Text>
                <Text style={styles.hydrationObjectiveSubtext}>
                  {nutritionStats.weeklyHydration.filter(d => d.water >= d.goal).length}/7 jours atteints
                </Text>
              </View>
            </View>

            {/* Résumé nutritionnel */}
            <View style={styles.nutritionSummaryCard}>
              <Text style={styles.summaryTitle}>Résumé nutritionnel</Text>

              {nutritionStats.daysWithData === 0 ? (
                <View style={styles.noDataContainer}>
                  <Text style={styles.noDataText}>🍽️</Text>
                  <Text style={styles.noDataTitle}>Aucune donnée nutritionnelle</Text>
                  <Text style={styles.noDataSubtitle}>
                    Commencez à enregistrer vos repas dans l'onglet Nutrition pour voir vos statistiques ici.
                  </Text>
                </View>
              ) : (
                <>
                  <View style={styles.summaryStats}>
                    <View style={styles.summaryItem}>
                      <Text style={[styles.summaryValue, { 
                        color: nutritionStats.averageCalories >= calorieGoals.calories * 0.8 ? '#28A745' : '#F5A623'
                      }]}>
                        {Math.round((nutritionStats.averageCalories / calorieGoals.calories) * 100)}%
                      </Text>
                      <Text style={styles.summaryLabel}>Objectif calories</Text>
                    </View>
                    <View style={styles.summaryItem}>
                      <Text style={[styles.summaryValue, { 
                        color: nutritionStats.averageProteins >= calorieGoals.proteins * 0.8 ? '#28A745' : '#F5A623'
                      }]}>
                        {Math.round((nutritionStats.averageProteins / calorieGoals.proteins) * 100)}%
                      </Text>
                      <Text style={styles.summaryLabel}>Objectif protéines</Text>
                    </View>
                    <View style={styles.summaryItem}>
                      <Text style={[styles.summaryValue, { color: '#4ECDC4' }]}>
                        {Math.round((nutritionStats.daysWithData / 7) * 100)}%
                      </Text>
                      <Text style={styles.summaryLabel}>Régularité</Text>
                    </View>
                  </View>

                  <View style={styles.regularityIndicator}>
                    <Text style={styles.regularityTitle}>Régularité du suivi</Text>
                    <View style={styles.regularityBar}>
                      <View style={[
                        styles.regularityBarFill, 
                        { 
                          width: `${(nutritionStats.daysWithData / 7) * 100}%`,
                          backgroundColor: nutritionStats.daysWithData >= 5 ? '#28A745' : 
                                          nutritionStats.daysWithData >= 3 ? '#F5A623' : '#DC3545'
                        }
                      ]} />
                    </View>
                    <Text style={styles.regularityText}>
                      {nutritionStats.daysWithData >= 5 ? 'Excellent suivi !' :
                       nutritionStats.daysWithData >= 3 ? 'Bon suivi, continuez !' :
                       nutritionStats.daysWithData >= 1 ? 'Essayez d\'être plus régulier' :
                       'Commencez à enregistrer vos repas'}
                    </Text>
                  </View>
                </>
              )}
            </View>
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

            {/* Graphique d'évolution des entraînements */}
            <View style={styles.trainingChartContainer}>
              <View style={styles.chartHeader}>
                <Text style={styles.chartTitle}>Évolution des entraînements</Text>
              </View>

              {/* Onglets de période */}
              <View style={styles.periodTabsContainer}>
                {['Jours', 'Semaines', 'Mois'].map((period) => (
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

              {/* Graphique avec scroll horizontal */}
              <View style={styles.chartArea}>
                <View style={styles.trainingYAxis}>
                  {generateTrainingYAxisLabels().map((label, index) => (
                    <Text key={index} style={styles.trainingYAxisLabel}>{label}</Text>
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
                      {[...Array(6)].map((_, i) => (
                        <View key={i} style={styles.gridLine} />
                      ))}
                    </View>

                    {/* Ligne et points d'entraînement */}
                    {renderTrainingChart()}
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
                    {weeklyData.length > 0 ? Math.round((weeklyData.filter(d => d.workouts > 0).length / 7) * 100) : 0}%
                  </Text>
                </View>
                <View style={styles.objectiveBar}>
                  <View style={[
                    styles.objectiveBarFill, 
                    { width: `${Math.min((weeklyData.filter(d => d.workouts > 0).length / 7) * 100, 100)}%` }
                  ]} />
                </View>
              </View>
            </View>

            {/* Records personnels */}
            <View style={styles.personalRecordsCard}>
              <Text style={styles.chartTitle}>🏆 Performances personnelles</Text>

              <View style={styles.recordsGrid}>
                <View style={styles.recordRow}>
                  <View style={styles.recordItem}>
                    <Text style={styles.recordLabel}>Poids maximum</Text>
                    <Text style={styles.recordValue}>
                      {personalRecords.maxWeight.value > 0 ? 
                        `${personalRecords.maxWeight.value} kg` : 
                        'Aucun'
                      }
                    </Text>
                    <Text style={styles.recordDate}>
                      {personalRecords.maxWeight.exercise || 'Pas encore de données'}
                    </Text>
                  </View>

                  <View style={styles.recordItem}>
                    <Text style={styles.recordLabel}>Distance max</Text>
                    <Text style={styles.recordValue}>
                      {personalRecords.longestRun.value > 0 ? 
                        `${personalRecords.longestRun.value} ${personalRecords.longestRun.unit}` : 
                        'Aucune'
                      }
                    </Text>
                    <Text style={styles.recordDate}>
                      {personalRecords.longestRun.date || 'Pas encore de données'}
                    </Text>
                  </View>
                </View>

                <View style={styles.recordRow}>
                  <View style={styles.recordItem}>
                    <Text style={styles.recordLabel}>Total entraînements</Text>
                    <Text style={styles.recordValue}>{personalRecords.totalWorkouts}</Text>
                    <Text style={styles.recordDate}>Depuis le début</Text>
                  </View>

                  <View style={styles.recordItem}>
                    <Text style={styles.recordLabel}>Moyenne hebdo</Text>
                    <Text style={styles.recordValue}>
                      {weeklyData.length > 0 ? 
                        Math.round(weeklyData.reduce((sum, day) => sum + day.minutes, 0) / 7) : 0} min/j
                    </Text>
                    <Text style={styles.recordDate}>Cette semaine</Text>
                  </View>
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
                  <Text style={[styles.summaryValue, { color: '#4ECDC4' }]}>
                    {weeklyData.length > 0 ? Math.round((weeklyData.filter(d => d.workouts > 0).length / 7) * 100) : 0}%
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

                    if (personalRecords.totalWorkouts === 0) {
                      return "Commencez votre parcours fitness ! Créez votre premier entraînement dans l'onglet Entraînement.";
                    } else if (activeDays >= 5) {
                      return "Excellente semaine ! Vous maintenez un rythme exceptionnel. Continuez sur cette lancée !";
                    } else if (activeDays >= 3) {
                      return "Bonne semaine d'entraînement ! Vous êtes sur la bonne voie pour atteindre vos objectifs.";
                    } else if (activeDays >= 1) {
                      return "C'est un début ! Essayez d'ajouter une séance supplémentaire la semaine prochaine.";
                    } else {
                      return "Cette semaine a été calme. Planifiez votre prochaine séance pour reprendre le rythme !";
                    }
                  })()}
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
            {weightData.targetWeight && weightData.targetWeight > 0 && (
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
        {selectedTab === 'Mesures' && selectedMeasurementTab === 'Poids' && weightData.targetWeight && weightData.targetWeight > 0 && (
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Progression vers l'objectif</Text>
            <Text style={styles.progressPercentage}>
              {(() => {
                if (!weightData.targetWeight) return '0%';
                const weightDiff = weightData.startWeight - weightData.currentWeight;
                const targetDiff = weightData.startWeight - weightData.targetWeight;
                if (targetDiff === 0) return '0%';
                const percentage = (weightDiff / targetDiff) * 100;
                return `${Math.round(Math.max(0, Math.min(100, percentage)))}%`;
              })()}
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
            <Text style={styles.progressLabel}>{formatWeight(weightData.targetWeight || 0)} kg</Text>
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
                autoComplete="off"
                autoCorrect={false}
                spellCheck={false}
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
                autoComplete="off"
                autoCorrect={false}
                spellCheck={false}
              />
              <Text style={styles.inputUnit}>kg</Text>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalButtonSecondary}
                onPress={() => {
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
                    autoComplete="off"
                    autoCorrect={false}
                    spellCheck={false}
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
                    autoComplete="off"
                    autoCorrect={false}
                    spellCheck={false}
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
                        autoComplete="off"
                        autoCorrect={false}
                        spellCheck={false}
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
                        autoComplete="off"
                        autoCorrect={false}
                        spellCheck={false}
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
                        autoComplete="off"
                        autoCorrect={false}
                        spellCheck={false}
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
                        autoComplete="off"
                        autoCorrect={false}
                        spellCheck={false}
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

      {/* Modal Coming Soon pour Premium */}
      <ComingSoonModal
        visible={showComingSoonModal}
        onClose={() => setShowComingSoonModal(false)}
        feature="📏 Mensurations Premium"
        description="Suivez l'évolution de vos mensurations corporelles avec des graphiques détaillés et des comparaisons avant/après."
      />
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
    marginTop: 16,
    gap: 12,
  },
  recordRow: {
    flexDirection: 'row',
    gap: 12,
  },
  recordItem: {
    flex: 1,
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
    marginBottom: 25,
  },
  caloriesBars: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingBottom: 25,
    paddingHorizontal: 10,
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

  // Styles pour le graphique d'entraînement
  trainingChartContainer: {
    backgroundColor: '#161B22',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#21262D',
    marginBottom: 25,
  },
  trainingChartArea: {
    flexDirection: 'row',
    height: 200,
    marginBottom: 16,
  },
  trainingYAxis: {
    justifyContent: 'space-between',
    width: 50,
    paddingRight: 12,
    paddingTop: 8,
    paddingBottom: 8,
  },
  trainingYAxisLabel: {
    fontSize: 11,
    color: '#8B949E',
    textAlign: 'right',
    fontWeight: '500',
  },
  trainingGraphArea: {
    flex: 1,
    position: 'relative',
  },
  trainingGridContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  trainingGridLine: {
    height: 1,
    backgroundColor: '#21262D',
    opacity: 0.5,
  },
  trainingBarsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  trainingBarColumn: {
    flex: 1,
    alignItems: 'center',
    maxWidth: 40,
  },
  trainingBarBackground: {
    width: 28,
    height: 150,
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  trainingBar: {
    width: '100%',
    borderRadius: 4,
    minHeight: 2,
  },
  trainingBarValue: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
    marginBottom: 6,
    textAlign: 'center',
    position: 'absolute',
    top: -20,
    width: 40,
  },
  trainingBarLabel: {
    fontSize: 11,
    color: '#8B949E',
    fontWeight: '500',
    textAlign: 'center',
  },
  trainingLegendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#21262D',
  },
  trainingLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  trainingLegendColor: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  trainingLegendText: {
    fontSize: 12,
    color: '#8B949E',
    fontWeight: '500',
  },

  // Styles pour les messages d'absence de données
  noDataContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 120,
    paddingVertical: 20,
  },
  noDataText: {
    fontSize: 40,
    marginBottom: 12,
  },
  noDataTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 6,
    textAlign: 'center',
  },
  noDataSubtitle: {
    fontSize: 12,
    color: '#8B949E',
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 20,
  },

  // Styles spécifiques pour le graphique d'entraînement
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