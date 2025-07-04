import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView, 
  TextInput, 
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getCurrentUser } from '../../utils/auth';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { allSports } from '@/utils/sportPrograms';

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

const getOrderedSports = (favoriteSport: string, recentSports: string[] = []) => {
  const sports = [...allSports];
  const orderedSports = [];

  // 1. Mettre le sport favori en premier
  if (favoriteSport) {
    const favoriteIndex = sports.findIndex(sport => sport.id === favoriteSport);
    if (favoriteIndex !== -1) {
      const favoriteSportData = sports.splice(favoriteIndex, 1)[0];
      orderedSports.push(favoriteSportData);
    }
  }

  // 2. Ajouter les sports récents (max 3, en excluant le sport favori)
  const recentSportsData = recentSports
    .filter(sportId => sportId !== favoriteSport) // Exclure le sport favori
    .slice(0, 3) // Max 3 sports récents
    .map(sportId => sports.find(sport => sport.id === sportId))
    .filter(sport => sport !== undefined);

  // Retirer les sports récents de la liste principale
  recentSportsData.forEach(recentSport => {
    const index = sports.findIndex(sport => sport.id === recentSport.id);
    if (index !== -1) {
      sports.splice(index, 1);
    }
  });

  // Ajouter les sports récents après le favori
  orderedSports.push(...recentSportsData);

  // 3. Ajouter le reste des sports
  orderedSports.push(...sports);

  return orderedSports;
};



const SPECIFICITIES = [
  'Force', 'Endurance', 'Vitesse', 'Souplesse', 'Équilibre', 
  'Coordination', 'Puissance', 'Récupération', 'Technique', 'Cardio'
];

const DIFFICULTIES = ['Facile', 'Modéré', 'Difficile', 'Effort maximal'];

const EXERCISE_SUGGESTIONS = {
  'Musculation': [
    'Squat', 'Développé couché', 'Soulevé de terre', 'Pompes', 'Tractions',
    'Développé militaire', 'Rowing barre', 'Curl biceps', 'Dips', 'Fentes'
  ],
  'Cardio': [
    'Tapis de course', 'Vélo elliptique', 'Rameur', 'Stepper', 'Burpees',
    'Mountain climbers', 'Jumping jacks', 'High knees', 'Corde à sauter'
  ],
  'Course à pied': [
    'Échauffement', 'Course continue', 'Fractionné', 'Interval training',
    'Sprint', 'Côtes', 'Récupération active', 'Étirements', 'Fartlek'
  ],
  'Natation': [
    'Crawl', 'Brasse', 'Dos crawlé', 'Papillon', 'Battements de jambes',
    'Pull buoy', 'Plaquettes', 'Éducatifs', 'Récupération', 'Apnée'
  ],
  'Cyclisme': [
    'Échauffement', 'Endurance', 'Fractionné', 'Côtes', 'Sprint',
    'Tempo', 'Récupération', 'Technique', 'PMA', 'Seuil'
  ],
  'Yoga': [
    'Salutation au soleil', 'Guerrier', 'Chien tête en bas', 'Cobra',
    'Triangle', 'Arbre', 'Lotus', 'Shavasana', 'Pranayama', 'Méditation'
  ],
  'HIIT': [
    'Burpees', 'Squat jump', 'Mountain climbers', 'Planche', 'Fentes sautées',
    'Push-ups', 'Corde à sauter', 'Sprints', 'Battle rope', 'Box jump'
  ],
  'Pilates': [
    'Hundred', 'Roll up', 'Single leg circle', 'Rolling like a ball',
    'Teaser', 'Plank', 'Side plank', 'Swan', 'Leg pull front', 'Scissors'
  ],
  'Boxe': [
    'Jab', 'Cross', 'Crochet', 'Uppercut', 'Esquive', 'Blocage',
    'Sac de frappe', 'Pattes d\'ours', 'Shadow boxing', 'Corde à sauter'
  ],
  'CrossFit': [
    'Thrusters', 'Pull-ups', 'Box jump', 'Kettlebell swing', 'Burpees',
    'Deadlift', 'Clean and jerk', 'Snatch', 'Wall ball', 'Double unders'
  ],
  'Football': [
    'Échauffement', 'Passes courtes', 'Passes longues', 'Contrôle',
    'Dribbles', 'Tirs', 'Têtes', 'Défense', 'Jeu à 11', 'Penalties'
  ],
  'Basketball': [
    'Dribbles', 'Tirs', 'Passes', 'Rebonds', 'Défense', 'Lay-up',
    '3 points', 'Lancers francs', 'Jeu collectif', 'Conditionnement'
  ],
  'Tennis': [
    'Service', 'Coup droit', 'Revers', 'Volée', 'Smash', 'Lob',
    'Déplacements', 'Jeu de jambes', 'Retour de service', 'Points'
  ],
  'Étirement': [
    'Ischio-jambiers', 'Quadriceps', 'Mollets', 'Fessiers', 'Dos',
    'Épaules', 'Cou', 'Hanches', 'Adducteurs', 'Psoas'
  ],
  'Danse': [
    'Échauffement', 'Technique', 'Chorégraphie', 'Improvisation',
    'Cardio dance', 'Isolation', 'Coordination', 'Souplesse', 'Rythme'
  ],
  'Escalade': [
    'Échauffement', 'Technique', 'Force', 'Endurance', 'Équilibre',
    'Voies faciles', 'Voies difficiles', 'Boulder', 'Rappel', 'Nœuds'
  ]
};

