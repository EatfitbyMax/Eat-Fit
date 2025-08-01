
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Alert, Modal, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PersistentStorage } from '@/utils/storage';

interface Exercice {
  id: string;
  nom: string;
  jour: string;
  type: string;
  duree: number;
  calories: number;
  intensite: string;
  difficulte: string;
  equipement: string;
  instructions: string;
}

interface Programme {
  id: string;
  nom: string;
  description: string;
  type: 'sport';
  public: boolean;
  dateCreation: string;
  details: {
    exercices: Exercice[];
  };
}

const TYPES_EXERCICE = [
  'Cardio', 'Musculation', 'Étirement', 'HIIT', 'Yoga', 'Pilates', 'Course à pied', 
  'Natation', 'Cyclisme', 'Boxe', 'CrossFit', 'Danse', 'Escalade', 'Football', 
  'Basketball', 'Tennis', 'Badminton', 'Volleyball', 'Rugby', 'Handball', 
  'Athlétisme', 'Gymnastique', 'Arts martiaux', 'Fitness', 'Aquagym'
];
const JOURS_SEMAINE = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const INTENSITES = ['Très faible', 'Faible', 'Modérée', 'Élevée', 'Très élevée'];
const DIFFICULTES = ['Débutant', 'Intermédiaire', 'Expert'];

const PROGRAMMES_STORAGE_KEY = 'programmes_coach';

