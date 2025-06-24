
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView, 
  Alert 
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getCurrentUser } from '../../utils/auth';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';

interface Exercise {
  id: string;
  name: string;
  sets?: string;
  reps?: string;
  duration?: string;
  rest?: string;
  notes?: string;
  distance?: string;
  weight?: string;
  intensity?: string;
}

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
  exercises: Exercise[];
}

export default function GererEntrainementsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { theme } = useTheme();
  const { t } = useLanguage();

  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const selectedDay = params.selectedDay as string;
  const selectedDate = params.selectedDate as string;

  useEffect(() => {
    loadWorkouts();
  }, []);

  const loadWorkouts = async () => {
    try {
      setIsLoading(true);
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        console.log('Aucun utilisateur connecté pour charger les entraînements');
        return;
      }

      console.log(`=== CHARGEMENT ENTRAINEMENTS POUR ${selectedDate} ===`);
      
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      const storedWorkouts = await AsyncStorage.getItem(`workouts_${currentUser.id}`);
      
      if (storedWorkouts) {
        const allWorkouts = JSON.parse(storedWorkouts);
        console.log(`Total entraînements stockés: ${allWorkouts.length}`);
        
        // Debug: afficher tous les entraînements
        allWorkouts.forEach((workout: Workout, index: number) => {
          console.log(`Entraînement ${index + 1}: ${workout.name} - Date: ${workout.date} - Type: ${workout.type}`);
        });
        
        // Filtrer les entraînements pour la date sélectionnée
        const dayWorkouts = allWorkouts.filter((workout: Workout) => {
          const match = workout.date === selectedDate;
          console.log(`Workout "${workout.name}" (${workout.date}) - Match avec ${selectedDate}: ${match}`);
          return match;
        });
        
        console.log(`Entraînements trouvés pour ${selectedDate}: ${dayWorkouts.length}`);
        dayWorkouts.forEach((workout: Workout, index: number) => {
          console.log(`  ${index + 1}. ${workout.name} (${workout.type})`);
        });
        
        setWorkouts(dayWorkouts);
      } else {
        console.log('Aucun entraînement stocké trouvé');
        setWorkouts([]);
      }
      
      console.log('=== FIN CHARGEMENT ENTRAINEMENTS ===');
    } catch (error) {
      console.error('Erreur chargement entraînements:', error);
      setWorkouts([]);
    } finally {
      setIsLoading(false);
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
              if (!currentUser) return;

              const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
              const storedWorkouts = await AsyncStorage.getItem(`workouts_${currentUser.id}`);
              
              if (storedWorkouts) {
                const allWorkouts = JSON.parse(storedWorkouts);
                const updatedWorkouts = allWorkouts.filter((w: Workout) => w.id !== workoutId);
                
                await AsyncStorage.setItem(`workouts_${currentUser.id}`, JSON.stringify(updatedWorkouts));
                
                // Recharger les entraînements
                loadWorkouts();
                
                Alert.alert('Succès', 'Entraînement supprimé avec succès');
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

  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    return timeString.substring(0, 5); // HH:MM
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Facile': return '#4CAF50';
      case 'Modéré': return '#FF9800';
      case 'Difficile': return '#F44336';
      case 'Effort maximal': return '#9C27B0';
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
      case 'Boxe': return '🥊';
      case 'CrossFit': return '🏋️‍♂️';
      case 'Tennis': return '🎾';
      case 'Football': return '⚽';
      case 'Basketball': return '🏀';
      case 'HIIT': return '⚡';
      case 'Étirement': return '🤸';
      default: return '🏋️‍♂️';
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.push('/(client)/entrainement')}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{selectedDay}</Text>
          <Text style={styles.headerDate}>
            {new Date(selectedDate).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })}
          </Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={handleAddNewWorkout}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          {/* Statistiques du jour */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{workouts.length}</Text>
              <Text style={styles.statLabel}>Séance{workouts.length > 1 ? 's' : ''}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {workouts.reduce((total, workout) => total + workout.duration, 0)}
              </Text>
              <Text style={styles.statLabel}>Minutes</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {workouts.reduce((total, workout) => total + workout.calories, 0)}
              </Text>
              <Text style={styles.statLabel}>Calories</Text>
            </View>
          </View>

          {/* Liste des entraînements */}
          <View style={styles.workoutsSection}>
            <Text style={styles.sectionTitle}>
              Entraînements planifiés ({workouts.length})
            </Text>

            {workouts.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>📅</Text>
                <Text style={styles.emptyTitle}>Aucun entraînement</Text>
                <Text style={styles.emptyMessage}>
                  Vous n'avez pas encore planifié d'entraînement pour ce jour
                </Text>
                <TouchableOpacity style={styles.addWorkoutButton} onPress={handleAddNewWorkout}>
                  <Text style={styles.addWorkoutButtonText}>Créer un entraînement</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.workoutsList}>
                {workouts.map((workout) => (
                  <View key={workout.id} style={styles.workoutCard}>
                    <View style={styles.workoutHeader}>
                      <View style={styles.workoutInfo}>
                        <View style={styles.workoutTitleRow}>
                          <Text style={styles.workoutIcon}>{getTypeIcon(workout.type)}</Text>
                          <View style={styles.workoutTitleContainer}>
                            <Text style={styles.workoutName}>{workout.name}</Text>
                            <Text style={styles.workoutType}>{workout.type}</Text>
                          </View>
                        </View>
                        {workout.time && (
                          <View style={styles.timeContainer}>
                            <Text style={styles.timeIcon}>🕐</Text>
                            <Text style={styles.timeText}>{formatTime(workout.time)}</Text>
                          </View>
                        )}
                      </View>
                      
                      <View style={styles.workoutActions}>
                        <TouchableOpacity 
                          style={styles.actionButton}
                          onPress={() => handleEditWorkout(workout)}
                        >
                          <Text style={styles.actionButtonText}>✏️</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={[styles.actionButton, styles.deleteButton]}
                          onPress={() => handleDeleteWorkout(workout.id)}
                        >
                          <Text style={styles.actionButtonText}>🗑️</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Détails de l'entraînement */}
                    <View style={styles.workoutDetails}>
                      <View style={styles.detailsGrid}>
                        <View style={styles.detailItem}>
                          <Text style={styles.detailLabel}>Durée</Text>
                          <Text style={styles.detailValue}>{workout.duration} min</Text>
                        </View>
                        
                        <View style={styles.detailItem}>
                          <Text style={styles.detailLabel}>Calories</Text>
                          <Text style={styles.detailValue}>{workout.calories} kcal</Text>
                        </View>

                        {workout.difficulty && (
                          <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>Difficulté</Text>
                            <Text style={[
                              styles.detailValue, 
                              { color: getDifficultyColor(workout.difficulty) }
                            ]}>
                              {workout.difficulty}
                            </Text>
                          </View>
                        )}

                        {workout.specificity && (
                          <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>Spécificité</Text>
                            <Text style={styles.detailValue}>{workout.specificity}</Text>
                          </View>
                        )}
                      </View>
                    </View>

                    {/* Exercices */}
                    {workout.exercises && workout.exercises.length > 0 && (
                      <View style={styles.exercisesSection}>
                        <Text style={styles.exercisesTitle}>
                          Exercices ({workout.exercises.length})
                        </Text>
                        <View style={styles.exercisesList}>
                          {workout.exercises.slice(0, 3).map((exercise, index) => (
                            <View key={exercise.id} style={styles.exerciseItem}>
                              <Text style={styles.exerciseName}>{exercise.name}</Text>
                              <View style={styles.exerciseDetails}>
                                {exercise.sets && (
                                  <Text style={styles.exerciseDetail}>{exercise.sets} séries</Text>
                                )}
                                {exercise.reps && (
                                  <Text style={styles.exerciseDetail}>{exercise.reps} reps</Text>
                                )}
                                {exercise.duration && (
                                  <Text style={styles.exerciseDetail}>{exercise.duration} min</Text>
                                )}
                                {exercise.weight && (
                                  <Text style={styles.exerciseDetail}>{exercise.weight} kg</Text>
                                )}
                              </View>
                            </View>
                          ))}
                          {workout.exercises.length > 3 && (
                            <Text style={styles.moreExercises}>
                              +{workout.exercises.length - 3} exercice{workout.exercises.length - 3 > 1 ? 's' : ''} de plus
                            </Text>
                          )}
                        </View>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
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
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#21262D',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#21262D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerInfo: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerDate: {
    fontSize: 14,
    color: '#8B949E',
    marginTop: 2,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5A623',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#000000',
    fontSize: 24,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#21262D',
    flex: 1,
    marginHorizontal: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F5A623',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#8B949E',
    textAlign: 'center',
  },
  workoutsSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  emptyState: {
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#21262D',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: '#8B949E',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  addWorkoutButton: {
    backgroundColor: '#F5A623',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  addWorkoutButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  workoutsList: {
    gap: 16,
  },
  workoutCard: {
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#21262D',
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  workoutInfo: {
    flex: 1,
  },
  workoutTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  workoutIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  workoutTitleContainer: {
    flex: 1,
  },
  workoutName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  workoutType: {
    fontSize: 14,
    color: '#F5A623',
    fontWeight: '500',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  timeText: {
    fontSize: 14,
    color: '#8B949E',
    fontWeight: '500',
  },
  workoutActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#21262D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    backgroundColor: '#DA373C',
  },
  actionButtonText: {
    fontSize: 16,
  },
  workoutDetails: {
    marginBottom: 16,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  detailItem: {
    backgroundColor: '#0D1117',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#21262D',
    minWidth: '45%',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    color: '#8B949E',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  exercisesSection: {
    borderTopWidth: 1,
    borderTopColor: '#21262D',
    paddingTop: 16,
  },
  exercisesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  exercisesList: {
    gap: 8,
  },
  exerciseItem: {
    backgroundColor: '#0D1117',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#21262D',
  },
  exerciseName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  exerciseDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  exerciseDetail: {
    fontSize: 12,
    color: '#8B949E',
    backgroundColor: '#21262D',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  moreExercises: {
    fontSize: 12,
    color: '#8B949E',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
});
