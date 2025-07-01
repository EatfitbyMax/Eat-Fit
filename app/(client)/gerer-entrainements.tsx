
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
  const [selectedDay, setSelectedDay] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');

  useEffect(() => {
    loadWorkouts();
  }, []);

  const loadWorkouts = () => {
    const selectedDayParam = params.selectedDay as string;
    const selectedDateParam = params.selectedDate as string;
    const workoutsParam = params.workouts as string;

    setSelectedDay(selectedDayParam || '');
    setSelectedDate(selectedDateParam || '');

    if (workoutsParam) {
      try {
        const parsedWorkouts = JSON.parse(workoutsParam);
        setWorkouts(parsedWorkouts);
      } catch (error) {
        console.error('Erreur parsing workouts:', error);
        setWorkouts([]);
      }
    }
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

  const handleDeleteWorkout = async (workoutId: string) => {
    Alert.alert(
      'Supprimer l\'entraînement',
      'Êtes-vous sûr de vouloir supprimer cet entraînement ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Supprimer', 
          style: 'destructive',
          onPress: () => deleteWorkout(workoutId)
        }
      ]
    );
  };

  const deleteWorkout = async (workoutId: string) => {
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) return;

      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      const storedWorkouts = await AsyncStorage.getItem(`workouts_${currentUser.id}`);
      
      if (storedWorkouts) {
        const allWorkouts = JSON.parse(storedWorkouts);
        const updatedWorkouts = allWorkouts.filter((w: Workout) => w.id !== workoutId);
        
        await AsyncStorage.setItem(`workouts_${currentUser.id}`, JSON.stringify(updatedWorkouts));
        
        // Mettre à jour la liste locale
        const updatedLocalWorkouts = workouts.filter(w => w.id !== workoutId);
        setWorkouts(updatedLocalWorkouts);
        
        // Si plus d'entraînements, retourner à la page principale
        if (updatedLocalWorkouts.length === 0) {
          // Forcer le rechargement de la page précédente
          setTimeout(() => {
            router.back();
          }, 100);
        }
        
        Alert.alert('Succès', 'Entraînement supprimé !');
      }
    } catch (error) {
      console.error('Erreur suppression:', error);
      Alert.alert('Erreur', 'Impossible de supprimer l\'entraînement');
    }
  };

  const handleAddWorkout = () => {
    router.push({
      pathname: '/(client)/creer-entrainement',
      params: {
        selectedDay,
        selectedDate
      }
    });
  };

  const formatDate = (dateString: string) => {
    // Forcer le parsing en UTC pour éviter les décalages de fuseau horaire
    const date = new Date(dateString + 'T00:00:00.000Z');
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      timeZone: 'Europe/Paris'
    });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'facile':
        return '#28A745';
      case 'modéré':
        return '#FFA500';
      case 'difficile':
        return '#FF6B6B';
      default:
        return '#8B949E';
    }
  };

  const getTypeEmoji = (type: string) => {
    switch (type.toLowerCase()) {
      case 'musculation':
        return '💪';
      case 'cardio':
        return '🏃‍♂️';
      case 'yoga':
        return '🧘‍♀️';
      case 'natation':
        return '🏊‍♂️';
      case 'cyclisme':
        return '🚴‍♂️';
      case 'course':
        return '🏃‍♂️';
      default:
        return '🏋️‍♂️';
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>← Retour</Text>
        </TouchableOpacity>
        
        <View style={styles.headerInfo}>
          <Text style={styles.title}>Séances planifiées</Text>
          <Text style={styles.subtitle}>
            {formatDate(selectedDate)}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          {workouts.map((workout, index) => (
            <View key={workout.id} style={styles.workoutCard}>
              <View style={styles.workoutHeader}>
                <View style={styles.workoutTitleSection}>
                  <Text style={styles.workoutEmoji}>{getTypeEmoji(workout.type)}</Text>
                  <View style={styles.workoutInfo}>
                    <Text style={styles.workoutName}>{workout.name}</Text>
                    <Text style={styles.workoutType}>{workout.type}</Text>
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

              <View style={styles.workoutDetails}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Spécialité</Text>
                  <Text style={styles.detailValue}>{workout.specificity || 'Non spécifié'}</Text>
                </View>

                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Difficulté</Text>
                  <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(workout.difficulty) }]}>
                    <Text style={styles.difficultyText}>{workout.difficulty}</Text>
                  </View>
                </View>

                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Durée</Text>
                  <Text style={styles.detailValue}>{workout.duration} min</Text>
                </View>

                {workout.time && (
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Heure</Text>
                    <Text style={styles.detailValue}>{workout.time}</Text>
                  </View>
                )}

                {workout.exercises && workout.exercises.length > 0 && (
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Exercices</Text>
                    <Text style={styles.detailValue}>{workout.exercises.length} exercice(s)</Text>
                  </View>
                )}
              </View>
            </View>
          ))}

          <TouchableOpacity 
            style={styles.addButton}
            onPress={handleAddWorkout}
          >
            <Text style={styles.addButtonIcon}>+</Text>
            <Text style={styles.addButtonText}>Ajouter une séance</Text>
          </TouchableOpacity>
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
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
    backgroundColor: 'rgba(13, 17, 23, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 165, 0, 0.1)',
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#161B22',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#21262D',
    marginBottom: 16,
  },
  backButtonText: {
    color: '#F5A623',
    fontSize: 14,
    fontWeight: '600',
  },
  headerInfo: {
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#8B949E',
    textAlign: 'center',
    textTransform: 'capitalize',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  workoutCard: {
    backgroundColor: '#161B22',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#21262D',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  workoutTitleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  workoutEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  workoutInfo: {
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
    color: '#8B949E',
  },
  workoutActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    width: 36,
    height: 36,
    backgroundColor: '#0D1117',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#21262D',
  },
  editButtonText: {
    fontSize: 16,
  },
  deleteButton: {
    width: 36,
    height: 36,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.3)',
  },
  deleteButtonText: {
    fontSize: 16,
  },
  workoutDetails: {
    gap: 12,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: '#8B949E',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  difficultyText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#21262D',
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  addButtonIcon: {
    fontSize: 24,
    color: '#8B949E',
    marginBottom: 4,
  },
  addButtonText: {
    fontSize: 14,
    color: '#8B949E',
    fontWeight: '500',
  },
});
