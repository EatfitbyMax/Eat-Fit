
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Alert, Modal } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Programme {
  id: string;
  nom: string;
  description: string;
  type: 'nutrition' | 'sport';
  calories?: number;
  duree?: string;
  dateCreation: string;
  details?: any;
}

const PROGRAMMES_STORAGE_KEY = 'programmes_coach';

export default function ProgrammesScreen() {
  const [selectedTab, setSelectedTab] = useState<'nutrition' | 'sport'>('nutrition');
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [selectedProgramme, setSelectedProgramme] = useState<Programme | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Charger les programmes au démarrage
  useEffect(() => {
    chargerProgrammes();
  }, []);

  const chargerProgrammes = async () => {
    try {
      const programmesStockes = await AsyncStorage.getItem(PROGRAMMES_STORAGE_KEY);
      if (programmesStockes) {
        const programmesParses = JSON.parse(programmesStockes);
        setProgrammes(programmesParses);
        console.log('Programmes chargés:', programmesParses.length);
      } else {
        // Première utilisation, démarrer avec une liste vide
        setProgrammes([]);
        console.log('Démarrage avec une liste de programmes vide');
      }
    } catch (error) {
      console.error('Erreur chargement programmes:', error);
      setProgrammes([]);
    }
  };

  const sauvegarderProgrammes = async (nouveauxProgrammes: Programme[]) => {
    try {
      await AsyncStorage.setItem(PROGRAMMES_STORAGE_KEY, JSON.stringify(nouveauxProgrammes));
      console.log('Programmes sauvegardés:', nouveauxProgrammes.length);
    } catch (error) {
      console.error('Erreur sauvegarde programmes:', error);
    }
  };

  const programmesFiltres = programmes.filter(p => p.type === selectedTab);

  const handleMenuAction = (programmeId: string, action: 'modifier' | 'supprimer') => {
    if (action === 'modifier') {
      Alert.alert('Modifier', `Modifier le programme ${programmeId}`);
      // TODO: Naviguer vers l'écran de modification
    } else if (action === 'supprimer') {
      Alert.alert(
        'Supprimer le programme',
        'Êtes-vous sûr de vouloir supprimer ce programme ?',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Supprimer',
            style: 'destructive',
            onPress: async () => {
              const nouveauxProgrammes = programmes.filter(p => p.id !== programmeId);
              setProgrammes(nouveauxProgrammes);
              await sauvegarderProgrammes(nouveauxProgrammes);
            }
          }
        ]
      );
    }
  };

  const handleImporterProgrammes = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const response = await fetch(result.assets[0].uri);
      const text = await response.text();
      const data = JSON.parse(text);

      if (!data.programmes || !Array.isArray(data.programmes)) {
        Alert.alert('Erreur', 'Format de fichier invalide. Le fichier doit contenir un tableau "programmes".');
        return;
      }

      let programmesImportes = 0;
      const nouveauxProgrammes: Programme[] = [];

      data.programmes.forEach((prog: any) => {
        if (prog.nom && prog.description && (prog.type === 'nutrition' || prog.type === 'sport')) {
          const nouveauProgramme: Programme = {
            id: Date.now().toString() + Math.random().toString(),
            nom: prog.nom,
            description: prog.description,
            type: prog.type,
            calories: prog.calories,
            duree: prog.duree,
            dateCreation: new Date().toLocaleDateString('fr-FR'),
            details: prog.details
          };
          nouveauxProgrammes.push(nouveauProgramme);
          programmesImportes++;
        }
      });

      if (programmesImportes > 0) {
        const programmesMAJ = [...programmes, ...nouveauxProgrammes];
        setProgrammes(programmesMAJ);
        await sauvegarderProgrammes(programmesMAJ);
        Alert.alert(
          'Import réussi !',
          `${programmesImportes} programme(s) ont été importé(s) avec succès.`
        );
      } else {
        Alert.alert('Aucun programme valide', 'Aucun programme valide trouvé dans le fichier.');
      }

    } catch (error) {
      console.error('Erreur import:', error);
      Alert.alert('Erreur', 'Impossible de lire le fichier. Vérifiez le format JSON.');
    }
  };

  const handleNouveauProgramme = () => {
    Alert.alert(
      'Nouveau Programme',
      'Comment voulez-vous créer un programme ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Importer JSON', onPress: handleImporterProgrammes },
        { 
          text: 'Créer manuellement', 
          onPress: () => {
            Alert.prompt(
              'Nouveau Programme',
              `Nom du programme ${selectedTab === 'nutrition' ? 'nutrition' : 'sportif'} :`,
              [
                { text: 'Annuler', style: 'cancel' },
                {
                  text: 'Créer',
                  onPress: async (nom) => {
                    if (nom && nom.trim()) {
                      const nouveauProgramme: Programme = {
                        id: Date.now().toString(),
                        nom: nom.trim(),
                        description: `Programme ${selectedTab} créé le ${new Date().toLocaleDateString('fr-FR')}`,
                        type: selectedTab,
                        calories: selectedTab === 'nutrition' ? 2000 : undefined,
                        duree: selectedTab === 'sport' ? '30 min' : undefined,
                        dateCreation: new Date().toLocaleDateString('fr-FR')
                      };
                      
                      const programmesMAJ = [...programmes, nouveauProgramme];
                      setProgrammes(programmesMAJ);
                      await sauvegarderProgrammes(programmesMAJ);
                      
                      Alert.alert(
                        'Programme créé !',
                        `Le programme "${nom}" a été ajouté avec succès.`
                      );
                    } else {
                      Alert.alert('Erreur', 'Veuillez saisir un nom pour le programme.');
                    }
                  }
                }
              ],
              'plain-text',
              '',
              'default'
            );
          }
        }
      ]
    );
  };

  const obtenirPremiersElements = (programme: Programme) => {
    if (!programme.details) return null;

    if (programme.type === 'nutrition' && programme.details.repas) {
      const premiersRepas = programme.details.repas.slice(0, 2);
      return premiersRepas.map((repas: any, index: number) => (
        <View key={index} style={styles.previewItem}>
          <Text style={styles.previewIcon}>🍽️</Text>
          <View style={styles.previewContent}>
            <Text style={styles.previewTitle}>{repas.jour || `Jour ${index + 1}`}</Text>
            <Text style={styles.previewSubtitle}>{repas.petitDejeuner || repas.nom || 'Repas'}</Text>
            <Text style={styles.previewDetails}>
              {repas.type || 'Petit déjeuner'} • {repas.calories || programme.calories} kcal
            </Text>
          </View>
        </View>
      ));
    }

    if (programme.type === 'sport' && programme.details.exercices) {
      const premiersExercices = programme.details.exercices.slice(0, 2);
      return premiersExercices.map((exercice: any, index: number) => (
        <View key={index} style={styles.previewItem}>
          <Text style={styles.previewIcon}>💪</Text>
          <View style={styles.previewContent}>
            <Text style={styles.previewTitle}>{exercice.nom}</Text>
            <Text style={styles.previewSubtitle}>
              {exercice.series ? `${exercice.series} séries` : ''}
              {exercice.repetitions ? ` • ${exercice.repetitions} reps` : ''}
              {exercice.duree ? ` • ${exercice.duree}` : ''}
            </Text>
            <Text style={styles.previewDetails}>
              {exercice.repos ? `Repos: ${exercice.repos}` : ''}
            </Text>
          </View>
        </View>
      ));
    }

    // Fallback si pas de détails structurés
    return (
      <View style={styles.previewItem}>
        <Text style={styles.previewIcon}>
          {programme.type === 'nutrition' ? '🍽️' : '💪'}
        </Text>
        <View style={styles.previewContent}>
          <Text style={styles.previewTitle}>Contenu disponible</Text>
          <Text style={styles.previewSubtitle}>Cliquez pour voir les détails</Text>
          <Text style={styles.previewDetails}>
            {programme.type === 'nutrition' ? `${programme.calories} kcal` : programme.duree}
          </Text>
        </View>
      </View>
    );
  };

  const renderProgrammeCard = (programme: Programme) => (
    <TouchableOpacity 
      key={programme.id} 
      style={styles.programCard}
      onPress={() => {
        setSelectedProgramme(programme);
        setModalVisible(true);
      }}
    >
      <View style={styles.programHeader}>
        <Text style={styles.programTitle}>{programme.nom}</Text>
        <View style={styles.programHeaderRight}>
          {programme.calories && (
            <Text style={styles.programSubtitle}>{programme.calories} kcal</Text>
          )}
          {programme.duree && (
            <Text style={styles.programSubtitle}>{programme.duree}</Text>
          )}
          <TouchableOpacity 
            style={styles.menuButton}
            onPress={(e) => {
              e.stopPropagation();
              Alert.alert(
                'Actions',
                'Que souhaitez-vous faire ?',
                [
                  { text: 'Annuler', style: 'cancel' },
                  { text: 'Modifier', onPress: () => handleMenuAction(programme.id, 'modifier') },
                  { text: 'Supprimer', style: 'destructive', onPress: () => handleMenuAction(programme.id, 'supprimer') }
                ]
              );
            }}
          >
            <Text style={styles.menuButtonText}>⋮</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <Text style={styles.programDescription}>{programme.description}</Text>
      
      {/* Aperçu du contenu réel */}
      <View style={styles.previewContainer}>
        {obtenirPremiersElements(programme)}
        {programme.details && (
          <Text style={styles.moreContent}>
            Cliquez pour voir le programme complet
          </Text>
        )}
      </View>
      
      <Text style={styles.programDate}>© Créé le {programme.dateCreation}</Text>
    </TouchableOpacity>
  );

  const renderProgrammeDetail = () => {
    if (!selectedProgramme) return null;

    return (
      <Modal
        animationType="slide"
        transparent={false}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.backButtonText}>← Retour</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{selectedProgramme.nom}</Text>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalDescription}>{selectedProgramme.description}</Text>
            
            {selectedProgramme.calories && (
              <Text style={styles.modalInfo}>📊 {selectedProgramme.calories} kcal par jour</Text>
            )}
            {selectedProgramme.duree && (
              <Text style={styles.modalInfo}>⏱️ Durée: {selectedProgramme.duree}</Text>
            )}

            {selectedProgramme.details && (
              <View style={styles.detailsContainer}>
                <Text style={styles.detailsTitle}>Contenu du programme</Text>
                
                {selectedProgramme.type === 'nutrition' && selectedProgramme.details.repas && (
                  selectedProgramme.details.repas.map((repas: any, index: number) => (
                    <View key={index} style={styles.detailCard}>
                      <Text style={styles.detailCardTitle}>
                        {repas.jour || `Jour ${index + 1}`}
                      </Text>
                      {repas.petitDejeuner && (
                        <Text style={styles.detailItem}>🌅 Petit déjeuner: {repas.petitDejeuner}</Text>
                      )}
                      {repas.dejeuner && (
                        <Text style={styles.detailItem}>☀️ Déjeuner: {repas.dejeuner}</Text>
                      )}
                      {repas.collation && (
                        <Text style={styles.detailItem}>🍪 Collation: {repas.collation}</Text>
                      )}
                      {repas.diner && (
                        <Text style={styles.detailItem}>🌙 Dîner: {repas.diner}</Text>
                      )}
                      {repas.calories && (
                        <Text style={styles.detailCalories}>{repas.calories} kcal</Text>
                      )}
                    </View>
                  ))
                )}

                {selectedProgramme.type === 'sport' && selectedProgramme.details.exercices && (
                  selectedProgramme.details.exercices.map((exercice: any, index: number) => (
                    <View key={index} style={styles.detailCard}>
                      <Text style={styles.detailCardTitle}>{exercice.nom}</Text>
                      {exercice.series && (
                        <Text style={styles.detailItem}>📊 Séries: {exercice.series}</Text>
                      )}
                      {exercice.repetitions && (
                        <Text style={styles.detailItem}>🔢 Répétitions: {exercice.repetitions}</Text>
                      )}
                      {exercice.duree && (
                        <Text style={styles.detailItem}>⏱️ Durée: {exercice.duree}</Text>
                      )}
                      {exercice.repos && (
                        <Text style={styles.detailItem}>😴 Repos: {exercice.repos}</Text>
                      )}
                      {exercice.description && (
                        <Text style={styles.detailDescription}>{exercice.description}</Text>
                      )}
                    </View>
                  ))
                )}

                {/* Affichage générique si structure différente */}
                {selectedProgramme.details && !selectedProgramme.details.repas && !selectedProgramme.details.exercices && (
                  <View style={styles.detailCard}>
                    <Text style={styles.detailCardTitle}>Détails du programme</Text>
                    <Text style={styles.detailItem}>{JSON.stringify(selectedProgramme.details, null, 2)}</Text>
                  </View>
                )}
              </View>
            )}

            {!selectedProgramme.details && (
              <View style={styles.noDetailsContainer}>
                <Text style={styles.noDetailsText}>Aucun détail disponible pour ce programme</Text>
                <Text style={styles.noDetailsSubtext}>
                  Modifiez le programme pour ajouter du contenu détaillé
                </Text>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateIcon}>
        {selectedTab === 'nutrition' ? '🍽️' : '🏋️‍♂️'}
      </Text>
      <Text style={styles.emptyStateTitle}>
        Aucun programme {selectedTab === 'nutrition' ? 'nutrition' : 'sportif'}
      </Text>
      <Text style={styles.emptyStateDescription}>
        Créez votre premier programme en appuyant sur le bouton ✏️
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Gestion des Programmes</Text>
          <Text style={styles.subtitle}>Créez et gérez les modèles de repas et d'entraînements pour vos clients.</Text>
        </View>

        {/* Mes Modules Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Vos Modules</Text>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.tabScrollContainer}
            contentContainerStyle={styles.tabContainer}
          >
            <TouchableOpacity 
              style={[styles.tab, selectedTab === 'nutrition' && styles.activeTab]}
              onPress={() => setSelectedTab('nutrition')}
            >
              <Text style={[styles.tabText, selectedTab === 'nutrition' && styles.activeTabText]}>
                🍽️ Nutrition ({programmes.filter(p => p.type === 'nutrition').length})
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.tab, selectedTab === 'sport' && styles.activeTab]}
              onPress={() => setSelectedTab('sport')}
            >
              <Text style={[styles.tabText, selectedTab === 'sport' && styles.activeTabText]}>
                💪 Sportif ({programmes.filter(p => p.type === 'sport').length})
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Programmes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Programmes {selectedTab === 'nutrition' ? 'de Nutrition' : 'Sportifs'}
          </Text>
          
          {programmesFiltres.length > 0 ? (
            programmesFiltres.map(renderProgrammeCard)
          ) : (
            renderEmptyState()
          )}
        </View>

        {/* Assigner des Programmes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚡ Assigner des Programmes</Text>
          
          <TouchableOpacity style={styles.assignButton}>
            <Text style={styles.assignButtonText}>Gérer les Affectations aux Clients</Text>
          </TouchableOpacity>
          
          <Text style={styles.assignDescription}>
            Accédez à la page de gestion des clients pour leur assigner des programmes personnalisés.
          </Text>
        </View>

        {/* Espace pour le bouton flottant */}
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Bouton flottant pour nouveau programme */}
      <TouchableOpacity 
        style={styles.floatingButton}
        onPress={handleNouveauProgramme}
      >
        <Text style={styles.floatingButtonText}>✏️</Text>
      </TouchableOpacity>

      {/* Modal pour les détails du programme */}
      {renderProgrammeDetail()}
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
    padding: 20,
    paddingTop: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#8B949E',
    lineHeight: 20,
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  tabScrollContainer: {
    marginBottom: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingRight: 20,
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#21262D',
    borderRadius: 10,
    marginRight: 12,
    minWidth: 140,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#F5A623',
  },
  tabText: {
    fontSize: 14,
    color: '#8B949E',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#000000',
  },
  programCard: {
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#21262D',
    marginBottom: 16,
  },
  programHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  programHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  programTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
  },
  programSubtitle: {
    fontSize: 12,
    color: '#8B949E',
    marginRight: 8,
  },
  menuButton: {
    padding: 4,
  },
  menuButtonText: {
    color: '#8B949E',
    fontSize: 16,
  },
  programDescription: {
    fontSize: 14,
    color: '#8B949E',
    lineHeight: 20,
    marginBottom: 16,
  },
  previewContainer: {
    marginBottom: 12,
  },
  previewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0D1117',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  previewIcon: {
    fontSize: 16,
    marginRight: 12,
  },
  previewContent: {
    flex: 1,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  previewSubtitle: {
    fontSize: 12,
    color: '#8B949E',
    marginBottom: 2,
  },
  previewDetails: {
    fontSize: 10,
    color: '#6A737D',
  },
  moreContent: {
    fontSize: 12,
    color: '#F5A623',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 8,
  },
  programDate: {
    fontSize: 10,
    color: '#6A737D',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  emptyStateDescription: {
    fontSize: 14,
    color: '#8B949E',
    textAlign: 'center',
    lineHeight: 20,
  },
  assignButton: {
    backgroundColor: '#21262D',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  assignButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  assignDescription: {
    fontSize: 12,
    color: '#8B949E',
    textAlign: 'center',
    lineHeight: 18,
  },
  bottomPadding: {
    height: 80,
  },
  floatingButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 65,
    height: 65,
    borderRadius: 32.5,
    backgroundColor: '#F5A623',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 15,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    zIndex: 1000,
  },
  floatingButtonText: {
    fontSize: 28,
    color: '#000000',
    fontWeight: 'bold',
  },
  // Styles pour la modal
  modalContainer: {
    flex: 1,
    backgroundColor: '#0D1117',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#21262D',
  },
  backButton: {
    marginRight: 16,
  },
  backButtonText: {
    color: '#F5A623',
    fontSize: 16,
    fontWeight: '500',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalDescription: {
    fontSize: 16,
    color: '#8B949E',
    lineHeight: 22,
    marginBottom: 20,
  },
  modalInfo: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  detailsContainer: {
    marginTop: 20,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  detailCard: {
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#21262D',
    marginBottom: 12,
  },
  detailCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  detailItem: {
    fontSize: 14,
    color: '#8B949E',
    marginBottom: 6,
    lineHeight: 18,
  },
  detailCalories: {
    fontSize: 14,
    color: '#F5A623',
    fontWeight: '600',
    marginTop: 8,
  },
  detailDescription: {
    fontSize: 12,
    color: '#6A737D',
    marginTop: 8,
    lineHeight: 16,
  },
  noDetailsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noDetailsText: {
    fontSize: 16,
    color: '#8B949E',
    marginBottom: 8,
  },
  noDetailsSubtext: {
    fontSize: 14,
    color: '#6A737D',
    textAlign: 'center',
  },
});
