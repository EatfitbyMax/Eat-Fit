import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Alert, TextInput } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { IntegrationsManager, StravaActivity } from '../../utils/integrations';
import { getCurrentUser } from '../../utils/auth';
import { checkSubscriptionStatus } from '../../utils/subscription';
import { getUserData, PersistentStorage } from '@/utils/storage';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { getRecommendedPrograms, getSportEmoji, getSportName, WorkoutProgram } from '@/utils/sportPrograms';

export default function EntrainementScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [selectedTab, setSelectedTab] = useState('Journal');
  const [selectedDay, setSelectedDay] = useState('Lundi');
  const [stravaActivities, setStravaActivities] = useState<StravaActivity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [currentWeek, setCurrentWeek] = useState(() => {
    // Utiliser la date actuelle en UTC pour éviter les problèmes de fuseau horaire
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [showAddWorkout, setShowAddWorkout] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedStravaActivity, setSelectedStravaActivity] = useState<StravaActivity | null>(null);
  const [userSport, setUserSport] = useState<string>('');
  const [recommendedPrograms, setRecommendedPrograms] = useState<WorkoutProgram[]>([]);
  const [showRPEModal, setShowRPEModal] = useState(false);
  const [activityToRate, setActivityToRate] = useState<StravaActivity | null>(null);
  const [rpeRating, setRpeRating] = useState(5);
  const [rpeNotes, setRpeNotes] = useState('');
  const [activityRatings, setActivityRatings] = useState<{[key: string]: {rpe: number, notes: string, date: string}}>({});

  const daysOfWeek = [
    'Lundi', 
    'Mardi', 
    'Mercredi', 
    'Jeudi', 
    'Vendredi', 
    'Samedi', 
    'Dimanche'
  ];

  useEffect(() => {
    loadStravaActivities();
    checkUserSubscription();
    loadWorkouts();
    loadActivityRatings();
  }, []);

  // Debug pour la semaine courante et force refresh des composants
  useEffect(() => {
    const { start, end } = getWeekRange();
    console.log(`=== SEMAINE COURANTE ===`);
    console.log(`Début: ${start.toISOString().split('T')[0]} (${start.toDateString()})`);
    console.log(`Fin: ${end.toISOString().split('T')[0]} (${end.toDateString()})`);
    console.log(`Workouts chargés: ${workouts.length}`);

    // Grouper les workouts par date pour debug
    const workoutsByDate = workouts.reduce((acc: any, workout: any) => {
      if (!acc[workout.date]) acc[workout.date] = [];
      acc[workout.date].push(workout.name);
      return acc;
    }, {});

    console.log('Workouts par date:', workoutsByDate);
    console.log('=== FIN DEBUG SEMAINE ===');

    // Forcer un petit délai pour s'assurer que l'UI se met à jour
    setTimeout(() => {
      console.log('Force refresh UI terminé');
    }, 100);
  }, [workouts, currentWeek]);

  // Rechargement automatique quand l'écran est focalisé
  useFocusEffect(
    useCallback(() => {
      console.log('=== FOCUS EFFECT: RECHARGEMENT COMPLET ===');
      // Délai pour s'assurer que les données sont bien sauvegardées
      setTimeout(() => {
        loadWorkouts();
        // Forcer un re-render en mettant à jour l'état
        setCurrentWeek(prev => new Date(prev.getTime()));
      }, 200);
    }, [])
  );

  // Rafraîchissement automatique constant toutes les 3 secondes
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('=== RAFRAÎCHISSEMENT AUTOMATIQUE ===');
      loadWorkouts();
      // Forcer un re-render subtil
      setCurrentWeek(prev => new Date(prev.getTime()));
    }, 3000); // Rafraîchit toutes les 3 secondes

    return () => clearInterval(interval);
  }, []);

  const loadWorkouts = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        console.log('Aucun utilisateur connecté pour charger les entraînements');
        setWorkouts([]);
        return;
      }

      console.log('=== CHARGEMENT TOUS LES ENTRAINEMENTS ===');

      // Charger depuis le serveur VPS d'abord
      try {
        const workouts = await PersistentStorage.getWorkouts(currentUser.id);
        console.log(`Total entraînements chargés depuis le serveur: ${workouts.length}`);

        // Debug: grouper par date
        const workoutsByDate = workouts.reduce((acc: any, workout: any) => {
          if (!acc[workout.date]) acc[workout.date] = [];
          acc[workout.date].push(workout.name);
          return acc;
        }, {});

        Object.keys(workoutsByDate).forEach(date => {
          console.log(`${date}: ${workoutsByDate[date].length} entraînement(s)`);
          workoutsByDate[date].forEach((w: any, i: number) => {
            console.log(`  ${i + 1}. ${w.name} (${w.type})`);
          });
        });

        // Forcer la mise à jour de l'état même si les données sont identiques
        setWorkouts([...workouts]);
      } catch (error) {
        console.error('Erreur chargement entraînements depuis serveur:', error);
        // Fallback vers le stockage local
        const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
        const storedWorkouts = await AsyncStorage.getItem(`workouts_${currentUser.id}`);

        if (storedWorkouts) {
          const allWorkouts = JSON.parse(storedWorkouts);
          console.log(`Total entraînements chargés en local: ${allWorkouts.length}`);
          setWorkouts([...allWorkouts]);
        } else {
          console.log('Aucun entraînement trouvé');
          setWorkouts([]);
        }
      }

      console.log('=== FIN CHARGEMENT TOUS LES ENTRAINEMENTS ===');
    } catch (error) {
      console.error('Erreur chargement entraînements:', error);
      setWorkouts([]);
    }
  };

  const loadActivityRatings = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) return;

      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      const storedRatings = await AsyncStorage.getItem(`activity_ratings_${currentUser.id}`);

      if (storedRatings) {
        setActivityRatings(JSON.parse(storedRatings));
      }
    } catch (error) {
      console.error('Erreur chargement notes RPE:', error);
    }
  };

  const saveActivityRating = async (activityId: string, rpe: number, notes: string, activityDate: string) => {
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) return;

      const newRatings = {
        ...activityRatings,
        [activityId]: {
          rpe,
          notes,
          date: activityDate
        }
      };

      setActivityRatings(newRatings);

      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      await AsyncStorage.setItem(`activity_ratings_${currentUser.id}`, JSON.stringify(newRatings));

      console.log(`Note RPE sauvegardée pour activité ${activityId}: ${rpe}/10`);
    } catch (error) {
      console.error('Erreur sauvegarde note RPE:', error);
    }
  };

  const handleRateActivity = (activity: StravaActivity) => {
    setActivityToRate(activity);
    const existingRating = activityRatings[activity.id];
    if (existingRating) {
      setRpeRating(existingRating.rpe);
      setRpeNotes(existingRating.notes);
    } else {
      setRpeRating(5);
      setRpeNotes('');
    }
    setShowRPEModal(true);
  };

  const handleSaveRPE = async () => {
    if (!activityToRate) return;

    await saveActivityRating(activityToRate.id, rpeRating, rpeNotes, activityToRate.date);
    setShowRPEModal(false);
    setActivityToRate(null);
    Alert.alert('Succès', 'Note RPE enregistrée !');
  };

  const getWorkoutsCountForDay = (day: string) => {
    const { start } = getWeekRange();
    const dayIndex = daysOfWeek.indexOf(day);

    // Créer une nouvelle date pour éviter les mutations
    const targetDate = new Date(start.getTime());
    targetDate.setDate(start.getDate() + dayIndex);
    targetDate.setHours(0, 0, 0, 0);

    // Formater la date au format YYYY-MM-DD
    const year = targetDate.getFullYear();
    const month = String(targetDate.getMonth() + 1).padStart(2, '0');
    const dayNum = String(targetDate.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${dayNum}`;

    const count = workouts.filter(workout => workout.date === dateString).length;

    console.log(`${day} (index ${dayIndex}): ${dateString} (${targetDate.toLocaleDateString('fr-FR', { weekday: 'long' })}) -> ${count} séance(s)`);

    return count;
  };

  const loadStravaActivities = async () => {
    try {
      setIsLoading(true);
      const currentUser = await getCurrentUser();
      if (currentUser) {
        const activities = await IntegrationsManager.getStravaActivities(currentUser.id);
        setStravaActivities(activities);
      }
    } catch (error) {
      console.error('Erreur chargement activités Strava:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkUserSubscription = async () => {
    try {
      const subscriptionStatus = await checkSubscriptionStatus();
      setHasSubscription(subscriptionStatus);
    } catch (error) {
      console.error('Erreur vérification abonnement:', error);
    }
  };

  const handleProgrammesTab = () => {
    if (!hasSubscription) {
      Alert.alert(
        'Abonnement requis',
        'Cette fonctionnalité est réservée aux membres premium. Souhaitez-vous vous abonner ?',
        [
          { text: 'Plus tard', style: 'cancel' },
          { text: 'S\'abonner', onPress: () => {
            console.log('Redirection vers abonnement');
          }}
        ]
      );
      return;
    }
    setSelectedTab('Programmes');
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    }
    return `${minutes}min`;
  };

  const formatDistance = (meters: number) => {
    const km = meters / 1000;
    return `${km.toFixed(1)} km`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getWeekRange = () => {
    // Créer une nouvelle date basée sur currentWeek pour éviter les mutations
    const referenceDate = new Date(currentWeek.getTime());
    referenceDate.setHours(0, 0, 0, 0);

    // Calculer le lundi de la semaine courante
    const dayOfWeek = referenceDate.getDay(); // 0 = dimanche, 1 = lundi, ..., 6 = samedi
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Distance depuis lundi

    const startOfWeek = new Date(referenceDate);
    startOfWeek.setDate(referenceDate.getDate() - daysFromMonday);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    return {
      start: startOfWeek,
      end: endOfWeek
    };
  };

  const formatWeekRange = () => {
    const { start, end } = getWeekRange();
    return `${start.getDate()}-${end.getDate()} ${end.toLocaleDateString('fr-FR', { month: 'long' })}`;
  };

  const getStravaActivitiesForCurrentWeek = () => {
    const { start, end } = getWeekRange();

    return stravaActivities.filter(activity => {
      // Normaliser la date d'activité pour éviter les problèmes de fuseau horaire
      const activityDate = new Date(activity.date);
      activityDate.setHours(0, 0, 0, 0);

      // Créer des copies des dates de début et fin pour la comparaison
      const startDate = new Date(start.getTime());
      const endDate = new Date(end.getTime());
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);

      return activityDate >= startDate && activityDate <= endDate;
    });
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeek = new Date(currentWeek.getTime());
    newWeek.setHours(0, 0, 0, 0);

    if (direction === 'prev') {
      newWeek.setDate(newWeek.getDate() - 7);
    } else {
      newWeek.setDate(newWeek.getDate() + 7);
    }

    console.log(`Navigation semaine ${direction}: ${newWeek.toISOString().split('T')[0]}`);
    setCurrentWeek(newWeek);
  };

  const handleDayPress = (jour: string) => {
    const { start } = getWeekRange();
    const dayIndex = daysOfWeek.indexOf(jour);
    const targetDate = new Date(start);
    targetDate.setDate(start.getDate() + dayIndex);

    // S'assurer que la date est en UTC pour éviter les décalages
    const formattedDate = targetDate.toISOString().split('T')[0];

    console.log('=== NAVIGATION VERS JOUR ===');
    console.log('Jour sélectionné:', jour);
    console.log('Index du jour:', dayIndex);
    console.log('Date de début de semaine:', start.toISOString().split('T')[0]);
    console.log('Date calculée:', formattedDate);
    console.log('Date object:', targetDate.toDateString());
    console.log('========================');

    if (getWorkoutsCountForDay(jour) > 0) {
      // Il y a des séances, aller vers la gestion
      router.push({
        pathname: '/(client)/gerer-entrainements',
        params: {
          selectedDay: jour,
          selectedDate: formattedDate
        }
      });
    } else {
      // Pas de séances, aller directement à la création
      router.push({
        pathname: '/(client)/creer-entrainement',
        params: {
          selectedDay: jour,
          selectedDate: formattedDate
        }
      });
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'run':
        return '🏃‍♂️';
      case 'ride':
        return '🚴‍♂️';
      case 'swim':
        return '🏊‍♂️';
      case 'walk':
        return '🚶‍♂️';
      case 'hike':
        return '🥾';
      case 'workout':
        return '💪';
      default:
        return '🏋️‍♂️';
    }
  };

  const renderStravaActivity = (activity: StravaActivity) => {
    const hasRating = activityRatings[activity.id];

    return (
      <View key={activity.id} style={styles.activityCard}>
        <TouchableOpacity 
          style={styles.activityContent}
          onPress={() => setSelectedStravaActivity(activity)}
        >
          <View style={styles.activityHeader}>
            <Text style={styles.activityIcon}>{getActivityIcon(activity.type)}</Text>
            <View style={styles.activityInfo}>
              <Text style={styles.activityName}>{activity.name}</Text>
              <Text style={styles.activityDate}>{formatDate(activity.date)}</Text>
            </View>
            <View style={styles.activityTypeContainer}>
              <Text style={styles.activityType}>{activity.type}</Text>
              <Text style={styles.arrowIcon}>›</Text>
            </View>
          </View>

          <View style={styles.activityStats}>
            {activity.distance > 0 && (
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Distance</Text>
                <Text style={styles.statValue}>{formatDistance(activity.distance)}</Text>
              </View>
            )}
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Durée</Text>
              <Text style={styles.statValue}>{formatDuration(activity.duration)}</Text>
            </View>
            {activity.calories > 0 && (
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Calories</Text>
                <Text style={styles.statValue}>{activity.calories}</Text>
              </View>
            )}
            {activity.avgHeartRate && (
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>FC moy.</Text>
                <Text style={styles.statValue}>{Math.round(activity.avgHeartRate)} bpm</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        {/* Section RPE */}
        <View style={styles.rpeSection}>
          <View style={styles.rpeSectionHeader}>
            <Text style={styles.rpeSectionTitle}>💪 Ressenti (RPE)</Text>
            {hasRating && (
              <View style={styles.rpeDisplay}>
                <Text style={styles.rpeValue}>{hasRating.rpe}/10</Text>
                <Text style={styles.rpeLabel}>
                  {hasRating.rpe <= 3 ? 'Très facile' :
                   hasRating.rpe <= 5 ? 'Modéré' :
                   hasRating.rpe <= 7 ? 'Difficile' : 'Très difficile'}
                </Text>
              </View>
            )}
          </View>

          <TouchableOpacity 
            style={[styles.rpeButton, hasRating && styles.rpeButtonRated]}
            onPress={() => handleRateActivity(activity)}
          >
            <Text style={[styles.rpeButtonText, hasRating && styles.rpeButtonTextRated]}>
              {hasRating ? 'Modifier la note' : 'Noter cette séance'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderStravaActivityDetail = () => {
    if (!selectedStravaActivity) return null;

    const activity = selectedStravaActivity;

    return (
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{activity.name}</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setSelectedStravaActivity(null)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <View style={styles.activityDetailHeader}>
              <Text style={styles.activityDetailIcon}>{getActivityIcon(activity.type)}</Text>
              <View style={styles.activityDetailInfo}>
                <Text style={styles.activityDetailType}>{activity.type}</Text>
                <Text style={styles.activityDetailDate}>{formatDate(activity.date)}</Text>
              </View>
            </View>

            <View style={styles.detailStatsGrid}>
              {activity.distance > 0 && (
                <View style={styles.detailStatCard}>
                  <Text style={styles.detailStatLabel}>Distance</Text>
                  <Text style={styles.detailStatValue}>{formatDistance(activity.distance)}</Text>
                </View>
              )}

              <View style={styles.detailStatCard}>
                <Text style={styles.detailStatLabel}>Durée</Text>
                <Text style={styles.detailStatValue}>{formatDuration(activity.duration)}</Text>
              </View>

              {activity.calories > 0 && (
                <View style={styles.detailStatCard}>
                  <Text style={styles.detailStatLabel}>Calories</Text>
                  <Text style={styles.detailStatValue}>{activity.calories}</Text>
                </View>
              )}

              {activity.avgHeartRate && (
                <View style={styles.detailStatCard}>
                  <Text style={styles.detailStatLabel}>FC moyenne</Text>
                  <Text style={styles.detailStatValue}>{Math.round(activity.avgHeartRate)} bpm</Text>
                </View>
              )}

              {activity.maxHeartRate && (
                <View style={styles.detailStatCard}>
                  <Text style={styles.detailStatLabel}>FC maximale</Text>
                  <Text style={styles.detailStatValue}>{Math.round(activity.maxHeartRate)} bpm</Text>
                </View>
              )}

              {activity.distance > 0 && activity.duration > 0 && (
                <View style={styles.detailStatCard}>
                  <Text style={styles.detailStatLabel}>Allure moyenne</Text>
                  <Text style={styles.detailStatValue}>
                    {formatPace(activity.duration, activity.distance)}
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    );
  };

  const formatPace = (duration: number, distance: number) => {
    if (distance === 0) return '--';
    const pacePerKm = (duration / (distance / 1000)) / 60; // minutes par km
    const minutes = Math.floor(pacePerKm);
    const seconds = Math.floor((pacePerKm - minutes) * 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}/km`;
  };

  useEffect(() => {
    checkUserAccess();
  }, []);

  const checkUserAccess = async () => {
    try {
      // Utiliser getCurrentUser au lieu de getUserData
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        console.log('Aucun utilisateur connecté, redirection vers login');
        router.replace('/auth/login');
        return;
      }

      console.log('Utilisateur trouvé dans entrainement:', currentUser.email);

      // Récupérer le sport favori de l'utilisateur
      const favoriteSport = currentUser.favoriteSport || 'musculation';
      setUserSport(favoriteSport);

      // Charger les programmes recommandés pour ce sport
      const programs = getRecommendedPrograms(favoriteSport);
      setRecommendedPrograms(programs);
    } catch (error) {
      console.error('Erreur vérification utilisateur:', error);
      // Ne pas rediriger automatiquement en cas d'erreur, juste logger
      console.log('Erreur lors de la vérification, mais ne pas déconnecter');
    }
  };

  // Fonction pour obtenir la date d'aujourd'hui
  const getTodayDate = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  };

  // Fonction pour vérifier si une date est aujourd'hui
  const isToday = (targetDate: Date) => {
    const today = getTodayDate();
    const target = new Date(targetDate.getTime());
    target.setHours(0, 0, 0, 0);

    return target.getFullYear() === today.getFullYear() &&
           target.getMonth() === today.getMonth() &&
           target.getDate() === today.getDate();
  };

  useEffect(() => {
    loadUserAndWorkouts();
  }, []);

  const loadUserAndWorkouts = async () => {
    try {
      const userData = await PersistentStorage.getUserData();
      if (userData) {
        setCurrentUser(userData);
        const userWorkouts = await PersistentStorage.getUserWorkouts(userData.id);
        setWorkouts(userWorkouts);
      }
    } catch (error) {
      console.error('Erreur chargement entraînements:', error);
    }
  };

  const saveWorkouts = async (newWorkouts: any[]) => {
    try {
      if (!currentUser?.id) return;

      await PersistentStorage.saveUserWorkouts(currentUser.id, newWorkouts);
      setWorkouts(newWorkouts);
      console.log('Entraînements sauvegardés pour utilisateur:', currentUser.id);
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Entraînement</Text>

          {/* Navigation par semaines */}
          <View style={styles.weekNavigation}>
            <TouchableOpacity 
              style={styles.weekArrow}
              onPress={() => navigateWeek('prev')}
            >
              <Text style={styles.arrowText}>←</Text>
            </TouchableOpacity>

            <View style={styles.weekContainer}>
              <Text style={styles.weekRange}>{formatWeekRange()}</Text>
            </View>

            <TouchableOpacity 
              style={styles.weekArrow}
              onPress={() => navigateWeek('next')}
            >
              <Text style={styles.arrowText}>→</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tabs avec design amélioré */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity 
            style={[styles.tab, selectedTab === 'Journal' && styles.activeTab]}
            onPress={() => setSelectedTab('Journal')}
          >
            <View style={styles.tabContent}>
              <Text style={styles.tabIcon}>📅</Text>
              <Text style={[styles.tabText, selectedTab === 'Journal' && styles.activeTabText]}>
                À venir
              </Text>
            </View>
            {selectedTab === 'Journal' && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, selectedTab === 'Strava' && styles.activeTab]}
            onPress={() => setSelectedTab('Strava')}
          >
            <View style={styles.tabContent}>
              <Text style={styles.tabIcon}>✅</Text>
              <Text style={[styles.tabText, selectedTab === 'Strava' && styles.activeTabText]}>
                Terminées
              </Text>
            </View>
            {selectedTab === 'Strava' && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, selectedTab === 'Programmes' && styles.activeTab, !hasSubscription && styles.lockedTab]}
            onPress={handleProgrammesTab}
          >
            <View style={styles.tabContent}>
              <Text style={styles.tabIcon}>👑</Text>
              <Text style={[styles.tabText, selectedTab === 'Programmes' && styles.activeTabText, !hasSubscription && styles.lockedTabText]}>
                {t('programs')}
              </Text>
            </View>
            {selectedTab === 'Programmes' && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.contentContainer}>
          {selectedTab === 'Journal' && (
            <View style={styles.daysContainer}>
              {/* Liste des jours avec design de cartes */}
              {daysOfWeek.map((jour) => {
                const sessionCount = getWorkoutsCountForDay(jour);
                const { start } = getWeekRange();
                const dayIndex = daysOfWeek.indexOf(jour);

                // Calculer la date correcte pour le jour
                const targetDate = new Date(start);
                targetDate.setDate(start.getDate() + dayIndex);
                targetDate.setHours(0, 0, 0, 0);

                const isTodayCheck = isToday(targetDate);

                return (
                  <TouchableOpacity 
                    key={jour}
                    style={[styles.dayCard, isTodayCheck && styles.todayCard]}
                    onPress={() => handleDayPress(jour)}
                  >
                    <View style={styles.dayHeader}>
                      <View style={styles.dayTitleContainer}>
                        <Text style={[styles.dayName, isTodayCheck && styles.todayDayName]}>{jour}</Text>
                        <Text style={styles.dayDate}>{targetDate.getDate()}</Text>
                      </View>

                      <View style={styles.dayStatus}>
                        {sessionCount > 0 ? (
                          <View style={styles.sessionBadge}>
                            <Text style={styles.sessionBadgeText}>{sessionCount}</Text>
                          </View>
                        ) : (
                          <View style={styles.emptyBadge}>
                            <Text style={styles.emptyBadgeText}>+</Text>
                          </View>
                        )}
                        <Text style={styles.arrowIcon}>›</Text>
                      </View>
                    </View>

                    <View style={styles.dayFooter}>
                      <Text style={styles.sessionDetails}>
                        {sessionCount > 0 
                          ? `${sessionCount} séance${sessionCount > 1 ? 's' : ''} planifiée${sessionCount > 1 ? 's' : ''}`
                          : 'Aucune séance planifiée'
                        }
                      </Text>
                      {isTodayCheck && (
                        <View style={styles.todayIndicator}>
                          <Text style={styles.todayText}>Aujourd'hui</Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {selectedTab === 'Strava' && (
            <View style={styles.completedContainer}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Activités Strava</Text>
                <Text style={styles.sectionSubtitle}>
                  {getStravaActivitiesForCurrentWeek().length} activité{getStravaActivitiesForCurrentWeek().length > 1 ? 's' : ''} cette semaine
                </Text>
              </View>

              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <Text style={styles.loadingText}>Chargement...</Text>
                </View>
              ) : getStravaActivitiesForCurrentWeek().length > 0 ? (
                <ScrollView style={styles.activitiesList}>
                  {getStravaActivitiesForCurrentWeek().map(renderStravaActivity)}
                </ScrollView>
              ) : stravaActivities.length > 0 ? (
                <View style={styles.emptyState}>
                  <View style={styles.emptyIcon}>
                    <Text style={styles.emptyIconText}>📅</Text>
                  </View>
                  <Text style={styles.emptyTitle}>Aucune activité cette semaine</Text>
                  <Text style={styles.emptyMessage}>
                    Pas d'activité Strava pour cette période
                  </Text>
                  <Text style={styles.emptySubmessage}>
                    Naviguez entre les semaines pour voir vos autresséances
                  </Text>
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <View style={styles.emptyIcon}>
                    <Text style={styles.emptyIconText}>📊</Text>
                  </View>
                  <Text style={styles.emptyTitle}>Aucune activité</Text>
                  <Text style={styles.emptyMessage}>
                    Connectez votre compte Strava pour voir vos séances
                  </Text>
                  <Text style={styles.emptySubmessage}>
                    Rendez-vous dans votre profil pour connecter Strava
                  </Text>
                </View>
              )}
            </View>
          )}

          {selectedTab === 'Programmes' && hasSubscription && (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Text style={styles.emptyIconText}>💪</Text>
              </View>
              <Text style={styles.emptyTitle}>Programmes Premium</Text>
              <Text style={styles.emptyMessage}>
                Accédez à vos programmes personnalisés
              </Text>
              <Text style={styles.emptySubmessage}>
                Programmes créés spécialement pour vous par votre coach