export default function CreerProgrammeSportScreen() {
  const router = useRouter();
  const [nomProgramme, setNomProgramme] = useState('');
  const [description, setDescription] = useState('');
  const [estPublic, setEstPublic] = useState(false);
  const [exercices, setExercices] = useState<Exercice[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [exerciceEnEdition, setExerciceEnEdition] = useState<Exercice | null>(null);
  const [jourDropdownOpen, setJourDropdownOpen] = useState(false);
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);
  const [intensiteDropdownOpen, setIntensiteDropdownOpen] = useState(false);
  const [difficulteDropdownOpen, setDifficulteDropdownOpen] = useState(false);

  const [nouvelExercice, setNouvelExercice] = useState({
    nom: '',
    jour: '',
    type: '',
    duree: 0,
    calories: 0,
    intensite: '',
    difficulte: '',
    equipement: '',
    instructions: ''
  });

  const ouvrirModalAjout = () => {
    setExerciceEnEdition(null);
    setNouvelExercice({
      nom: '',
      jour: '',
      type: '',
      duree: 0,
      calories: 0,
      intensite: '',
      difficulte: '',
      equipement: '',
      instructions: ''
    });
    setModalVisible(true);
  };

  const ouvrirModalEdition = (exercice: Exercice) => {
    setExerciceEnEdition(exercice);
    setNouvelExercice({
      nom: exercice.nom,
      jour: exercice.jour,
      type: exercice.type,
      duree: exercice.duree,
      calories: exercice.calories,
      intensite: exercice.intensite,
      difficulte: exercice.difficulte,
      equipement: exercice.equipement,
      instructions: exercice.instructions
    });
    setModalVisible(true);
  };

  const fermerModal = () => {
    setModalVisible(false);
    setExerciceEnEdition(null);
    setJourDropdownOpen(false);
    setTypeDropdownOpen(false);
    setIntensiteDropdownOpen(false);
    setDifficulteDropdownOpen(false);
  };

  const ajouterOuModifierExercice = () => {
    if (!nouvelExercice.nom.trim() || !nouvelExercice.jour || !nouvelExercice.type) {
      Alert.alert('Erreur', 'Veuillez remplir au moins le nom, jour et type d\'exercice');
      return;
    }

    if (exerciceEnEdition) {
      // Modification
      setExercices(exercices.map(ex => 
        ex.id === exerciceEnEdition.id 
          ? { ...nouvelExercice, id: exerciceEnEdition.id }
          : ex
      ));
    } else {
      // Ajout
      const exercice: Exercice = {
        id: Date.now().toString() + Math.random().toString(),
        ...nouvelExercice
      };
      setExercices([...exercices, exercice]);
    }

    fermerModal();
  };

  const supprimerExercice = (exerciceId: string) => {
    setExercices(exercices.filter(ex => ex.id !== exerciceId));
  };

  const sauvegarderProgramme = async () => {
    if (!nomProgramme.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir un nom pour le programme');
      return;
    }

    if (exercices.length === 0) {
      Alert.alert('Erreur', 'Veuillez ajouter au moins un exercice');
      return;
    }

    try {
      const nouveauProgramme: Programme = {
        id: Date.now().toString(),
        nom: nomProgramme.trim(),
        description: description.trim() || `Programme sport créé le ${new Date().toLocaleDateString('fr-FR')}`,
        type: 'sport',
        public: estPublic,
        dateCreation: new Date().toLocaleDateString('fr-FR'),
        details: {
          exercices: exercices
        }
      };

      // Charger les programmes existants
      let programmesExistants: Programme[] = [];
      try {
        const programmesObject = await PersistentStorage.getProgrammes();
        if (programmesObject.length > 0) {
          programmesExistants = programmesObject;
        } else {
          const programmesStockes = await AsyncStorage.getItem(PROGRAMMES_STORAGE_KEY);
          if (programmesStockes) {
            programmesExistants = JSON.parse(programmesStockes);
          }
        }
      } catch (error) {
        console.error('Erreur chargement programmes existants:', error);
      }

      // Ajouter le nouveau programme
      const programmesMAJ = [...programmesExistants, nouveauProgramme];

      // Sauvegarder
      await PersistentStorage.saveProgrammes(programmesMAJ);
      await AsyncStorage.setItem(PROGRAMMES_STORAGE_KEY, JSON.stringify(programmesMAJ));

      console.log('Programme sportif sauvegardé avec', exercices.length, 'exercices');

      Alert.alert(
        'Programme créé !',
        `Le programme "${nomProgramme}" a été créé avec succès avec ${exercices.length} exercice(s).`,
        [{ 
          text: 'OK', 
          onPress: () => {
            console.log('Retour à la liste des programmes');
            router.back();
          }
        }]
      );
    } catch (error) {
      console.error('Erreur sauvegarde programme:', error);
      Alert.alert('Erreur', `Impossible de sauvegarder le programme: ${error.message || 'Erreur inconnue'}`);
    }
  };

  const renderDropdown = (
    options: string[], 
    selectedValue: string, 
    onSelect: (value: string) => void,
    placeholder: string
  ) => (
    <View style={styles.dropdownContainer}>
      <Text style={styles.dropdownText}>{selectedValue || placeholder}</Text>
    </View>
  );

  const renderModalAjoutExercice = () => (
    <Modal
      visible={modalVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={fermerModal}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {exerciceEnEdition ? 'Modifier l\'exercice' : 'Ajouter un exercice'}
            </Text>
            <TouchableOpacity onPress={fermerModal} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.modalFullRow}>
              <Text style={styles.modalLabel}>Nom</Text>
              <TextInput
                style={styles.modalInput}
                value={nouvelExercice.nom}
                onChangeText={(text) => setNouvelExercice({...nouvelExercice, nom: text})}
                placeholder="Ex: Squat avec..."
                placeholderTextColor="#6A737D"
              />
            </View>

            <View style={styles.modalRow}>
              <View style={[styles.modalColumn, { zIndex: jourDropdownOpen ? 1000 : 1 }]}>
                <Text style={styles.modalLabel}>Jour</Text>
                <TouchableOpacity 
                  style={[styles.modalDropdown, jourDropdownOpen && { borderColor: '#F5A623', borderWidth: 2 }]}
                  onPress={() => {
                    setJourDropdownOpen(!jourDropdownOpen);
                    setTypeDropdownOpen(false);
                    setIntensiteDropdownOpen(false);
                    setDifficulteDropdownOpen(false);
                  }}
                >
                  <Text style={[styles.modalDropdownText, !nouvelExercice.jour && styles.placeholderText]}>
                    {nouvelExercice.jour || 'Sélectionnez un jour'}
                  </Text>
                  <Text style={[styles.dropdownArrow, jourDropdownOpen && { color: '#F5A623' }]}>▼</Text>
                </TouchableOpacity>
                {jourDropdownOpen && (
                  <View style={styles.dropdownOverlay}>
                    <ScrollView style={styles.dropdownList} nestedScrollEnabled={true} showsVerticalScrollIndicator={true}>
                      {JOURS_SEMAINE.map((jour, index) => (
                        <TouchableOpacity
                          key={jour}
                          style={[
                            styles.dropdownItem,
                            index === JOURS_SEMAINE.length - 1 && { borderBottomWidth: 0 }
                          ]}
                          onPress={() => {
                            setNouvelExercice({...nouvelExercice, jour: jour});
                            setJourDropdownOpen(false);
                          }}
                        >
                          <Text style={styles.dropdownItemText}>{jour}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
              <View style={[styles.modalColumn, { zIndex: typeDropdownOpen ? 1000 : 1 }]}>
                <Text style={styles.modalLabel}>Type d'exercice</Text>
                <TouchableOpacity 
                  style={[styles.modalDropdown, typeDropdownOpen && { borderColor: '#F5A623', borderWidth: 2 }]}
                  onPress={() => {
                    setTypeDropdownOpen(!typeDropdownOpen);
                    setJourDropdownOpen(false);
                    setIntensiteDropdownOpen(false);
                    setDifficulteDropdownOpen(false);
                  }}
                >
                  <Text style={[styles.modalDropdownText, !nouvelExercice.type && styles.placeholderText]}>
                    {nouvelExercice.type || 'Sélectionnez un type'}
                  </Text>
                  <Text style={[styles.dropdownArrow, typeDropdownOpen && { color: '#F5A623' }]}>▼</Text>
                </TouchableOpacity>
                {typeDropdownOpen && (
                  <View style={styles.dropdownOverlay}>
                    <ScrollView style={styles.dropdownList} nestedScrollEnabled={true} showsVerticalScrollIndicator={true}>
                      {TYPES_EXERCICE.map((type, index) => (
                        <TouchableOpacity
                          key={type}
                          style={[
                            styles.dropdownItem,
                            index === TYPES_EXERCICE.length - 1 && { borderBottomWidth: 0 }
                          ]}
                          onPress={() => {
                            setNouvelExercice({...nouvelExercice, type: type});
                            setTypeDropdownOpen(false);
                          }}
                        >
                          <Text style={styles.dropdownItemText}>{type}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.modalRow}>
              <View style={styles.modalColumn}>
                <Text style={styles.modalLabel}>Durée (min)</Text>
                <TextInput
                  style={styles.modalInput}
                  value={nouvelExercice.duree ? nouvelExercice.duree.toString() : ''}
                  onChangeText={(text) => setNouvelExercice({...nouvelExercice, duree: parseInt(text) || 0})}
                  placeholder="45"
                  placeholderTextColor="#6A737D"
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.modalColumn}>
                <Text style={styles.modalLabel}>Calories</Text>
                <TextInput
                  style={styles.modalInput}
                  value={nouvelExercice.calories ? nouvelExercice.calories.toString() : ''}
                  onChangeText={(text) => setNouvelExercice({...nouvelExercice, calories: parseInt(text) || 0})}
                  placeholder="300"
                  placeholderTextColor="#6A737D"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.modalRow}>
              <View style={[styles.modalColumn, { zIndex: intensiteDropdownOpen ? 1000 : 1 }]}>
                <Text style={styles.modalLabel}>Intensité</Text>
                <TouchableOpacity 
                  style={[styles.modalDropdown, intensiteDropdownOpen && { borderColor: '#F5A623', borderWidth: 2 }]}
                  onPress={() => {
                    setIntensiteDropdownOpen(!intensiteDropdownOpen);
                    setJourDropdownOpen(false);
                    setTypeDropdownOpen(false);
                    setDifficulteDropdownOpen(false);
                  }}
                >
                  <Text style={[styles.modalDropdownText, !nouvelExercice.intensite && styles.placeholderText]}>
                    {nouvelExercice.intensite || 'Sélectionnez une intensité'}
                  </Text>
                  <Text style={[styles.dropdownArrow, intensiteDropdownOpen && { color: '#F5A623' }]}>▼</Text>
                </TouchableOpacity>
                {intensiteDropdownOpen && (
                  <View style={styles.dropdownOverlay}>
                    <ScrollView style={styles.dropdownList} nestedScrollEnabled={true} showsVerticalScrollIndicator={true}>
                      {INTENSITES.map((intensite, index) => (
                        <TouchableOpacity
                          key={intensite}
                          style={[
                            styles.dropdownItem,
                            index === INTENSITES.length - 1 && { borderBottomWidth: 0 }
                          ]}
                          onPress={() => {
                            setNouvelExercice({...nouvelExercice, intensite: intensite});
                            setIntensiteDropdownOpen(false);
                          }}
                        >
                          <Text style={styles.dropdownItemText}>{intensite}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
              <View style={[styles.modalColumn, { zIndex: difficulteDropdownOpen ? 1000 : 1 }]}>
                <Text style={styles.modalLabel}>Difficulté</Text>
                <TouchableOpacity 
                  style={[styles.modalDropdown, difficulteDropdownOpen && { borderColor: '#F5A623', borderWidth: 2 }]}
                  onPress={() => {
                    setDifficulteDropdownOpen(!difficulteDropdownOpen);
                    setJourDropdownOpen(false);
                    setTypeDropdownOpen(false);
                    setIntensiteDropdownOpen(false);
                  }}
                >
                  <Text style={[styles.modalDropdownText, !nouvelExercice.difficulte && styles.placeholderText]}>
                    {nouvelExercice.difficulte || 'Sélectionnez une difficulté'}
                  </Text>
                  <Text style={[styles.dropdownArrow, difficulteDropdownOpen && { color: '#F5A623' }]}>▼</Text>
                </TouchableOpacity>
                {difficulteDropdownOpen && (
                  <View style={styles.dropdownOverlay}>
                    <ScrollView style={styles.dropdownList} nestedScrollEnabled={true} showsVerticalScrollIndicator={true}>
                      {DIFFICULTES.map((difficulte, index) => (
                        <TouchableOpacity
                          key={difficulte}
                          style={[
                            styles.dropdownItem,
                            index === DIFFICULTES.length - 1 && { borderBottomWidth: 0 }
                          ]}
                          onPress={() => {
                            setNouvelExercice({...nouvelExercice, difficulte: difficulte});
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
            </View>

            <View style={styles.modalFullRow}>
              <Text style={styles.modalLabel}>Équipement</Text>
              <TextInput
                style={styles.modalInput}
                value={nouvelExercice.equipement}
                onChangeText={(text) => setNouvelExercice({...nouvelExercice, equipement: text})}
                placeholder="Ex: Haltères, tapis..."
                placeholderTextColor="#6A737D"
              />
            </View>

            <View style={styles.modalFullRow}>
              <Text style={styles.modalLabel}>Instructions</Text>
              <TextInput
                style={[styles.modalInput, styles.modalTextArea]}
                value={nouvelExercice.instructions}
                onChangeText={(text) => setNouvelExercice({...nouvelExercice, instructions: text})}
                placeholder="Décrivez comment réaliser cet exercice..."
                placeholderTextColor="#6A737D"
                multiline
                numberOfLines={4}
              />
            </View>

            {exerciceEnEdition && (
              <TouchableOpacity 
                style={styles.deleteButton}
                onPress={() => {
                  Alert.alert(
                    'Supprimer l\'exercice',
                    'Êtes-vous sûr de vouloir supprimer cet exercice ?',
                    [
                      { text: 'Annuler', style: 'cancel' },
                      {
                        text: 'Supprimer',
                        style: 'destructive',
                        onPress: () => {
                          supprimerExercice(exerciceEnEdition.id);
                          fermerModal();
                        }
                      }
                    ]
                  );
                }}
              >
                <Text style={styles.deleteButtonText}>🗑️ Supprimer</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.saveButton} onPress={ajouterOuModifierExercice}>
              <Text style={styles.saveButtonText}>
                {exerciceEnEdition ? 'Modifier l\'exercice' : 'Ajouter l\'exercice'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>×</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nouveau Programme Sport</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nom du Programme</Text>
          <TextInput
            style={styles.input}
            value={nomProgramme}
            onChangeText={setNomProgramme}
            placeholder="Ex: Programme de renforcement"
            placeholderTextColor="#6A737D"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Décrivez brièvement ce programme..."
            placeholderTextColor="#6A737D"
            multiline
            numberOfLines={3}
          />
        </View>

        

        <View style={styles.exercicesSection}>
          <View style={styles.exercicesHeader}>
            <Text style={styles.exercicesTitle}>💪 Exercices ({exercices.length})</Text>
            <TouchableOpacity style={styles.addButton} onPress={ouvrirModalAjout}>
              <Text style={styles.addButtonText}>+ Ajouter</Text>
            </TouchableOpacity>
          </View>

          {exercices.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>💪</Text>
              <Text style={styles.emptyStateText}>Aucun exercice ajouté</Text>
              <Text style={styles.emptyStateSubtext}>
                Commencez par ajouter votre premier exercice
              </Text>
              <TouchableOpacity style={styles.emptyStateButton} onPress={ouvrirModalAjout}>
                <Text style={styles.emptyStateButtonText}>+ Ajouter un exercice</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.exercicesList}>
              {exercices.map((exercice, index) => (
                <TouchableOpacity 
                  key={exercice.id} 
                  style={styles.exerciceCard}
                  onPress={() => ouvrirModalEdition(exercice)}
                >
                  <View style={styles.exerciceHeader}>
                    <Text style={styles.exerciceNumber}>Exercice {index + 1}</Text>
                    <View style={styles.exerciceTags}>
                      <Text style={styles.exerciceTag}>{exercice.jour}</Text>
                      <Text style={styles.exerciceTag}>{exercice.type}</Text>
                    </View>
                  </View>
                  <Text style={styles.exerciceNom}>{exercice.nom}</Text>
                  <View style={styles.exerciceDetails}>
                    <Text style={styles.exerciceDetail}>⏱️ {exercice.duree} min</Text>
                    <Text style={styles.exerciceDetail}>🔥 {exercice.calories} kcal</Text>
                    <Text style={styles.exerciceDetail}>💪 {exercice.intensite}</Text>
                  </View>
                </TouchableOpacity>
              ))}

              <TouchableOpacity style={styles.addAnotherButton} onPress={ouvrirModalAjout}>
                <Text style={styles.addAnotherButtonText}>+ Ajouter un autre exercice</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Bouton de création intégré dans le contenu */}
        <View style={styles.createButtonContainer}>
          <TouchableOpacity style={styles.createButton} onPress={sauvegarderProgramme}>
            <Text style={styles.createButtonText}>Créer le Programme</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {renderModalAjoutExercice()}
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#21262D',
  },
  backButton: {
    marginRight: 12,
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
    flex: 1,
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
  emptyState: {
    backgroundColor: '#161B22',
    borderWidth: 1,
    borderColor: '#21262D',
    borderRadius: 8,
    padding: 32,
    alignItems: 'center',
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    color: '#8B949E',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyStateButton: {
    backgroundColor: '#F5A623',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  emptyStateButtonText: {
    color: '#000000',
    fontSize: 16,
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
  exerciceTags: {
    flexDirection: 'row',
  },
  exerciceTag: {
    backgroundColor: '#21262D',
    color: '#8B949E',
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 4,
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
  addAnotherButton: {
    borderWidth: 1,
    borderColor: '#21262D',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  addAnotherButtonText: {
    color: '#8B949E',
    fontSize: 14,
  },
  createButtonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    marginBottom: 20,
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
  // Styles pour la modal
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
    maxHeight: '90%',
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
    padding: 16,
  },
  modalRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  modalColumn: {
    flex: 1,
    marginRight: 8,
  },
  modalFullRow: {
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B949E',
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: '#161B22',
    borderWidth: 1,
    borderColor: '#21262D',
    borderRadius: 6,
    padding: 12,
    color: '#FFFFFF',
    fontSize: 16,
  },
  modalTextArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalDropdown: {
    backgroundColor: '#161B22',
    borderWidth: 1,
    borderColor: '#21262D',
    borderRadius: 6,
    padding: 12,
  },
  modalDropdownText: {
    color: '#FFFFFF',
    fontSize: 16,
    flex: 1,
  },
  placeholderText: {
    color: '#6A737D',
  },
  dropdownArrow: {
    color: '#6A737D',
    fontSize: 12,
    marginLeft: 8,
  },
  dropdownOverlay: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#161B22',
    borderWidth: 1,
    borderColor: '#21262D',
    borderRadius: 6,
    maxHeight: 150,
    zIndex: 2000,
  },
  dropdownList: {
    maxHeight: 150,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#21262D',
  },
  dropdownItemText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  deleteButton: {
    backgroundColor: '#DA3633',
    borderRadius: 6,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#F5A623',
    borderRadius: 6,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dropdownContainer: {
    backgroundColor: '#161B22',
    borderWidth: 1,
    borderColor: '#21262D',
    borderRadius: 6,
    padding: 12,
  },
  dropdownText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
});
