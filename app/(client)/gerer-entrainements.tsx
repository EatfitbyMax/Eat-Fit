
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView, 
  Alert,
  Modal,
  TextInput
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getCurrentUser } from '../../utils/auth';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { IntegrationsManager } from '../../utils/integrations';

interface Workout {
  id: string;
  name: string;
  date: string;
  type: string;
  specificity: string;
  difficulty: string;
  duration: number;
  calories: number;
  time: string;
  exercises: any[];
  completed?: boolean;
  rating?: number;
  completedAt?: string;
  notes?: string;
}

export default function GererEntrainementsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { theme } = useTheme();
  const { t } = useLanguage();

  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [rating, setRating] = useState(5);
  const [completionNotes, setCompletionNotes] = useState('');
  const [showStravaModal, setShowStravaModal] = useState(false);
  const [stravaActivities, setStravaActivities] = useState<any[]>([]);
  const [isLoadingStrava, setIsLoadingStrava] = useState(false);
  const selectedDay = params.selectedDay as string;
  const selectedDate = params.selectedDate as string;

  useEffect(() => {
    loadWorkouts();
  }, []);

  const loadWorkouts = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (currentUser) {
        // Utiliser la nouvelle méthode avec fallback
        const { PersistentStorage } = await import('../../utils/storage');
        const allWorkouts = await PersistentStorage.getWorkouts(currentUser.id);
        const dayWorkouts = allWorkouts.filter((workout: Workout) => workout.date === selectedDate);
        setWorkouts(dayWorkouts);
        console.log(`Entraînements du jour chargés: ${dayWorkouts.length} séances trouvées`);
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
            const allWorkouts = JSON.parse(storedWorkouts);
            const dayWorkouts = allWorkouts.filter((workout: Workout) => workout.date === selectedDate);
            setWorkouts(dayWorkouts);
            console.log(`Fallback local: ${dayWorkouts.length} séances trouvées`);
          }
        }
      } catch (localError) {
        console.error('Erreur fallback local:', localError);
      }
    }
  };

  const handleDeleteWorkout = async (workoutId: string) => {
    Alert.alert(
      'Supprimer l\'entraînement',
      'Êtes-vous sûr de vouloir supprimer cet entraînement ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Supprimer', 
          style: 'destructive',
          onPress: async () => {
            try {
              const currentUser = await getCurrentUser();
              if (currentUser) {
                const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
                const storedWorkouts = await AsyncStorage.getItem(`workouts_${currentUser.id}`);
                if (storedWorkouts) {
                  const allWorkouts = JSON.parse(storedWorkouts);
                  const updatedWorkouts = allWorkouts.filter((workout: Workout) => workout.id !== workoutId);
                  await AsyncStorage.setItem(`workouts_${currentUser.id}`, JSON.stringify(updatedWorkouts));
                  loadWorkouts(); // Recharger la liste
                }
              }
            } catch (error) {
              console.error('Erreur suppression entraînement:', error);
              Alert.alert('Erreur', 'Impossible de supprimer l\'entraînement');
            }
          }
        }
      ]
    );
  };

  const handleEditWorkout = (workout: Workout) => {
    router.push({
      pathname: '/(client)/creer-entrainement',
      params: {
        selectedDay,
        selectedDate,
        editWorkout: JSON.stringify(workout)
      }
    });
  };

  const handleAddNewWorkout = () => {
    router.push({
      pathname: '/(client)/creer-entrainement',
      params: {
        selectedDay,
        selectedDate
      }
    });
  };

  const handleValidateWorkout = (workout: Workout) => {
    setSelectedWorkout(workout);
    setRating(5);
    setCompletionNotes('');
    setShowValidationModal(true);
  };

  const saveWorkoutCompletion = async () => {
    if (!selectedWorkout) return;

    try {
      const currentUser = await getCurrentUser();
      if (currentUser) {
        const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
        const storedWorkouts = await AsyncStorage.getItem(`workouts_${currentUser.id}`);
        if (storedWorkouts) {
          const allWorkouts = JSON.parse(storedWorkouts);
          const updatedWorkouts = allWorkouts.map((workout: Workout) => 
            workout.id === selectedWorkout.id 
              ? {
                  ...workout,
                  completed: true,
                  rating: rating,
                  completedAt: new Date().toISOString(),
                  notes: completionNotes
                }
              : workout
          );
          await AsyncStorage.setItem(`workouts_${currentUser.id}`, JSON.stringify(updatedWorkouts));
          loadWorkouts(); // Recharger la liste
          setShowValidationModal(false);
          Alert.alert('Succès', 'Séance validée avec succès !');
        }
      }
    } catch (error) {
      console.error('Erreur validation séance:', error);
      Alert.alert('Erreur', 'Impossible de valider la séance');
    }
  };

  const handleImportFromStrava = async () => {
    setIsLoadingStrava(true);
    try {
      const currentUser = await getCurrentUser();
      if (currentUser) {
        const activities = await IntegrationsManager.getStravaActivities(currentUser.id);
        const todayActivities = activities.filter(activity => {
          const activityDate = new Date(activity.date).toISOString().split('T')[0];
          return activityDate === selectedDate;
        });
        setStravaActivities(todayActivities);
        setShowStravaModal(true);
      }
    } catch (error) {
      console.error('Erreur import Strava:', error);
      Alert.alert('Erreur', 'Impossible de récupérer les activités Strava');
    } finally {
      setIsLoadingStrava(false);
    }
  };

  const importStravaActivity = async (activity: any) => {
    try {
      const currentUser = await getCurrentUser();
      if (currentUser) {
        const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
        
        // Créer un nouvel entraînement basé sur l'activité Strava
        const newWorkout: Workout = {
          id: `strava_${activity.id}_${Date.now()}`,
          name: activity.name,
          date: selectedDate,
          type: activity.type === 'Run' ? 'Course à pied' : 
                activity.type === 'Ride' ? 'Cyclisme' : 
                activity.type === 'Swim' ? 'Natation' : activity.type,
          specificity: 'Importé depuis Strava',
          difficulty: 'Modéré',
          duration: Math.round(activity.duration / 60), // Convertir en minutes
          calories: activity.calories || 0,
          time: new Date(activity.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          exercises: [],
          completed: true,
          rating: 5,
          completedAt: activity.date,
          notes: `Activité importée depuis Strava - Distance: ${(activity.distance / 1000).toFixed(1)} km`
        };

        // Récupérer les entraînements existants et ajouter le nouveau
        const existingWorkouts = await AsyncStorage.getItem(`workouts_${currentUser.id}`);
        const workouts = existingWorkouts ? JSON.parse(existingWorkouts) : [];
        workouts.push(newWorkout);
        
        await AsyncStorage.setItem(`workouts_${currentUser.id}`, JSON.stringify(workouts));
        loadWorkouts();
        setShowStravaModal(false);
        Alert.alert('Succès', 'Activité Strava importée avec succès !');
      }
    } catch (error) {
      console.error('Erreur import activité Strava:', error);
      Alert.alert('Erreur', 'Impossible d\'importer l\'activité');
    }
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    return timeString.substring(0, 5); // HH:MM
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Facile': return '#4CAF50';
      case 'Modéré': return '#FF9800';
      case 'Difficile': return '#F44336';
      case 'Très difficile': return '#9C27B0';
      default: return '#8B949E';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Musculation': return '💪';
      case 'Cardio': return '🏃‍♂️';
      case 'Natation': return '🏊‍♂️';
      case 'Yoga': return '🧘‍♀️';
      case 'Pilates': return '🤸‍♀️';
      case 'Escalade': return '🧗‍♂️';
      case 'Cyclisme': return '🚴‍♂️';
      case 'Course à pied': return '🏃‍♂️';
      case 'Marche': return '🚶‍♂️';
      case 'Danse': return '💃';
      case 'Arts martiaux': return '🥋';
      case 'Sport collectif': return '⚽';
      case 'Autre': return '🏋️‍♂️';
      default: return '🏋️‍♂️';
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{selectedDay}</Text>
          <Text style={styles.headerSubtitle}>
            {new Date(selectedDate).toLocaleDateString('fr-FR', { 
              day: 'numeric', 
              month: 'long', 
              year: 'numeric' 
            })}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.stravaButton} 
            onPress={handleImportFromStrava}
            disabled={isLoadingStrava}
          >
            <Text style={styles.stravaButtonText}>
              {isLoadingStrava ? '⏳' : '📊'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.addButton} onPress={handleAddNewWorkout}>
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          {workouts.length > 0 ? (
            <View style={styles.workoutsContainer}>
              <Text style={styles.sectionTitle}>
                {workouts.length} entraînement{workouts.length > 1 ? 's' : ''} prévu{workouts.length > 1 ? 's' : ''}
              </Text>

              {workouts.map((workout, index) => (
                <View key={workout.id} style={styles.workoutCard}>
                  <View style={styles.workoutHeader}>
                    <View style={styles.workoutMainInfo}>
                      <Text style={styles.workoutIcon}>{getTypeIcon(workout.type)}</Text>
                      <View style={styles.workoutDetails}>
                        <Text style={styles.workoutType}>{workout.type}</Text>
                        {workout.specificity && (
                          <Text style={styles.workoutSpecificity}>{workout.specificity}</Text>
                        )}
                        {workout.time && (
                          <Text style={styles.workoutTime}>🕐 {formatTime(workout.time)}</Text>
                        )}
                      </View>
                    </View>
                    
                    <View style={styles.workoutActions}>
                      {workout.completed && (
                        <View style={styles.completedBadge}>
                          <Text style={styles.completedBadgeText}>✅</Text>
                        </View>
                      )}
                      {!workout.completed && (
                        <TouchableOpacity 
                          style={styles.validateButton}
                          onPress={() => handleValidateWorkout(workout)}
                        >
                          <Text style={styles.validateButtonText}>✓</Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity 
                        style={styles.editButton}
                        onPress={() => handleEditWorkout(workout)}
                      >
                        <Text style={styles.editButtonText}>✏️</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.deleteButton}
                        onPress={() => handleDeleteWorkout(workout.id)}
                      >
                        <Text style={styles.deleteButtonText}>🗑️</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.workoutStats}>
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>Durée</Text>
                      <Text style={styles.statValue}>{workout.duration} min</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>Calories</Text>
                      <Text style={styles.statValue}>{workout.calories} kcal</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>Difficulté</Text>
                      <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(workout.difficulty) }]}>
                        <Text style={styles.difficultyText}>{workout.difficulty}</Text>
                      </View>
                    </View>
                  </View>

                  {workout.exercises.length > 0 && (
                    <View style={styles.exercisesPreview}>
                      <Text style={styles.exercisesTitle}>
                        {workout.exercises.length} exercice{workout.exercises.length > 1 ? 's' : ''}
                      </Text>
                      <View style={styles.exercisesList}>
                        {workout.exercises.slice(0, 3).map((exercise, idx) => (
                          <Text key={idx} style={styles.exerciseName}>
                            • {exercise.name}
                          </Text>
                        ))}
                        {workout.exercises.length > 3 && (
                          <Text style={styles.moreExercises}>
                            +{workout.exercises.length - 3} autre{workout.exercises.length - 3 > 1 ? 's' : ''}
                          </Text>
                        )}
                      </View>
                    </View>
                  )}

                  {workout.completed && (
                    <View style={styles.completionInfo}>
                      <View style={styles.ratingSection}>
                        <Text style={styles.ratingLabel}>Note: </Text>
                        <View style={styles.stars}>
                          {Array.from({ length: 5 }, (_, i) => (
                            <Text key={i} style={styles.star}>
                              {i < (workout.rating || 0) ? '⭐' : '☆'}
                            </Text>
                          ))}
                        </View>
                      </View>
                      {workout.notes && (
                        <Text style={styles.completionNotes}>{workout.notes}</Text>
                      )}
                      <Text style={styles.completedDate}>
                        Complété le {new Date(workout.completedAt || '').toLocaleDateString('fr-FR')}
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Text style={styles.emptyIconText}>📅</Text>
              </View>
              <Text style={styles.emptyTitle}>Aucun entraînement prévu</Text>
              <Text style={styles.emptyMessage}>
                Commencez par ajouter votre premier entraînement pour ce jour
              </Text>
              <TouchableOpacity style={styles.addWorkoutButton} onPress={handleAddNewWorkout}>
                <Text style={styles.addWorkoutButtonText}>+ Ajouter un entraînement</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Modal de validation de séance */}
      <Modal
        visible={showValidationModal}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Valider la séance</Text>
            <Text style={styles.modalSubtitle}>{selectedWorkout?.name}</Text>

            <View style={styles.ratingSection}>
              <Text style={styles.ratingLabel}>Comment s'est passée votre séance ?</Text>
              <View style={styles.stars}>
                {Array.from({ length: 5 }, (_, i) => (
                  <TouchableOpacity key={i} onPress={() => setRating(i + 1)}>
                    <Text style={styles.star}>
                      {i < rating ? '⭐' : '☆'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.notesSection}>
              <Text style={styles.notesLabel}>Notes (optionnel)</Text>
              <TextInput
                style={styles.notesInput}
                value={completionNotes}
                onChangeText={setCompletionNotes}
                placeholder="Comment vous êtes-vous senti ? Des difficultés ?"
                placeholderTextColor="#8B949E"
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowValidationModal(false)}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.confirmButton}
                onPress={saveWorkoutCompletion}
              >
                <Text style={styles.confirmButtonText}>Valider</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal d'import Strava */}
      <Modal
        visible={showStravaModal}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Importer depuis Strava</Text>
            <Text style={styles.modalSubtitle}>
              Activités du {new Date(selectedDate).toLocaleDateString('fr-FR')}
            </Text>

            {stravaActivities.length > 0 ? (
              <ScrollView style={styles.stravaActivitiesList}>
                {stravaActivities.map((activity, index) => (
                  <TouchableOpacity 
                    key={index}
                    style={styles.stravaActivityCard}
                    onPress={() => importStravaActivity(activity)}
                  >
                    <Text style={styles.stravaActivityName}>{activity.name}</Text>
                    <Text style={styles.stravaActivityType}>{activity.type}</Text>
                    <Text style={styles.stravaActivityStats}>
                      {(activity.distance / 1000).toFixed(1)} km • {Math.round(activity.duration / 60)} min
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <Text style={styles.noStravaActivities}>
                Aucune activité Strava trouvée pour cette date
              </Text>
            )}

            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => setShowStravaModal(false)}
            >
              <Text style={styles.cancelButtonText}>Fermer</Text>
            </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#21262D',
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#161B22',
    borderWidth: 1,
    borderColor: '#21262D',
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#8B949E',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stravaButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FC4C02',
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stravaButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  addButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#1F6FEB',
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  completedBadge: {
    padding: 4,
    marginRight: 8,
  },
  completedBadgeText: {
    fontSize: 16,
  },
  validateButton: {
    padding: 8,
    backgroundColor: '#4CAF50',
    borderRadius: 4,
    marginRight: 8,
  },
  validateButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  workoutsContainer: {
    flex: 1,
  },
  workoutCard: {
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#21262D',
    marginBottom: 12,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  workoutMainInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  workoutIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  workoutDetails: {
    flex: 1,
  },
  workoutType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  workoutSpecificity: {
    fontSize: 14,
    color: '#8B949E',
    marginBottom: 2,
  },
  workoutTime: {
    fontSize: 12,
    color: '#1F6FEB',
    fontWeight: '500',
  },
  workoutActions: {
    flexDirection: 'row',
  },
  editButton: {
    padding: 8,
    marginLeft: 8,
  },
  editButtonText: {
    fontSize: 16,
  },
  deleteButton: {
    padding: 8,
    marginLeft: 4,
  },
  deleteButtonText: {
    fontSize: 16,
  },
  workoutStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 11,
    color: '#8B949E',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  exercisesPreview: {
    borderTopWidth: 1,
    borderTopColor: '#21262D',
    paddingTop: 12,
  },
  exercisesTitle: {
    fontSize: 12,
    color: '#8B949E',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  exercisesList: {
    gap: 4,
  },
  exerciseName: {
    fontSize: 13,
    color: '#FFFFFF',
  },
  moreExercises: {
    fontSize: 12,
    color: '#8B949E',
    fontStyle: 'italic',
  },
  emptyState: {
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: 32,
    borderWidth: 1,
    borderColor: '#21262D',
    alignItems: 'center',
    marginTop: 40,
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
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 14,
    color: '#8B949E',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  addWorkoutButton: {
    backgroundColor: '#1F6FEB',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  addWorkoutButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  completionInfo: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#21262D',
  },
  ratingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingLabel: {
    fontSize: 12,
    color: '#8B949E',
    marginRight: 8,
  },
  stars: {
    flexDirection: 'row',
  },
  star: {
    fontSize: 16,
    marginRight: 2,
  },
  completionNotes: {
    fontSize: 12,
    color: '#FFFFFF',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  completedDate: {
    fontSize: 10,
    color: '#8B949E',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: 24,
    margin: 20,
    borderWidth: 1,
    borderColor: '#21262D',
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#8B949E',
    marginBottom: 20,
    textAlign: 'center',
  },
  notesSection: {
    marginBottom: 24,
  },
  notesLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#21262D',
    borderRadius: 8,
    padding: 12,
    color: '#FFFFFF',
    backgroundColor: '#0D1117',
    textAlignVertical: 'top',
    minHeight: 80,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#21262D',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#8B949E',
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  stravaActivitiesList: {
    maxHeight: 300,
    marginBottom: 20,
  },
  stravaActivityCard: {
    backgroundColor: '#0D1117',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#21262D',
  },
  stravaActivityName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  stravaActivityType: {
    fontSize: 12,
    color: '#FC4C02',
    marginBottom: 4,
  },
  stravaActivityStats: {
    fontSize: 11,
    color: '#8B949E',
  },
  noStravaActivities: {
    fontSize: 14,
    color: '#8B949E',
    textAlign: 'center',
    marginBottom: 20,
    padding: 20,
  },
});
