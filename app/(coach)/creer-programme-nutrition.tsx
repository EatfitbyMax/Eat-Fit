
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, TextInput, Alert, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Repas {
  nom: string;
  jour: string;
  type: string;
  description: string;
  caloriesTotal: number;
  proteines: number;
  glucides: number;
  lipides: number;
  fibres: number;
  recette: string;
}

const PROGRAMMES_STORAGE_KEY = 'programmes_coach';

const JOURS_SEMAINE = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const TYPES_REPAS = ['Petit-déjeuner', 'Déjeuner', 'Dîner', 'Collation', 'Repas Complet'];

export default function CreerProgrammeNutritionScreen() {
  const router = useRouter();
  const [nomProgramme, setNomProgramme] = useState('');
  const [description, setDescription] = useState('');
  const [repas, setRepas] = useState<Repas[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [nouveauRepas, setNouveauRepas] = useState({
    nom: '',
    jour: '',
    type: '',
    description: '',
    caloriesTotal: 0,
    proteines: 0,
    glucides: 0,
    lipides: 0,
    fibres: 0,
    recette: ''
  });
  const [jourDropdownOpen, setJourDropdownOpen] = useState(false);
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);

  const ouvrirModalAjout = () => {
    setNouveauRepas({
      nom: '',
      jour: '',
      type: '',
      description: '',
      caloriesTotal: 0,
      proteines: 0,
      glucides: 0,
      lipides: 0,
      fibres: 0,
      recette: ''
    });
    setModalVisible(true);
  };

  const fermerModal = () => {
    setModalVisible(false);
    setJourDropdownOpen(false);
    setTypeDropdownOpen(false);
  };

  const ajouterRepas = () => {
    if (!nouveauRepas.nom.trim() || !nouveauRepas.jour || !nouveauRepas.type) {
      Alert.alert('Erreur', 'Veuillez remplir au moins le nom, jour et type de repas');
      return;
    }

    const repasAajouter = {
      ...nouveauRepas,
      nom: nouveauRepas.nom.trim(),
      caloriesTotal: nouveauRepas.caloriesTotal || 0,
      proteines: nouveauRepas.proteines || 0,
      glucides: nouveauRepas.glucides || 0,
      lipides: nouveauRepas.lipides || 0,
      fibres: nouveauRepas.fibres || 0
    };

    console.log('Ajout du repas:', repasAajouter);
    setRepas(prevRepas => {
      const nouveauxRepas = [...prevRepas, repasAajouter];
      console.log('Nombre de repas après ajout:', nouveauxRepas.length);
      return nouveauxRepas;
    });
    fermerModal();
  };

  const supprimerRepas = (index: number) => {
    const nouveauxRepas = repas.filter((_, i) => i !== index);
    setRepas(nouveauxRepas);
  };

  const sauvegarderProgramme = async () => {
    if (!nomProgramme.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir un nom pour le programme');
      return;
    }

    if (repas.length === 0) {
      Alert.alert('Erreur', 'Veuillez ajouter au moins un repas au programme');
      return;
    }

    try {
      console.log('Début sauvegarde programme...', { nomProgramme, repasCount: repas.length });
      
      const programmesStockes = await AsyncStorage.getItem(PROGRAMMES_STORAGE_KEY);
      const programmesExistants = programmesStockes ? JSON.parse(programmesStockes) : [];
      
      console.log('Programmes existants chargés:', programmesExistants.length);

      const caloriesTotal = repas.reduce((total, r) => total + (r.caloriesTotal || 0), 0);
      const caloriesMoyennes = repas.length > 0 ? Math.round(caloriesTotal / repas.length) : 0;

      const nouveauProgramme = {
        id: Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9),
        nom: nomProgramme.trim(),
        description: description.trim() || `Programme nutrition créé le ${new Date().toLocaleDateString('fr-FR')}`,
        type: 'nutrition' as const,
        calories: caloriesMoyennes,
        dateCreation: new Date().toLocaleDateString('fr-FR'),
        details: {
          repas: repas.map(r => ({
            ...r,
            nom: r.nom || 'Repas sans nom',
            jour: r.jour || 'Non défini',
            type: r.type || 'Non défini'
          }))
        }
      };

      console.log('Nouveau programme créé:', nouveauProgramme);

      const nouveauxProgrammes = [...programmesExistants, nouveauProgramme];
      await AsyncStorage.setItem(PROGRAMMES_STORAGE_KEY, JSON.stringify(nouveauxProgrammes));
      
      console.log('Programme sauvegardé avec succès, total:', nouveauxProgrammes.length);

      Alert.alert(
        'Programme créé !',
        `Le programme "${nomProgramme}" a été créé avec succès avec ${repas.length} repas.`,
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

  const renderModalAjoutRepas = () => (
    <Modal
      visible={modalVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={fermerModal}
      presentationStyle="overFullScreen"
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Ajouter un repas</Text>
            <TouchableOpacity onPress={fermerModal} style={styles.closeButtonContainer}>
              <Text style={styles.closeButton}>×</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Nom du repas */}
            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>Nom du repas</Text>
              <TextInput
                style={styles.modalInput}
                value={nouveauRepas.nom}
                onChangeText={(text) => setNouveauRepas({...nouveauRepas, nom: text})}
                placeholder="Ex: Poulet grillé avec légumes"
                placeholderTextColor="#6A737D"
              />
            </View>

            {/* Jour de la semaine */}
            <View style={[styles.modalFieldDropdown, { zIndex: jourDropdownOpen ? 1000 : 1 }]}>
              <Text style={styles.modalLabel}>Jour de la semaine</Text>
              <TouchableOpacity 
                style={[styles.modalDropdown, jourDropdownOpen && { borderColor: '#F5A623', borderWidth: 2 }]}
                onPress={() => {
                  setJourDropdownOpen(!jourDropdownOpen);
                  setTypeDropdownOpen(false);
                }}
              >
                <Text style={[styles.modalDropdownText, !nouveauRepas.jour && styles.placeholderText]}>
                  {nouveauRepas.jour || 'Sélectionnez un jour'}
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
                          setNouveauRepas({...nouveauRepas, jour});
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

            {/* Type de repas */}
            <View style={[styles.modalFieldDropdown, { zIndex: typeDropdownOpen ? 1000 : 1 }]}>
              <Text style={styles.modalLabel}>Type de repas</Text>
              <TouchableOpacity 
                style={[styles.modalDropdown, typeDropdownOpen && { borderColor: '#F5A623', borderWidth: 2 }]}
                onPress={() => {
                  setTypeDropdownOpen(!typeDropdownOpen);
                  setJourDropdownOpen(false);
                }}
              >
                <Text style={[styles.modalDropdownText, !nouveauRepas.type && styles.placeholderText]}>
                  {nouveauRepas.type || 'Sélectionnez un type'}
                </Text>
                <Text style={[styles.dropdownArrow, typeDropdownOpen && { color: '#F5A623' }]}>▼</Text>
              </TouchableOpacity>
              {typeDropdownOpen && (
                <View style={styles.dropdownOverlay}>
                  <ScrollView style={styles.dropdownList} nestedScrollEnabled={true} showsVerticalScrollIndicator={true}>
                    {TYPES_REPAS.map((type, index) => (
                      <TouchableOpacity
                        key={type}
                        style={[
                          styles.dropdownItem,
                          index === TYPES_REPAS.length - 1 && { borderBottomWidth: 0 }
                        ]}
                        onPress={() => {
                          setNouveauRepas({...nouveauRepas, type});
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

            {/* Description */}
            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>Description</Text>
              <TextInput
                style={[styles.modalInput, styles.modalTextArea]}
                value={nouveauRepas.description}
                onChangeText={(text) => setNouveauRepas({...nouveauRepas, description: text})}
                placeholder="Description du repas..."
                placeholderTextColor="#6A737D"
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Macronutriments - version compacte */}
            <View style={styles.macroContainer}>
              <Text style={styles.macroSectionTitle}>Informations nutritionnelles</Text>
              
              <View style={styles.macroRow}>
                <View style={styles.macroFieldCompact}>
                  <Text style={styles.modalLabelSmall}>Calories</Text>
                  <TextInput
                    style={styles.modalInputSmall}
                    value={nouveauRepas.caloriesTotal.toString()}
                    onChangeText={(text) => setNouveauRepas({...nouveauRepas, caloriesTotal: parseInt(text) || 0})}
                    placeholder="0"
                    placeholderTextColor="#6A737D"
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.macroFieldCompact}>
                  <Text style={styles.modalLabelSmall}>Protéines (g)</Text>
                  <TextInput
                    style={styles.modalInputSmall}
                    value={nouveauRepas.proteines.toString()}
                    onChangeText={(text) => setNouveauRepas({...nouveauRepas, proteines: parseInt(text) || 0})}
                    placeholder="0"
                    placeholderTextColor="#6A737D"
                    keyboardType="numeric"
                  />
                </View>
              </View>
              
              <View style={styles.macroRow}>
                <View style={styles.macroFieldCompact}>
                  <Text style={styles.modalLabelSmall}>Glucides (g)</Text>
                  <TextInput
                    style={styles.modalInputSmall}
                    value={nouveauRepas.glucides.toString()}
                    onChangeText={(text) => setNouveauRepas({...nouveauRepas, glucides: parseInt(text) || 0})}
                    placeholder="0"
                    placeholderTextColor="#6A737D"
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.macroFieldCompact}>
                  <Text style={styles.modalLabelSmall}>Lipides (g)</Text>
                  <TextInput
                    style={styles.modalInputSmall}
                    value={nouveauRepas.lipides.toString()}
                    onChangeText={(text) => setNouveauRepas({...nouveauRepas, lipides: parseInt(text) || 0})}
                    placeholder="0"
                    placeholderTextColor="#6A737D"
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </View>

            {/* Recette / Instructions */}
            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>Recette / Instructions (optionnel)</Text>
              <TextInput
                style={[styles.modalInput, styles.modalTextArea]}
                value={nouveauRepas.recette}
                onChangeText={(text) => setNouveauRepas({...nouveauRepas, recette: text})}
                placeholder="Instructions de préparation..."
                placeholderTextColor="#6A737D"
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.modalSpacer} />
          </ScrollView>

          {/* Boutons */}
          <View style={styles.modalButtons}>
            <TouchableOpacity style={styles.cancelButton} onPress={fermerModal}>
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addButton} onPress={ajouterRepas}>
              <Text style={styles.addButtonText}>Ajouter</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nouveau Programme de Nutrition Complet</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Nom du programme */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nom du programme</Text>
          <TextInput
            style={styles.input}
            value={nomProgramme}
            onChangeText={setNomProgramme}
            placeholder="Programme perte de poids - 1 semaine"
            placeholderTextColor="#6A737D"
          />
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Description du programme..."
            placeholderTextColor="#6A737D"
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Repas du programme */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Repas du programme</Text>
          <Text style={styles.sectionSubtitle}>
            Ajouter les différents repas qui composeront ce programme
          </Text>

          <TouchableOpacity style={styles.ajouterButton} onPress={ouvrirModalAjout}>
            <Text style={styles.ajouterButtonText}>+ Ajouter un repas au programme</Text>
          </TouchableOpacity>

          {/* Liste des repas ajoutés */}
          {repas.map((repasSingle, index) => (
            <View key={index} style={styles.repasCard}>
              <View style={styles.repasHeader}>
                <View>
                  <Text style={styles.repasNom}>{repasSingle.nom}</Text>
                  <Text style={styles.repasInfo}>{repasSingle.jour} - {repasSingle.type}</Text>
                </View>
                <TouchableOpacity 
                  style={styles.supprimerButton}
                  onPress={() => supprimerRepas(index)}
                >
                  <Text style={styles.supprimerText}>×</Text>
                </TouchableOpacity>
              </View>
              {repasSingle.description && (
                <Text style={styles.repasDescription}>{repasSingle.description}</Text>
              )}
              <View style={styles.macroInfo}>
                <Text style={styles.repasCalories}>{repasSingle.caloriesTotal} kcal</Text>
                <Text style={styles.macroDetail}>
                  P: {repasSingle.proteines}g | G: {repasSingle.glucides}g | L: {repasSingle.lipides}g
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Bouton sauvegarder */}
        <TouchableOpacity style={styles.sauvegarderButton} onPress={sauvegarderProgramme}>
          <Text style={styles.sauvegarderButtonText}>Créer le programme de repas</Text>
        </TouchableOpacity>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {renderModalAjoutRepas()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1117',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#21262D',
  },
  backButton: {
    marginBottom: 12,
  },
  backText: {
    color: '#F5A623',
    fontSize: 16,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#8B949E',
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#161B22',
    borderWidth: 1,
    borderColor: '#21262D',
    borderRadius: 8,
    padding: 12,
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 12,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  ajouterButton: {
    backgroundColor: '#21262D',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  ajouterButtonText: {
    color: '#F5A623',
    fontSize: 14,
    fontWeight: '500',
  },
  repasCard: {
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#21262D',
    marginBottom: 12,
  },
  repasHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  repasNom: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  repasInfo: {
    fontSize: 14,
    color: '#8B949E',
    marginTop: 2,
  },
  repasDescription: {
    fontSize: 14,
    color: '#8B949E',
    marginBottom: 8,
    lineHeight: 18,
  },
  macroInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  repasCalories: {
    fontSize: 14,
    color: '#F5A623',
    fontWeight: '600',
  },
  macroDetail: {
    fontSize: 12,
    color: '#8B949E',
  },
  supprimerButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#8B949E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  supprimerText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sauvegarderButton: {
    backgroundColor: '#F5A623',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  sauvegarderButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomPadding: {
    height: 40,
  },
  
  // Styles pour la modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#161B22',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    width: '100%',
    maxHeight: '95%',
    minHeight: '80%',
    borderWidth: 1,
    borderColor: '#21262D',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#21262D',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
  },
  closeButtonContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#21262D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  modalContent: {
    padding: 20,
    flex: 1,
  },
  modalField: {
    marginBottom: 24,
    zIndex: 1,
    position: 'relative',
  },
  modalFieldDropdown: {
    marginBottom: 24,
    zIndex: 10,
    position: 'relative',
  },
  modalLabel: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  modalLabelSmall: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 6,
    fontWeight: '500',
  },
  modalInput: {
    backgroundColor: '#0D1117',
    borderWidth: 2,
    borderColor: '#30363D',
    borderRadius: 8,
    padding: 14,
    color: '#FFFFFF',
    fontSize: 16,
    minHeight: 48,
  },
  modalInputSmall: {
    backgroundColor: '#0D1117',
    borderWidth: 1,
    borderColor: '#21262D',
    borderRadius: 6,
    padding: 8,
    color: '#FFFFFF',
    fontSize: 14,
    minHeight: 36,
    textAlign: 'center',
  },
  modalTextArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalDropdown: {
    backgroundColor: '#0D1117',
    borderWidth: 2,
    borderColor: '#30363D',
    borderRadius: 8,
    padding: 14,
    minHeight: 48,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalDropdownText: {
    color: '#FFFFFF',
    fontSize: 16,
    flex: 1,
    fontWeight: '500',
  },
  placeholderText: {
    color: '#6A737D',
    fontWeight: 'normal',
  },
  dropdownArrow: {
    color: '#8B949E',
    fontSize: 14,
    marginLeft: 8,
  },
  dropdownOverlay: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    zIndex: 9999,
    elevation: 15,
    marginTop: 4,
  },
  dropdownList: {
    backgroundColor: '#0D1117',
    borderRadius: 8,
    maxHeight: 200,
    borderWidth: 2,
    borderColor: '#F5A623',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 15,
  },
  dropdownItem: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#21262D',
    backgroundColor: 'transparent',
  },
  dropdownItemText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'left',
  },
  macroContainer: {
    marginBottom: 20,
  },
  macroSectionTitle: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 12,
    fontWeight: '600',
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  macroFieldCompact: {
    flex: 1,
    marginHorizontal: 4,
  },
  modalSpacer: {
    height: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#21262D',
    gap: 16,
    backgroundColor: '#161B22',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    backgroundColor: '#30363D',
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#484F58',
  },
  cancelButtonText: {
    color: '#F0F6FC',
    fontSize: 16,
    fontWeight: '600',
  },
  addButton: {
    flex: 1,
    paddingVertical: 16,
    backgroundColor: '#F5A623',
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#F5A623',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  addButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
