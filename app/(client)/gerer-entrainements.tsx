
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
}

export default function GererEntrainementsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { theme } = useTheme();
  const { t } = useLanguage();

  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const selectedDay = params.selectedDay as string;
  const selectedDate = params.selectedDate as string;

  useEffect(() => {
    loadWorkouts();
  }, []);

  const loadWorkouts = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (currentUser) {
        const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
        const storedWorkouts = await AsyncStorage.getItem(`workouts_${currentUser.id}`);
        if (storedWorkouts) {
          const allWorkouts = JSON.parse(storedWorkouts);
          const dayWorkouts = allWorkouts.filter((workout: Workout) => workout.date === selectedDate);
          setWorkouts(dayWorkouts);
        }
      }
    } catch (error) {
      console.error('Erreur chargement entraînements:', error);
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
        <TouchableOpacity style={styles.addButton} onPress={handleAddNewWorkout}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
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
});
