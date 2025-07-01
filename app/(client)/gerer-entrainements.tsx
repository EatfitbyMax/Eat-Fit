
import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView, 
  Alert,
  RefreshControl
} from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
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
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Charger les données initiales
  useEffect(() => {
    initializeData();
  }, []);

  // Recharger quand l'écran reprend le focus
  useFocusEffect(
    useCallback(() => {
      console.log('=== FOCUS EFFECT GERER-ENTRAINEMENTS ===');
      loadWorkoutsData();
    }, [selectedDate])
  );

  const initializeData = () => {
    const selectedDayParam = params.selectedDay as string;
    const selectedDateParam = params.selectedDate as string;
    
    console.log('=== INITIALISATION GERER-ENTRAINEMENTS ===');
    console.log('Jour sélectionné:', selectedDayParam);
    console.log('Date sélectionnée:', selectedDateParam);

    setSelectedDay(selectedDayParam || '');
    setSelectedDate(selectedDateParam || '');
    
    // Charger les entraînements après avoir défini la date
    if (selectedDateParam) {
      loadWorkoutsData(selectedDateParam);
    }
  };

  const loadWorkoutsData = async (targetDate?: string) => {
    try {
      setIsLoading(true);
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        console.error('Utilisateur non connecté');
        setWorkouts([]);
        return;
      }

      const dateToUse = targetDate || selectedDate;
      if (!dateToUse) {
        console.error('Aucune date spécifiée');
        setWorkouts([]);
        return;
      }

      console.log('=== CHARGEMENT ENTRAINEMENTS POUR DATE ===');
      console.log('Date cible:', dateToUse);

      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      const storedWorkouts = await AsyncStorage.getItem(`workouts_${currentUser.id}`);
      
      if (storedWorkouts) {
        const allWorkouts = JSON.parse(storedWorkouts);
        console.log('Total entraînements stockés:', allWorkouts.length);
        
        // Filtrer par date exacte
        const dayWorkouts = allWorkouts.filter((workout: Workout) => {
          const match = workout.date === dateToUse;
          if (match) {
            console.log(`✅ Entraînement trouvé: ${workout.name} le ${workout.date}`);
          }
          return match;
        });
        
        console.log(`Entraînements filtrés pour ${dateToUse}:`, dayWorkouts.length);
        setWorkouts(dayWorkouts);
      } else {
        console.log('Aucun entraînement stocké');
        setWorkouts([]);
      }
    } catch (error) {
      console.error('Erreur chargement entraînements:', error);
      setWorkouts([]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadWorkoutsData();
  };

  const handleEditWorkout = (workout: Workout) => {
    console.log('Édition entraînement:', workout.name);
    router.push({
      pathname: '/(client)/creer-entrainement',
      params: {
        selectedDay,
        selectedDate,
        editWorkout: JSON.stringify(workout)
      }
    });
  };

  const handleDeleteWorkout = (workoutId: string) => {
    const workoutToDelete = workouts.find(w => w.id === workoutId);
    if (!workoutToDelete) return;

    Alert.alert(
      'Supprimer l\'entraînement',
      `Êtes-vous sûr de vouloir supprimer "${workoutToDelete.name}" ?`,
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
      if (!currentUser) {
        Alert.alert('Erreur', 'Utilisateur non connecté');
        return;
      }

      console.log('=== SUPPRESSION ENTRAINEMENT ===');
      console.log('ID à supprimer:', workoutId);

      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      const storedWorkouts = await AsyncStorage.getItem(`workouts_${currentUser.id}`);
      
      if (storedWorkouts) {
        const allWorkouts = JSON.parse(storedWorkouts);
        const updatedWorkouts = allWorkouts.filter((w: Workout) => w.id !== workoutId);
        
        await AsyncStorage.setItem(`workouts_${currentUser.id}`, JSON.stringify(updatedWorkouts));
        
        // Mettre à jour la liste locale
        const updatedLocalWorkouts = workouts.filter(w => w.id !== workoutId);
        setWorkouts(updatedLocalWorkouts);
        
        console.log(`Entraînement supprimé. Restants: ${updatedLocalWorkouts.length}`);
        
        Alert.alert('Succès', 'Entraînement supprimé avec succès !');
        
        // Si plus d'entraînements pour ce jour, retourner à la page principale
        if (updatedLocalWorkouts.length === 0) {
          setTimeout(() => {
            router.back();
          }, 1000);
        }
      }
    } catch (error) {
      console.error('Erreur suppression:', error);
      Alert.alert('Erreur', 'Impossible de supprimer l\'entraînement');
    }
  };

  const handleAddWorkout = () => {
    console.log('Ajout nouvel entraînement pour:', selectedDate);
    router.push({
      pathname: '/(client)/creer-entrainement',
      params: {
        selectedDay,
        selectedDate
      }
    });
  };

  const handleGoBack = () => {
    console.log('Retour à la page entraînement');
    router.back();
  };

  const formatDate = (dateString: string) => {
    try {
      // Parser la date en UTC pour éviter les décalages
      const date = new Date(dateString + 'T00:00:00.000Z');
      return date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        timeZone: 'Europe/Paris'
      });
    } catch (error) {
      console.error('Erreur formatage date:', error);
      return dateString;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'facile':
        return '#28A745';
      case 'modéré':
        return '#FFA500';
      case 'difficile':
        return '#FF6B6B';
      case 'effort maximal':
        return '#DC3545';
      default:
        return '#8B949E';
    }
  };

  const getTypeEmoji = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'musculation':
        return '💪';
      case 'cardio':
        return '❤️';
      case 'course à pied':
        return '🏃‍♂️';
      case 'yoga':
        return '🧘‍♀️';
      case 'natation':
        return '🏊‍♂️';
      case 'cyclisme':
        return '🚴‍♂️';
      case 'hiit':
        return '🔥';
      case 'boxe':
        return '🥊';
      case 'crossfit':
        return '⚡';
      case 'étirement':
        return '🤸‍♀️';
      default:
        return '🏋️‍♂️';
    }
  };

  const renderWorkoutCard = (workout: Workout, index: number) => (
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
        {workout.specificity && (
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Spécialité</Text>
            <Text style={styles.detailValue}>{workout.specificity}</Text>
          </View>
        )}

        {workout.difficulty && (
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Difficulté</Text>
            <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(workout.difficulty) }]}>
              <Text style={styles.difficultyText}>{workout.difficulty}</Text>
            </View>
          </View>
        )}

        {workout.duration > 0 && (
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Durée</Text>
            <Text style={styles.detailValue}>{workout.duration} min</Text>
          </View>
        )}

        {workout.time && (
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Heure</Text>
            <Text style={styles.detailValue}>{workout.time}</Text>
          </View>
        )}

        {workout.calories > 0 && (
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Calories</Text>
            <Text style={styles.detailValue}>{workout.calories} kcal</Text>
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
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Text style={styles.emptyIconText}>📅</Text>
      </View>
      <Text style={styles.emptyTitle}>Aucune séance planifiée</Text>
      <Text style={styles.emptyMessage}>
        Vous n'avez pas encore d'entraînement prévu pour ce jour
      </Text>
      <TouchableOpacity 
        style={styles.addFirstButton}
        onPress={handleAddWorkout}
      >
        <Text style={styles.addFirstButtonText}>Créer ma première séance</Text>
      </TouchableOpacity>
    </View>
  );

  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <Text style={styles.loadingText}>Chargement...</Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleGoBack}
        >
          <Text style={styles.backButtonText}>← Retour</Text>
        </TouchableOpacity>
        
        <View style={styles.headerInfo}>
          <Text style={styles.title}>Séances planifiées</Text>
          {selectedDate && (
            <Text style={styles.subtitle}>
              {formatDate(selectedDate)}
            </Text>
          )}
        </View>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#F5A623"
            colors={['#F5A623']}
          />
        }
      >
        <View style={styles.content}>
          {isLoading ? (
            renderLoadingState()
          ) : workouts.length > 0 ? (
            <>
              {/* Liste des entraînements */}
              <View style={styles.workoutsList}>
                {workouts.map((workout, index) => renderWorkoutCard(workout, index))}
              </View>

              {/* Bouton d'ajout */}
              <TouchableOpacity 
                style={styles.addButton}
                onPress={handleAddWorkout}
              >
                <Text style={styles.addButtonIcon}>+</Text>
                <Text style={styles.addButtonText}>Ajouter une séance</Text>
              </TouchableOpacity>
            </>
          ) : (
            renderEmptyState()
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
  workoutsList: {
    marginBottom: 20,
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
  emptyState: {
    backgroundColor: '#161B22',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#21262D',
    marginTop: 40,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#21262D',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyIconText: {
    fontSize: 36,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 16,
    color: '#8B949E',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  addFirstButton: {
    backgroundColor: '#F5A623',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  addFirstButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
});
