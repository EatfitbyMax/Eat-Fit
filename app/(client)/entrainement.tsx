import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { IntegrationsManager, StravaActivity } from '../../utils/integrations';
import { getCurrentUser } from '../../utils/auth';
import { checkSubscriptionStatus } from '../../utils/subscription';
import { getUserData } from '../../utils/storage';
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
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [selectedStravaActivity, setSelectedStravaActivity] = useState<StravaActivity | null>(null);
  const [userSport, setUserSport] = useState<string>('');
  const [recommendedPrograms, setRecommendedPrograms] = useState<WorkoutProgram[]>([]);



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
  }, []);

  // Rechargement automatique quand l'écran est focalisé
  useFocusEffect(
    useCallback(() => {
      loadWorkouts();
    }, [])
  );

  const loadWorkouts = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        console.log('Aucun utilisateur connecté pour charger les entraînements');
        return;
      }

      console.log('=== CHARGEMENT TOUS LES ENTRAINEMENTS ===');
      
      // Utiliser directement le stockage local pour plus de fiabilité
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      const storedWorkouts = await AsyncStorage.getItem(`workouts_${currentUser.id}`);
      
      if (storedWorkouts) {
        const allWorkouts = JSON.parse(storedWorkouts);
        console.log(`Total entraînements chargés: ${allWorkouts.length}`);
        
        // Debug: grouper par date
        const workoutsByDate = allWorkouts.reduce((acc: any, workout: any) => {
          if (!acc[workout.date]) acc[workout.date] = [];
          acc[workout.date].push(workout);
          return acc;
        }, {});
        
        Object.keys(workoutsByDate).forEach(date => {
          console.log(`${date}: ${workoutsByDate[date].length} entraînement(s)`);
          workoutsByDate[date].forEach((w: any, i: number) => {
            console.log(`  ${i + 1}. ${w.name} (${w.type})`);
          });
        });
        
        setWorkouts(allWorkouts);
      } else {
        console.log('Aucun entraînement stocké trouvé');
        setWorkouts([]);
      }
      
      console.log('=== FIN CHARGEMENT TOUS LES ENTRAINEMENTS ===');
    } catch (error) {
      console.error('Erreur chargement entraînements:', error);
      setWorkouts([]);
    }
  };

  const getWorkoutsCountForDay = (day: string) => {
    const { start } = getWeekRange();
    const dayIndex = daysOfWeek.indexOf(day);
    const targetDate = new Date(start);
    targetDate.setDate(start.getDate() + dayIndex);
    const dateString = targetDate.toISOString().split('T')[0];

    return workouts.filter(workout => workout.date === dateString).length;
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
    const startOfWeek = new Date(currentWeek);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

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
      const activityDate = new Date(activity.date);
      return activityDate >= start && activityDate <= end;
    });
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeek = new Date(currentWeek);
    if (direction === 'prev') {
      newWeek.setDate(currentWeek.getDate() - 7);
    } else {
      newWeek.setDate(currentWeek.getDate() + 7);
    }
    setCurrentWeek(newWeek);
  };

  const handleDayPress = (jour: string) => {
    const { start } = getWeekRange();
    const dayIndex = daysOfWeek.indexOf(jour);
    const targetDate = new Date(start);
    targetDate.setDate(start.getDate() + dayIndex);
    const dateString = targetDate.toISOString().split('T')[0];

    // Récupérer les entraînements du jour
    const dayWorkouts = workouts.filter(workout => workout.date === dateString);

    if (dayWorkouts.length > 0) {
      // S'il y a des entraînements, naviguer vers la gestion
      router.push({
        pathname: '/(client)/gerer-entrainements',
        params: {
          selectedDay: jour,
          selectedDate: dateString,
          workouts: JSON.stringify(dayWorkouts)
        }
      });
    } else {
      // S'il n'y en a pas, créer un nouvel entraînement
      router.push({
        pathname: '/(client)/creer-entrainement',
        params: {
          selectedDay: jour,
          selectedDate: dateString
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



  const renderStravaActivity = (activity: StravaActivity) => (
    <TouchableOpacity 
      key={activity.id} 
      style={styles.activityCard}
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
  );

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
              <Text style={styles.arrowText}>‹</Text>
            </TouchableOpacity>

            <View style={styles.weekContainer}>
              <Text style={styles.weekRange}>{formatWeekRange()}</Text>
            </View>

            <TouchableOpacity 
              style={styles.weekArrow}
              onPress={() => navigateWeek('next')}
            >
              <Text style={styles.arrowText}>›</Text>
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
                const targetDate = new Date(start);
                targetDate.setDate(start.getDate() + dayIndex);
                const isToday = targetDate.toDateString() === new Date().toDateString();

                return (
                  <TouchableOpacity 
                    key={jour}
                    style={[styles.dayCard, isToday && styles.todayCard]}
                    onPress={() => handleDayPress(jour)}
                  >
                    <View style={styles.dayHeader}>
                      <View style={styles.dayTitleContainer}>
                        <Text style={[styles.dayName, isToday && styles.todayDayName]}>{jour}</Text>
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
                      {isToday && (
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
                    Naviguez entre les semaines pour voir vos autres séances
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
              </Text>
              <TouchableOpacity style={styles.addWorkoutButton}>
                <Text style={styles.addWorkoutText}>Voir mes programmes</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>




    {/* Modal pour les détails de l'activité Strava */}
      {selectedStravaActivity && renderStravaActivityDetail()}
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
    paddingTop: 12,
    paddingBottom: 20,
    backgroundColor: 'rgba(13, 17, 23, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 165, 0, 0.1)',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  weekNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  weekArrow: {
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
  weekContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 20,
    backgroundColor: 'rgba(22, 27, 34, 0.6)',
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 165, 0, 0.2)',
  },
  weekRange: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 20,
    marginTop: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 16,
    marginHorizontal: 4,
    backgroundColor: '#161B22',
    borderWidth: 1,
    borderColor: '#21262D',
    alignItems: 'center',
    position: 'relative',
  },
  activeTab: {
    backgroundColor: '#1F6FEB',
    borderColor: '#1F6FEB',
    shadowColor: '#1F6FEB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  tabText: {
    fontSize: 12,
    color: '#8B949E',
    fontWeight: '600',
    marginTop: 2,
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    fontSize: 16,
    marginBottom: 2,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: -1,
    left: '25%',
    right: '25%',
    height: 3,
    backgroundColor: '#F5A623',
    borderRadius: 2,
  },
  lockedTab: {
    opacity: 0.7,
  },
  lockedTabText: {
    color: '#6A737D',
  },
  daysContainer: {
    flex: 1,
    paddingHorizontal: 1,
    paddingTop: 20,
  },
  dayCard: {
    backgroundColor: '#161B22',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#21262D',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  todayCard: {
    borderColor: '#F5A623',
    borderWidth: 2,
    shadowColor: '#F5A623',
    shadowOpacity: 0.2,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dayTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dayName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  todayDayName: {
    color: '#F5A623',
  },
  dayDate: {
    fontSize: 14,
    color: '#8B949E',
    backgroundColor: '#21262D',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    fontWeight: '500',
  },
  dayStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sessionBadge: {
    backgroundColor: '#F5A623',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000',
  },
  emptyBadge: {
    backgroundColor: '#21262D',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#8B949E',
    borderStyle: 'dashed',
  },
  emptyBadgeText: {
    fontSize: 14,
    color: '#8B949E',
    fontWeight: 'bold',
  },
  dayFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionDetails: {
    fontSize: 13,
    color: '#8B949E',
    flex: 1,
  },
  todayIndicator: {
    backgroundColor: '#F5A623',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  todayText: {
    fontSize: 10,
    color: '#000',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  arrowIcon: {
    fontSize: 18,
    color: '#8B949E',
    fontWeight: 'bold',
  },

  contentContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 90,
  },
  emptyState: {
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: 24,
    borderWidth: 1,
    borderColor: '#21262D',
    alignItems: 'center',
    marginTop: 20,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#21262D',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyIconText: {
    fontSize: 28,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 15,
    color: '#8B949E',
    textAlign: 'center',
    marginBottom: 6,
    lineHeight: 20,
  },
  emptySubmessage: {
    fontSize: 13,
    color: '#8B949E',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
    paddingHorizontal: 8,
  },
  addWorkoutButton: {
    backgroundColor: '#0D1117',
    borderWidth: 1,
    borderColor: '#21262D',
    borderStyle: 'dashed',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  addWorkoutText: {
    fontSize: 14,
    color: '#8B949E',
  },

  // Styles pour les activités Strava
  completedContainer: {
    flex: 1,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#8B949E',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#8B949E',
  },
  activitiesList: {
    flex: 1,
  },
  activityCard: {
    backgroundColor: '#161B22',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#21262D',
    marginBottom: 10,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  activityIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  activityInfo: {
    flex: 1,
  },
  activityName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  activityDate: {
    fontSize: 11,
    color: '#8B949E',
  },
  activityType: {
    fontSize: 11,
    color: '#000000',
    fontWeight: '500',
    backgroundColor: '#F5A623',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    overflow: 'hidden',
  },
  activityStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  statItem: {
    alignItems: 'center',
    minWidth: 50,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 9,
    color: '#8B949E',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  activityTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // Styles pour le modal de détail
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#161B22',
    borderRadius: 16,
    margin: 20,
    maxHeight: '80%',
    width: '90%',
    borderWidth: 1,
    borderColor: '#21262D',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#21262D',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#21262D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#8B949E',
    fontWeight: 'bold',
  },
  modalBody: {
    padding: 20,
  },
  activityDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  activityDetailIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  activityDetailInfo: {
    flex: 1,
  },
  activityDetailType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  activityDetailDate: {
    fontSize: 14,
    color: '#8B949E',
  },
  detailStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  detailStatCard: {
    backgroundColor: '#0D1117',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#21262D',
    minWidth: '45%',
    alignItems: 'center',
  },
  detailStatLabel: {
    fontSize: 12,
    color: '#8B949E',
    marginBottom: 8,
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  detailStatValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  exerciseCard: {
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#21262D',
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  exerciseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  exerciseReps: {
    fontSize: 12,
    color: '#8B949E',
  },
  favoriteSportSection: {
    marginHorizontal: 20,
    marginBottom: 25,
    backgroundColor: '#161B22',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#21262D',
  },
  favoriteSportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  favoriteSportEmoji: {
    fontSize: 32,
    marginRight: 16,
  },
  favoriteSportTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  favoriteSportSubtitle: {
    fontSize: 14,
    color: '#F5A623',
    fontWeight: '500',
  },
});