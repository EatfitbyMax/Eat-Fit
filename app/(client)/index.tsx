
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
import { PersistentStorage } from '@/utils/storage';
import { checkSubscriptionStatus } from '@/utils/subscription';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  userType: 'client' | 'coach';
  weight?: number;
  targetWeight?: number;
  age?: number;
  height?: number;
  gender?: string;
  activityLevel?: string;
  goals?: string[];
  createdAt?: string;
}

export default function HomeScreen() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isPremium, setIsPremium] = useState(false);
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
  const [weeklyWorkouts, setWeeklyWorkouts] = useState(0);
  const [weightData, setWeightData] = useState({
    startWeight: 0,
    currentWeight: 0,
    targetWeight: 0,
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
  }, []);

  // Rechargement automatique quand l'écran est focalisé
  useFocusEffect(
    React.useCallback(() => {
      const loadDataOnFocus = async () => {
        try {
          await loadUserData();
          await loadTodayStats();
          await loadFormeScore();
          await loadWeightData();
          await calculateWeeklyWorkouts();
          setConnectionError(null);
        } catch (error: any) {
          console.error('Erreur chargement données:', error);
          setConnectionError(error.message);
        }
      };

      loadDataOnFocus();
    }, [])
  );

  const generateRandomTip = () => {
    const randomIndex = Math.floor(Math.random() * tips.length);
    setCurrentTip(tips[randomIndex]);
  };

  const handleRefreshTip = () => {
    generateRandomTip();
  };

  const calculatePersonalizedGoals = (user: User) => {
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

    const activityFactor = activityFactors[user.activityLevel as keyof typeof activityFactors] || 1.2;
    let totalCalories = Math.round(bmr * activityFactor);

    // Ajustements selon les objectifs
    const goals = user.goals || [];

    if (goals.includes('Perdre du poids')) {
      totalCalories -= 300; // Déficit de 300 kcal pour perte de poids
    } else if (goals.includes('Prendre du muscle')) {
      totalCalories += 200; // Surplus de 200 kcal pour prise de muscle
    }

    // Calcul des macronutriments selon les objectifs
    let proteinRatio = 0.20; // 20% par défaut
    let carbRatio = 0.50;    // 50% par défaut
    let fatRatio = 0.30;     // 30% par défaut

    if (goals.includes('Me muscler')) {
      proteinRatio = 0.30; // 30%
      carbRatio = 0.45;    // 45%
      fatRatio = 0.25;     // 25%
    } else if (goals.includes('Gagner en performance')) {
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

  const loadUserData = async () => {
    try {
      setConnectionError(null);
      console.log('🔄 Chargement des données utilisateur...');
      
      const currentUser = await getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        console.log('👤 Utilisateur chargé:', currentUser.firstName, currentUser.lastName);

        // Vérifier le statut premium
        try {
          const subscription = await checkSubscriptionStatus();
          setIsPremium(subscription.isPremium);
          console.log(`📱 Statut Premium Accueil: ${subscription.isPremium ? 'OUI' : 'NON'}`);
        } catch (error) {
          console.error('❌ Erreur vérification premium:', error);
          setIsPremium(false);
        }

        // Calculer les objectifs personnalisés
        const personalizedGoals = calculatePersonalizedGoals(currentUser);
        setCalorieGoals(personalizedGoals);
      } else {
        throw new Error('Aucun utilisateur connecté');
      }
    } catch (error: any) {
      console.error('❌ Erreur chargement utilisateur:', error);
      setConnectionError(error.message || 'Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  const loadFormeScore = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) return;

      const today = new Date().toISOString().split('T')[0];

      // Récupérer le score calculé et sauvegardé par la page Forme
      try {
        const savedScore = await AsyncStorage.getItem(`forme_score_${currentUser.id}_${today}`);
        if (savedScore) {
          const score = parseInt(savedScore);
          setFormeScore(score);
          console.log(`📊 Score de forme récupéré: ${score}/100`);
        } else {
          // Si aucun score sauvegardé, utiliser une valeur par défaut
          setFormeScore(75);
          console.log('📊 Score de forme par défaut: 75/100');
        }
      } catch (error) {
        console.log('❌ Erreur récupération score de forme, utilisation du score par défaut');
        setFormeScore(75);
      }
    } catch (error: any) {
      console.error('❌ Erreur récupération score de forme:', error);
      setFormeScore(75); // Valeur par défaut
    }
  };

  const loadTodayStats = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) return;

      const today = new Date().toISOString().split('T')[0];
      console.log('📊 Chargement statistiques pour:', currentUser.email, 'Date:', today);

      // 1. Récupérer les calories depuis la nutrition
      let totalCalories = 0;
      try {
        const nutritionEntries = await PersistentStorage.getUserNutrition(currentUser.id);
        const todayEntries = nutritionEntries.filter((entry: any) => entry.date === today);
        totalCalories = todayEntries.reduce((sum: number, entry: any) => sum + (entry.calories || 0), 0);
        console.log('🔥 Total calories calculé:', totalCalories);
      } catch (error) {
        console.error('❌ Erreur récupération calories:', error);
        totalCalories = 0;
      }

      // 2. Récupérer le nombre de séances
      let totalWorkouts = 0;
      try {
        const localWorkouts = await PersistentStorage.getWorkouts(currentUser.id);
        const todayLocalWorkouts = localWorkouts.filter((workout: any) => workout.date === today);
        totalWorkouts = todayLocalWorkouts.length;
        console.log(`💪 Séances aujourd'hui: ${totalWorkouts}`);
      } catch (error) {
        console.error('❌ Erreur récupération séances:', error);
        totalWorkouts = 0;
      }

      // 3. Récupérer les pas depuis Apple Health (optionnel)
      let totalSteps = 0;
      try {
        const healthData = await IntegrationsManager.getHealthData(currentUser.id);
        const todayHealthData = healthData.find((data: any) => data.date === today);
        if (todayHealthData) {
          totalSteps = todayHealthData.steps || 0;
        }
      } catch (error) {
        console.log('⚠️ Pas de données Apple Health disponibles');
        totalSteps = 0;
      }

      setTodayStats({
        calories: Math.round(totalCalories),
        workouts: totalWorkouts,
        steps: totalSteps,
      });

      console.log(`✅ Statistiques chargées: ${Math.round(totalCalories)} calories, ${totalWorkouts} séances, ${totalSteps} pas`);
    } catch (error: any) {
      console.error('❌ Erreur chargement statistiques:', error);
      // Maintenir les valeurs existantes en cas d'erreur
      setTodayStats(prevStats => ({
        calories: prevStats.calories || 0,
        workouts: prevStats.workouts || 0,
        steps: prevStats.steps || 0,
      }));
    }
  };

  const loadWeightData = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) return;

      console.log('⚖️ Chargement données de poids...');
      const data = await PersistentStorage.getUserWeight(currentUser.id);
      setWeightData(data);
      console.log('⚖️ Données poids chargées:', data);
    } catch (error: any) {
      console.error('❌ Erreur chargement données poids:', error);
      // Utiliser les données du profil utilisateur si disponibles
      if (user) {
        setWeightData({
          startWeight: user.weight || 0,
          currentWeight: user.weight || 0,
          targetWeight: user.targetWeight || 0,
        });
      }
    }
  };

  const calculateWeeklyWorkouts = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) return;

      // Calculer les dates de début et fin de semaine
      const today = new Date();
      const startOfWeek = new Date(today);
      const dayOfWeek = today.getDay();
      const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      startOfWeek.setDate(diff);
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      console.log(`💪 Calcul séances semaine du ${startOfWeek.toISOString().split('T')[0]} au ${endOfWeek.toISOString().split('T')[0]}`);

      let weeklyWorkoutsCount = 0;
      try {
        const workouts = await PersistentStorage.getWorkouts(currentUser.id);
        
        const weekWorkouts = workouts.filter((workout: any) => {
          const workoutDate = new Date(workout.date + 'T00:00:00');
          return workoutDate >= startOfWeek && workoutDate <= endOfWeek;
        });

        weeklyWorkoutsCount = weekWorkouts.length;
        console.log(`💪 Séances cette semaine: ${weeklyWorkoutsCount}`);
      } catch (error) {
        console.error('❌ Erreur récupération workouts:', error);
        weeklyWorkoutsCount = 0;
      }

      setWeeklyWorkouts(weeklyWorkoutsCount);
    } catch (error: any) {
      console.error('❌ Erreur calcul séances hebdomadaires:', error);
      setWeeklyWorkouts(0);
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
              try {
                await syncWithExternalApps(user?.id || '');
                Alert.alert('Succès', 'Synchronisation terminée');
                setConnectionError(null);
                // Recharger les données après synchronisation
                await loadTodayStats();
              } catch (error: any) {
                setConnectionError(error.message || 'Erreur de synchronisation');
                Alert.alert('Erreur', error.message || 'Impossible de synchroniser les données');
              }
            }
          }
        ]
      );
    } catch (error: any) {
      setConnectionError(error.message || 'Erreur de synchronisation');
      Alert.alert('Erreur', error.message || 'Impossible de synchroniser les données');
    }
  };

  const handleRetryConnection = async () => {
    setLoading(true);
    setConnectionError(null);
    try {
      await loadUserData();
    } catch (error: any) {
      setConnectionError(error.message || 'Erreur de connexion');
    } finally {
      setLoading(false);
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

  const getTrainingGoal = () => {
    if (!user) return Math.max(weeklyWorkouts, 1);

    let baseGoal = Math.max(weeklyWorkouts, 1);

    if (user.goals?.includes('Me muscler') || user.goals?.includes('Gagner en performance')) {
      baseGoal = Math.max(baseGoal, weeklyWorkouts + 1);
    }

    if (user.goals?.includes('Perdre du poids')) {
      baseGoal = Math.max(baseGoal, 2);
    }

    if (weeklyWorkouts === 0) {
      return user.goals?.includes('Perdre du poids') ? 2 : 1;
    }

    return baseGoal;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Connexion au serveur...</Text>
      </View>
    );
  }

  // Affichage d'erreur de connexion
  if (connectionError) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Connexion requise</Text>
          <Text style={styles.errorMessage}>{connectionError}</Text>
          <Text style={styles.errorSubMessage}>
            Cette application nécessite une connexion internet pour fonctionner.
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetryConnection}>
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
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
                <Text style={styles.profileInitial}>
                  {user?.firstName?.charAt(0) || 'U'}
                </Text>
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
          <Text style={styles.sectionTitle}>Mes objectifs</Text>

          {/* Objectif Nutrition */}
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

          {/* Objectif Entraînement */}
          <View style={styles.goalCard}>
            <View style={styles.goalHeader}>
              <Text style={styles.goalTitle}>💪 Objectif d'entraînements</Text>
              <Text style={styles.goalProgress}>{weeklyWorkouts}/{getTrainingGoal()}</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[
                styles.progressFill, 
                { 
                  width: `${Math.min((weeklyWorkouts / getTrainingGoal()) * 100, 100)}%`,
                  backgroundColor: weeklyWorkouts >= getTrainingGoal() ? '#28A745' : '#F5A623'
                }
              ]} />
            </View>
            <Text style={styles.goalSubtext}>
              {weeklyWorkouts >= getTrainingGoal() 
                ? 'Objectif hebdomadaire atteint ! 🎉' 
                : weeklyWorkouts === 0 
                  ? 'Planifiez vos séances dans Entraînement'
                  : `${Math.max(0, getTrainingGoal() - weeklyWorkouts)} séance${getTrainingGoal() - weeklyWorkouts > 1 ? 's' : ''} supplémentaire${getTrainingGoal() - weeklyWorkouts > 1 ? 's' : ''} suggérée${getTrainingGoal() - weeklyWorkouts > 1 ? 's' : ''}`
              }
            </Text>
          </View>

          {/* Objectif Perte de poids */}
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

          {/* Objectif secondaire */}
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0D1117',
    paddingHorizontal: 20,
  },
  errorTitle: {
    color: '#FF6B6B',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  errorMessage: {
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 12,
    textAlign: 'center',
  },
  errorSubMessage: {
    color: '#8B949E',
    fontSize: 14,
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: '#F5A623',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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
