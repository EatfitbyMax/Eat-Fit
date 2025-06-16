
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Alert, TextInput } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getCurrentUser } from '../../utils/auth';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';

export default function CreerEntrainementScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const params = useLocalSearchParams();
  
  const [typeActiviteDropdownOpen, setTypeActiviteDropdownOpen] = useState(false);
  const [typeSpecifiqueDropdownOpen, setTypeSpecifiqueDropdownOpen] = useState(false);
  const [difficulteDropdownOpen, setDifficulteDropdownOpen] = useState(false);
  const [exerciceModalVisible, setExerciceModalVisible] = useState(false);
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
    date: params.date as string || '',
    heure: '09:00',
    notes: '',
    jour: params.jour as string || '',
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

  useEffect(() => {
    // Pré-remplir la date si elle est passée en paramètre
    if (params.date) {
      setNouvelEntrainement(prev => ({
        ...prev,
        date: params.date as string,
        jour: params.jour as string
      }));
    }
  }, [params]);

  const ouvrirModalExercice = () => {
    setNouvelExercice({
      id: '',
      nom: '',
      series: '',
      repetitions: '',
      poids: '',
      repos: '',
      notes: ''
    });
    setExerciceModalVisible(true);
  };

  const fermerModalExercice = () => {
    setExerciceModalVisible(false);
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
      const currentUser = await getCurrentUser();
      if (currentUser) {
        const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
        
        // Récupérer les entraînements existants
        const storedWorkouts = await AsyncStorage.getItem(`workouts_${currentUser.id}`);
        const workouts = storedWorkouts ? JSON.parse(storedWorkouts) : [];

        const newWorkout = {
          id: Date.now().toString(),
          ...nouvelEntrainement,
          createdAt: new Date().toISOString()
        };

        const updatedWorkouts = [...workouts, newWorkout];
        await AsyncStorage.setItem(`workouts_${currentUser.id}`, JSON.stringify(updatedWorkouts));

        Alert.alert('Succès', 'Entraînement ajouté avec succès!', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      }
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder l\'entraînement');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nouvel entraînement</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Nom */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nom de l'entraînement</Text>
          <TextInput
            style={styles.input}
            value={nouvelEntrainement.nom}
            onChangeText={(text) => setNouvelEntrainement({...nouvelEntrainement, nom: text})}
            placeholder="Ex: Séance de musculation du Lundi"
            placeholderTextColor="#6A737D"
          />
        </View>

        {/* Type d'activité */}
        <View style={[styles.section, { zIndex: typeActiviteDropdownOpen ? 1000 : 1 }]}>
          <Text style={styles.sectionTitle}>Type d'activité</Text>
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
        <View style={[styles.section, { zIndex: typeSpecifiqueDropdownOpen ? 1000 : 1 }]}>
          <Text style={styles.sectionTitle}>Type spécifique</Text>
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
        <View style={[styles.section, { zIndex: difficulteDropdownOpen ? 1000 : 1 }]}>
          <Text style={styles.sectionTitle}>Difficulté</Text>
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

        {/* Durée et Calories */}
        <View style={styles.row}>
          <View style={[styles.section, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.sectionTitle}>Durée (min)</Text>
            <TextInput
              style={styles.input}
              value={nouvelEntrainement.duree}
              onChangeText={(text) => setNouvelEntrainement({...nouvelEntrainement, duree: text})}
              placeholder="45"
              placeholderTextColor="#6A737D"
              keyboardType="numeric"
            />
          </View>
          <View style={[styles.section, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.sectionTitle}>Calories (kcal)</Text>
            <TextInput
              style={styles.input}
              value={nouvelEntrainement.calories}
              onChangeText={(text) => setNouvelEntrainement({...nouvelEntrainement, calories: text})}
              placeholder="250"
              placeholderTextColor="#6A737D"
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Date et Heure */}
        <View style={styles.row}>
          <View style={[styles.section, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.sectionTitle}>Date</Text>
            <TextInput
              style={styles.input}
              value={nouvelEntrainement.date}
              onChangeText={(text) => setNouvelEntrainement({...nouvelEntrainement, date: text})}
              placeholder="2025-06-18"
              placeholderTextColor="#6A737D"
            />
          </View>
          <View style={[styles.section, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.sectionTitle}>Heure</Text>
            <TextInput
              style={styles.input}
              value={nouvelEntrainement.heure}
              onChangeText={(text) => setNouvelEntrainement({...nouvelEntrainement, heure: text})}
              placeholder="09:00"
              placeholderTextColor="#6A737D"
            />
          </View>
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={nouvelEntrainement.notes}
            onChangeText={(text) => setNouvelEntrainement({...nouvelEntrainement, notes: text})}
            placeholder="Notes supplémentaires sur cet entraînement..."
            placeholderTextColor="#6A737D"
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Section Exercices */}
        <View style={styles.exercicesSection}>
          <View style={styles.exercicesHeader}>
            <Text style={styles.exercicesTitle}>Exercices ({nouvelEntrainement.exercices.length})</Text>
            <TouchableOpacity style={styles.addButton} onPress={ouvrirModalExercice}>
              <Text style={styles.addButtonText}>+ Ajouter</Text>
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
                      style={styles.deleteButton}
                    >
                      <Text style={styles.deleteButtonText}>×</Text>
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

        {/* Bouton de création */}
        <View style={styles.createButtonContainer}>
          <TouchableOpacity style={styles.createButton} onPress={sauvegarderEntrainement}>
            <Text style={styles.createButtonText}>Créer l'entraînement</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal d'ajout d'exercice */}
      {exerciceModalVisible && (
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
              <TouchableOpacity style={styles.primaryButton} onPress={ajouterExercice}>
                <Text style={styles.primaryButtonText}>Ajouter</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
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
  content: {
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
    maxHeight: 200,
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
  row: {
    flexDirection: 'row',
    marginBottom: 0,
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
    fontSize: 12,
    fontWeight: '600',
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
  deleteButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#DA3633',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
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
  createButtonContainer: {
    marginTop: 20,
    marginBottom: 40,
  },
  createButton: {
    backgroundColor: '#F5A623',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  // Styles pour la modal d'exercice
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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
    maxHeight: '80%',
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
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalColumn: {
    flex: 1,
    marginHorizontal: 4,
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
  primaryButton: {
    flex: 1,
    backgroundColor: '#F5A623',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginLeft: 8,
  },
  primaryButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
