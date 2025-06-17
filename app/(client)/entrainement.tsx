import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { IntegrationsManager, StravaActivity } from '../../utils/integrations';
import { getCurrentUser } from '../../utils/auth';
import { checkSubscriptionStatus } from '../../utils/subscription';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';

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
  const [currentStravaWeek, setCurrentStravaWeek] = useState(new Date());
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [selectedStravaActivity, setSelectedStravaActivity] = useState<StravaActivity | null>(null);



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
      if (currentUser) {
        // Utiliser la nouvelle méthode avec fallback
        const { PersistentStorage } = await import('../../utils/storage');
        const storedWorkouts = await PersistentStorage.getWorkouts(currentUser.id);
        setWorkouts(storedWorkouts);
        console.log(`Entraînements chargés: ${storedWorkouts.length} séances trouvées`);
      }
    } catch (error) {
      console.error('Erreur chargement entraînements:', error);
      // En cas d'erreur, essayer le stockage local direct
      try {
        const currentUser = await getCurrentUser();
        if (currentUser) {
          const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
          const storedWorkouts = await AsyncStorage.getItem(`workouts_${currentUser.id}`);
          if (storedWorkouts) {
            setWorkouts(JSON.parse(storedWorkouts));
            console.log(`Fallback local: ${JSON.parse(storedWorkouts).length} séances trouvées`);
          }
        }
      } catch (localError) {
        console.error('Erreur fallback local:', localError);
      }
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

  const getStravaWeekRange = () => {
    const startOfWeek = new Date(currentStravaWeek);
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

  const formatStravaWeekRange = () => {
    const { start, end } = getStravaWeekRange();
    return `${start.getDate()}-${end.getDate()} ${end.toLocaleDateString('fr-FR', { month: 'long' })}`;
  };

  const navigateStravaWeek = (direction: 'prev' | 'next') => {
    const newWeek = new Date(currentStravaWeek);
    if (direction === 'prev') {
      newWeek.setDate(currentStravaWeek.getDate() - 7);
    } else {
      newWeek.setDate(currentStravaWeek.getDate() + 7);
    }
    setCurrentStravaWeek(newWeek);
  };

  const getStravaActivitiesForCurrentWeek = () => {
    const { start, end } = getStravaWeekRange();
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{t('training')}</Text>

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

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity 
            style={[styles.tab, selectedTab === 'Journal' && styles.activeTab]}
            onPress={() => setSelectedTab('Journal')}
          >
            <Text style={[styles.tabText, selectedTab === 'Journal' && styles.activeTabText]}>
              À venir
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, selectedTab === 'Strava' && styles.activeTab]}
            onPress={() => setSelectedTab('Strava')}
          >
            <Text style={[styles.tabText, selectedTab === 'Strava' && styles.activeTabText]}>
              Terminées
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, selectedTab === 'Programmes' && styles.activeTab, !hasSubscription && styles.lockedTab]}
            onPress={handleProgrammesTab}
          >
            <View style={styles.tabContent}>
              <Text style={[styles.tabText, selectedTab === 'Programmes' && styles.activeTabText, !hasSubscription && styles.lockedTabText]}>
                {t('programs')}
              </Text>
              <Text style={[styles.crownIcon, selectedTab === 'Programmes' && styles.activeCrownIcon]}>
                👑
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.contentContainer}>
          {selectedTab === 'Journal' && (
            <View style={styles.daysContainer}>
              {/* Liste des jours avec style compact */}
              {daysOfWeek.map((jour) => {
                const sessionCount = getWorkoutsCountForDay(jour);
                return (
                  <TouchableOpacity 
                    key={jour}
                    style={styles.dayRow}
                    onPress={() => handleDayPress(jour)}
                  >
                    <Text style={styles.dayName}>{jour}</Text>
                    <View style={styles.dayInfo}>
                      <Text style={styles.sessionCount}>
                        {sessionCount} séance{sessionCount > 1 ? 's' : ''}
                      </Text>
                      <Text style={styles.arrowIcon}>›</Text>
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
                
                {/* Navigation par semaines pour Strava */}
                <View style={styles.weekNavigation}>
                  <TouchableOpacity 
                    style={styles.weekArrow}
                    onPress={() => navigateStravaWeek('prev')}
                  >
                    <Text style={styles.arrowText}>‹</Text>
                  </TouchableOpacity>

                  <View style={styles.weekContainer}>
                    <Text style={styles.weekRange}>{formatStravaWeekRange()}</Text>
                  </View>

                  <TouchableOpacity 
                    style={styles.weekArrow}
                    onPress={() => navigateStravaWeek('next')}
                  >
                    <Text style={styles.arrowText}>›</Text>
                  </TouchableOpacity>
                </View>
                
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
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  weekNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    paddingHorizontal: 8,
  },
  weekArrow: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#161B22',
    borderWidth: 1,
    borderColor: '#21262D',
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  weekContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 12,
  },
  weekRange: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    textTransform: 'capitalize',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginHorizontal: 2,
    backgroundColor: '#161B22',
    borderWidth: 1,
    borderColor: '#21262D',
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#1F6FEB',
    borderColor: '#1F6FEB',
  },
  tabText: {
    fontSize: 13,
    color: '#8B949E',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  crownIcon: {
    fontSize: 10,
    marginLeft: 4,
    color: '#8B949E',
    opacity: 0.6,
  },
  activeCrownIcon: {
    opacity: 1,
  },
  lockedTab: {
    opacity: 0.7,
  },
  lockedTabText: {
    color: '#6A737D',
  },
  daysContainer: {
    flex: 1,
    paddingTop: 8,
  },
  dayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#21262D',
  },
  dayName: {
    fontSize: 17,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  dayInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sessionCount: {
    fontSize: 15,
    color: '#F5A623',
    fontWeight: '500',
    marginRight: 12,
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

});