import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Dimensions, Modal, Alert } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import FoodSearchModal from '@/components/FoodSearchModal';
import { FoodProduct, OpenFoodFactsService, FoodEntry } from '@/utils/openfoodfacts';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentUser } from '@/utils/auth';

const { width } = Dimensions.get('window');

function NutritionScreen() {
  const [selectedTab, setSelectedTab] = useState('Journal');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [hasNutritionProgram, setHasNutritionProgram] = useState(false); // Assuming default is no access
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showFoodModal, setShowFoodModal] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState<string>('');
  const [foodEntries, setFoodEntries] = useState<FoodEntry[]>([]);
  const [dailyTotals, setDailyTotals] = useState({
    calories: 0,
    proteins: 0,
    carbohydrates: 0,
    fat: 0,
  });
  const [calorieGoals, setCalorieGoals] = useState({
    calories: 2495,
    proteins: 125,
    carbohydrates: 312,
    fat: 83,
  });
  const [waterIntake, setWaterIntake] = useState(0); // en ml
  const [dailyWaterGoal, setDailyWaterGoal] = useState(2000); // objectif de base en ml

  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    };
    return date.toLocaleDateString('fr-FR', options);
  };

  const calculateDailyWaterGoal = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) return 2000;

      // Calcul de base personnalisé selon le poids et l'âge
      let baseGoal = 2000; // Valeur par défaut
      
      if (user.weight && user.age) {
        // Formule: 35ml par kg de poids corporel + ajustement selon l'âge
        baseGoal = user.weight * 35;
        
        // Ajustement selon l'âge (les personnes âgées ont besoin de plus d'hydratation)
        if (user.age > 65) {
          baseGoal += 300; // +300ml pour les seniors
        } else if (user.age > 50) {
          baseGoal += 200; // +200ml pour les 50-65 ans
        }
        
        // Arrondir au supérieur à la centaine la plus proche
        baseGoal = Math.ceil(baseGoal / 100) * 100;
      }
      
      // Récupérer les entraînements du jour
      const dateString = selectedDate.toISOString().split('T')[0];
      const workoutsStored = await AsyncStorage.getItem(`workouts_${user.id}`);
      
      if (workoutsStored) {
        const workouts = JSON.parse(workoutsStored);
        const dayWorkouts = workouts.filter((workout: any) => {
          const workoutDate = new Date(workout.date).toISOString().split('T')[0];
          return workoutDate === dateString;
        });

        // Ajouter 500ml par séance d'entraînement
        dayWorkouts.forEach((workout: any) => {
          baseGoal += 500;
          
          // Ajouter 250ml supplémentaires si période chaude (été ou température élevée)
          const currentMonth = new Date().getMonth(); // 0 = janvier, 11 = décembre
          const isSummerPeriod = currentMonth >= 5 && currentMonth <= 8; // Juin à septembre
          
          if (isSummerPeriod) {
            baseGoal += 250;
          }
          
          console.log(`Séance "${workout.name}" ajoutée: +${isSummerPeriod ? 750 : 500}ml`);
        });
        
        if (dayWorkouts.length > 0) {
          console.log(`${dayWorkouts.length} séance(s) d'entraînement détectée(s) le ${dateString}`);
        }
      }

      // Arrondir au supérieur à la centaine la plus proche
      const finalGoal = Math.ceil(baseGoal / 100) * 100;
      console.log(`Objectif hydratation calculé: ${finalGoal}ml (base: ${Math.ceil((user.weight * 35) / 100) * 100}ml)`);
      
      return finalGoal;
    } catch (error) {
      console.error('Erreur calcul objectif hydratation:', error);
      return 2000;
    }
  };

  const calculatePersonalizedGoals = async (user: any) => {
    if (!user || !user.age || !user.weight || !user.height || !user.gender) {
      return {
        calories: 2495,
        proteins: 125,
        carbohydrates: 312,
        fat: 83,
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

    // Vérifier s'il y a un entraînement programmé le jour sélectionné
    try {
      const dateString = selectedDate.toISOString().split('T')[0];
      const workoutsStored = await AsyncStorage.getItem(`workouts_${user.id}`);
      
      if (workoutsStored) {
        const workouts = JSON.parse(workoutsStored);
        const hasWorkoutToday = workouts.some((workout: any) => {
          const workoutDate = new Date(workout.date).toISOString().split('T')[0];
          return workoutDate === dateString;
        });

        if (hasWorkoutToday) {
          // Ajouter 150 kcal pour le premier entraînement + 50 kcal par séance supplémentaire
          const workoutCount = workouts.filter((workout: any) => {
            const workoutDate = new Date(workout.date).toISOString().split('T')[0];
            return workoutDate === dateString;
          }).length;
          
          const bonusCalories = 150 + (workoutCount - 1) * 50;
          totalCalories += bonusCalories;
          console.log(`${workoutCount} entraînement(s) détecté(s) le ${dateString} - Ajout de ${bonusCalories} kcal`);
        }
      }
    } catch (error) {
      console.error('Erreur vérification entraînements:', error);
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

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 1);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setSelectedDate(newDate);
  };

  const isToday = () => {
    const today = new Date();
    return selectedDate.toDateString() === today.toDateString();
  };

  const handleTabPress = (tabName: string) => {
    if (tabName === 'Programme' && !hasNutritionProgram) {
      setShowSubscriptionModal(true);
    } else {
      setSelectedTab(tabName);
    }
  };

  const handleAddFood = (mealType: string) => {
    setSelectedMealType(mealType);
    setShowFoodModal(true);
  };

  const handleFoodAdded = async (product: FoodProduct, quantity: number) => {
    try {
      console.log('=== Début ajout aliment ===');
      console.log('Produit:', product?.name);
      console.log('Quantité:', quantity);
      console.log('Type de repas:', selectedMealType);

      const user = await getCurrentUser();
      if (!user) {
        console.log('Erreur: Utilisateur non connecté');
        Alert.alert('Erreur', 'Utilisateur non connecté');
        setShowFoodModal(false);
        return;
      }

      // Vérifier que le produit et la quantité sont valides
      if (!product || !product.name || quantity <= 0) {
        console.log('Erreur: Produit ou quantité invalide');
        Alert.alert('Erreur', 'Produit ou quantité invalide');
        setShowFoodModal(false);
        return;
      }

      console.log('Calcul nutrition...');
      const nutrition = OpenFoodFactsService.calculateNutrition(product, quantity);
      console.log('Nutrition calculée:', nutrition);

      const newEntry: FoodEntry = {
        id: Date.now().toString(),
        product,
        quantity,
        mealType: selectedMealType as any,
        date: selectedDate.toISOString().split('T')[0],
        calories: nutrition.calories || 0,
        proteins: nutrition.proteins || 0,
        carbohydrates: nutrition.carbohydrates || 0,
        fat: nutrition.fat || 0,
      };

      console.log('Nouvelle entrée créée:', newEntry);

      const updatedEntries = [...foodEntries, newEntry];
      setFoodEntries(updatedEntries);

      // Sauvegarder localement et sur le serveur
      try {
        // Toujours sauvegarder en local d'abord
        await AsyncStorage.setItem(`food_entries_${user.id}`, JSON.stringify(updatedEntries));
        console.log('Sauvegarde locale réussie');

        // Sauvegarder sur le serveur VPS
        try {
          const VPS_URL = process.env.EXPO_PUBLIC_VPS_URL || 'https://eatfitbymax.replit.app';
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 secondes timeout

          const response = await fetch(`${VPS_URL}/api/nutrition/${user.id}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(updatedEntries),
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (response.ok) {
            console.log('Données nutrition sauvegardées sur le serveur VPS');
          } else {
            console.warn('Échec sauvegarde nutrition sur serveur VPS, données conservées localement');
          }
        } catch (serverError) {
          console.warn('Erreur serveur nutrition:', serverError);
          console.log('Les données nutrition restent disponibles localement');
        }
      } catch (storageError) {
        console.error('Erreur sauvegarde nutrition:', storageError);
        Alert.alert('Erreur', 'Impossible de sauvegarder les données nutrition');
        return;
      }

      // Recalculer les totaux
      calculateDailyTotals(updatedEntries);

      // Fermer la modal en premier
      setShowFoodModal(false);
      
      // Puis afficher le message de succès
      setTimeout(() => {
        Alert.alert('Succès', `${product.name || 'Aliment'} ajouté à ${selectedMealType}`);
      }, 100);

      console.log('=== Fin ajout aliment ===');
    } catch (error) {
      console.error('Erreur ajout aliment:', error);
      setShowFoodModal(false);
      setTimeout(() => {
        Alert.alert('Erreur', 'Impossible d\'ajouter l\'aliment. Veuillez réessayer.');
      }, 100);
    }
  };

  const calculateDailyTotals = (entries: FoodEntry[]) => {
    const dateString = selectedDate.toISOString().split('T')[0];
    const dayEntries = entries.filter(entry => entry.date === dateString);

    const totals = dayEntries.reduce(
      (acc, entry) => ({
        calories: acc.calories + entry.calories,
        proteins: acc.proteins + entry.proteins,
        carbohydrates: acc.carbohydrates + entry.carbohydrates,
        fat: acc.fat + entry.fat,
      }),
      { calories: 0, proteins: 0, carbohydrates: 0, fat: 0 }
    );

    setDailyTotals(totals);
  };

  const loadUserFoodData = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) return;

      // Calculer les objectifs personnalisés
      const personalizedGoals = await calculatePersonalizedGoals(user);
      setCalorieGoals(personalizedGoals);

      // Calculer l'objectif d'hydratation dynamique
      const waterGoal = await calculateDailyWaterGoal();
      setDailyWaterGoal(waterGoal);

      // Essayer de charger depuis le serveur VPS d'abord
      try {
        const VPS_URL = process.env.EXPO_PUBLIC_VPS_URL || 'https://eatfitbymax.replit.app';
        const response = await fetch(`${VPS_URL}/api/nutrition/${user.id}`);
        
        if (response.ok) {
          const serverEntries = await response.json();
          console.log('Données nutrition chargées depuis le serveur VPS');
          setFoodEntries(serverEntries);
          calculateDailyTotals(serverEntries);
          // Sauvegarder en local comme backup
          await AsyncStorage.setItem(`food_entries_${user.id}`, JSON.stringify(serverEntries));
        } else {
          throw new Error('Serveur indisponible');
        }
      } catch (serverError) {
        console.log('Fallback vers le stockage local pour la nutrition');
        const stored = await AsyncStorage.getItem(`food_entries_${user.id}`);
        if (stored) {
          const entries = JSON.parse(stored);
          setFoodEntries(entries);
          calculateDailyTotals(entries);
        }
      }

      // Charger les données d'hydratation
      const waterStored = await AsyncStorage.getItem(`water_intake_${user.id}_${selectedDate.toISOString().split('T')[0]}`);
      if (waterStored) {
        setWaterIntake(parseInt(waterStored));
      } else {
        setWaterIntake(0);
      }
    } catch (error) {
      console.error('Erreur chargement données alimentaires:', error);
    }
  };

  const addWater = async (amount: number) => {
    try {
      const user = await getCurrentUser();
      if (!user) return;

      const newWaterIntake = waterIntake + amount;
      setWaterIntake(newWaterIntake);

      const dateKey = selectedDate.toISOString().split('T')[0];
      await AsyncStorage.setItem(`water_intake_${user.id}_${dateKey}`, newWaterIntake.toString());
    } catch (error) {
      console.error('Erreur ajout eau:', error);
    }
  };

  const resetWater = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) return;

      setWaterIntake(0);
      const dateKey = selectedDate.toISOString().split('T')[0];
      await AsyncStorage.setItem(`water_intake_${user.id}_${dateKey}`, '0');
    } catch (error) {
      console.error('Erreur reset eau:', error);
    }
  };

  const getMealEntries = (mealType: string) => {
    const dateString = selectedDate.toISOString().split('T')[0];
    return foodEntries.filter(entry => 
      entry.mealType === mealType && entry.date === dateString
    );
  };

  const removeFoodEntry = async (entryId: string) => {
    try {
      const user = await getCurrentUser();
      if (!user) return;

      const updatedEntries = foodEntries.filter(entry => entry.id !== entryId);
      setFoodEntries(updatedEntries);

      // Sauvegarder localement
      await AsyncStorage.setItem(`food_entries_${user.id}`, JSON.stringify(updatedEntries));
      calculateDailyTotals(updatedEntries);

      // Sauvegarder sur le serveur VPS
      try {
        const VPS_URL = process.env.EXPO_PUBLIC_VPS_URL || 'https://eatfitbymax.replit.app';
        const response = await fetch(`${VPS_URL}/api/nutrition/${user.id}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatedEntries),
        });

        if (response.ok) {
          console.log('Suppression aliment synchronisée sur le serveur VPS');
        } else {
          console.warn('Échec synchronisation suppression sur serveur VPS');
        }
      } catch (serverError) {
        console.warn('Erreur serveur lors de la suppression:', serverError);
      }
    } catch (error) {
      console.error('Erreur suppression aliment:', error);
      Alert.alert('Erreur', 'Impossible de supprimer l\'aliment');
    }
  };

  // Charger les données au montage du composant
  React.useEffect(() => {
    loadUserFoodData();
  }, []);

  // Recalculer les totaux et charger l'hydratation quand la date change
  React.useEffect(() => {
    calculateDailyTotals(foodEntries);
    loadUserFoodData();
  }, [selectedDate]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Nutrition</Text>

          {/* Date Navigation */}
          <View style={styles.dateNavigation}>
            <TouchableOpacity 
              style={styles.dateArrow}
              onPress={() => navigateDate('prev')}
            >
              <Text style={styles.arrowText}>‹</Text>
            </TouchableOpacity>

            <View style={styles.dateContainer}>
              <Text style={styles.date}>
                {isToday() ? 'Aujourd\'hui' : formatDate(selectedDate)}
              </Text>
            </View>

            <TouchableOpacity 
              style={styles.dateArrow}
              onPress={() => navigateDate('next')}
            >
              <Text style={styles.arrowText}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          {/* Combined Calories and Macros Card */}
          <View style={styles.combinedStatsCard}>
            {/* Calories Circular Gauge - Left Side */}
            <View style={styles.caloriesSection}>
              <View style={styles.circularGauge}>
                <Svg width={width < 375 ? 110 : 120} height={width < 375 ? 110 : 120} style={styles.svgGauge}>
                  {/* Background circle */}
                  <Circle
                    cx={(width < 375 ? 110 : 120) / 2}
                    cy={(width < 375 ? 110 : 120) / 2}
                    r={(width < 375 ? 110 : 120) / 2 - 8}
                    stroke="rgba(33, 38, 45, 0.8)"
                    strokeWidth="8"
                    fill="transparent"
                  />
                  {/* Progress circle */}
                  <Circle
                    cx={(width < 375 ? 110 : 120) / 2}
                    cy={(width < 375 ? 110 : 120) / 2}
                    r={(width < 375 ? 110 : 120) / 2 - 8}
                    stroke="#FFA500"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={`${2 * Math.PI * ((width < 375 ? 110 : 120) / 2 - 8)}`}
                    strokeDashoffset={`${2 * Math.PI * ((width < 375 ? 110 : 120) / 2 - 8) * (1 - Math.min(dailyTotals.calories / calorieGoals.calories, 1))}`}
                    strokeLinecap="round"
                    transform={`rotate(-90 ${(width < 375 ? 110 : 120) / 2} ${(width < 375 ? 110 : 120) / 2})`}
                  />
                </Svg>
                <View style={styles.circularGaugeInner}>
                  <Text style={styles.caloriesValue}>{dailyTotals.calories}</Text>
                  <Text style={styles.caloriesTarget}>/ {calorieGoals.calories}</Text>
                  <Text style={styles.caloriesLabel}>kcal</Text>
                </View>
              </View>
              <Text style={styles.caloriesSubtext}>
                {Math.max(0, calorieGoals.calories - dailyTotals.calories)} kcal restantes
              </Text>
            </View>

            {/* Macros Progress Bars - Right Side */}
            <View style={styles.macrosSection}>
              {/* Protéines */}
              <View style={styles.macroItem}>
                <View style={styles.macroHeader}>
                  <Text style={styles.macroLabel}>Protéines</Text>
                  <Text style={styles.macroValue}>{Math.round(dailyTotals.proteins)}g / {calorieGoals.proteins}g</Text>
                </View>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { 
                    width: `${Math.min((dailyTotals.proteins / calorieGoals.proteins) * 100, 100)}%`, 
                    backgroundColor: '#FF6B6B' 
                  }]} />
                </View>
              </View>

              {/* Glucides */}
              <View style={styles.macroItem}>
                <View style={styles.macroHeader}>
                  <Text style={styles.macroLabel}>Glucides</Text>
                  <Text style={styles.macroValue}>{Math.round(dailyTotals.carbohydrates)}g / {calorieGoals.carbohydrates}g</Text>
                </View>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { 
                    width: `${Math.min((dailyTotals.carbohydrates / calorieGoals.carbohydrates) * 100, 100)}%`, 
                    backgroundColor: '#4ECDC4' 
                  }]} />
                </View>
              </View>

              {/* Lipides */}
              <View style={styles.macroItem}>
                <View style={styles.macroHeader}>
                  <Text style={styles.macroLabel}>Lipides</Text>
                  <Text style={styles.macroValue}>{Math.round(dailyTotals.fat)}g / {calorieGoals.fat}g</Text>
                </View>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { 
                    width: `${Math.min((dailyTotals.fat / calorieGoals.fat) * 100, 100)}%`, 
                    backgroundColor: '#FFE66D' 
                  }]} />
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity 
            style={[styles.tab, selectedTab === 'Journal' && styles.activeTab]}
            onPress={() => handleTabPress('Journal')}
          >
            <Text style={[styles.tabText, selectedTab === 'Journal' && styles.activeTabText]}>
              Journal
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, selectedTab === 'Programme' && styles.activeTab]}
            onPress={() => handleTabPress('Programme')}
          >
            <View style={styles.tabContent}>
              <Text style={[styles.tabText, selectedTab === 'Programme' && styles.activeTabText]}>
                Programme
              </Text>
              <Text style={[styles.crownIcon, selectedTab === 'Programme' && styles.activeCrownIcon]}>
                👑
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Hydratation */}
        <View style={styles.hydrationContainer}>
          <View style={styles.hydrationCard}>
            <View style={styles.hydrationHeader}>
              <Text style={styles.hydrationTitle}>💧 Hydratation</Text>
              <TouchableOpacity onPress={resetWater} style={styles.resetButton}>
                <Text style={styles.resetButtonText}>Reset</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.hydrationContent}>
              <View style={styles.waterProgress}>
                <View style={styles.waterProgressBar}>
                  <View style={[styles.waterProgressFill, { 
                    width: `${Math.min((waterIntake / dailyWaterGoal) * 100, 100)}%` 
                  }]} />
                </View>
                <Text style={styles.waterText}>
                  {waterIntake} ml / {dailyWaterGoal} ml
                </Text>
              </View>

              <View style={styles.waterButtons}>
                <TouchableOpacity
                  style={styles.waterButton}
                  onPress={() => addWater(250)}
                >
                  <Text style={styles.waterButtonText}>+250ml</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.waterButton}
                  onPress={() => addWater(500)}
                >
                  <Text style={styles.waterButtonText}>+500ml</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.waterButton}
                  onPress={() => addWater(1000)}
                >
                  <Text style={styles.waterButtonText}>+1L</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Meals Section */}
        <View style={styles.mealsContainer}>
          {selectedTab === 'Journal' && (
            <>
              {['Petit-déjeuner', 'Déjeuner', 'Collation', 'Dîner'].map((mealType) => {
                const mealEntries = getMealEntries(mealType);
                const mealCalories = mealEntries.reduce((sum, entry) => sum + entry.calories, 0);

                return (
                  <View key={mealType} style={styles.mealCard}>
                    <View style={styles.mealHeader}>
                      <Text style={styles.mealTitle}>{mealType}</Text>
                      <TouchableOpacity style={styles.addButton}>
                        <Text style={styles.addButtonText}>{mealCalories} kcal</Text>
                      </TouchableOpacity>
                    </View>

                    {mealEntries.length === 0 ? (
                      <Text style={styles.mealEmpty}>Aucun aliment ajouté</Text>
                    ) : (
                      <View style={styles.foodList}>
                        {mealEntries.map((entry) => (
                          <View key={entry.id} style={styles.foodItem}>
                            <View style={styles.foodInfo}>
                              <Text style={styles.foodName}>{entry.product.name}</Text>
                              <Text style={styles.foodDetails}>
                                {entry.quantity}g • {entry.calories} kcal
                              </Text>
                            </View>
                            <TouchableOpacity
                              style={styles.removeButton}
                              onPress={() => removeFoodEntry(entry.id)}
                            >
                              <Text style={styles.removeButtonText}>×</Text>
                            </TouchableOpacity>
                          </View>
                        ))}
                      </View>
                    )}

                    <TouchableOpacity 
                      style={styles.addFoodButton}
                      onPress={() => handleAddFood(mealType)}
                    >
                      <Text style={styles.addFoodText}>+ Ajouter un aliment</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </>
          )}
        </View>

        {/* Modal d'abonnement */}
        <Modal
          visible={showSubscriptionModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowSubscriptionModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>🔒 Accès Premium</Text>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={() => setShowSubscriptionModal(false)}
                >
                  <Text style={styles.closeButtonText}>×</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.modalDescription}>
                L'accès aux programmes nutrition est réservé aux membres Premium.
              </Text>

              <View style={styles.benefitsList}>
                <Text style={styles.benefitItem}>✓ Programmes nutrition personnalisés</Text>
                <Text style={styles.benefitItem}>✓ Suivi par un coach professionnel</Text>
                <Text style={styles.benefitItem}>✓ Plans de repas détaillés</Text>
                <Text style={styles.benefitItem}>✓ Ajustements selon vos progrès</Text>
              </View>

              <TouchableOpacity 
                style={styles.subscribeButton}
                onPress={() => {
                  setShowSubscriptionModal(false);
                  Alert.alert(
                    'Abonnement Premium', 
                    'Fonctionnalité d\'abonnement en cours de développement.'
                  );
                }}
              >
                <Text style={styles.subscribeButtonText}>S'abonner maintenant</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowSubscriptionModal(false)}
              >
                <Text style={styles.cancelButtonText}>Plus tard</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Modal de recherche d'aliments */}
        <FoodSearchModal
          visible={showFoodModal}
          onClose={() => setShowFoodModal(false)}
          onAddFood={handleFoodAdded}
          mealType={selectedMealType}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0B0D',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: width < 375 ? 16 : 20,
    paddingTop: 12,
    paddingBottom: 20,
    backgroundColor: 'rgba(13, 17, 23, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 165, 0, 0.1)',
  },
  title: {
    fontSize: width < 375 ? 22 : 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  dateNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  dateArrow: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(22, 27, 34, 0.8)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 165, 0, 0.3)',
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFA500',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  arrowText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFA500',
  },
  dateContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
    backgroundColor: 'rgba(22, 27, 34, 0.6)',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 165, 0, 0.2)',
  },
  date: {
    fontSize: width < 375 ? 14 : 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  dateSubtext: {
    fontSize: 12,
    color: '#8B949E',
    marginTop: 2,
    textAlign: 'center',
  },
  statsContainer: {
    paddingHorizontal: width < 375 ? 16 : 20,
    paddingVertical: 20,
  },
  combinedStatsCard: {
    backgroundColor: 'rgba(22, 27, 34, 0.95)',
    borderRadius: 20,
    padding: width < 375 ? 16 : 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 165, 0, 0.3)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: width < 375 ? 16 : 20,
    shadowColor: '#FFA500',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  caloriesSection: {
    alignItems: 'center',
    minWidth: width < 375 ? 130 : 140,
  },
  circularGauge: {
    width: width < 375 ? 110 : 120,
    height: width < 375 ? 110 : 120,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 12,
  },
  svgGauge: {
    position: 'absolute',
  },
  circularGaugeInner: {
    alignItems: 'center',
  },
  caloriesValue: {
    fontSize: width < 375 ? 20 : 22,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: width < 375 ? 22 : 24,
  },
  caloriesTarget: {
    fontSize: width < 375 ? 12 : 13,
    color: '#FFA500',
    lineHeight: width < 375 ? 14 : 15,
    fontWeight: '500',
  },
  caloriesLabel: {
    fontSize: width < 375 ? 11 : 12,
    color: '#8B949E',
    marginTop: 2,
    fontWeight: '600',
  },
  caloriesSubtext: {
    fontSize: width < 375 ? 10 : 11,
    color: '#8B949E',
    textAlign: 'center',
    fontWeight: '500',
  },
  macrosSection: {
    flex: 1,
    gap: width < 375 ? 10 : 12,
  },
  macroItem: {
    backgroundColor: 'rgba(13, 17, 23, 0.7)',
    borderRadius: 12,
    padding: width < 375 ? 10 : 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 165, 0, 0.2)',
  },
  macroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  macroLabel: {
    fontSize: width < 375 ? 11 : 12,
    color: '#8B949E',
    fontWeight: '600',
  },
  macroValue: {
    fontSize: width < 375 ? 11 : 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  progressBar: {
    height: width < 375 ? 4 : 5,
    backgroundColor: 'rgba(33, 38, 45, 0.8)',
    borderRadius: width < 375 ? 2 : 2.5,
    overflow: 'hidden',
    width: '100%',
  },
  progressFill: {
    height: '100%',
    borderRadius: width < 375 ? 2 : 2.5,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: width < 375 ? 16 : 20,
    marginBottom: 20,
    gap: width < 375 ? 8 : 12,
  },
  tab: {
    flex: 1,
    paddingVertical: width < 375 ? 12 : 14,
    paddingHorizontal: width < 375 ? 16 : 20,
    borderRadius: 16,
    backgroundColor: 'rgba(22, 27, 34, 0.8)',
    borderWidth: 1.5,
    borderColor: 'rgba(139, 148, 158, 0.3)',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activeTab: {
    backgroundColor: 'linear-gradient(135deg, #FFA500, #FFD700)',
    borderColor: '#FFA500',
    shadowColor: '#FFA500',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tabText: {
    fontSize: width < 375 ? 13 : 15,
    color: '#8B949E',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  crownIcon: {
    fontSize: width < 375 ? 14 : 16,
    opacity: 0.6,
  },
  activeCrownIcon: {
    opacity: 1,
  },
  mealsContainer: {
    paddingHorizontal: width < 375 ? 16 : 20,
    paddingBottom: 140,
  },
  sectionTitle: {
    fontSize: width < 375 ? 18 : 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 18,
    letterSpacing: 0.3,
  },
  mealCard: {
    backgroundColor: 'rgba(22, 27, 34, 0.95)',
    borderRadius: 18,
    padding: width < 375 ? 18 : 22,
    borderWidth: 1.5,
    borderColor: 'rgba(139, 148, 158, 0.2)',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  mealTitle: {
    fontSize: width < 375 ? 16 : 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  addButton: {
    backgroundColor: 'rgba(255, 165, 0, 0.1)',
    paddingVertical: width < 375 ? 6 : 8,
    paddingHorizontal: width < 375 ? 12 : 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 165, 0, 0.3)',
  },
  addButtonText: {
    fontSize: width < 375 ? 11 : 13,
    color: '#FFA500',
    fontWeight: '600',
  },
  mealEmpty: {
    fontSize: width < 375 ? 13 : 15,
    color: 'rgba(139, 148, 158, 0.8)',
    textAlign: 'center',
    marginBottom: 16,
    fontStyle: 'italic',
    fontWeight: '500',
  },
  addFoodButton: {
    backgroundColor: 'rgba(13, 17, 23, 0.8)',
    borderWidth: 2,
    borderColor: 'rgba(255, 165, 0, 0.3)',
    borderStyle: 'dashed',
    paddingVertical: width < 375 ? 12 : 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  addFoodText: {
    fontSize: width < 375 ? 13 : 15,
    color: '#FFA500',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: width < 375 ? 20 : 24,
    width: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: width < 375 ? 18 : 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  closeButton: {
    backgroundColor: '#21262D',
    borderRadius: 12,
    width: width < 375 ? 24 : 28,
    height: width < 375 ? 24 : 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: width < 375 ? 14 : 16,
    color: '#8B949E',
    fontWeight: 'bold',
  },
  modalDescription: {
    fontSize: width < 375 ? 14 : 16,
    color: '#8B949E',
    marginBottom: 20,
  },
  benefitsList: {
    marginBottom: 20,
  },
  benefitItem: {
    fontSize: width < 375 ? 14 : 16,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subscribeButton: {
    backgroundColor: '#F5A623',
    paddingVertical: width < 375 ? 12 : 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  subscribeButtonText: {
    fontSize: width < 375 ? 14 : 16,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  cancelButton: {
    paddingVertical: width < 375 ? 12 : 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: width < 375 ? 14 : 16,
    color: '#8B949E',
  },
  foodList: {
    marginBottom: 16,
  },
  foodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(13, 17, 23, 0.9)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(139, 148, 158, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    color: '#FFFFFF',
    fontSize: width < 375 ? 15 : 17,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  foodDetails: {
    color: '#8B949E',
    fontSize: width < 375 ? 13 : 15,
    fontWeight: '500',
  },
  removeButton: {
    backgroundColor: 'rgba(255, 107, 107, 0.9)',
    borderRadius: 14,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  removeButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  hydrationContainer: {
    paddingHorizontal: width < 375 ? 16 : 20,
    paddingBottom: 20,
  },
  hydrationCard: {
    backgroundColor: 'rgba(22, 27, 34, 0.95)',
    borderRadius: 20,
    padding: width < 375 ? 18 : 22,
    borderWidth: 1.5,
    borderColor: 'rgba(78, 205, 196, 0.3)',
    shadowColor: '#4ECDC4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  hydrationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  hydrationTitle: {
    fontSize: width < 375 ? 18 : 20,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  resetButton: {
    backgroundColor: 'rgba(33, 38, 45, 0.8)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(139, 148, 158, 0.3)',
  },
  resetButtonText: {
    fontSize: 12,
    color: '#8B949E',
    fontWeight: '600',
  },
  hydrationContent: {
    gap: 20,
  },
  waterProgress: {
    alignItems: 'center',
  },
  waterProgressBar: {
    width: '100%',
    height: 12,
    backgroundColor: 'rgba(33, 38, 45, 0.8)',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(78, 205, 196, 0.2)',
  },
  waterProgressFill: {
    height: '100%',
    backgroundColor: '#4ECDC4',
    borderRadius: 6,
    shadowColor: '#4ECDC4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
  waterText: {
    fontSize: width < 375 ? 16 : 18,
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  waterButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  waterButton: {
    flex: 1,
    backgroundColor: 'rgba(78, 205, 196, 0.9)',
    paddingVertical: width < 375 ? 12 : 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(78, 205, 196, 0.3)',
    shadowColor: '#4ECDC4',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  waterButtonText: {
    color: '#FFFFFF',
    fontSize: width < 375 ? 13 : 15,
    fontWeight: '700',
  },
});

export default NutritionScreen;