
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export default function NutritionScreen() {
  const [selectedTab, setSelectedTab] = useState('Journal');
  const [selectedDate, setSelectedDate] = useState(new Date());

  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    };
    return date.toLocaleDateString('fr-FR', options);
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 1);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setSelectedDate(newDate);
  };

  const isToday = () => {
    const today = new Date();
    return selectedDate.toDateString() === today.toDateString();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Nutrition</Text>
          
          {/* Date Navigation */}
          <View style={styles.dateNavigation}>
            <TouchableOpacity 
              style={styles.dateArrow}
              onPress={() => navigateDate('prev')}
            >
              <Text style={styles.arrowText}>‹</Text>
            </TouchableOpacity>
            
            <View style={styles.dateContainer}>
              <Text style={styles.date}>
                {isToday() ? 'Aujourd\'hui' : formatDate(selectedDate)}
              </Text>
              {!isToday() && (
                <Text style={styles.dateSubtext}>
                  {formatDate(selectedDate)}
                </Text>
              )}
            </View>
            
            <TouchableOpacity 
              style={styles.dateArrow}
              onPress={() => navigateDate('next')}
            >
              <Text style={styles.arrowText}>›</Text>
            </TouchableOpacity>
          </View>
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
    paddingHorizontal: width < 375 ? 16 : 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  title: {
    fontSize: width < 375 ? 22 : 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  dateNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  dateArrow: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#161B22',
    borderWidth: 1,
    borderColor: '#21262D',
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  dateContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  date: {
    fontSize: width < 375 ? 14 : 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  dateSubtext: {
    fontSize: 12,
    color: '#8B949E',
    marginTop: 2,
    textAlign: 'center',
  },
  statsContainer: {
    paddingHorizontal: width < 375 ? 12 : 16,
    paddingBottom: 16,
  },
  caloriesCard: {
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: width < 375 ? 16 : 20,
    borderWidth: 1,
    borderColor: '#21262D',
    marginBottom: 12,
    alignItems: 'center',
  },
  caloriesValue: {
    fontSize: width < 375 ? 28 : 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  caloriesLabel: {
    fontSize: width < 375 ? 14 : 16,
    color: '#8B949E',
    marginBottom: 6,
  },
  caloriesSubtext: {
    fontSize: width < 375 ? 12 : 14,
    color: '#8B949E',
  },
  macrosContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: width < 375 ? 6 : 8,
  },
  macroItem: {
    backgroundColor: '#161B22',
    borderRadius: 10,
    padding: width < 375 ? 12 : 16,
    borderWidth: 1,
    borderColor: '#21262D',
    flex: 1,
    alignItems: 'center',
  },
  macroLabel: {
    fontSize: width < 375 ? 11 : 12,
    color: '#8B949E',
    marginBottom: 4,
    textAlign: 'center',
  },
  macroValue: {
    fontSize: width < 375 ? 16 : 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: width < 375 ? 12 : 16,
    marginBottom: 16,
    gap: width < 375 ? 6 : 8,
  },
  tab: {
    flex: 1,
    paddingVertical: width < 375 ? 10 : 12,
    paddingHorizontal: width < 375 ? 12 : 16,
    borderRadius: 8,
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
    fontSize: width < 375 ? 12 : 14,
    color: '#8B949E',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  mealsContainer: {
    paddingHorizontal: width < 375 ? 12 : 16,
    paddingBottom: 120,
  },
  sectionTitle: {
    fontSize: width < 375 ? 16 : 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 14,
  },
  mealCard: {
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: width < 375 ? 14 : 18,
    borderWidth: 1,
    borderColor: '#21262D',
    marginBottom: 12,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  mealTitle: {
    fontSize: width < 375 ? 14 : 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  addButton: {
    backgroundColor: '#21262D',
    paddingVertical: width < 375 ? 4 : 6,
    paddingHorizontal: width < 375 ? 8 : 12,
    borderRadius: 6,
  },
  addButtonText: {
    fontSize: width < 375 ? 10 : 12,
    color: '#8B949E',
  },
  mealEmpty: {
    fontSize: width < 375 ? 12 : 14,
    color: '#8B949E',
    textAlign: 'center',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  addFoodButton: {
    backgroundColor: '#0D1117',
    borderWidth: 1,
    borderColor: '#21262D',
    borderStyle: 'dashed',
    paddingVertical: width < 375 ? 10 : 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  addFoodText: {
    fontSize: width < 375 ? 12 : 14,
    color: '#8B949E',
  },
});