export default function CreerEntrainementScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { theme } = useTheme();
  const { t } = useLanguage();

  const [workout, setWorkout] = useState<Workout>({
    id: '',
    name: '',
    date: params.selectedDate as string || '',
    type: '',
    specificity: '',
    difficulty: '',
    duration: 0,
    calories: 0,
    time: '',
    exercises: []
  });

  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showSpecificityModal, setShowSpecificityModal] = useState(false);
  const [showDifficultyModal, setShowDifficultyModal] = useState(false);
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [currentExercise, setCurrentExercise] = useState<Exercise>({
    id: '',
    name: '',
    sets: '',
    reps: '',
    duration: '',
    rest: '',
    notes: '',
    distance: '',
    weight: '',
    intensity: ''
  });
  const [editingExerciseIndex, setEditingExerciseIndex] = useState<number | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [userFavoriteSport, setUserFavoriteSport] = useState<string>('');
  const [recentSports, setRecentSports] = useState<string[]>([]);

  useEffect(() => {
    loadUserData();
    loadRecentSports();
  }, []);

  // Surveiller les changements de paramètres pour mettre à jour la date
  useEffect(() => {
    if (params.selectedDate && params.selectedDate !== workout.date) {
      console.log('=== MISE À JOUR DATE PARAMÈTRES ===');
      console.log('Ancienne date:', workout.date);
      console.log('Nouvelle date:', params.selectedDate);
      console.log('Jour sélectionné:', params.selectedDay);
      console.log('=================================');
      
      setWorkout(prev => ({
        ...prev,
        date: params.selectedDate as string
      }));
    }
  }, [params.selectedDate, params.selectedDay]);

  useEffect(() => {
    // Calculer les calories estimées basées sur le type et la durée
    calculateCalories();
  }, [workout.type, workout.duration, workout.difficulty]);

  const loadUserData = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (currentUser && currentUser.favoriteSport) {
        setUserFavoriteSport(currentUser.favoriteSport);

        // Pré-remplir le sport avec le sport favori
        const favoriteSport = allSports.find(sport => sport.id === currentUser.favoriteSport);
        if (favoriteSport) {
          setWorkout(prev => ({ ...prev, type: favoriteSport.name }));
          console.log('Sport favori de l\'utilisateur:', currentUser.favoriteSport, '-> Sport:', favoriteSport.name);
        }
      }
    } catch (error) {
      console.error('Erreur chargement données utilisateur:', error);
    }
  };

  const loadRecentSports = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) return;

      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      const recentSportsData = await AsyncStorage.getItem(`recent_sports_${currentUser.id}`);
      
      if (recentSportsData) {
        const recent = JSON.parse(recentSportsData);
        setRecentSports(recent);
      }
    } catch (error) {
      console.error('Erreur chargement sports récents:', error);
    }
  };

  const saveRecentSport = async (sportName: string) => {
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) return;

      // Trouver l'ID du sport à partir du nom
      const sport = allSports.find(s => s.name === sportName);
      if (!sport) return;

      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      
      // Récupérer les sports récents actuels
      const currentRecentData = await AsyncStorage.getItem(`recent_sports_${currentUser.id}`);
      const currentRecent = currentRecentData ? JSON.parse(currentRecentData) : [];

      // Créer la nouvelle liste (enlever le sport s'il existe déjà, puis l'ajouter en premier)
      const updatedRecent = [sport.id, ...currentRecent.filter((id: string) => id !== sport.id)].slice(0, 5); // Max 5 sports récents

      // Sauvegarder
      await AsyncStorage.setItem(`recent_sports_${currentUser.id}`, JSON.stringify(updatedRecent));
      setRecentSports(updatedRecent);
    } catch (error) {
      console.error('Erreur sauvegarde sport récent:', error);
    }
  };

  const calculateCalories = () => {
    if (!workout.duration || !workout.type) return;

    let caloriesPerMinute = 5; // Base

    // Ajustement selon le type d'exercice
    switch (workout.type.toLowerCase()) {
      case 'course à pied':
      case 'hiit':
        caloriesPerMinute = 12;
        break;
      case 'cyclisme':
      case 'natation':
        caloriesPerMinute = 10;
        break;
      case 'musculation':
      case 'crossfit':
        caloriesPerMinute = 8;
        break;
      case 'yoga':
      case 'étirement':
        caloriesPerMinute = 3;
        break;
      case 'cardio':
        caloriesPerMinute = 7;
        break;
      default:
        caloriesPerMinute = 6;
    }

    // Ajustement selon la difficulté
    switch (workout.difficulty) {
      case 'Facile':
        caloriesPerMinute *= 0.8;
        break;
      case 'Modéré':
        caloriesPerMinute *= 1.0;
        break;
      case 'Difficile':
        caloriesPerMinute *= 1.2;
        break;
      case 'Effort maximal':
        caloriesPerMinute *= 1.4;
        break;
    }

    const estimatedCalories = Math.round(workout.duration * caloriesPerMinute);
    setWorkout(prev => ({ ...prev, calories: estimatedCalories }));
  };

  const handleSaveWorkout = async () => {
    if (!workout.name.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir un nom pour l\'entraînement');
      return;
    }

    if (!workout.type) {
      Alert.alert('Erreur', 'Veuillez sélectionner un sport');
      return;
    }

    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        Alert.alert('Erreur', 'Utilisateur non connecté');
        return;
      }

      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;

      const workoutToSave: Workout = {
        ...workout,
        id: Date.now().toString()
      };

      console.log('=== SAUVEGARDE ENTRAÎNEMENT ===');
      console.log('Date paramètre:', params.selectedDate);
      console.log('Date workout:', workout.date);
      console.log('Jour paramètre:', params.selectedDay);
      console.log('Entraînement à sauvegarder:', workoutToSave);
      console.log('==============================');

      // Récupérer les entraînements existants
      const existingWorkouts = await AsyncStorage.getItem(`workouts_${currentUser.id}`);
      const workouts = existingWorkouts ? JSON.parse(existingWorkouts) : [];

      console.log('Entraînements existants:', workouts.length);

      // Ajouter le nouvel entraînement
      workouts.push(workoutToSave);

      console.log('Total après ajout:', workouts.length);

      // Sauvegarder
      await AsyncStorage.setItem(`workouts_${currentUser.id}`, JSON.stringify(workouts));

      console.log('Sauvegarde terminée avec succès');

      Alert.alert(
        'Succès', 
        'Entraînement créé avec succès !',
        [{ 
          text: 'OK', 
          onPress: () => {
            // Rediriger vers la page entrainement
            router.push('/(client)/entrainement');
          }
        }]
      );
    } catch (error) {
      console.error('Erreur sauvegarde entraînement:', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder l\'entraînement');
    }
  };

  const handleAddExercise = () => {
    setCurrentExercise({
      id: '',
      name: '',
      sets: '',
      reps: '',
      duration: '',
      rest: '',
      notes: '',
      distance: '',
      weight: '',
      intensity: ''
    });
    setEditingExerciseIndex(null);
    setShowSuggestions(false);
    setShowExerciseModal(true);
  };

  const handleEditExercise = (index: number) => {
    setCurrentExercise(workout.exercises[index]);
    setEditingExerciseIndex(index);
    setShowExerciseModal(true);
  };

  const handleSaveExercise = () => {
    if (!currentExercise.name.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir un nom pour l\'exercice');
      return;
    }

    const exerciseToSave: Exercise = {
      ...currentExercise,
      id: currentExercise.id || Date.now().toString()
    };

    if (editingExerciseIndex !== null) {
      // Modification
      const updatedExercises = [...workout.exercises];
      updatedExercises[editingExerciseIndex] = exerciseToSave;
      setWorkout(prev => ({ ...prev, exercises: updatedExercises }));
    } else {
      // Ajout
      setWorkout(prev => ({
        ...prev,
        exercises: [...prev.exercises, exerciseToSave]
      }));
    }

    // Réinitialiser le formulaire
    setCurrentExercise({
      id: '',
      name: '',
      sets: '',
      reps: '',
      duration: '',
      rest: '',
      notes: '',
      distance: '',
      weight: '',
      intensity: ''
    });
    setEditingExerciseIndex(null);
    setShowSuggestions(false);
    setShowExerciseModal(false);
  };

  const handleDeleteExercise = (index: number) => {
    Alert.alert(
      'Supprimer l\'exercice',
      'Êtes-vous sûr de vouloir supprimer cet exercice ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            const updatedExercises = workout.exercises.filter((_, i) => i !== index);
            setWorkout(prev => ({ ...prev, exercises: updatedExercises }));
          }
        }
      ]
    );
  };

  const getFieldsForSport = (sportType: string) => {
    const commonFields = ['name', 'notes'];
    const sportLower = sportType.toLowerCase();

    // Sports de force et musculation
    if (['musculation', 'fitness', 'crossfit', 'body-pump', 'body-combat', 'gymnastique', 'powerlifting', 'haltérophilie'].includes(sportLower)) {
      return [...commonFields, 'sets', 'reps', 'weight', 'rest'];
    }

    // Sports d'endurance avec distance
    if (['course', 'marathon', 'trail', 'cyclisme', 'vtt', 'bmx', 'triathlon', 'biathlon'].includes(sportLower)) {
      return [...commonFields, 'distance', 'duration', 'intensity'];
    }

    // Sports aquatiques
    if (['natation', 'aquagym', 'water-polo', 'plongee', 'surf', 'kitesurf', 'windsurf', 'voile', 'aviron', 'canoë'].includes(sportLower)) {
      return [...commonFields, 'distance', 'duration', 'sets'];
    }

    // Sports de combat
    if (['boxe', 'judo', 'karate', 'taekwondo', 'mma', 'krav-maga', 'aikido', 'capoeira', 'lutte', 'escrime'].includes(sportLower)) {
      return [...commonFields, 'duration', 'sets', 'intensity'];
    }

    // Sports collectifs
    if (['football', 'basketball', 'rugby', 'volleyball', 'handball', 'hockey-glace', 'hockey-gazon', 'futsal', 'beach-volley', 'beach-soccer', 'ultimate', 'baseball', 'softball', 'cricket', 'tchoukball', 'kinball', 'floorball', 'netball', 'lacrosse', 'rugby-americain'].includes(sportLower)) {
      return [...commonFields, 'duration', 'sets', 'intensity'];
    }

    // Sports de raquette
    if (['tennis', 'badminton', 'ping-pong', 'squash', 'padel'].includes(sportLower)) {
      return [...commonFields, 'duration', 'sets', 'intensity'];
    }

    // Sports d'hiver
    if (['ski', 'snowboard', 'patin-glace', 'curling', 'ski-fond', 'luge', 'bobsleigh', 'patinage-artistique', 'danse-glace'].includes(sportLower)) {
      return [...commonFields, 'duration', 'sets', 'intensity'];
    }

    // Sports de bien-être et flexibilité
    if (['yoga', 'pilates', 'tai-chi', 'qi-gong', 'stretching', 'meditation'].includes(sportLower)) {
      return [...commonFields, 'duration', 'sets'];
    }

    // Sports de danse et fitness
    if (['danse', 'zumba', 'step', 'rpm', 'aerobic'].includes(sportLower)) {
      return [...commonFields, 'duration', 'sets', 'intensity'];
    }

    // Sports d'aventure et nature
    if (['escalade', 'alpinisme', 'via-ferrata', 'speleologie', 'randonnee', 'course-orientation', 'parkour'].includes(sportLower)) {
      return [...commonFields, 'duration', 'sets', 'intensity'];
    }

    // Sports aériens
    if (['parapente', 'saut-parachute', 'deltaplane', 'ulm'].includes(sportLower)) {
      return [...commonFields, 'duration', 'sets', 'intensity'];
    }

    // Sports mécaniques
    if (['motocross', 'karting', 'rallye', 'quad', 'drone-racing'].includes(sportLower)) {
      return [...commonFields, 'duration', 'sets', 'intensity'];
    }

    // Sports de précision
    if (['golf', 'tir-arc', 'petanque', 'bowling', 'billard', 'flechettes'].includes(sportLower)) {
      return [...commonFields, 'sets', 'reps', 'duration'];
    }

    // Sports mentaux et électroniques
    if (['echecs', 'poker', 'bridge', 'esport'].includes(sportLower)) {
      return [...commonFields, 'duration', 'sets'];
    }

    // Sports équestres
    if (['equitation'].includes(sportLower)) {
      return [...commonFields, 'duration', 'sets', 'intensity'];
    }

    // Par défaut
    return [...commonFields, 'sets', 'reps', 'duration', 'rest'];
  };

  const getPlaceholderForField = (field: string, sportType: string) => {
    switch (field) {
      case 'sets':
        return sportType === 'Natation' ? 'Longueurs' : '3';
      case 'reps':
        return '12';
      case 'duration':
        return sportType === 'Course à pied' ? '30' : '30';
      case 'distance':
        return sportType === 'Course à pied' ? '5' : sportType === 'Natation' ? '1000' : '10';
      case 'weight':
        return '20';
      case 'rest':
        return '60';
      case 'intensity':
        return sportType === 'Course à pied' ? 'Modérée' : 'Moyenne';
      default:
        return '';
    }
  };

  const getUnitForField = (field: string, sportType: string) => {
    switch (field) {
      case 'duration':
        return 'min';
      case 'distance':
        return sportType === 'Natation' ? 'm' : 'km';
      case 'weight':
        return 'kg';
      case 'rest':
        return 'sec';
      default:
        return '';
    }
  };

  const renderSportModal = () => {
    const orderedSports = getOrderedSports(userFavoriteSport, recentSports);

    return (
      <Modal visible={showTypeModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sport</Text>
              <TouchableOpacity onPress={() => setShowTypeModal(false)} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalContent}>
              {orderedSports.map((sport, index) => {
                const isFavorite = sport.id === userFavoriteSport;
                const isRecent = recentSports.includes(sport.id) && !isFavorite;
                const isFirstRecent = isRecent && index === 1; // Premier sport récent après le favori
                
                return (
                  <View key={sport.id}>
                    {/* Séparateur pour les sports récents */}
                    {isFirstRecent && (
                      <View style={styles.sectionSeparator}>
                        <Text style={styles.sectionSeparatorText}>📋 Sports récents</Text>
                      </View>
                    )}
                    
                    {/* Séparateur pour tous les sports */}
                    {!isFavorite && !isRecent && index === (recentSports.filter(id => id !== userFavoriteSport).length + (userFavoriteSport ? 1 : 0)) && (
                      <View style={styles.sectionSeparator}>
                        <Text style={styles.sectionSeparatorText}>🏃 Tous les sports</Text>
                      </View>
                    )}

                    <TouchableOpacity
                      style={[
                        styles.optionItem,
                        isFavorite && styles.favoriteOptionItem,
                        isRecent && styles.recentOptionItem
                      ]}
                      onPress={() => {
                        setWorkout(prev => ({ ...prev, type: sport.name }));
                        saveRecentSport(sport.name); // Sauvegarder comme sport récent
                        setShowTypeModal(false);
                      }}
                    >
                      <View style={styles.optionContent}>
                        <View style={styles.sportOptionLeft}>
                          <Text style={styles.sportEmoji}>{sport.emoji}</Text>
                          <View style={styles.sportOptionInfo}>
                            <Text style={[
                              styles.optionText,
                              isFavorite && styles.favoriteOptionText,
                              isRecent && styles.recentOptionText
                            ]}>
                              {sport.name}
                            </Text>
                            <Text style={[
                              styles.sportCategoryText,
                              isFavorite && styles.favoriteCategoryText,
                              isRecent && styles.recentCategoryText
                            ]}>
                              {sport.category}
                            </Text>
                          </View>
                        </View>
                        
                        {isFavorite && (
                          <View style={styles.favoriteIndicator}>
                            <Text style={styles.favoriteIndicatorText}>⭐ Favori</Text>
                          </View>
                        )}
                        
                        {isRecent && (
                          <View style={styles.recentIndicator}>
                            <Text style={styles.recentIndicatorText}>🕒 Récent</Text>
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  const renderDropdownModal = (
    visible: boolean,
    onClose: () => void,
    title: string,
    options: string[],
    onSelect: (value: string) => void
  ) => {
    return (
      <Modal visible={visible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{title}</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalContent}>
              {options.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={styles.optionItem}
                  onPress={() => {
                    onSelect(option);
                    onClose();
                  }}
                >
                  <Text style={styles.optionText}>{option}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  const renderExerciseModal = () => {
    const fieldsToShow = getFieldsForSport(workout.type);
    const suggestions = EXERCISE_SUGGESTIONS[workout.type] || [];

    return (
      <Modal visible={showExerciseModal} transparent animationType="slide">
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingExerciseIndex !== null ? 'Modifier l\'exercice' : `Ajouter un exercice ${workout.type ? `- ${workout.type}` : ''}`}
              </Text>
              <TouchableOpacity onPress={() => setShowExerciseModal(false)} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.modalContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
            >
              {/* Nom de l'exercice avec suggestions */}
              <View style={styles.inputGroup}>
                <View style={styles.labelWithSuggestion}>
                  <Text style={styles.label}>Nom de l'exercice *</Text>
                  {suggestions.length > 0 && (
                    <TouchableOpacity 
                      style={styles.suggestionButton}
                      onPress={() => setShowSuggestions(!showSuggestions)}
                    >
                      <Text style={styles.suggestionButtonText}>
                        {showSuggestions ? 'Masquer' : 'Suggestions'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
                <TextInput
                  style={styles.input}
                  value={currentExercise.name}
                  onChangeText={(text) => setCurrentExercise(prev => ({ ...prev, name: text }))}
                  placeholder={`Ex: ${suggestions.slice(0, 2).join(', ')}...`}
                  placeholderTextColor="#8B949E"
                />

                {showSuggestions && suggestions.length > 0 && (
                  <View style={styles.suggestionsContainer}>
                    {suggestions.map((suggestion) => (
                      <TouchableOpacity
                        key={suggestion}
                        style={styles.suggestionItem}
                        onPress={() => {
                          setCurrentExercise(prev => ({ ...prev, name: suggestion }));
                          setShowSuggestions(false);
                        }}
                      >
                        <Text style={styles.suggestionText}>{suggestion}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Champs dynamiques selon le sport */}
              {fieldsToShow.includes('sets') && fieldsToShow.includes('reps') && (
                <View style={styles.row}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.label}>
                      {workout.type === 'Natation' ? 'Longueurs' : 'Séries'}
                    </Text>
                    <TextInput
                      style={styles.input}
                      value={currentExercise.sets}
                      onChangeText={(text) => setCurrentExercise(prev => ({ ...prev, sets: text }))}
                      placeholder={getPlaceholderForField('sets', workout.type)}
                      placeholderTextColor="#8B949E"
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                    <Text style={styles.label}>Répétitions</Text>
                    <TextInput
                      style={styles.input}
                      value={currentExercise.reps}
                      onChangeText={(text) => setCurrentExercise(prev => ({ ...prev, reps: text }))}
                      placeholder={getPlaceholderForField('reps', workout.type)}
                      placeholderTextColor="#8B949E"
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              )}

              {fieldsToShow.includes('distance') && fieldsToShow.includes('duration') && (
                <View style={styles.row}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.label}>
                      Distance ({getUnitForField('distance', workout.type)})
                    </Text>
                    <TextInput
                      style={styles.input}
                      value={currentExercise.distance}
                      onChangeText={(text) => setCurrentExercise(prev => ({ ...prev, distance: text }))}
                      placeholder={getPlaceholderForField('distance', workout.type)}
                      placeholderTextColor="#8B949E"
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                    <Text style={styles.label}>
                      Durée ({getUnitForField('duration', workout.type)})
                    </Text>
                    <TextInput
                      style={styles.input}
                      value={currentExercise.duration}
                      onChangeText={(text) => setCurrentExercise(prev => ({ ...prev, duration: text }))}
                      placeholder={getPlaceholderForField('duration', workout.type)}
                      placeholderTextColor="#8B949E"
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              )}

              {fieldsToShow.includes('weight') && fieldsToShow.includes('rest') && (
                <View style={styles.row}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.label}>
                      Poids ({getUnitForField('weight', workout.type)})
                    </Text>
                    <TextInput
                      style={styles.input}
                      value={currentExercise.weight}
                      onChangeText={(text) => setCurrentExercise(prev => ({ ...prev, weight: text }))}
                      placeholder={getPlaceholderForField('weight', workout.type)}
                      placeholderTextColor="#8B949E"
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                    <Text style={styles.label}>
                      Repos ({getUnitForField('rest', workout.type)})
                    </Text>
                    <TextInput
                      style={styles.input}
                      value={currentExercise.rest}
                      onChangeText={(text) => setCurrentExercise(prev => ({ ...prev, rest: text }))}
                      placeholder={getPlaceholderForField('rest', workout.type)}
                      placeholderTextColor="#8B949E"
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              )}

              {fieldsToShow.includes('intensity') && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Intensité</Text>
                  <TextInput
                    style={styles.input}
                    value={currentExercise.intensity}
                    onChangeText={(text) => setCurrentExercise(prev => ({ ...prev, intensity: text }))}
                    placeholder={getPlaceholderForField('intensity', workout.type)}
                    placeholderTextColor="#8B949E"
                  />
                </View>
              )}

              {/* Champs individuels selon le sport */}
              {fieldsToShow.includes('sets') && !fieldsToShow.includes('reps') && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>
                    {workout.type === 'Natation' ? 'Longueurs' : 'Séries'}
                  </Text>
                  <TextInput
                    style={styles.input}
                    value={currentExercise.sets}
                    onChangeText={(text) => setCurrentExercise(prev => ({ ...prev, sets: text }))}
                    placeholder={getPlaceholderForField('sets', workout.type)}
                    placeholderTextColor="#8B949E"
                    keyboardType="numeric"
                  />
                </View>
              )}

              {fieldsToShow.includes('duration') && !fieldsToShow.includes('distance') && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>
                    Durée ({getUnitForField('duration', workout.type)})
                  </Text>
                  <TextInput
                    style={styles.input}
                    value={currentExercise.duration}
                    onChangeText={(text) => setCurrentExercise(prev => ({ ...prev, duration: text }))}
                    placeholder={getPlaceholderForField('duration', workout.type)}
                    placeholderTextColor="#8B949E"
                    keyboardType="numeric"
                  />
                </View>
              )}

              {fieldsToShow.includes('notes') && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Notes</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={currentExercise.notes}
                    onChangeText={(text) => setCurrentExercise(prev => ({ ...prev, notes: text }))}
                    placeholder="Instructions spécifiques..."
                    placeholderTextColor="#8B949E"
                    multiline
                  />
                </View>
              )}

              <TouchableOpacity style={styles.saveButton} onPress={handleSaveExercise}>
                <Text style={styles.saveButtonText}>
                  {editingExerciseIndex !== null ? 'Modifier' : 'Ajouter'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    );
  };

  // Fonction pour formater la date correctement
  const formatSelectedDate = () => {
    if (!params.selectedDate) return 'Date non définie';
    
    try {
      // Parser la date en UTC pour éviter les décalages de fuseau horaire
      const date = new Date(params.selectedDate + 'T00:00:00.000Z');
      return date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'Europe/Paris'
      });
    } catch (error) {
      console.error('Erreur formatage date:', error);
      return params.selectedDate as string;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.push('/(client)/entrainement')}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nouvel entraînement</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          {/* Informations de base */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informations générales</Text>

            <Text style={styles.dateInfo}>
              {formatSelectedDate()}
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nom de l'entraînement *</Text>
              <TextInput
                style={styles.input}
                value={workout.name}
                onChangeText={(text) => setWorkout(prev => ({ ...prev, name: text }))}
                placeholder="Ex: Séance pectoraux, Course matinale..."
                placeholderTextColor="#8B949E"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Sport *</Text>
              <TouchableOpacity
                style={styles.dropdown}
                onPress={() => setShowTypeModal(true)}
              >
                <Text style={[styles.dropdownText, !workout.type && styles.placeholder]}>
                  {workout.type || 'Sélectionner un sport'}
                </Text>
                <Text style={styles.dropdownArrow}>▼</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Spécificité</Text>
              <TouchableOpacity
                style={styles.dropdown}
                onPress={() => setShowSpecificityModal(true)}
              >
                <Text style={[styles.dropdownText, !workout.specificity && styles.placeholder]}>
                  {workout.specificity || 'Sélectionner une spécificité'}
                </Text>
                <Text style={styles.dropdownArrow}>▼</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Difficulté</Text>
              <TouchableOpacity
                style={styles.dropdown}
                onPress={() => setShowDifficultyModal(true)}
              >
                <Text style={[styles.dropdownText, !workout.difficulty && styles.placeholder]}>
                  {workout.difficulty || 'Sélectionner une difficulté'}
                </Text>
                <Text style={styles.dropdownArrow}>▼</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>Durée (minutes)</Text>
                <TextInput
                  style={styles.input}
                  value={workout.duration.toString()}
                  onChangeText={(text) => setWorkout(prev => ({ ...prev, duration: parseInt(text) || 0 }))}
                  placeholder="60"
                  placeholderTextColor="#8B949E"
                  keyboardType="numeric"
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>Heure</Text>
                <TextInput
                  style={styles.input}
                  value={workout.time}
                  onChangeText={(text) => setWorkout(prev => ({ ...prev, time: text }))}
                  placeholder="08:00"
                  placeholderTextColor="#8B949E"
                />
              </View>
            </View>

            <View style={styles.caloriesInfo}>
              <Text style={styles.caloriesLabel}>Calories estimées:</Text>
              <Text style={styles.caloriesValue}>{workout.calories} kcal</Text>
            </View>
          </View>

          {/* Exercices */}
          <View style={styles.section}>
            <View style={styles.exercisesHeader}>
              <Text style={styles.sectionTitle}>Exercices ({workout.exercises.length})</Text>
              <TouchableOpacity style={styles.addExerciseButton} onPress={handleAddExercise}>
                <Text style={styles.addExerciseButtonText}>+ Ajouter</Text>
              </TouchableOpacity>
            </View>

            {workout.exercises.length === 0 ? (
              <View style={styles.emptyExercises}>
                <Text style={styles.emptyExercisesText}>Aucun exercice ajouté</Text>
                <Text style={styles.emptyExercisesSubtext}>
                  Cliquez sur "Ajouter" pour créer des exercices spécifiques
                </Text>
              </View>
            ) : (
              <View style={styles.exercisesList}>
                {workout.exercises.map((exercise, index) => (
                  <View key={exercise.id} style={styles.exerciseCard}>
                    <View style={styles.exerciseHeader}>
                      <Text style={styles.exerciseName}>{exercise.name}</Text>
                      <View style={styles.exerciseActions}>
                        <TouchableOpacity onPress={() => handleEditExercise(index)}>
                          <Text style={styles.editButton}>✏️</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDeleteExercise(index)}>
                          <Text style={styles.deleteButton}>🗑️</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    <View style={styles.exerciseDetails}>
                      {exercise.sets && (
                        <Text style={styles.exerciseDetail}>
                          {exercise.sets} {workout.type === 'Natation' ? 'longueurs' : 'séries'}
                        </Text>                      )}
                      {exercise.reps && (
                        <Text style={styles.exerciseDetail}>{exercise.reps} reps</Text>
                      )}
                      {exercise.duration && (
                        <Text style={styles.exerciseDetail}>{exercise.duration} min</Text>
                      )}
                      {exercise.distance && (
                        <Text style={styles.exerciseDetail}>
                          {exercise.distance} {workout.type === 'Natation' ? 'm' : 'km'}
                        </Text>
                      )}
                      {exercise.weight && (
                        <Text style={styles.exerciseDetail}>{exercise.weight} kg</Text>
                      )}
                      {exercise.intensity && (
                        <Text style={styles.exerciseDetail}>Intensité: {exercise.intensity}</Text>
                      )}
                      {exercise.rest && (
                        <Text style={styles.exerciseDetail}>{exercise.rest}s repos</Text>
                      )}
                    </View>

                    {exercise.notes && (
                      <Text style={styles.exerciseNotes}>{exercise.notes}</Text>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Bouton de sauvegarde */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveWorkoutButton} onPress={handleSaveWorkout}>
          <Text style={styles.saveWorkoutButtonText}>Créer l'entraînement</Text>
        </TouchableOpacity>
      </View>

      {/* Modals */}
      {renderSportModal()}

      {renderDropdownModal(
        showSpecificityModal,
        () => setShowSpecificityModal(false),
        'Spécificité',
        SPECIFICITIES,
        (value) => setWorkout(prev => ({ ...prev, specificity: value }))
      )}

      {renderDropdownModal(
        showDifficultyModal,
        () => setShowDifficultyModal(false),
        'Difficulté',
        DIFFICULTIES,
        (value) => setWorkout(prev => ({ ...prev, difficulty: value }))
      )}

      {renderExerciseModal()}
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#21262D',
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#21262D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerTitle: {
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  dateInfo: {
    fontSize: 16,
    color: '#F5A623',
    fontWeight: '500',
    marginBottom: 16,
    textAlign: 'center',
    padding: 12,
    backgroundColor: '#161B22',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#21262D',
    textTransform: 'capitalize',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 8,
    fontWeight: '500',
  },
  labelWithHint: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  favoriteHint: {
    fontSize: 12,
    color: '#F5A623',
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#161B22',
    borderWidth: 1,
    borderColor: '#21262D',
    borderRadius: 8,
    padding: 12,
    color: '#FFFFFF',
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  dropdown: {
    backgroundColor: '#161B22',
    borderWidth: 1,
    borderColor: '#21262D',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  placeholder: {
    color: '#8B949E',
  },
  dropdownArrow: {
    color: '#8B949E',
    fontSize: 12,
  },
  row: {
    flexDirection: 'row',
  },
  caloriesInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#161B22',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#21262D',
    marginTop: 8,
  },
  caloriesLabel: {
    fontSize: 14,
    color: '#8B949E',
  },
  caloriesValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F5A623',
  },
  exercisesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addExerciseButton: {
    backgroundColor: '#1F6FEB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addExerciseButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyExercises: {
    backgroundColor: '#161B22',
    borderWidth: 1,
    borderColor: '#21262D',
    borderRadius: 8,
    padding: 24,
    alignItems: 'center',
  },
  emptyExercisesText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  emptyExercisesSubtext: {
    color: '#8B949E',
    fontSize: 14,
    textAlign: 'center',
  },
  exercisesList: {
    gap: 12,
  },
  exerciseCard: {
    backgroundColor: '#161B22',
    borderWidth: 1,
    borderColor: '#21262D',
    borderRadius: 8,
    padding: 16,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  exerciseName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  exerciseActions: {
    flexDirection: 'row',
    gap: 12,
  },
  editButton: {
    fontSize: 16,
  },
  deleteButton: {
    fontSize: 16,
  },
  exerciseDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 8,
  },
  exerciseDetail: {
    color: '#8B949E',
    fontSize: 12,
    backgroundColor: '#21262D',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  exerciseNotes: {
    color: '#8B949E',
    fontSize: 12,
    fontStyle: 'italic',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#21262D',
  },
  saveWorkoutButton: {
    backgroundColor: '#F5A623',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveWorkoutButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContainer: {
    backgroundColor: '#0D1117',
    borderRadius: 12,
    width: '100%',
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: '#21262D',
    alignSelf: 'center',
  },
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
  },
  modalContent: {
    padding: 16,
  },
  optionItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#21262D',
  },
  optionText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  favoriteOptionItem: {
    backgroundColor: '#21262D',
    borderLeftWidth: 3,
    borderLeftColor: '#F5A623',
  },
  optionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  favoriteOptionText: {
    color: '#F5A623',
    fontWeight: '600',
  },
  favoriteIndicator: {
    backgroundColor: '#F5A623',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  favoriteIndicatorText: {
    color: '#000000',
    fontSize: 10,
    fontWeight: 'bold',
  },
  recentOptionItem: {
    backgroundColor: '#1A1A2E',
    borderLeftWidth: 3,
    borderLeftColor: '#1F6FEB',
  },
  recentOptionText: {
    color: '#1F6FEB',
    fontWeight: '500',
  },
  recentCategoryText: {
    color: '#5A85D6',
  },
  recentIndicator: {
    backgroundColor: '#1F6FEB',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  recentIndicatorText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  sectionSeparator: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#0D1117',
    borderBottomWidth: 1,
    borderBottomColor: '#21262D',
  },
  sectionSeparatorText: {
    fontSize: 12,
    color: '#8B949E',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  saveButton: {
    backgroundColor: '#F5A623',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  saveButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  labelWithSuggestion: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  suggestionButton: {
    backgroundColor: '#21262D',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  suggestionButtonText: {
    color: '#1F6FEB',
    fontSize: 12,
    fontWeight: '500',
  },
  suggestionsContainer: {
    backgroundColor: '#161B22',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#21262D',
    marginTop: 8,
    maxHeight: 150,
  },
  suggestionItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#21262D',
  },
  suggestionText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  sportOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sportEmoji: {
    fontSize: 20,
    marginRight: 12,
  },
  sportOptionInfo: {
    flex: 1,
  },
  sportCategoryText: {
    fontSize: 12,
    color: '#8B949E',
    marginTop: 2,
  },
  favoriteCategoryText: {
    color: '#666666',
  },
});