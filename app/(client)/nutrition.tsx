import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Dimensions, Modal, Alert } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import FoodSearchModal from '@/components/FoodSearchModal';
import ComingSoonModal from '@/components/ComingSoonModal';
import { FoodProduct, OpenFoodFactsService, FoodEntry } from '@/utils/openfoodfacts';
import { PersistentStorage } from '@/utils/storage';
import { getCurrentUser } from '@/utils/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

function NutritionScreen() {
  const [selectedTab, setSelectedTab] = useState('Journal');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [hasNutritionProgram, setHasNutritionProgram] = useState(false); // Assuming default is no access
  const [showComingSoonModal, setShowComingSoonModal] = useState(false);
  const [showFoodModal, setShowFoodModal] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState<string>('');
  const [foodEntries, setFoodEntries] = useState<FoodEntry[]>([]);
  const [dailyTotals, setDailyTotals] = useState({
    calories: 0,
    proteins: 0,
    carbohydrates: 0,
    fat: 0,
    // Micronutriments - Vitamines
    vitaminA: 0,
    vitaminC: 0,
    vitaminD: 0,
    vitaminE: 0,
    vitaminK: 0,
    vitaminB1: 0,
    vitaminB2: 0,
    vitaminB3: 0,
    vitaminB5: 0,
    vitaminB6: 0,
    vitaminB7: 0, // Biotine
    vitaminB9: 0, // Folate
    vitaminB12: 0,
    // Micronutriments - Minéraux
    calcium: 0,
    iron: 0,
    magnesium: 0,
    potassium: 0,
    zinc: 0,
    sodium: 0,
    phosphorus: 0,
    selenium: 0,
    copper: 0,
    manganese: 0,
    iodine: 0,
    chromium: 0,
    molybdenum: 0,
    // Autres
    caffeine: 0,
    fiber: 0,
    omega3: 0,
    omega6: 0,
  });
  const [calorieGoals, setCalorieGoals] = useState({
    calories: 2495,
    proteins: 125,
    carbohydrates: 312,
    fat: 83,
  });

  const [microGoals, setMicroGoals] = useState({
    // Vitamines
    vitaminA: 900, // μg
    vitaminC: 90, // mg
    vitaminD: 15, // μg
    vitaminE: 15, // mg
    vitaminK: 120, // μg
    vitaminB1: 1.2, // mg
    vitaminB2: 1.3, // mg
    vitaminB3: 16, // mg
    vitaminB5: 5, // mg
    vitaminB6: 1.4, // mg
    vitaminB7: 30, // μg (Biotine)
    vitaminB9: 400, // μg (Folate)
    vitaminB12: 2.4, // μg
    // Minéraux
    calcium: 1000, // mg
    iron: 8, // mg
    magnesium: 400, // mg
    potassium: 3500, // mg
    zinc: 11, // mg
    sodium: 2300, // mg (limite supérieure)
    phosphorus: 700, // mg
    selenium: 55, // μg
    copper: 0.9, // mg
    manganese: 2.3, // mg
    iodine: 150, // μg
    chromium: 35, // μg
    molybdenum: 45, // μg
    // Autres
    caffeine: 400, // mg (limite supérieure recommandée)
    fiber: 25, // g
    omega3: 1.6, // g
    omega6: 17, // g
  });
  const [waterIntake, setWaterIntake] = useState(0); // en ml
  const [dailyWaterGoal, setDailyWaterGoal] = useState(2000); // objectif de base en ml

  // États pour le système de navigation
  const [currentView, setCurrentView] = useState<'macros' | 'vitamines' | 'mineraux' | 'autres'>('macros');

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

      // Vérifier que weight et age sont des nombres valides
      const userWeight = parseFloat(user.weight?.currentWeight) || parseFloat(user.currentWeight) || 70; // Poids par défaut 70kg
      const userAge = parseFloat(user.age) || 25; // Âge par défaut 25 ans

      if (userWeight && userAge && !isNaN(userWeight) && !isNaN(userAge)) {
        // Formule: 35ml par kg de poids corporel + ajustement selon l'âge
        baseGoal = userWeight * 35;

        // Ajustement selon l'âge (les personnes âgées ont besoin de plus d'hydratation)
        if (userAge > 65) {
          baseGoal += 300; // +300ml pour les seniors
        } else if (userAge > 50) {
          baseGoal += 200; // +200ml pour les 50-65 ans
        }

        // Arrondir au supérieur au multiple de 250ml le plus proche
        baseGoal = Math.ceil(baseGoal / 250) * 250;
      }

      // Récupérer les entraînements du jour depuis le serveur VPS
      const dateString = selectedDate.toISOString().split('T')[0];

      try {
        const workouts = await PersistentStorage.getWorkouts(user.id);
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
      } catch (error) {
        console.error('Erreur récupération workouts depuis VPS:', error);
      }

      // Arrondir pour être réalisable avec les boutons disponibles (250ml, 500ml, 1000ml)
      // L'objectif doit être un multiple de 250ml pour être atteignable facilement
      const finalGoal = Math.ceil(baseGoal / 250) * 250;

      // Validation finale pour éviter NaN
      const validGoal = isNaN(finalGoal) ? 2000 : finalGoal;
      console.log(`Objectif hydratation calculé: ${validGoal}ml (base: ${Math.ceil((userWeight * 35) / 250) * 250}ml)`);

      return validGoal;
    } catch (error) {
      console.error('Erreur calcul objectif hydratation:', error);
      return 2000;
    }
  };

  const calculatePersonalizedGoals = async (user: any) => {
    console.log('🎯 CALCUL OBJECTIFS PERSONNALISÉS');
    console.log('Données utilisateur reçues:', {
      age: user?.age,
      weight: user?.weight,
      height: user?.height,
      gender: user?.gender,
      activityLevel: user?.activityLevel,
      goals: user?.goals
    });

    if (!user || !user.age || !user.weight || !user.height || !user.gender) {
      console.log('⚠️ Données utilisateur incomplètes - Utilisation valeurs par défaut');
      const defaultGoals = {
        calories: 2495,
        proteins: 125,
        carbohydrates: 312,
        fat: 83,
      };
      console.log('🎯 Objectifs par défaut définis:', defaultGoals);
      return defaultGoals;
    }

    // Conversion en nombres pour éviter les erreurs
    const age = parseFloat(user.age) || 25;
    const weight = parseFloat(user.weight?.currentWeight) || parseFloat(user.currentWeight) || 70;
    const height = parseFloat(user.height) || 175;

    console.log('📊 Valeurs numériques utilisées:', { age, weight, height, gender: user.gender });

    // Calcul du métabolisme de base (BMR) avec la formule de Mifflin-St Jeor
    let bmr;
    if (user.gender === 'Homme') {
      bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
    } else {
      bmr = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
    }

    console.log(`🔥 BMR calculé (${user.gender}): ${Math.round(bmr)} kcal`);

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
    
    console.log(`🏃 Facteur activité (${user.activityLevel}): ${activityFactor}`);
    console.log(`📈 Calories avec activité: ${totalCalories} kcal`);

    // Ajustements selon les objectifs
    const goals = user.goals || [];
    console.log('🎯 Objectifs utilisateur:', goals);

    if (goals.includes('Perdre du poids')) {
      totalCalories -= 200; // Déficit de 200 kcal
      console.log('⬇️ Ajustement perte de poids: -200 kcal');
    }

    // Vérifier s'il y a un entraînement programmé le jour sélectionné depuis le serveur VPS
    try {
      const dateString = selectedDate.toISOString().split('T')[0];
      const workouts = await PersistentStorage.getWorkouts(user.id);

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
        console.log(`💪 ${workoutCount} entraînement(s) détecté(s) le ${dateString} - Ajout de ${bonusCalories} kcal`);
      }
    } catch (error) {
      console.error('Erreur vérification entraînements depuis VPS:', error);
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
      console.log('💪 Ratios musculation appliqués');
    } else if (goals.includes('Gagner en performance')) {
      // Ratio glucides/protéines optimal pour la performance
      proteinRatio = 0.25; // 25%
      carbRatio = 0.55;    // 55%
      fatRatio = 0.20;     // 20%
      console.log('🏃‍♂️ Ratios performance appliqués');
    }

    // Calcul des grammes de macronutriments
    const proteins = Math.round((totalCalories * proteinRatio) / 4); // 4 kcal par gramme
    const carbohydrates = Math.round((totalCalories * carbRatio) / 4); // 4 kcal par gramme
    const fat = Math.round((totalCalories * fatRatio) / 9); // 9 kcal par gramme

    const finalGoals = {
      calories: Math.max(totalCalories, 1200), // Minimum 1200 kcal pour la santé
      proteins,
      carbohydrates,
      fat,
    };

    console.log('✅ OBJECTIFS FINAUX CALCULÉS:', finalGoals);
    console.log(`📊 Ratios: P${Math.round(proteinRatio*100)}% C${Math.round(carbRatio*100)}% F${Math.round(fatRatio*100)}%`);

    return finalGoals;
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
      setShowComingSoonModal(true);
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

      // Sauvegarder uniquement sur le serveur VPS
      try {
        await PersistentStorage.saveNutrition(user.id, updatedEntries);
        console.log('✅ Données nutrition sauvegardées sur le serveur VPS');
      } catch (storageError) {
        console.error('Erreur sauvegarde nutrition sur VPS:', storageError);
        Alert.alert('Erreur', 'Impossible de sauvegarder les données nutrition. Vérifiez votre connexion internet.');
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
      (acc, entry) => {
        // Estimation des micronutriments basée sur les macronutriments
        const estimatedMicros = estimateMicronutrients(entry);

        return {
          calories: acc.calories + entry.calories,
          proteins: acc.proteins + entry.proteins,
          carbohydrates: acc.carbohydrates + entry.carbohydrates,
          fat: acc.fat + entry.fat,
          // Vitamines
          vitaminA: acc.vitaminA + estimatedMicros.vitaminA,
          vitaminC: acc.vitaminC + estimatedMicros.vitaminC,
          vitaminD: acc.vitaminD + estimatedMicros.vitaminD,
          vitaminE: acc.vitaminE + estimatedMicros.vitaminE,
          vitaminK: acc.vitaminK + estimatedMicros.vitaminK,
          vitaminB1: acc.vitaminB1 + estimatedMicros.vitaminB1,
          vitaminB2: acc.vitaminB2 + estimatedMicros.vitaminB2,
          vitaminB3: acc.vitaminB3 + estimatedMicros.vitaminB3,
          vitaminB5: acc.vitaminB5 + estimatedMicros.vitaminB5,
          vitaminB6: acc.vitaminB6 + estimatedMicros.vitaminB6,
          vitaminB7: acc.vitaminB7 + estimatedMicros.vitaminB7,
          vitaminB9: acc.vitaminB9 + estimatedMicros.vitaminB9,
          vitaminB12: acc.vitaminB12 + estimatedMicros.vitaminB12,
          // Minéraux
          calcium: acc.calcium + estimatedMicros.calcium,
          iron: acc.iron + estimatedMicros.iron,
          magnesium: acc.magnesium + estimatedMicros.magnesium,
          potassium: acc.potassium + estimatedMicros.potassium,
          zinc: acc.zinc + estimatedMicros.zinc,
          sodium: acc.sodium + estimatedMicros.sodium,
          phosphorus: acc.phosphorus + estimatedMicros.phosphorus,
          selenium: acc.selenium + estimatedMicros.selenium,
          copper: acc.copper + estimatedMicros.copper,
          manganese: acc.manganese + estimatedMicros.manganese,
          iodine: acc.iodine + estimatedMicros.iodine,
          chromium: acc.chromium + estimatedMicros.chromium,
          molybdenum: acc.molybdenum + estimatedMicros.molybdenum,
          // Autres
          caffeine: acc.caffeine + estimatedMicros.caffeine,
          fiber: acc.fiber + estimatedMicros.fiber,
          omega3: acc.omega3 + estimatedMicros.omega3,
          omega6: acc.omega6 + estimatedMicros.omega6,
        };
      },
      { 
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
      }
    );

    setDailyTotals(totals);
  };

  // Fonction d'estimation des micronutriments basée sur les macronutriments et le nom du produit
  const estimateMicronutrients = (entry: FoodEntry) => {
    const productName = entry.product.name?.toLowerCase() || '';
    const calories = entry.calories;

    // Coefficients de base par 100 kcal
    let vitaminA = 0, vitaminC = 0, vitaminD = 0, vitaminE = 0, vitaminK = 0;
    let vitaminB1 = 0, vitaminB2 = 0, vitaminB3 = 0, vitaminB5 = 0, vitaminB6 = 0;
    let vitaminB7 = 0, vitaminB9 = 0, vitaminB12 = 0;
    let calcium = 0, iron = 0, magnesium = 0, potassium = 0, zinc = 0;
    let sodium = 0, phosphorus = 0, selenium = 0, copper = 0, manganese = 0;
    let iodine = 0, chromium = 0, molybdenum = 0;
    let caffeine = 0, fiber = 0, omega3 = 0, omega6 = 0;

    // Estimation basée sur les types d'aliments
    if (productName.includes('café') || productName.includes('coffee') || productName.includes('expresso')) {
      caffeine = calories * 8; // Café très riche en caféine
      potassium = calories * 2;
      magnesium = calories * 0.3;
    } else if (productName.includes('thé') || productName.includes('tea')) {
      caffeine = calories * 3; // Thé moins riche que le café
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
      // Valeurs par défaut pour les aliments non catégorisés
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
      // Vitamines
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
      // Minéraux
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
      // Autres
      caffeine: Math.round(caffeine * 10) / 10,
      fiber: Math.round(fiber * 10) / 10,
      omega3: Math.round(omega3 * 100) / 100,
      omega6: Math.round(omega6 * 100) / 100,
    };
  };

  const loadUserFoodData = async () => {
    try {
      console.log('🔄 CHARGEMENT DONNÉES NUTRITION');
      const user = await getCurrentUser();
      if (!user) {
        console.log('❌ Aucun utilisateur connecté');
        return;
      }

      console.log('👤 Utilisateur connecté:', user.email);
      console.log('📋 Profil utilisateur complet:', {
        firstName: user.firstName,
        lastName: user.lastName,
        age: user.age,
        weight: user.weight,
        currentWeight: user.currentWeight,
        height: user.height,
        gender: user.gender,
        activityLevel: user.activityLevel,
        goals: user.goals
      });

      // Calculer les objectifs personnalisés
      console.log('🎯 Début calcul objectifs personnalisés...');
      const personalizedGoals = await calculatePersonalizedGoals(user);
      setCalorieGoals(personalizedGoals);
      console.log('✅ Objectifs appliqués dans l\'état:', personalizedGoals);

      // Calculer l'objectif d'hydratation dynamique
      const waterGoal = await calculateDailyWaterGoal();
      setDailyWaterGoal(waterGoal);

      // Charger depuis le serveur VPS uniquement
      try {
        const serverEntries = await PersistentStorage.getNutrition(user.id);
        console.log('🍽️ Données nutrition chargées depuis le serveur VPS');
        setFoodEntries(serverEntries);
        calculateDailyTotals(serverEntries);
      } catch (serverError) {
        console.error('❌ Erreur chargement nutrition depuis VPS:', serverError);
        setFoodEntries([]);
      }

      // Charger les données d'hydratation depuis le serveur VPS
      try {
        const waterData = await PersistentStorage.getWaterIntake(user.id, selectedDate.toISOString().split('T')[0]);
        setWaterIntake(waterData || 0);
      } catch (error) {
        console.error('Erreur chargement hydratation depuis VPS:', error);
        setWaterIntake(0);
      }
    } catch (error) {
      console.error('❌ Erreur chargement données alimentaires:', error);
    }
  };

  const addWater = async (amount: number) => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        console.error('❌ Aucun utilisateur connecté pour ajout eau');
        Alert.alert('Erreur', 'Utilisateur non connecté');
        return;
      }

      console.log(`💧 Ajout ${amount}ml d'eau pour ${user.email}`);
      
      const newWaterIntake = waterIntake + amount;
      const dateKey = selectedDate.toISOString().split('T')[0];
      
      console.log(`📡 Tentative sauvegarde hydratation:`, {
        userId: user.id,
        date: dateKey,
        amount: newWaterIntake,
        userEmail: user.email
      });
      
      // Sauvegarder sur le serveur avec une gestion d'erreur plus robuste
      try {
        await PersistentStorage.saveWaterIntake(user.id, dateKey, newWaterIntake);
        console.log(`✅ Hydratation sauvegardée avec succès sur le serveur VPS`);
        
        // Mettre à jour l'état local seulement après succès de la sauvegarde
        setWaterIntake(newWaterIntake);
        console.log(`✅ Hydratation mise à jour localement: ${newWaterIntake}ml`);
        
        // Afficher un feedback positif à l'utilisateur
        Alert.alert('✅ Hydratation', `+${amount}ml ajoutés avec succès !`, [{ text: 'OK' }]);
        
      } catch (serverError) {
        console.error('❌ Erreur sauvegarde serveur hydratation:', serverError);
        console.error('❌ Détails erreur complète:', {
          message: serverError.message,
          name: serverError.name,
          stack: serverError.stack,
          userId: user.id,
          date: dateKey,
          amount: newWaterIntake,
          userEmail: user.email
        });
        
        // Essayer de déterminer la cause spécifique de l'erreur
        let errorMessage = 'Erreur de connexion au serveur';
        if (serverError.message.includes('404')) {
          errorMessage = 'Utilisateur non trouvé sur le serveur';
        } else if (serverError.message.includes('400')) {
          errorMessage = 'Données invalides envoyées au serveur';
        } else if (serverError.message.includes('500')) {
          errorMessage = 'Erreur interne du serveur';
        } else if (serverError.message.includes('network')) {
          errorMessage = 'Problème de connexion réseau';
        }
        
        throw new Error(errorMessage);
      }
      
    } catch (error) {
      console.error('❌ Erreur complète ajout eau:', error);
      
      // Afficher une alerte détaillée à l'utilisateur
      Alert.alert(
        'Erreur d\'hydratation',
        `Impossible de sauvegarder votre consommation d'eau.\n\n${error.message || 'Vérifiez votre connexion internet et réessayez.'}`,
        [
          { text: 'Réessayer', onPress: () => addWater(amount) },
          { text: 'Annuler', style: 'cancel' }
        ]
      );
    }
  };

  const resetWater = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        console.error('❌ Aucun utilisateur connecté pour reset eau');
        Alert.alert('Erreur', 'Utilisateur non connecté');
        return;
      }

      console.log(`💧 Reset hydratation pour ${user.email}`);
      
      const dateKey = selectedDate.toISOString().split('T')[0];
      
      console.log(`📡 Tentative reset hydratation: ${user.id}, ${dateKey}`);
      
      // Sauvegarder sur le serveur avec gestion d'erreur robuste
      try {
        await PersistentStorage.saveWaterIntake(user.id, dateKey, 0);
        console.log(`✅ Reset hydratation sauvegardé avec succès sur le serveur VPS`);
        
        // Mettre à jour l'état local seulement après succès
        setWaterIntake(0);
        console.log(`✅ Hydratation remise à zéro localement`);
        
      } catch (serverError) {
        console.error('❌ Erreur reset serveur hydratation:', serverError);
        console.error('❌ Détails erreur reset:', {
          message: serverError.message,
          name: serverError.name,
          userId: user.id,
          date: dateKey
        });
        
        throw new Error(`Erreur serveur: ${serverError.message}`);
      }
      
    } catch (error) {
      console.error('❌ Erreur complète reset eau:', error);
      Alert.alert(
        'Erreur de reset',
        `Impossible de remettre à zéro votre consommation d'eau. ${error.message || 'Vérifiez votre connexion internet.'}`,
        [{ text: 'OK' }]
      );
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

      // Sauvegarder uniquement sur le serveur VPS
      await PersistentStorage.saveNutrition(user.id, updatedEntries);
      calculateDailyTotals(updatedEntries);
      console.log('Suppression aliment synchronisée sur le serveur VPS');
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
              <Text style={styles.arrowText}>←</Text>
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
              <Text style={styles.arrowText}>→</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats avec swipe */}
        <View style={styles.statsContainer}>
          <View style={styles.swipeContainer}>
            {/* Vue Macros */}
            {currentView === 'macros' && (
              <View style={styles.combinedStatsCard}>
                <View style={styles.macrosLayout}>
                  {/* Calories Circular Gauge - Gauche */}
                  <View style={styles.caloriesGaugeContainer}>
                    <View style={styles.circularGauge}>
                      <Svg width={120} height={120} style={styles.svgGauge}>
                        {/* Background circle */}
                        <Circle
                          cx={60}
                          cy={60}
                          r={52}
                          stroke="rgba(33, 38, 45, 0.8)"
                          strokeWidth="8"
                          fill="transparent"
                        />
                        {/* Progress circle */}
                        <Circle
                          cx={60}
                          cy={60}
                          r={52}
                          stroke="#FFA500"
                          strokeWidth="8"
                          fill="transparent"
                          strokeDasharray={`${2 * Math.PI * 52}`}
                          strokeDashoffset={`${2 * Math.PI * 52 * (1 - Math.min(((isNaN(dailyTotals.calories) ? 0 : dailyTotals.calories) / (isNaN(calorieGoals.calories) ? 1 : calorieGoals.calories)), 1))}`}
                          strokeLinecap="round"
                          transform="rotate(-90 60 60)"
                        />
                      </Svg>
                      <View style={styles.circularGaugeInner}>
                        <Text style={styles.caloriesValue}>{isNaN(dailyTotals.calories) ? 0 : Math.round(dailyTotals.calories)}</Text>
                        <Text style={styles.caloriesTarget}>/ {isNaN(calorieGoals.calories) ? 0 : calorieGoals.calories}</Text>
                        <Text style={styles.caloriesLabel}>kcal</Text>
                      </View>
                    </View>
                    <Text style={styles.caloriesSubtext}>
                      {Math.max(0, (isNaN(calorieGoals.calories) ? 0 : calorieGoals.calories) - (isNaN(dailyTotals.calories) ? 0 : dailyTotals.calories))} kcal restantes
                    </Text>
                  </View>

                  {/* Macros Progress Bars - Droite */}
                  <View style={styles.macrosProgressContainer}>
                    {/* Protéines */}
                    <View style={styles.macroProgressItem}>
                      <View style={styles.macroProgressHeader}>
                        <Text style={styles.macroProgressLabel}>Protéines</Text>
                        <Text style={styles.macroProgressValue}>
                          {isNaN(dailyTotals.proteins) ? 0 : Math.round(dailyTotals.proteins)}g / {isNaN(calorieGoals.proteins) ? 0 : calorieGoals.proteins}g
                        </Text>
                      </View>
                      <View style={styles.macroProgressBar}>
                        <View style={[styles.macroProgressFill, { 
                          width: `${Math.min(((isNaN(dailyTotals.proteins) ? 0 : dailyTotals.proteins) / (isNaN(calorieGoals.proteins) ? 1 : calorieGoals.proteins)) * 100, 100)}%`, 
                          backgroundColor: '#FF6B6B' 
                        }]} />
                      </View>
                    </View>

                    {/* Glucides */}
                    <View style={styles.macroProgressItem}>
                      <View style={styles.macroProgressHeader}>
                        <Text style={styles.macroProgressLabel}>Glucides</Text>
                        <Text style={styles.macroProgressValue}>
                          {isNaN(dailyTotals.carbohydrates) ? 0 : Math.round(dailyTotals.carbohydrates)}g / {isNaN(calorieGoals.carbohydrates) ? 0 : calorieGoals.carbohydrates}g
                        </Text>
                      </View>
                      <View style={styles.macroProgressBar}>
                        <View style={[styles.macroProgressFill, { 
                          width: `${Math.min(((isNaN(dailyTotals.carbohydrates) ? 0 : dailyTotals.carbohydrates) / (isNaN(calorieGoals.carbohydrates) ? 1 : calorieGoals.carbohydrates)) * 100, 100)}%`, 
                          backgroundColor: '#4ECDC4' 
                        }]} />
                      </View>
                    </View>

                    {/* Lipides */}
                    <View style={styles.macroProgressItem}>
                      <View style={styles.macroProgressHeader}>
                        <Text style={styles.macroProgressLabel}>Lipides</Text>
                        <Text style={styles.macroProgressValue}>
                          {isNaN(dailyTotals.fat) ? 0 : Math.round(dailyTotals.fat)}g / {isNaN(calorieGoals.fat) ? 0 : calorieGoals.fat}g
                        </Text>
                      </View>
                      <View style={styles.macroProgressBar}>
                        <View style={[styles.macroProgressFill, { 
                          width: `${Math.min(((isNaN(dailyTotals.fat) ? 0 : dailyTotals.fat) / (isNaN(calorieGoals.fat) ? 1 : calorieGoals.fat)) * 100, 100)}%`, 
                          backgroundColor: '#FFE66D' 
                        }]} />
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* Vue Vitamines */}
            {currentView === 'vitamines' && (
              <View style={styles.combinedStatsCard}>
                <View style={styles.microGrid}>
                  <View style={styles.microItem}>
                    <Text style={styles.microLabel}>Vit. A</Text>
                    <Text style={styles.microValue}>{Math.round(dailyTotals.vitaminA)}μg</Text>
                    <View style={styles.microProgressBar}>
                      <View style={[styles.microProgressFill, { 
                        width: `${Math.min((dailyTotals.vitaminA / microGoals.vitaminA) * 100, 100)}%`,
                        backgroundColor: dailyTotals.vitaminA >= microGoals.vitaminA * 0.8 ? '#28A745' : '#F5A623'
                      }]} />
                    </View>
                  </View>

                  <View style={styles.microItem}>
                    <Text style={styles.microLabel}>Vit. C</Text>
                    <Text style={styles.microValue}>{Math.round(dailyTotals.vitaminC)}mg</Text>
                    <View style={styles.microProgressBar}>
                      <View style={[styles.microProgressFill, { 
                        width: `${Math.min((dailyTotals.vitaminC / microGoals.vitaminC) * 100, 100)}%`,
                        backgroundColor: dailyTotals.vitaminC >= microGoals.vitaminC * 0.8 ? '#28A745' : '#F5A623'
                      }]} />
                    </View>
                  </View>

                  <View style={styles.microItem}>
                    <Text style={styles.microLabel}>Vit. D</Text>
                    <Text style={styles.microValue}>{Math.round(dailyTotals.vitaminD * 10) / 10}μg</Text>
                    <View style={styles.microProgressBar}>
                      <View style={[styles.microProgressFill, { 
                        width: `${Math.min((dailyTotals.vitaminD / microGoals.vitaminD) * 100, 100)}%`,
                        backgroundColor: dailyTotals.vitaminD >= microGoals.vitaminD * 0.8 ? '#28A745' : '#F5A623'
                      }]} />
                    </View>
                  </View>

                  <View style={styles.microItem}>
                    <Text style={styles.microLabel}>Vit. E</Text>
                    <Text style={styles.microValue}>{Math.round(dailyTotals.vitaminE * 10) / 10}mg</Text>
                    <View style={styles.microProgressBar}>
                      <View style={[styles.microProgressFill, { 
                        width: `${Math.min((dailyTotals.vitaminE / microGoals.vitaminE) * 100, 100)}%`,
                        backgroundColor: dailyTotals.vitaminE >= microGoals.vitaminE * 0.8 ? '#28A745' : '#F5A623'
                      }]} />
                    </View>
                  </View>

                  <View style={styles.microItem}>
                    <Text style={styles.microLabel}>Vit. K</Text>
                    <Text style={styles.microValue}>{Math.round(dailyTotals.vitaminK * 10) / 10}μg</Text>
                    <View style={styles.microProgressBar}>
                      <View style={[styles.microProgressFill, { 
                        width: `${Math.min((dailyTotals.vitaminK / microGoals.vitaminK) * 100, 100)}%`,
                        backgroundColor: dailyTotals.vitaminK >= microGoals.vitaminK * 0.8 ? '#28A745' : '#F5A623'
                      }]} />
                    </View>
                  </View>

                  <View style={styles.microItem}>
                    <Text style={styles.microLabel}>Vit. B1</Text>
                    <Text style={styles.microValue}>{Math.round(dailyTotals.vitaminB1 * 100) / 100}mg</Text>
                    <View style={styles.microProgressBar}>
                      <View style={[styles.microProgressFill, { 
                        width: `${Math.min((dailyTotals.vitaminB1 / microGoals.vitaminB1) * 100, 100)}%`,
                        backgroundColor: dailyTotals.vitaminB1 >= microGoals.vitaminB1 * 0.8 ? '#28A745' : '#F5A623'
                      }]} />
                    </View>
                  </View>

                  <View style={styles.microItem}>
                    <Text style={styles.microLabel}>Vit. B2</Text>
                    <Text style={styles.microValue}>{Math.round(dailyTotals.vitaminB2 * 100) / 100}mg</Text>
                    <View style={styles.microProgressBar}>
                      <View style={[styles.microProgressFill, { 
                        width: `${Math.min((dailyTotals.vitaminB2 / microGoals.vitaminB2) * 100, 100)}%`,
                        backgroundColor: dailyTotals.vitaminB2 >= microGoals.vitaminB2 * 0.8 ? '#28A745' : '#F5A623'
                      }]} />
                    </View>
                  </View>

                  <View style={styles.microItem}>
                    <Text style={styles.microLabel}>Vit. B3</Text>
                    <Text style={styles.microValue}>{Math.round(dailyTotals.vitaminB3 * 10) / 10}mg</Text>
                    <View style={styles.microProgressBar}>
                      <View style={[styles.microProgressFill, { 
                        width: `${Math.min((dailyTotals.vitaminB3 / microGoals.vitaminB3) * 100, 100)}%`,
                        backgroundColor: dailyTotals.vitaminB3 >= microGoals.vitaminB3 * 0.8 ? '#28A745' : '#F5A623'
                      }]} />
                    </View>
                  </View>

                  <View style={styles.microItem}>
                    <Text style={styles.microLabel}>Vit. B6</Text>
                    <Text style={styles.microValue}>{Math.round(dailyTotals.vitaminB6 * 100) / 100}mg</Text>
                    <View style={styles.microProgressBar}>
                      <View style={[styles.microProgressFill, { 
                        width: `${Math.min((dailyTotals.vitaminB6 / microGoals.vitaminB6) * 100, 100)}%`,
                        backgroundColor: dailyTotals.vitaminB6 >= microGoals.vitaminB6 * 0.8 ? '#28A745' : '#F5A623'
                      }]} />
                    </View>
                  </View>

                  <View style={styles.microItem}>
                    <Text style={styles.microLabel}>Vit. B9</Text>
                    <Text style={styles.microValue}>{Math.round(dailyTotals.vitaminB9 * 10) / 10}μg</Text>
                    <View style={styles.microProgressBar}>
                      <View style={[styles.microProgressFill, { 
                        width: `${Math.min((dailyTotals.vitaminB9 / microGoals.vitaminB9) * 100, 100)}%`,
                        backgroundColor: dailyTotals.vitaminB9 >= microGoals.vitaminB9 * 0.8 ? '#28A745' : '#F5A623'
                      }]} />
                    </View>
                  </View>

                  <View style={styles.microItem}>
                    <Text style={styles.microLabel}>Vit. B12</Text>
                    <Text style={styles.microValue}>{Math.round(dailyTotals.vitaminB12 * 100) / 100}μg</Text>
                    <View style={styles.microProgressBar}>
                      <View style={[styles.microProgressFill, { 
                        width: `${Math.min((dailyTotals.vitaminB12 / microGoals.vitaminB12) * 100, 100)}%`,
                        backgroundColor: dailyTotals.vitaminB12 >= microGoals.vitaminB12 * 0.8 ? '#28A745' : '#F5A623'
                      }]} />
                    </View>
                  </View>

                  <View style={styles.microItem}>
                    <Text style={styles.microLabel}>Biotine</Text>
                    <Text style={styles.microValue}>{Math.round(dailyTotals.vitaminB7 * 1000) / 1000}μg</Text>
                    <View style={styles.microProgressBar}>
                      <View style={[styles.microProgressFill, { 
                        width: `${Math.min((dailyTotals.vitaminB7 / microGoals.vitaminB7) * 100, 100)}%`,
                        backgroundColor: dailyTotals.vitaminB7 >= microGoals.vitaminB7 * 0.8 ? '#28A745' : '#F5A623'
                      }]} />
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* Vue Minéraux */}
            {currentView === 'mineraux' && (
              <View style={styles.combinedStatsCard}>
                <View style={styles.microGrid}>
                  <View style={styles.microItem}>
                    <Text style={styles.microLabel}>Calcium</Text>
                    <Text style={styles.microValue}>{Math.round(dailyTotals.calcium)}mg</Text>
                    <View style={styles.microProgressBar}>
                      <View style={[styles.microProgressFill, { 
                        width: `${Math.min((dailyTotals.calcium / microGoals.calcium) * 100, 100)}%`,
                        backgroundColor: dailyTotals.calcium >= microGoals.calcium * 0.8 ? '#28A745' : '#F5A623'
                      }]} />
                    </View>
                  </View>

                  <View style={styles.microItem}>
                    <Text style={styles.microLabel}>Fer</Text>
                    <Text style={styles.microValue}>{Math.round(dailyTotals.iron * 100) / 100}mg</Text>
                    <View style={styles.microProgressBar}>
                      <View style={[styles.microProgressFill, { 
                        width: `${Math.min((dailyTotals.iron / microGoals.iron) * 100, 100)}%`,
                        backgroundColor: dailyTotals.iron >= microGoals.iron * 0.8 ? '#28A745' : '#F5A623'
                      }]} />
                    </View>
                  </View>

                  <View style={styles.microItem}>
                    <Text style={styles.microLabel}>Magnésium</Text>
                    <Text style={styles.microValue}>{Math.round(dailyTotals.magnesium)}mg</Text>
                    <View style={styles.microProgressBar}>
                      <View style={[styles.microProgressFill, { 
                        width: `${Math.min((dailyTotals.magnesium / microGoals.magnesium) * 100, 100)}%`,
                        backgroundColor: dailyTotals.magnesium >= microGoals.magnesium * 0.8 ? '#28A745' : '#F5A623'
                      }]} />
                    </View>
                  </View>

                  <View style={styles.microItem}>
                    <Text style={styles.microLabel}>Potassium</Text>
                    <Text style={styles.microValue}>{Math.round(dailyTotals.potassium)}mg</Text>
                    <View style={styles.microProgressBar}>
                      <View style={[styles.microProgressFill, { 
                        width: `${Math.min((dailyTotals.potassium / microGoals.potassium) * 100, 100)}%`,
                        backgroundColor: dailyTotals.potassium >= microGoals.potassium * 0.8 ? '#28A745' : '#F5A623'
                      }]} />
                    </View>
                  </View>

                  <View style={styles.microItem}>
                    <Text style={styles.microLabel}>Zinc</Text>
                    <Text style={styles.microValue}>{Math.round(dailyTotals.zinc * 100) / 100}mg</Text>
                    <View style={styles.microProgressBar}>
                      <View style={[styles.microProgressFill, { 
                        width: `${Math.min((dailyTotals.zinc / microGoals.zinc) * 100, 100)}%`,
                        backgroundColor: dailyTotals.zinc >= microGoals.zinc * 0.8 ? '#28A745' : '#F5A623'
                      }]} />
                    </View>
                  </View>

                  <View style={styles.microItem}>
                    <Text style={styles.microLabel}>Sodium</Text>
                    <Text style={styles.microValue}>{Math.round(dailyTotals.sodium)}mg</Text>
                    <View style={styles.microProgressBar}>
                      <View style={[styles.microProgressFill, { 
                        width: `${Math.min((dailyTotals.sodium / microGoals.sodium) * 100, 100)}%`,
                        backgroundColor: dailyTotals.sodium <= microGoals.sodium * 0.8 ? '#28A745' : '#FF6B6B'
                      }]} />
                    </View>
                  </View>

                  <View style={styles.microItem}>
                    <Text style={styles.microLabel}>Phosphore</Text>
                    <Text style={styles.microValue}>{Math.round(dailyTotals.phosphorus)}mg</Text>
                    <View style={styles.microProgressBar}>
                      <View style={[styles.microProgressFill, { 
                        width: `${Math.min((dailyTotals.phosphorus / microGoals.phosphorus) * 100, 100)}%`,
                        backgroundColor: dailyTotals.phosphorus >= microGoals.phosphorus * 0.8 ? '#28A745' : '#F5A623'
                      }]} />
                    </View>
                  </View>

                  <View style={styles.microItem}>
                    <Text style={styles.microLabel}>Sélénium</Text>
                    <Text style={styles.microValue}>{Math.round(dailyTotals.selenium * 100) / 100}μg</Text>
                    <View style={styles.microProgressBar}>
                      <View style={[styles.microProgressFill, { 
                        width: `${Math.min((dailyTotals.selenium / microGoals.selenium) * 100, 100)}%`,
                        backgroundColor: dailyTotals.selenium >= microGoals.selenium * 0.8 ? '#28A745' : '#F5A623'
                      }]} />
                    </View>
                  </View>

                  <View style={styles.microItem}>
                    <Text style={styles.microLabel}>Cuivre</Text>
                    <Text style={styles.microValue}>{Math.round(dailyTotals.copper * 1000) / 1000}mg</Text>
                    <View style={styles.microProgressBar}>
                      <View style={[styles.microProgressFill, { 
                        width: `${Math.min((dailyTotals.copper / microGoals.copper) * 100, 100)}%`,
                        backgroundColor: dailyTotals.copper >= microGoals.copper * 0.8 ? '#28A745' : '#F5A623'
                      }]} />
                    </View>
                  </View>

                  <View style={styles.microItem}>
                    <Text style={styles.microLabel}>Iode</Text>
                    <Text style={styles.microValue}>{Math.round(dailyTotals.iodine * 100) / 100}μg</Text>
                    <View style={styles.microProgressBar}>
                      <View style={[styles.microProgressFill, { 
                        width: `${Math.min((dailyTotals.iodine / microGoals.iodine) * 100, 100)}%`,
                        backgroundColor: dailyTotals.iodine >= microGoals.iodine * 0.8 ? '#28A745' : '#F5A623'
                      }]} />
                    </View>
                  </View>

                  <View style={styles.microItem}>
                    <Text style={styles.microLabel}>Manganèse</Text>
                    <Text style={styles.microValue}>{Math.round(dailyTotals.manganese * 1000) / 1000}mg</Text>
                    <View style={styles.microProgressBar}>
                      <View style={[styles.microProgressFill, { 
                        width: `${Math.min((dailyTotals.manganese / microGoals.manganese) * 100, 100)}%`,
                        backgroundColor: dailyTotals.manganese >= microGoals.manganese * 0.8 ? '#28A745' : '#F5A623'
                      }]} />
                    </View>
                  </View>

                  <View style={styles.microItem}>
                    <Text style={styles.microLabel}>Chrome</Text>
                    <Text style={styles.microValue}>{Math.round(dailyTotals.chromium * 1000) / 1000}μg</Text>
                    <View style={styles.microProgressBar}>
                      <View style={[styles.microProgressFill, { 
                        width: `${Math.min((dailyTotals.chromium / microGoals.chromium) * 100, 100)}%`,
                        backgroundColor: dailyTotals.chromium >= microGoals.chromium * 0.8 ? '#28A745' : '#F5A623'
                      }]} />
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* Vue Autres */}
            {currentView === 'autres' && (
              <View style={styles.combinedStatsCard}>
                <View style={styles.microGrid}>
                  <View style={styles.microItem}>
                    <Text style={styles.microLabel}>Caféine</Text>
                    <Text style={styles.microValue}>{Math.round(dailyTotals.caffeine * 10) / 10}mg</Text>
                    <View style={styles.microProgressBar}>
                      <View style={[styles.microProgressFill, { 
                        width: `${Math.min((dailyTotals.caffeine / microGoals.caffeine) * 100, 100)}%`,
                        backgroundColor: dailyTotals.caffeine <= microGoals.caffeine * 0.8 ? '#28A745' : '#FF6B6B'
                      }]} />
                    </View>
                  </View>

                  <View style={styles.microItem}>
                    <Text style={styles.microLabel}>Fibres</Text>
                    <Text style={styles.microValue}>{Math.round(dailyTotals.fiber * 10) / 10}g</Text>
                    <View style={styles.microProgressBar}>
                      <View style={[styles.microProgressFill, { 
                        width: `${Math.min((dailyTotals.fiber / microGoals.fiber) * 100, 100)}%`,
                        backgroundColor: dailyTotals.fiber >= microGoals.fiber * 0.8 ? '#28A745' : '#F5A623'
                      }]} />
                    </View>
                  </View>

                  <View style={styles.microItem}>
                    <Text style={styles.microLabel}>Oméga-3</Text>
                    <Text style={styles.microValue}>{Math.round(dailyTotals.omega3 * 100) / 100}g</Text>
                    <View style={styles.microProgressBar}>
                      <View style={[styles.microProgressFill, { 
                        width: `${Math.min((dailyTotals.omega3 / microGoals.omega3) * 100, 100)}%`,
                        backgroundColor: dailyTotals.omega3 >= microGoals.omega3 * 0.8 ? '#28A745' : '#F5A623'
                      }]} />
                    </View>
                  </View>

                  <View style={styles.microItem}>
                    <Text style={styles.microLabel}>Oméga-6</Text>
                    <Text style={styles.microValue}>{Math.round(dailyTotals.omega6 * 100) / 100}g</Text>
                    <View style={styles.microProgressBar}>
                      <View style={[styles.microProgressFill, { 
                        width: `${Math.min((dailyTotals.omega6 / microGoals.omega6) * 100, 100)}%`,
                        backgroundColor: dailyTotals.omega6 >= microGoals.omega6 * 0.8 ? '#28A745' : '#F5A623'
                      }]} />
                    </View>
                  </View>
                </View>
              </View>
            )}
          </View>



          {/* Boutons de navigation */}
          <View style={styles.navigationButtons}>
            <TouchableOpacity 
              style={[styles.navButton, currentView === 'macros' && styles.activeNavButton]}
              onPress={() => setCurrentView('macros')}
            >
              <Text style={[styles.navButtonText, currentView === 'macros' && styles.activeNavButtonText]}>
                Macros
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.navButton, currentView === 'vitamines' && styles.activeNavButton]}
              onPress={() => setCurrentView('vitamines')}
            >
              <Text style={[styles.navButtonText, currentView === 'vitamines' && styles.activeNavButtonText]}>
                Vitamines
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.navButton, currentView === 'mineraux' && styles.activeNavButton]}
              onPress={() => setCurrentView('mineraux')}
            >
              <Text style={[styles.navButtonText, currentView === 'mineraux' && styles.activeNavButtonText]}>
                Minéraux
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.navButton, currentView === 'autres' && styles.activeNavButton]}
              onPress={() => setCurrentView('autres')}
            >
              <Text style={[styles.navButtonText, currentView === 'autres' && styles.activeNavButtonText]}>
                Autres
              </Text>
            </TouchableOpacity>
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

        {/* Modal Coming Soon pour Programme Nutrition */}
        <ComingSoonModal
          visible={showComingSoonModal}
          onClose={() => setShowComingSoonModal(false)}
          feature="🍽️ Programme Nutrition Premium"
          description="Accédez à des programmes nutritionnels personnalisés créés par nos coaches certifiés pour atteindre vos objectifs plus rapidement."
        />

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
    borderRadius: 12,
    backgroundColor: 'rgba(245, 166, 35, 0.15)',
    borderWidth: 2,
    borderColor: 'rgba(245, 166, 35, 0.4)',
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 4px 12px rgba(255, 165, 0, 0.25)',
    elevation: 8,
  },
  arrowText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFA500',
    textShadowColor: 'rgba(245, 166, 35, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    textAlign: 'center',
    lineHeight: 22,
    textAlignVertical: 'center',
    includeFontPadding: false,
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
    shadowColor: '#FFA500',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    width: width - 40,
    minHeight: 200, // Hauteur fixe pour tous les cadres
  },
  macrosLayout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  caloriesGaugeContainer: {
    alignItems: 'center',
    flex: 0,
  },
  circularGauge: {
    width: 120,
    height: 120,
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
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 24,
  },
  caloriesTarget: {
    fontSize: 13,
    color: '#FFA500',
    lineHeight: 15,
    fontWeight: '500',
  },
  caloriesLabel: {
    fontSize: 12,
    color: '#8B949E',
    marginTop: 2,
    fontWeight: '600',
  },
  caloriesSubtext: {
    fontSize: 10,
    color: '#8B949E',
    textAlign: 'center',
    fontWeight: '500',
  },
  macrosProgressContainer: {
    flex: 1,
    gap: 16,
  },
  macroProgressItem: {
    backgroundColor: 'rgba(13, 17, 23, 0.7)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 165, 0, 0.2)',
  },
  macroProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  macroProgressLabel: {
    fontSize: 12,
    color: '#8B949E',
    fontWeight: '600',
  },
  macroProgressValue: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  macroProgressBar: {
    height: 4,
    backgroundColor: 'rgba(33, 38, 45, 0.8)',
    borderRadius: 2,
    overflow: 'hidden',
    width: '100%',
  },
  macroProgressFill: {
    height: '100%',
    borderRadius: 2,
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

  // Styles pour le système de navigation
  swipeContainer: {
    width: '100%',
    alignItems: 'center',
  },

  // Styles pour les micronutriments
  microTitle: {
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 165, 0, 0.2)',
  },
  microTitleText: {
    fontSize: width < 375 ? 16 : 17,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  microSubtitle: {
    fontSize: width < 375 ? 11 : 12,
    color: '#8B949E',
    fontWeight: '500',
  },
  microSection: {
    marginBottom: 12,
  },
  microSectionTitle: {
    fontSize: width < 375 ? 12 : 14,
    fontWeight: '600',
    color: '#FFA500',
    marginBottom: 8,
  },
  microGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 3,
    justifyContent: 'space-between',
    paddingTop: 8,
    flex: 1,
    alignContent: 'flex-start',
  },
  microItem: {
    backgroundColor: 'rgba(13, 17, 23, 0.7)',
    borderRadius: 6,
    padding: width < 375 ? 6 : 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 165, 0, 0.15)',
    width: '24%', // 4 colonnes avec 1% d'espacement
    alignItems: 'center',
    minHeight: 48,
    marginBottom: 4,
  },
  microLabel: {
    fontSize: width < 375 ? 8 : 9,
    color: '#8B949E',
    fontWeight: '600',
    marginBottom: 2,
    textAlign: 'center',
  },
  microValue: {
    fontSize: width < 375 ? 9 : 10,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 3,
    textAlign: 'center',
  },
  microProgressBar: {
    height: 3,
    backgroundColor: 'rgba(33, 38, 45, 0.8)',
    borderRadius: 1.5,
    overflow: 'hidden',
    width: '100%',
  },
  microProgressFill: {
    height: '100%',
    borderRadius: 1.5,
  },



  // Styles pour les boutons de navigation
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  navButton: {
    paddingVertical: 6,
    paddingHorizontal: width < 375 ? 10 : 12,
    borderRadius: 12,
    backgroundColor: 'rgba(22, 27, 34, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(139, 148, 158, 0.3)',
  },
  activeNavButton: {
    backgroundColor: 'rgba(255, 165, 0, 0.2)',
    borderColor: '#FFA500',
  },
  navButtonText: {
    fontSize: width < 375 ? 9 : 10,
    color: '#8B949E',
    fontWeight: '600',
  },
  activeNavButtonText: {
    color: '#FFA500',
    fontWeight: '700',
  },
});

export default NutritionScreen;