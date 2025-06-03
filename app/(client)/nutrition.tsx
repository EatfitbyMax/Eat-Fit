
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';

export default function NutritionScreen() {
  const [selectedTab, setSelectedTab] = useState('Journal');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Nutrition</Text>
          <Text style={styles.date}>Aujourd'hui, Mardi 3 Juin</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.caloriesCard}>
            <Text style={styles.caloriesValue}>0 / 2495</Text>
            <Text style={styles.caloriesLabel}>kcal</Text>
            <Text style={styles.caloriesSubtext}>245.5 kcal restantes</Text>
          </View>

          <View style={styles.macrosContainer}>
            <View style={styles.macroItem}>
              <Text style={styles.macroLabel}>Protéines</Text>
              <Text style={styles.macroValue}>0 g</Text>
            </View>
            <View style={styles.macroItem}>
              <Text style={styles.macroLabel}>Glucides</Text>
              <Text style={styles.macroValue}>0 g</Text>
            </View>
            <View style={styles.macroItem}>
              <Text style={styles.macroLabel}>Lipides</Text>
              <Text style={styles.macroValue}>0 g</Text>
            </View>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity 
            style={[styles.tab, selectedTab === 'Journal' && styles.activeTab]}
            onPress={() => setSelectedTab('Journal')}
          >
            <Text style={[styles.tabText, selectedTab === 'Journal' && styles.activeTabText]}>
              Journal
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, selectedTab === 'Rechercher' && styles.activeTab]}
            onPress={() => setSelectedTab('Rechercher')}
          >
            <Text style={[styles.tabText, selectedTab === 'Rechercher' && styles.activeTabText]}>
              Rechercher
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, selectedTab === 'Scanner' && styles.activeTab]}
            onPress={() => setSelectedTab('Scanner')}
          >
            <Text style={[styles.tabText, selectedTab === 'Scanner' && styles.activeTabText]}>
              Scanner
            </Text>
          </TouchableOpacity>
        </View>

        {/* Meals Section */}
        <View style={styles.mealsContainer}>
          <Text style={styles.sectionTitle}>Repas du jour</Text>

          {/* Petit-déjeuner */}
          <View style={styles.mealCard}>
            <View style={styles.mealHeader}>
              <Text style={styles.mealTitle}>Petit-déjeuner</Text>
              <TouchableOpacity style={styles.addButton}>
                <Text style={styles.addButtonText}>Aujourd'hui</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.mealEmpty}>Aucun aliment ajouté</Text>
            <TouchableOpacity style={styles.addFoodButton}>
              <Text style={styles.addFoodText}>+ Ajouter un aliment</Text>
            </TouchableOpacity>
          </View>

          {/* Déjeuner */}
          <View style={styles.mealCard}>
            <View style={styles.mealHeader}>
              <Text style={styles.mealTitle}>Déjeuner</Text>
              <TouchableOpacity style={styles.addButton}>
                <Text style={styles.addButtonText}>Aujourd'hui</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.mealEmpty}>Aucun aliment ajouté</Text>
            <TouchableOpacity style={styles.addFoodButton}>
              <Text style={styles.addFoodText}>+ Ajouter un aliment</Text>
            </TouchableOpacity>
          </View>

          {/* Collation */}
          <View style={styles.mealCard}>
            <View style={styles.mealHeader}>
              <Text style={styles.mealTitle}>Collation</Text>
              <TouchableOpacity style={styles.addButton}>
                <Text style={styles.addButtonText}>Aujourd'hui</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.mealEmpty}>Aucun aliment ajouté</Text>
            <TouchableOpacity style={styles.addFoodButton}>
              <Text style={styles.addFoodText}>+ Ajouter un aliment</Text>
            </TouchableOpacity>
          </View>

          {/* Dîner */}
          <View style={styles.mealCard}>
            <View style={styles.mealHeader}>
              <Text style={styles.mealTitle}>Dîner</Text>
              <TouchableOpacity style={styles.addButton}>
                <Text style={styles.addButtonText}>Aujourd'hui</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.mealEmpty}>Aucun aliment ajouté</Text>
            <TouchableOpacity style={styles.addFoodButton}>
              <Text style={styles.addFoodText}>+ Ajouter un aliment</Text>
            </TouchableOpacity>
          </View>
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
    marginBottom: 4,
  },
  date: {
    fontSize: 16,
    color: '#8B949E',
  },
  statsContainer: {
    padding: 20,
    paddingTop: 0,
  },
  caloriesCard: {
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#21262D',
    marginBottom: 16,
    alignItems: 'center',
  },
  caloriesValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  caloriesLabel: {
    fontSize: 16,
    color: '#8B949E',
    marginBottom: 8,
  },
  caloriesSubtext: {
    fontSize: 14,
    color: '#8B949E',
  },
  macrosContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  macroItem: {
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#21262D',
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  macroLabel: {
    fontSize: 12,
    color: '#8B949E',
    marginBottom: 4,
  },
  macroValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 4,
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
    fontSize: 14,
    color: '#8B949E',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  mealsContainer: {
    padding: 20,
    paddingTop: 0,
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  mealCard: {
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#21262D',
    marginBottom: 16,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  mealTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  addButton: {
    backgroundColor: '#21262D',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  addButtonText: {
    fontSize: 12,
    color: '#8B949E',
  },
  mealEmpty: {
    fontSize: 14,
    color: '#8B949E',
    textAlign: 'center',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  addFoodButton: {
    backgroundColor: '#0D1117',
    borderWidth: 1,
    borderColor: '#21262D',
    borderStyle: 'dashed',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  addFoodText: {
    fontSize: 14,
    color: '#8B949E',
  },
});
