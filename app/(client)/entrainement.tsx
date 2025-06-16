import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Modal, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
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
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);
  const [selectedDayForWorkout, setSelectedDayForWorkout] = useState('');
  const [newWorkout, setNewWorkout] = useState({
    nom: '',
    type: '',
    difficulte: 'Facile',
    duree: 0,
    notes: '',
    exercices: []
  });
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [newExercise, setNewExercise] = useState({
    nom: '',
    series: 0,
    repetitions: 0,
    poids: 0,
    repos: 0,
    notes: ''
  });

  

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

  const loadWorkouts = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (currentUser) {
        const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
        const storedWorkouts = await AsyncStorage.getItem(`workouts_${currentUser.id}`);
        if (storedWorkouts) {
          setWorkouts(JSON.parse(storedWorkouts));
        }
      }
    } catch (error) {
      console.error('Erreur chargement entraînements:', error);
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

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeek = new Date(currentWeek);
    if (direction === 'prev') {
      newWeek.setDate(currentWeek.getDate() - 7);
    } else {
      newWeek.setDate(currentWeek.getDate() + 7);
    }
    setCurrentWeek(newWeek);
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

  const handleDayPress = (day: string) => {
    setSelectedDayForWorkout(day);
    setNewWorkout({
      nom: '',
      type: '',
      difficulte: 'Facile',
      duree: 0,
      notes: '',
      exercices: []
    });
    setShowWorkoutModal(true);
  };

  const handleAddExercise = () => {
    setNewExercise({
      nom: '',
      series: 0,
      repetitions: 0,
      poids: 0,
      repos: 0,
      notes: ''
    });
    setShowExerciseModal(true);
  };

  const handleSaveExercise = () => {
    if (!newExercise.nom.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir le nom de l\'exercice');
      return;
    }

    const exercice = {
      id: Date.now().toString(),
      ...newExercise
    };

    setNewWorkout(prev => ({
      ...prev,
      exercices: [...prev.exercices, exercice]
    }));

    setShowExerciseModal(false);
  };

  const handleRemoveExercise = (exerciseId: string) => {
    setNewWorkout(prev => ({
      ...prev,
      exercices: prev.exercices.filter(ex => ex.id !== exerciseId)
    }));
  };

  const handleSaveWorkout = async () => {
    if (!newWorkout.nom.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir le nom de l\'entraînement');
      return;
    }

    try {
      const currentUser = await getCurrentUser();
      if (currentUser) {
        const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
        
        // Calculer la date du jour sélectionné
        const { start } = getWeekRange();
        const dayIndex = daysOfWeek.indexOf(selectedDayForWorkout);
        const targetDate = new Date(start);
        targetDate.setDate(start.getDate() + dayIndex);
        const dateString = targetDate.toISOString().split('T')[0];

        const workout = {
          id: Date.now().toString(),
          ...newWorkout,
          date: dateString,
          jour: selectedDayForWorkout,
          userId: currentUser.id,
          createdAt: new Date().toISOString()
        };

        const existingWorkouts = await AsyncStorage.getItem(`workouts_${currentUser.id}`);
        const workoutsArray = existingWorkouts ? JSON.parse(existingWorkouts) : [];
        workoutsArray.push(workout);

        await AsyncStorage.setItem(`workouts_${currentUser.id}`, JSON.stringify(workoutsArray));
        setWorkouts(workoutsArray);
        setShowWorkoutModal(false);

        Alert.alert('Succès', 'Entraînement créé avec succès !');
      }
    } catch (error) {
      console.error('Erreur sauvegarde entraînement:', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder l\'entraînement');
    }
  };

  

  const renderStravaActivity = (activity: StravaActivity) => (
    <View key={activity.id} style={styles.activityCard}>
      <View style={styles.activityHeader}>
        <Text style={styles.activityIcon}>{getActivityIcon(activity.type)}</Text>
        <View style={styles.activityInfo}>
          <Text style={styles.activityName}>{activity.name}</Text>
          <Text style={styles.activityDate}>{formatDate(activity.date)}</Text>
        </View>
        <Text style={styles.activityType}>{activity.type}</Text>
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
    </View>
  );

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
              {t('journal')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, selectedTab === 'Strava' && styles.activeTab]}
            onPress={() => setSelectedTab('Strava')}
          >
            <Text style={[styles.tabText, selectedTab === 'Strava' && styles.activeTabText]}>
              Strava
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
                      <Text style={styles.addIcon}>+</Text>
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
                  {stravaActivities.length} activité{stravaActivities.length > 1 ? 's' : ''} synchronisée{stravaActivities.length > 1 ? 's' : ''} depuis Strava
                </Text>
              </View>

              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <Text style={styles.loadingText}>Chargement...</Text>
                </View>
              ) : stravaActivities.length > 0 ? (
                <ScrollView style={styles.activitiesList}>
                  {stravaActivities.map(renderStravaActivity)}
                </ScrollView>
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

      {/* Modal Nouvel Entraînement */}
      <Modal
        visible={showWorkoutModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowWorkoutModal(false)}
      >
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              onPress={() => setShowWorkoutModal(false)}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Nouvel entraînement - {selectedDayForWorkout}</Text>
            <TouchableOpacity 
              onPress={handleSaveWorkout}
              style={styles.saveButton}
            >
              <Text style={styles.saveButtonText}>Sauvegarder</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Nom de l'entraînement</Text>
              <TextInput
                style={styles.input}
                value={newWorkout.nom}
                onChangeText={(text) => setNewWorkout({...newWorkout, nom: text})}
                placeholder="Ex: Séance jambes"
                placeholderTextColor="#6A737D"
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Type d'activité</Text>
              <TextInput
                style={styles.input}
                value={newWorkout.type}
                onChangeText={(text) => setNewWorkout({...newWorkout, type: text})}
                placeholder="Ex: Musculation, Cardio"
                placeholderTextColor="#6A737D"
              />
            </View>

            <View style={styles.modalRow}>
              <View style={styles.modalColumn}>
                <Text style={styles.sectionTitle}>Difficulté</Text>
                <View style={styles.difficultyContainer}>
                  {['Facile', 'Moyen', 'Difficile'].map((level) => (
                    <TouchableOpacity
                      key={level}
                      style={[
                        styles.difficultyButton,
                        newWorkout.difficulte === level && styles.difficultyButtonActive
                      ]}
                      onPress={() => setNewWorkout({...newWorkout, difficulte: level})}
                    >
                      <Text style={[
                        styles.difficultyButtonText,
                        newWorkout.difficulte === level && styles.difficultyButtonTextActive
                      ]}>
                        {level}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <View style={styles.modalColumn}>
                <Text style={styles.sectionTitle}>Durée (min)</Text>
                <TextInput
                  style={styles.input}
                  value={newWorkout.duree ? newWorkout.duree.toString() : ''}
                  onChangeText={(text) => setNewWorkout({...newWorkout, duree: parseInt(text) || 0})}
                  placeholder="45"
                  placeholderTextColor="#6A737D"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={newWorkout.notes}
                onChangeText={(text) => setNewWorkout({...newWorkout, notes: text})}
                placeholder="Notes sur l'entraînement..."
                placeholderTextColor="#6A737D"
                multiline
              />
            </View>

            <View style={styles.exercicesSection}>
              <View style={styles.exercicesHeader}>
                <Text style={styles.exercicesTitle}>Exercices</Text>
                <TouchableOpacity 
                  style={styles.addButton}
                  onPress={handleAddExercise}
                >
                  <Text style={styles.addButtonText}>+ Ajouter</Text>
                </TouchableOpacity>
              </View>

              {newWorkout.exercices.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateIcon}>💪</Text>
                  <Text style={styles.emptyStateText}>Aucun exercice ajouté</Text>
                  <Text style={styles.emptyStateSubtext}>
                    Cliquez sur "Ajouter" pour créer un exercice
                  </Text>
                </View>
              ) : (
                <View style={styles.exercicesList}>
                  {newWorkout.exercices.map((exercice, index) => (
                    <View key={exercice.id} style={styles.exerciceCard}>
                      <View style={styles.exerciceHeader}>
                        <Text style={styles.exerciceNumber}>Exercice {index + 1}</Text>
                        <TouchableOpacity
                          onPress={() => handleRemoveExercise(exercice.id)}
                          style={styles.removeButton}
                        >
                          <Text style={styles.removeButtonText}>×</Text>
                        </TouchableOpacity>
                      </View>
                      <Text style={styles.exerciceNom}>{exercice.nom}</Text>
                      <View style={styles.exerciceDetails}>
                        {exercice.series > 0 && (
                          <Text style={styles.exerciceDetail}>{exercice.series} séries</Text>
                        )}
                        {exercice.repetitions > 0 && (
                          <Text style={styles.exerciceDetail}>{exercice.repetitions} reps</Text>
                        )}
                        {exercice.poids > 0 && (
                          <Text style={styles.exerciceDetail}>{exercice.poids} kg</Text>
                        )}
                        {exercice.repos > 0 && (
                          <Text style={styles.exerciceDetail}>{exercice.repos}s repos</Text>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Modal Nouvel Exercice */}
      <Modal
        visible={showExerciseModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowExerciseModal(false)}
      >
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              onPress={() => setShowExerciseModal(false)}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Nouvel exercice</Text>
            <TouchableOpacity 
              onPress={handleSaveExercise}
              style={styles.saveButton}
            >
              <Text style={styles.saveButtonText}>Ajouter</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Nom de l'exercice</Text>
              <TextInput
                style={styles.input}
                value={newExercise.nom}
                onChangeText={(text) => setNewExercise({...newExercise, nom: text})}
                placeholder="Ex: Squats, Développé couché"
                placeholderTextColor="#6A737D"
              />
            </View>

            <View style={styles.modalRow}>
              <View style={styles.modalColumn}>
                <Text style={styles.sectionTitle}>Séries</Text>
                <TextInput
                  style={styles.input}
                  value={newExercise.series ? newExercise.series.toString() : ''}
                  onChangeText={(text) => setNewExercise({...newExercise, series: parseInt(text) || 0})}
                  placeholder="3"
                  placeholderTextColor="#6A737D"
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.modalColumn}>
                <Text style={styles.sectionTitle}>Répétitions</Text>
                <TextInput
                  style={styles.input}
                  value={newExercise.repetitions ? newExercise.repetitions.toString() : ''}
                  onChangeText={(text) => setNewExercise({...newExercise, repetitions: parseInt(text) || 0})}
                  placeholder="12"
                  placeholderTextColor="#6A737D"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.modalRow}>
              <View style={styles.modalColumn}>
                <Text style={styles.sectionTitle}>Poids (kg)</Text>
                <TextInput
                  style={styles.input}
                  value={newExercise.poids ? newExercise.poids.toString() : ''}
                  onChangeText={(text) => setNewExercise({...newExercise, poids: parseFloat(text) || 0})}
                  placeholder="20"
                  placeholderTextColor="#6A737D"
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.modalColumn}>
                <Text style={styles.sectionTitle}>Repos (sec)</Text>
                <TextInput
                  style={styles.input}
                  value={newExercise.repos ? newExercise.repos.toString() : ''}
                  onChangeText={(text) => setNewExercise({...newExercise, repos: parseInt(text) || 0})}
                  placeholder="60"
                  placeholderTextColor="#6A737D"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={newExercise.notes}
                onChangeText={(text) => setNewExercise({...newExercise, notes: text})}
                placeholder="Instructions particulières..."
                placeholderTextColor="#6A737D"
                multiline
              />
            </View>
          </ScrollView>
        </SafeAreaView>
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
  addIcon: {
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

  // Styles pour les modals
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#21262D',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
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
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#F5A623',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  saveButtonText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#161B22',
    borderWidth: 1,
    borderColor: '#F5A623',
    borderRadius: 8,
    padding: 12,
    color: '#FFFFFF',
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  modalColumn: {
    flex: 1,
    marginRight: 10,
  },
  difficultyContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  difficultyButton: {
    flex: 1,
    backgroundColor: '#161B22',
    borderWidth: 1,
    borderColor: '#21262D',
    borderRadius: 8,
    paddingVertical: 12,
    marginHorizontal: 2,
    alignItems: 'center',
  },
  difficultyButtonActive: {
    backgroundColor: '#F5A623',
    borderColor: '#F5A623',
  },
  difficultyButtonText: {
    fontSize: 14,
    color: '#8B949E',
    fontWeight: '500',
  },
  difficultyButtonTextActive: {
    color: '#000000',
  },
  exercicesSection: {
    marginBottom: 20,
  },
  exercicesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  exercicesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  addButton: {
    backgroundColor: '#F5A623',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  addButtonText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '600',
  },
  exercicesList: {
    backgroundColor: '#161B22',
    borderWidth: 1,
    borderColor: '#21262D',
    borderRadius: 8,
    padding: 16,
  },
  exerciceCard: {
    backgroundColor: '#0D1117',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  exerciceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  exerciceNumber: {
    color: '#8B949E',
    fontSize: 14,
    fontWeight: '500',
  },
  removeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#21262D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  exerciceNom: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  exerciceDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  exerciceDetail: {
    color: '#6A737D',
    fontSize: 12,
    marginRight: 12,
    marginBottom: 4,
  },
  
});