import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Dimensions, Modal, Alert } from 'react-native';
import FoodSearchModal from '@/components/FoodSearchModal';
import { FoodProduct, OpenFoodFactsService, FoodEntry } from '@/utils/openfoodfacts';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentUser } from '@/utils/auth';

const { width } = Dimensions.get('window');

function NutritionScreen() {
  const [selectedTab, setSelectedTab] = useState('Journal');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [hasNutritionProgram, setHasNutritionProgram] = useState(false); // Assuming default is no access
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showFoodModal, setShowFoodModal] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState<string>('');
  const [foodEntries, setFoodEntries] = useState<FoodEntry[]>([]);
  const [dailyTotals, setDailyTotals] = useState({
    calories: 0,
    proteins: 0,
    carbohydrates: 0,
    fat: 0,
  });
  const [waterIntake, setWaterIntake] = useState(0); // en ml

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

  const handleAddFood = (mealType: string) => {
    setSelectedMealType(mealType);
    setShowFoodModal(true);
  };

  const handleFoodAdded = async (product: FoodProduct, quantity: number) => {
    try {
      const user = await getCurrentUser();
      if (!user) return;

      const nutrition = OpenFoodFactsService.calculateNutrition(product, quantity);
      const newEntry: FoodEntry = {
        id: Date.now().toString(),
        product,
        quantity,
        mealType: selectedMealType as any,
        date: selectedDate.toISOString().split('T')[0],
        ...nutrition,
      };

      const updatedEntries = [...foodEntries, newEntry];
      setFoodEntries(updatedEntries);

      // Sauvegarder localement
      await AsyncStorage.setItem(`food_entries_${user.id}`, JSON.stringify(updatedEntries));

      // Recalculer les totaux
      calculateDailyTotals(updatedEntries);

      setShowFoodModal(false);
      Alert.alert('Succès', `${product.name} ajouté à ${selectedMealType}`);
    } catch (error) {
      console.error('Erreur ajout aliment:', error);
      Alert.alert('Erreur', 'Impossible d\'ajouter l\'aliment');
    }
  };

  const calculateDailyTotals = (entries: FoodEntry[]) => {
    const dateString = selectedDate.toISOString().split('T')[0];
    const dayEntries = entries.filter(entry => entry.date === dateString);

    const totals = dayEntries.reduce(
      (acc, entry) => ({
        calories: acc.calories + entry.calories,
        proteins: acc.proteins + entry.proteins,
        carbohydrates: acc.carbohydrates + entry.carbohydrates,
        fat: acc.fat + entry.fat,
      }),
      { calories: 0, proteins: 0, carbohydrates: 0, fat: 0 }
    );

    setDailyTotals(totals);
  };

  const loadUserFoodData = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) return;

      const stored = await AsyncStorage.getItem(`food_entries_${user.id}`);
      if (stored) {
        const entries = JSON.parse(stored);
        setFoodEntries(entries);
        calculateDailyTotals(entries);
      }

      // Charger les données d'hydratation
      const waterStored = await AsyncStorage.getItem(`water_intake_${user.id}_${selectedDate.toISOString().split('T')[0]}`);
      if (waterStored) {
        setWaterIntake(parseInt(waterStored));
      } else {
        setWaterIntake(0);
      }
    } catch (error) {
      console.error('Erreur chargement données alimentaires:', error);
    }
  };

  const addWater = async (amount: number) => {
    try {
      const user = await getCurrentUser();
      if (!user) return;

      const newWaterIntake = waterIntake + amount;
      setWaterIntake(newWaterIntake);

      const dateKey = selectedDate.toISOString().split('T')[0];
      await AsyncStorage.setItem(`water_intake_${user.id}_${dateKey}`, newWaterIntake.toString());
    } catch (error) {
      console.error('Erreur ajout eau:', error);
    }
  };

  const resetWater = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) return;

      setWaterIntake(0);
      const dateKey = selectedDate.toISOString().split('T')[0];
      await AsyncStorage.setItem(`water_intake_${user.id}_${dateKey}`, '0');
    } catch (error) {
      console.error('Erreur reset eau:', error);
    }
  };

  const getMealEntries = (mealType: string) => {
    const dateString = selectedDate.toISOString().split('T')[0];
    return foodEntries.filter(entry => 
      entry.mealType === mealType && entry.date === dateString
    );
  };

  const removeFoodEntry = async (entryId: string) => {
    try {
      const user = await getCurrentUser();
      if (!user) return;

      const updatedEntries = foodEntries.filter(entry => entry.id !== entryId);
      setFoodEntries(updatedEntries);

      await AsyncStorage.setItem(`food_entries_${user.id}`, JSON.stringify(updatedEntries));
      calculateDailyTotals(updatedEntries);
    } catch (error) {
      console.error('Erreur suppression aliment:', error);
    }
  };

  // Charger les données au montage du composant
  React.useEffect(() => {
    loadUserFoodData();
  }, []);

  // Recalculer les totaux et charger l'hydratation quand la date change
  React.useEffect(() => {
    calculateDailyTotals(foodEntries);
    loadUserFoodData();
  }, [selectedDate]);

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
                <View style={[styles.circularGaugeFill, { 
                  transform: [{ rotate: `${(dailyTotals.calories / 2495) * 360}deg` }] 
                }]} />
                <View style={styles.circularGaugeInner}>
                  <Text style={styles.caloriesValue}>{dailyTotals.calories}</Text>
                  <Text style={styles.caloriesTarget}>/ 2495</Text>
                  <Text style={styles.caloriesLabel}>kcal</Text>
                </View>
              </View>
              <Text style={styles.caloriesSubtext}>
                {Math.max(0, 2495 - dailyTotals.calories)} kcal restantes
              </Text>
            </View>

            {/* Macros Progress Bars - Right Side */}
            <View style={styles.macrosSection}>
              {/* Protéines */}
              <View style={styles.macroItem}>
                <View style={styles.macroHeader}>
                  <Text style={styles.macroLabel}>Protéines</Text>
                  <Text style={styles.macroValue}>{Math.round(dailyTotals.proteins)}g / 125g</Text>
                </View>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { 
                    width: `${Math.min((dailyTotals.proteins / 125) * 100, 100)}%`, 
                    backgroundColor: '#FF6B6B' 
                  }]} />
                </View>
              </View>

              {/* Glucides */}
              <View style={styles.macroItem}>
                <View style={styles.macroHeader}>
                  <Text style={styles.macroLabel}>Glucides</Text>
                  <Text style={styles.macroValue}>{Math.round(dailyTotals.carbohydrates)}g / 312g</Text>
                </View>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { 
                    width: `${Math.min((dailyTotals.carbohydrates / 312) * 100, 100)}%`, 
                    backgroundColor: '#4ECDC4' 
                  }]} />
                </View>
              </View>

              {/* Lipides */}
              <View style={styles.macroItem}>
                <View style={styles.macroHeader}>
                  <Text style={styles.macroLabel}>Lipides</Text>
                  <Text style={styles.macroValue}>{Math.round(dailyTotals.fat)}g / 83g</Text>
                </View>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { 
                    width: `${Math.min((dailyTotals.fat / 83) * 100, 100)}%`, 
                    backgroundColor: '#FFE66D' 
                  }]} />
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
            <View style={styles.tabContent}>
              <Text style={[styles.tabText, selectedTab === 'Programme' && styles.activeTabText]}>
                Programme
              </Text>
              <Text style={[styles.crownIcon, selectedTab === 'Programme' && styles.activeCrownIcon]}>
                👑
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Hydratation */}
        <View style={styles.hydrationContainer}>
          <View style={styles.hydrationCard}>
            <View style={styles.hydrationHeader}>
              <Text style={styles.hydrationTitle}>💧 Hydratation</Text>
              <TouchableOpacity onPress={resetWater} style={styles.resetButton}>
                <Text style={styles.resetButtonText}>Reset</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.hydrationContent}>
              <View style={styles.waterProgress}>
                <View style={styles.waterProgressBar}>
                  <View style={[styles.waterProgressFill, { 
                    width: `${Math.min((waterIntake / 2000) * 100, 100)}%` 
                  }]} />
                </View>
                <Text style={styles.waterText}>
                  {waterIntake} ml / 2000 ml
                </Text>
              </View>

              <View style={styles.waterButtons}>
                <TouchableOpacity
                  style={styles.waterButton}
                  onPress={() => addWater(250)}
                >
                  <Text style={styles.waterButtonText}>+250ml</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.waterButton}
                  onPress={() => addWater(500)}
                >
                  <Text style={styles.waterButtonText}>+500ml</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.waterButton}
                  onPress={() => addWater(1000)}
                >
                  <Text style={styles.waterButtonText}>+1L</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Meals Section */}
        <View style={styles.mealsContainer}>
          {selectedTab === 'Journal' && (
            <>
              {['Petit-déjeuner', 'Déjeuner', 'Collation', 'Dîner'].map((mealType) => {
                const mealEntries = getMealEntries(mealType);
                const mealCalories = mealEntries.reduce((sum, entry) => sum + entry.calories, 0);

                return (
                  <View key={mealType} style={styles.mealCard}>
                    <View style={styles.mealHeader}>
                      <Text style={styles.mealTitle}>{mealType}</Text>
                      <TouchableOpacity style={styles.addButton}>
                        <Text style={styles.addButtonText}>{mealCalories} kcal</Text>
                      </TouchableOpacity>
                    </View>

                    {mealEntries.length === 0 ? (
                      <Text style={styles.mealEmpty}>Aucun aliment ajouté</Text>
                    ) : (
                      <View style={styles.foodList}>
                        {mealEntries.map((entry) => (
                          <View key={entry.id} style={styles.foodItem}>
                            <View style={styles.foodInfo}>
                              <Text style={styles.foodName}>{entry.product.name}</Text>
                              <Text style={styles.foodDetails}>
                                {entry.quantity}g • {entry.calories} kcal
                              </Text>
                            </View>
                            <TouchableOpacity
                              style={styles.removeButton}
                              onPress={() => removeFoodEntry(entry.id)}
                            >
                              <Text style={styles.removeButtonText}>×</Text>
                            </TouchableOpacity>
                          </View>
                        ))}
                      </View>
                    )}

                    <TouchableOpacity 
                      style={styles.addFoodButton}
                      onPress={() => handleAddFood(mealType)}
                    >
                      <Text style={styles.addFoodText}>+ Ajouter un aliment</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
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

        {/* Modal de recherche d'aliments */}
        <FoodSearchModal
          visible={showFoodModal}
          onClose={() => setShowFoodModal(false)}
          onAddFood={handleFoodAdded}
          mealType={selectedMealType}
        />
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
    fontSize: width < 375 ? 18 : 18,
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
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tabText: {
    fontSize: width < 375 ? 12 : 14,
    color: '#8B949E',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  crownIcon: {
    fontSize: width < 375 ? 12 : 14,
    opacity: 0.6,
  },
  activeCrownIcon: {
    opacity: 1,
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
  foodList: {
    marginBottom: 12,
  },
  foodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0D1117',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#21262D',
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    color: '#FFFFFF',
    fontSize: width < 375 ? 14 : 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  foodDetails: {
    color: '#8B949E',
    fontSize: width < 375 ? 12 : 14,
  },
  removeButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  hydrationContainer: {
    paddingHorizontal: width < 375 ? 12 : 16,
    paddingBottom: 16,
  },
  hydrationCard: {
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: width < 375 ? 14 : 18,
    borderWidth: 1,
    borderColor: '#21262D',
  },
  hydrationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  hydrationTitle: {
    fontSize: width < 375 ? 16 : 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  resetButton: {
    backgroundColor: '#21262D',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  resetButtonText: {
    fontSize: 12,
    color: '#8B949E',
  },
  hydrationContent: {
    gap: 16,
  },
  waterProgress: {
    alignItems: 'center',
  },
  waterProgressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#21262D',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  waterProgressFill: {
    height: '100%',
    backgroundColor: '#4ECDC4',
    borderRadius: 4,
  },
  waterText: {
    fontSize: width < 375 ? 14 : 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  waterButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  waterButton: {
    flex: 1,
    backgroundColor: '#4ECDC4',
    paddingVertical: width < 375 ? 10 : 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  waterButtonText: {
    color: '#FFFFFF',
    fontSize: width < 375 ? 12 : 14,
    fontWeight: '600',
  },
});

export default NutritionScreen;