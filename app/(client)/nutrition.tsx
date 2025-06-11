import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Dimensions, Modal, Alert } from 'react-native';

const { width } = Dimensions.get('window');

export default function NutritionScreen() {
  const [selectedTab, setSelectedTab] = useState('Journal');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [hasNutritionProgram, setHasNutritionProgram] = useState(false); // Assuming default is no access
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

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

  const handleTabPress = (tabName: string) => {
    if (tabName === 'Programme' && !hasNutritionProgram) {
      setShowSubscriptionModal(true);
    } else {
      setSelectedTab(tabName);
    }
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
          {/* Combined Calories and Macros Card */}
          <View style={styles.combinedStatsCard}>
            {/* Calories Circular Gauge - Left Side */}
            <View style={styles.caloriesSection}>
              <View style={styles.circularGauge}>
                <View style={[styles.circularGaugeFill, { transform: [{ rotate: '0deg' }] }]} />
                <View style={styles.circularGaugeInner}>
                  <Text style={styles.caloriesValue}>0</Text>
                  <Text style={styles.caloriesTarget}>/ 2495</Text>
                  <Text style={styles.caloriesLabel}>kcal</Text>
                </View>
              </View>
              <Text style={styles.caloriesSubtext}>2495 kcal restantes</Text>
            </View>

            {/* Macros Progress Bars - Right Side */}
            <View style={styles.macrosSection}>
              {/* Protéines */}
              <View style={styles.macroItem}>
                <View style={styles.macroHeader}>
                  <Text style={styles.macroLabel}>Protéines</Text>
                  <Text style={styles.macroValue}>0g / 125g</Text>
                </View>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: '0%', backgroundColor: '#FF6B6B' }]} />
                </View>
              </View>

              {/* Glucides */}
              <View style={styles.macroItem}>
                <View style={styles.macroHeader}>
                  <Text style={styles.macroLabel}>Glucides</Text>
                  <Text style={styles.macroValue}>0g / 312g</Text>
                </View>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: '0%', backgroundColor: '#4ECDC4' }]} />
                </View>
              </View>

              {/* Lipides */}
              <View style={styles.macroItem}>
                <View style={styles.macroHeader}>
                  <Text style={styles.macroLabel}>Lipides</Text>
                  <Text style={styles.macroValue}>0g / 83g</Text>
                </View>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: '0%', backgroundColor: '#FFE66D' }]} />
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity 
            style={[styles.tab, selectedTab === 'Journal' && styles.activeTab]}
            onPress={() => handleTabPress('Journal')}
          >
            <Text style={[styles.tabText, selectedTab === 'Journal' && styles.activeTabText]}>
              Journal
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, selectedTab === 'Programme' && styles.activeTab]}
            onPress={() => handleTabPress('Programme')}
          >
            <Text style={[styles.tabText, selectedTab === 'Programme' && styles.activeTabText]}>
              Programme
            </Text>
          </TouchableOpacity>
        </View>

        {/* Meals Section */}
        <View style={styles.mealsContainer}>
          <Text style={styles.sectionTitle}>Repas du jour</Text>
          {selectedTab === 'Journal' && (
            <>
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
            </>
          )}
        </View>

        {/* Modal d'abonnement */}
        <Modal
          visible={showSubscriptionModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowSubscriptionModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>🔒 Accès Premium</Text>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={() => setShowSubscriptionModal(false)}
                >
                  <Text style={styles.closeButtonText}>×</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.modalDescription}>
                L'accès aux programmes nutrition est réservé aux membres Premium.
              </Text>

              <View style={styles.benefitsList}>
                <Text style={styles.benefitItem}>✓ Programmes nutrition personnalisés</Text>
                <Text style={styles.benefitItem}>✓ Suivi par un coach professionnel</Text>
                <Text style={styles.benefitItem}>✓ Plans de repas détaillés</Text>
                <Text style={styles.benefitItem}>✓ Ajustements selon vos progrès</Text>
              </View>

              <TouchableOpacity 
                style={styles.subscribeButton}
                onPress={() => {
                  setShowSubscriptionModal(false);
                  Alert.alert(
                    'Abonnement Premium', 
                    'Fonctionnalité d\'abonnement en cours de développement.'
                  );
                }}
              >
                <Text style={styles.subscribeButtonText}>S'abonner maintenant</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowSubscriptionModal(false)}
              >
                <Text style={styles.cancelButtonText}>Plus tard</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
  combinedStatsCard: {
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: width < 375 ? 12 : 16,
    borderWidth: 1,
    borderColor: '#21262D',
    flexDirection: 'row',
    alignItems: 'center',
    gap: width < 375 ? 12 : 16,
  },
  caloriesSection: {
    alignItems: 'center',
    minWidth: width < 375 ? 120 : 130,
  },
  circularGauge: {
    width: width < 375 ? 90 : 100,
    height: width < 375 ? 90 : 100,
    borderRadius: width < 375 ? 45 : 50,
    borderWidth: 6,
    borderColor: '#21262D',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 8,
  },
  circularGaugeFill: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: width < 375 ? 45 : 50,
    borderWidth: 6,
    borderColor: 'transparent',
    borderTopColor: '#1F6FEB',
  },
  circularGaugeInner: {
    alignItems: 'center',
  },
  caloriesValue: {
    fontSize: width < 375 ? 18 : 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    lineHeight: width < 375 ? 20 : 22,
  },
  caloriesTarget: {
    fontSize: width < 375 ? 11 : 12,
    color: '#8B949E',
    lineHeight: width < 375 ? 13 : 14,
  },
  caloriesLabel: {
    fontSize: width < 375 ? 10 : 11,
    color: '#8B949E',
    marginTop: 1,
  },
  caloriesSubtext: {
    fontSize: width < 375 ? 9 : 10,
    color: '#8B949E',
    textAlign: 'center',
  },
  macrosSection: {
    flex: 1,
    gap: width < 375 ? 8 : 10,
  },
  macroItem: {
    backgroundColor: '#161B22',
    borderRadius: 6,
    padding: width < 375 ? 8 : 10,
    borderWidth: 1,
    borderColor: '#21262D',
  },
  macroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  macroLabel: {
    fontSize: width < 375 ? 10 : 11,
    color: '#8B949E',
    fontWeight: '500',
  },
  macroValue: {
    fontSize: width < 375 ? 10 : 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  progressBar: {
    height: width < 375 ? 3 : 4,
    backgroundColor: '#21262D',
    borderRadius: width < 375 ? 1.5 : 2,
    overflow: 'hidden',
    width: '100%',
  },
  progressFill: {
    height: '100%',
    borderRadius: width < 375 ? 2 : 2.5,
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
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: width < 375 ? 20 : 24,
    width: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: width < 375 ? 18 : 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  closeButton: {
    backgroundColor: '#21262D',
    borderRadius: 12,
    width: width < 375 ? 24 : 28,
    height: width < 375 ? 24 : 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: width < 375 ? 14 : 16,
    color: '#8B949E',
    fontWeight: 'bold',
  },
  modalDescription: {
    fontSize: width < 375 ? 14 : 16,
    color: '#8B949E',
    marginBottom: 20,
  },
  benefitsList: {
    marginBottom: 20,
  },
  benefitItem: {
    fontSize: width < 375 ? 14 : 16,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subscribeButton: {
    backgroundColor: '#1F6FEB',
    paddingVertical: width < 375 ? 12 : 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  subscribeButtonText: {
    fontSize: width < 375 ? 14 : 16,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  cancelButton: {
    paddingVertical: width < 375 ? 12 : 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: width < 375 ? 14 : 16,
    color: '#8B949E',
  },
});