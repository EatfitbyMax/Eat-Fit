
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';

export default function ProgrammesScreen() {
  const [selectedTab, setSelectedTab] = useState('Nutrition');

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
          
          <View style={styles.tabContainer}>
            <TouchableOpacity 
              style={[styles.tab, selectedTab === 'Nutrition' && styles.activeTab]}
              onPress={() => setSelectedTab('Nutrition')}
            >
              <Text style={[styles.tabText, selectedTab === 'Nutrition' && styles.activeTabText]}>
                📄 Programmes Nutrition
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.tab, selectedTab === 'Sport' && styles.activeTab]}
              onPress={() => setSelectedTab('Sport')}
            >
              <Text style={[styles.tabText, selectedTab === 'Sport' && styles.activeTabText]}>
                💪 Programmes Sportif
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.newProgramButton}>
            <Text style={styles.newProgramButtonText}>+ Nouveau Programme Nutrition</Text>
          </TouchableOpacity>
        </View>

        {/* Programmes de Nutrition */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Programmes de Nutrition</Text>
          
          <View style={styles.programCard}>
            <View style={styles.programHeader}>
              <Text style={styles.programTitle}>Programme 2500Kcal</Text>
              <Text style={styles.programSubtitle}>645 kcal total</Text>
              <TouchableOpacity style={styles.menuButton}>
                <Text style={styles.menuButtonText}>⋮</Text>
              </TouchableOpacity>
            </View>
            
            <Text style={styles.programDescription}>
              programme de nutrition complet pour une semaine conçu pour un apport quotidien de 2500 kcal ...
            </Text>
            
            <View style={styles.mealItem}>
              <Text style={styles.mealIcon}>📅</Text>
              <View style={styles.mealContent}>
                <Text style={styles.mealTitle}>Lundi</Text>
                <Text style={styles.mealSubtitle}>Porridge protéiné aux fruits rouges</Text>
                <Text style={styles.mealDetails}>Petit déjeuner</Text>
              </View>
              <Text style={styles.mealCalories}>645 kcal</Text>
            </View>
            
            <Text style={styles.programDate}>© Créé le 20 mai 2025</Text>
          </View>
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
      </ScrollView>
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
    margin: 20,
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#21262D',
    borderRadius: 8,
    marginRight: 12,
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
  newProgramButton: {
    backgroundColor: '#F5A623',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  newProgramButtonText: {
    color: '#000000',
    fontWeight: '600',
    fontSize: 14,
  },
  programCard: {
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#21262D',
  },
  programHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
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
});
