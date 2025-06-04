
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Alert } from 'react-native';

interface Programme {
  id: string;
  nom: string;
  description: string;
  type: 'nutrition' | 'sport';
  calories?: number;
  duree?: string;
  dateCreation: string;
}

export default function ProgrammesScreen() {
  const [selectedTab, setSelectedTab] = useState<'nutrition' | 'sport'>('nutrition');
  const [programmes, setProgrammes] = useState<Programme[]>([
    {
      id: '1',
      nom: 'Programme 2500Kcal',
      description: 'Programme de nutrition complet pour une semaine conçu pour un apport quotidien de 2500 kcal...',
      type: 'nutrition',
      calories: 2500,
      dateCreation: '20 mai 2025'
    },
    {
      id: '2',
      nom: 'Musculation Débutant',
      description: 'Programme d\'entraînement pour débuter la musculation en douceur...',
      type: 'sport',
      duree: '45 min',
      dateCreation: '22 mai 2025'
    }
  ]);

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
            onPress: () => {
              setProgrammes(prev => prev.filter(p => p.id !== programmeId));
            }
          }
        ]
      );
    }
  };

  const handleNouveauProgramme = () => {
    Alert.alert(
      'Nouveau Programme',
      `Créer un nouveau programme ${selectedTab === 'nutrition' ? 'nutrition' : 'sportif'}`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Créer',
          onPress: () => {
            // TODO: Naviguer vers l'écran de création
            console.log(`Créer nouveau programme ${selectedTab}`);
          }
        }
      ]
    );
  };

  const renderProgrammeCard = (programme: Programme) => (
    <View key={programme.id} style={styles.programCard}>
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
            onPress={() => {
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
      
      {programme.type === 'nutrition' && (
        <View style={styles.mealItem}>
          <Text style={styles.mealIcon}>📅</Text>
          <View style={styles.mealContent}>
            <Text style={styles.mealTitle}>Lundi</Text>
            <Text style={styles.mealSubtitle}>Porridge protéiné aux fruits rouges</Text>
            <Text style={styles.mealDetails}>Petit déjeuner</Text>
          </View>
          <Text style={styles.mealCalories}>{programme.calories} kcal</Text>
        </View>
      )}

      {programme.type === 'sport' && (
        <View style={styles.mealItem}>
          <Text style={styles.mealIcon}>💪</Text>
          <View style={styles.mealContent}>
            <Text style={styles.mealTitle}>Séance 1</Text>
            <Text style={styles.mealSubtitle}>Pectoraux - Triceps</Text>
            <Text style={styles.mealDetails}>3 exercices</Text>
          </View>
          <Text style={styles.mealCalories}>{programme.duree}</Text>
        </View>
      )}
      
      <Text style={styles.programDate}>© Créé le {programme.dateCreation}</Text>
    </View>
  );

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
  mealItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0D1117',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  mealIcon: {
    fontSize: 16,
    marginRight: 12,
  },
  mealContent: {
    flex: 1,
  },
  mealTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  mealSubtitle: {
    fontSize: 12,
    color: '#8B949E',
    marginBottom: 2,
  },
  mealDetails: {
    fontSize: 10,
    color: '#6A737D',
  },
  mealCalories: {
    fontSize: 12,
    color: '#F5A623',
    fontWeight: '600',
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
    bottom: 30,
    right: 30,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F5A623',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  floatingButtonText: {
    fontSize: 24,
    color: '#000000',
  },
});
