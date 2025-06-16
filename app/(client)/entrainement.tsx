import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Alert, Modal, TextInput } from 'react-native';
import { IntegrationsManager, StravaActivity } from '../../utils/integrations';
import { getCurrentUser } from '../../utils/auth';
import { checkSubscriptionStatus } from '../../utils/subscription';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';

export default function EntrainementScreen() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [selectedTab, setSelectedTab] = useState('Journal');
  const [selectedDay, setSelectedDay] = useState('Lundi');
  const [stravaActivities, setStravaActivities] = useState<StravaActivity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [modalVisible, setModalVisible] = useState(false);
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [typeActiviteDropdownOpen, setTypeActiviteDropdownOpen] = useState(false);
  const [typeSpecifiqueDropdownOpen, setTypeSpecifiqueDropdownOpen] = useState(false);
  const [difficulteDropdownOpen, setDifficulteDropdownOpen] = useState(false);
  const [exerciceModalVisible, setExerciceModalVisible] = useState(false);
  const [exerciceEnEdition, setExerciceEnEdition] = useState<any>(null);
  const [nouvelExercice, setNouvelExercice] = useState({
    id: '',
    nom: '',
    series: '',
    repetitions: '',
    poids: '',
    repos: '',
    notes: ''
  });
  const [nouvelEntrainement, setNouvelEntrainement] = useState({
    nom: '',
    typeActivite: 'Musculation',
    typeSpecifique: 'Force',
    difficulte: 'Intermédiaire',
    duree: '',
    calories: '',
    date: '',
    heure: '',
    notes: '',
    jour: selectedDay,
    exercices: []
  });

  const typesActivite = [
    'Musculation',
    'Course à pied',
    'Cyclisme',
    'Natation',
    'Yoga',
    'Pilates',
    'Crossfit',
    'Tennis',
    'Football',
    'Basketball',
    'Boxe',
    'Danse',
    'Randonnée',
    'Escalade',
    'Autre'
  ];

  const typesSpecifiques = {
    'Musculation': ['Force', 'Hypertrophie', 'Endurance', 'Puissance'],
    'Course à pied': ['Sprint', 'Moyenne distance', 'Longue distance', 'Trail'],
    'Cyclisme': ['Route', 'VTT', 'Piste', 'BMX'],
    'Natation': ['Crawl', 'Brasse', 'Dos', 'Papillon', 'Eau libre'],
    'Yoga': ['Hatha', 'Vinyasa', 'Ashtanga', 'Hot yoga'],
    'Pilates': ['Mat', 'Reformer', 'Cadillac'],
    'Crossfit': ['WOD', 'AMRAP', 'EMOM', 'For Time'],
    'default': ['Débutant', 'Intermédiaire', 'Avancé']
  };

  const difficultes = ['Facile', 'Intermédiaire', 'Difficile', 'Expert'];

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

  const saveWorkouts = async (newWorkouts: any[]) => {
    try {
      const currentUser = await getCurrentUser();
      if (currentUser) {
        const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
        await AsyncStorage.setItem(`workouts_${currentUser.id}`, JSON.stringify(newWorkouts));
        setWorkouts(newWorkouts);
      }
    } catch (error) {
      console.error('Erreur sauvegarde entraînements:', error);
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

  const ouvrirModalAjout = (jour: string) => {
    setSelectedDay(jour);
    const { start } = getWeekRange();
    const dayIndex = daysOfWeek.indexOf(jour);
    const targetDate = new Date(start);
    targetDate.setDate(start.getDate() + dayIndex);

    setNouvelEntrainement({
      nom: '',
      typeActivite: 'Musculation',
      typeSpecifique: 'Force',
      difficulte: 'Intermédiaire',
      duree: '',
      calories: '',
      date: targetDate.toISOString().split('T')[0],
      heure: '09:00',
      notes: '',
      jour: jour,
      exercices: []
    });
    setTypeActiviteDropdownOpen(false);
    setTypeSpecifiqueDropdownOpen(false);
    setDifficulteDropdownOpen(false);
    setModalVisible(true);
  };

  const fermerModal = () => {
    setModalVisible(false);
  };

  const ouvrirModalExercice = () => {
    console.log('ouvrirModalExercice appelée');
    setNouvelExercice({
      id: '',
      nom: '',
      series: '',
      repetitions: '',
      poids: '',
      repos: '',
      notes: ''
    });
    setExerciceEnEdition(null);
    setExerciceModalVisible(true);
    console.log('exerciceModalVisible défini à true');
  };

  const fermerModalExercice = () => {
    setExerciceModalVisible(false);
    setExerciceEnEdition(null);
  };

  const ajouterExercice = () => {
    if (!nouvelExercice.nom.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir un nom pour l\'exercice');
      return;
    }

    const exercice = {
      id: Date.now().toString(),
      ...nouvelExercice
    };

    setNouvelEntrainement({
      ...nouvelEntrainement,
      exercices: [...nouvelEntrainement.exercices, exercice]
    });

    fermerModalExercice();
  };

  const supprimerExercice = (exerciceId: string) => {
    setNouvelEntrainement({
      ...nouvelEntrainement,
      exercices: nouvelEntrainement.exercices.filter(ex => ex.id !== exerciceId)
    });
  };

  const sauvegarderEntrainement = async () => {
    if (!nouvelEntrainement.nom.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir un nom pour l\'entraînement');
      return;
    }

    try {
      const newWorkout = {
        id: Date.now().toString(),
        ...nouvelEntrainement,
        createdAt: new Date().toISOString()
      };

      const updatedWorkouts = [...workouts, newWorkout];
      await saveWorkouts(updatedWorkouts);

      Alert.alert('Succès', 'Entraînement ajouté avec succès!');
      fermerModal();
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
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
                    onPress={() => ouvrirModalAjout(jour)}
                  >
                    <Text style={styles.dayName}>{jour}</Text>
                    <View style={styles.dayInfo}>
                      <Text style={styles.sessionCount}>
                        {sessionCount} séance{sessionCount > 1 ? 's' : ''}
                      </Text>
                      <Text style={styles.expandArrow}>⌄</Text>
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



      {/* Modal d'ajout d'entraînement */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={fermerModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('new_workout')}</Text>
              <TouchableOpacity onPress={fermerModal} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              {/* Nom */}
              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>{t('workout_name')}</Text>
                <TextInput
                  style={styles.modalInput}
                  value={nouvelEntrainement.nom}
                  onChangeText={(text) => setNouvelEntrainement({...nouvelEntrainement, nom: text})}
                  placeholder="Ex: Séance de musculation du Lundi"
                  placeholderTextColor="#6A737D"
                />
              </View>

              {/* Type d'activité */}
              <View style={[styles.modalSection, { zIndex: typeActiviteDropdownOpen ? 1000 : 1 }]}>
                <Text style={styles.modalLabel}>{t('activity_type')}</Text>
                <TouchableOpacity 
                  style={[styles.dropdown, typeActiviteDropdownOpen && { borderColor: '#F5A623', borderWidth: 2 }]}
                  onPress={() => {
                    setTypeActiviteDropdownOpen(!typeActiviteDropdownOpen);
                    setTypeSpecifiqueDropdownOpen(false);
                    setDifficulteDropdownOpen(false);
                  }}
                >
                  <Text style={styles.dropdownText}>{nouvelEntrainement.typeActivite}</Text>
                  <Text style={styles.dropdownArrow}>▼</Text>
                </TouchableOpacity>
                {typeActiviteDropdownOpen && (
                  <View style={styles.dropdownList}>
                    <ScrollView style={styles.dropdownScrollView} nestedScrollEnabled={true}>
                      {typesActivite.map((type, index) => (
                        <TouchableOpacity
                          key={index}
                          style={[
                            styles.dropdownItem,
                            index === typesActivite.length - 1 && { borderBottomWidth: 0 }
                          ]}
                          onPress={() => {
                            setNouvelEntrainement({
                              ...nouvelEntrainement, 
                              typeActivite: type,
                              typeSpecifique: typesSpecifiques[type] ? typesSpecifiques[type][0] : 'Débutant'
                            });
                            setTypeActiviteDropdownOpen(false);
                          }}
                        >
                          <Text style={styles.dropdownItemText}>{type}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>

              {/* Type spécifique */}
              <View style={[styles.modalSection, { zIndex: typeSpecifiqueDropdownOpen ? 1000 : 1 }]}>
                <Text style={styles.modalLabel}>Type spécifique</Text>
                <TouchableOpacity 
                  style={[styles.dropdown, typeSpecifiqueDropdownOpen && { borderColor: '#F5A623', borderWidth: 2 }]}
                  onPress={() => {
                    setTypeSpecifiqueDropdownOpen(!typeSpecifiqueDropdownOpen);
                    setTypeActiviteDropdownOpen(false);
                    setDifficulteDropdownOpen(false);
                  }}
                >
                  <Text style={styles.dropdownText}>{nouvelEntrainement.typeSpecifique}</Text>
                  <Text style={styles.dropdownArrow}>▼</Text>
                </TouchableOpacity>
                {typeSpecifiqueDropdownOpen && (
                  <View style={styles.dropdownList}>
                    <ScrollView style={styles.dropdownScrollView} nestedScrollEnabled={true}>
                      {(typesSpecifiques[nouvelEntrainement.typeActivite] || typesSpecifiques.default).map((type, index) => (
                        <TouchableOpacity
                          key={index}
                          style={[
                            styles.dropdownItem,
                            index === (typesSpecifiques[nouvelEntrainement.typeActivite] || typesSpecifiques.default).length - 1 && { borderBottomWidth: 0 }
                          ]}
                          onPress={() => {
                            setNouvelEntrainement({...nouvelEntrainement, typeSpecifique: type});
                            setTypeSpecifiqueDropdownOpen(false);
                          }}
                        >
                          <Text style={styles.dropdownItemText}>{type}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>

              {/* Difficulté */}
              <View style={[styles.modalSection, { zIndex: difficulteDropdownOpen ? 1000 : 1 }]}>
                <Text style={styles.modalLabel}>{t('difficulty')}</Text>
                <TouchableOpacity 
                  style={[styles.dropdown, difficulteDropdownOpen && { borderColor: '#F5A623', borderWidth: 2 }]}
                  onPress={() => {
                    setDifficulteDropdownOpen(!difficulteDropdownOpen);
                    setTypeActiviteDropdownOpen(false);
                    setTypeSpecifiqueDropdownOpen(false);
                  }}
                >
                  <Text style={styles.dropdownText}>{nouvelEntrainement.difficulte}</Text>
                  <Text style={styles.dropdownArrow}>▼</Text>
                </TouchableOpacity>
                {difficulteDropdownOpen && (
                  <View style={styles.dropdownList}>
                    <ScrollView style={styles.dropdownScrollView} nestedScrollEnabled={true}>
                      {difficultes.map((difficulte, index) => (
                        <TouchableOpacity
                          key={index}
                          style={[
                            styles.dropdownItem,
                            index === difficultes.length - 1 && { borderBottomWidth: 0 }
                          ]}
                          onPress={() => {
                            setNouvelEntrainement({...nouvelEntrainement, difficulte: difficulte});
                            setDifficulteDropdownOpen(false);
                          }}
                        >
                          <Text style={styles.dropdownItemText}>{difficulte}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>

              {/* Durée */}
              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>{t('duration_minutes')}</Text>
                <TextInput
                  style={styles.modalInput}
                  value={nouvelEntrainement.duree}
                  onChangeText={(text) => setNouvelEntrainement({...nouvelEntrainement, duree: text})}
                  placeholder="45"
                  placeholderTextColor="#6A737D"
                  keyboardType="numeric"
                />
              </View>

              {/* Calories */}
              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>Calories (kcal)</Text>
                <TextInput
                  style={styles.modalInput}
                  value={nouvelEntrainement.calories}
                  onChangeText={(text) => setNouvelEntrainement({...nouvelEntrainement, calories: text})}
                  placeholder="250"
                  placeholderTextColor="#6A737D"
                  keyboardType="numeric"
                />
              </View>

              {/* Date et Heure */}
              <View style={styles.modalRow}>
                <View style={styles.modalColumn}>
                  <Text style={styles.modalLabel}>Date</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={nouvelEntrainement.date}
                    onChangeText={(text) => setNouvelEntrainement({...nouvelEntrainement, date: text})}
                    placeholder="11/06/2025"
                    placeholderTextColor="#6A737D"
                  />
                </View>
                <View style={styles.modalColumn}>
                  <Text style={styles.modalLabel}>Heure</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={nouvelEntrainement.heure}
                    onChangeText={(text) => setNouvelEntrainement({...nouvelEntrainement, heure: text})}
                    placeholder="09:00"
                    placeholderTextColor="#6A737D"
                  />
                </View>
              </View>

              {/* Notes */}
              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>{t('notes')}</Text>
                <TextInput
                  style={[styles.modalInput, styles.textArea]}
                  value={nouvelEntrainement.notes}
                  onChangeText={(text) => setNouvelEntrainement({...nouvelEntrainement, notes: text})}
                  placeholder="Notes supplémentaires sur cet entraînement..."
                  placeholderTextColor="#6A737D"
                  multiline
                  numberOfLines={4}
                />
              </View>

              {/* Section Exercices */}
              <View style={styles.modalSection}>
                <View style={styles.exercicesHeader}>
                  <Text style={styles.modalLabel}>{t('exercises')} ({nouvelEntrainement.exercices.length})</Text>
                  <TouchableOpacity 
                    style={styles.addExerciceButton} 
                    onPress={() => {
                      console.log('Bouton + Ajouter pressé');
                      ouvrirModalExercice();
                    }}
                  >
                    <Text style={styles.addExerciceButtonText}>+ Ajouter</Text>
                  </TouchableOpacity>
                </View>

                {nouvelEntrainement.exercices.length > 0 ? (
                  <View style={styles.exercicesList}>
                    {nouvelEntrainement.exercices.map((exercice, index) => (
                      <View key={exercice.id} style={styles.exerciceItem}>
                        <View style={styles.exerciceHeader}>
                          <Text style={styles.exerciceNom}>{exercice.nom}</Text>
                          <TouchableOpacity 
                            onPress={() => supprimerExercice(exercice.id)}
                            style={styles.deleteExerciceButton}
                          >
                            <Text style={styles.deleteExerciceText}>×</Text>
                          </TouchableOpacity>
                        </View>
                        <View style={styles.exerciceDetails}>
                          {exercice.series && <Text style={styles.exerciceDetail}>{exercice.series} séries</Text>}
                          {exercice.repetitions && <Text style={styles.exerciceDetail}>{exercice.repetitions} reps</Text>}
                          {exercice.poids && <Text style={styles.exerciceDetail}>{exercice.poids} kg</Text>}
                          {exercice.repos && <Text style={styles.exerciceDetail}>{exercice.repos}s repos</Text>}
                        </View>
                      </View>
                    ))}
                  </View>
                ) : (
                  <View style={styles.emptyExercices}>
                    <Text style={styles.emptyExercicesIcon}>💪</Text>
                    <Text style={styles.emptyExercicesText}>
                      Aucun exercice ajouté. Cliquez sur "Ajouter" pour créer un exercice.
                    </Text>
                  </View>
                )}
              </View>
            </ScrollView>

            {/* Boutons d'action */}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={fermerModal}>
                <Text style={styles.cancelButtonText}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.createButton} onPress={sauvegarderEntrainement}>
                <Text style={styles.createButtonText}>{t('create')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal d'ajout d'exercice */}
      {console.log('Rendu de la modal exercice, visible:', exerciceModalVisible)}
      <Modal
        visible={exerciceModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={fermerModalExercice}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ajouter un exercice</Text>
              <TouchableOpacity onPress={fermerModalExercice} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              {/* Nom de l'exercice */}
              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>Nom de l'exercice</Text>
                <TextInput
                  style={styles.modalInput}
                  value={nouvelExercice.nom}
                  onChangeText={(text) => setNouvelExercice({...nouvelExercice, nom: text})}
                  placeholder="Ex: Développé couché"
                  placeholderTextColor="#6A737D"
                />
              </View>

              {/* Séries et Répétitions */}
              <View style={styles.modalRow}>
                <View style={styles.modalColumn}>
                  <Text style={styles.modalLabel}>Séries</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={nouvelExercice.series}
                    onChangeText={(text) => setNouvelExercice({...nouvelExercice, series: text})}
                    placeholder="4"
                    placeholderTextColor="#6A737D"
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.modalColumn}>
                  <Text style={styles.modalLabel}>Répétitions</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={nouvelExercice.repetitions}
                    onChangeText={(text) => setNouvelExercice({...nouvelExercice, repetitions: text})}
                    placeholder="12"
                    placeholderTextColor="#6A737D"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              {/* Poids et Repos */}
              <View style={styles.modalRow}>
                <View style={styles.modalColumn}>
                  <Text style={styles.modalLabel}>Poids (kg)</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={nouvelExercice.poids}
                    onChangeText={(text) => setNouvelExercice({...nouvelExercice, poids: text})}
                    placeholder="80"
                    placeholderTextColor="#6A737D"
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.modalColumn}>
                  <Text style={styles.modalLabel}>Repos (sec)</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={nouvelExercice.repos}
                    onChangeText={(text) => setNouvelExercice({...nouvelExercice, repos: text})}
                    placeholder="90"
                    placeholderTextColor="#6A737D"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              {/* Notes */}
              <View style={styles.modalSection}>
                This correction addresses a syntax error in the styles, specifically in the dropdownList definition.
```
                <Text style={styles.modalLabel}>Notes</Text>
                <TextInput
                  style={[styles.modalInput, styles.textArea]}
                  value={nouvelExercice.notes}
                  onChangeText={(text) => setNouvelExercice({...nouvelExercice, notes: text})}
                  placeholder="Instructions ou notes sur cet exercice..."
                  placeholderTextColor="#6A737D"
                  multiline
                  numberOfLines={3}
                />
              </View>
            </ScrollView>

            {/* Boutons d'action */}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={fermerModalExercice}>
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.createButton} onPress={ajouterExercice}>
                <Text style={styles.createButtonText}>Ajouter</Text>
              </TouchableOpacity>
            </View>
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
  expandArrow: {
    fontSize: 16,
    color: '#8B949E',
    fontWeight: '300',
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
  // Styles pour la modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    zIndex: 9999,
  },
  modalContainer: {
    backgroundColor: '#0D1117',
    borderRadius: 12,
    width: '100%',
    height: '75%',
    borderWidth: 1,
    borderColor: '#21262D',
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
    fontWeight: 'bold',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  modalSection: {
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: '#161B22',
    borderWidth: 1,
    borderColor: '#F5A623',
    borderRadius: 8,
    padding: 12,
    color: '#FFFFFF',
    fontSize: 16,
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
  dropdownArrow: {
    color: '#8B949E',
    fontSize: 12,
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalColumn: {
    flex: 1,
    marginHorizontal: 4,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  exercicesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addExerciceButton: {
    backgroundColor: '#F5A623',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  addExerciceButtonText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyExercices: {
    borderWidth: 1,
    borderColor: '#21262D',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 24,
    alignItems: 'center',
  },
  emptyExercicesIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyExercicesText: {
    color: '#8B949E',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  exercicesList: {
    marginTop: 8,
  },
  exerciceItem: {
    backgroundColor: '#21262D',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  exerciceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  exerciceNom: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  deleteExerciceButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#DA3633',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteExerciceText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  exerciceDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  exerciceDetail: {
    color: '#8B949E',
    fontSize: 12,
    marginRight: 12,
    marginBottom: 4,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#21262D',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#21262D',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  createButton: {
    flex: 1,
    backgroundColor: '#F5A623',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginLeft: 8,
  },
  createButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dropdownList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#161B22',
    borderWidth: 1,
    borderColor: '#F5A623',
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    maxHeight: '99%',
    zIndex: 1000,
  },
  dropdownScrollView: {
    maxHeight: 150,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#21262D',
  },
  dropdownItemText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
});