import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Dimensions, Alert, TextInput, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring } from 'react-native-reanimated';
import { checkSubscriptionStatus } from '@/utils/subscription';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PersistentStorage } from '@/utils/storage';

const { width } = Dimensions.get('window');

export default function ProgresScreen() {
  const [selectedTab, setSelectedTab] = useState('Mesures');
  const [isPremium, setIsPremium] = useState(false);
  const [selectedMeasurementTab, setSelectedMeasurementTab] = useState('Poids');
  const progressAnimation = useSharedValue(0);
  const [userData, setUserData] = useState<any>(null);
  const [weightData, setWeightData] = useState({
    startWeight: 0,
    currentWeight: 0,
    targetWeight: 0,
    lastWeightUpdate: null as string | null,
    weeklyUpdates: 0,
    lastWeekReset: null as string | null,
  });

  // Fonction pour formater le poids avec la précision appropriée
  const formatWeight = (weight: number) => {
    if (weight % 1 === 0) {
      return weight.toFixed(0); // Pas de décimales si c'est un nombre entier
    } else if ((weight * 10) % 1 === 0) {
      return weight.toFixed(1); // Une décimale si nécessaire
    } else {
      return weight.toFixed(2); // Deux décimales si nécessaire
    }
  };
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [tempWeight, setTempWeight] = useState('');
  const [tempTarget, setTempTarget] = useState('');

  useEffect(() => {
    loadUserData();
    
    // Vérifier le statut d'abonnement
    const checkPremiumStatus = async () => {
      const premiumStatus = await checkSubscriptionStatus();
      setIsPremium(premiumStatus);
    };
    
    checkPremiumStatus();
  }, []);

  const loadUserData = async () => {
    try {
      // Récupérer les données utilisateur
      const currentUserString = await AsyncStorage.getItem('currentUser');
      if (currentUserString) {
        const user = JSON.parse(currentUserString);
        setUserData(user);

        // Charger les données de poids
        const weightDataString = await AsyncStorage.getItem(`weight_data_${user.id}`);
        if (weightDataString) {
          const saved = JSON.parse(weightDataString);
          setWeightData(saved);
          // Calculer le pourcentage de progression
          if (saved.targetWeight && saved.startWeight) {
            const totalLoss = saved.startWeight - saved.targetWeight;
            const currentLoss = saved.startWeight - saved.currentWeight;
            const progress = Math.max(0, Math.min(1, currentLoss / totalLoss));
            progressAnimation.value = withSpring(progress);
          }
        } else {
          // Première utilisation - définir le poids de départ depuis l'inscription
          const initialData = {
            startWeight: user.weight || 0,
            currentWeight: user.weight || 0,
            targetWeight: 0,
            lastWeightUpdate: null,
            weeklyUpdates: 0,
            lastWeekReset: null,
          };
          setWeightData(initialData);
          // Demander de définir l'objectif si pas encore fait
          if (!initialData.targetWeight) {
            setTimeout(() => setShowTargetModal(true), 1000);
          }
        }
      }
    } catch (error) {
      console.error('Erreur chargement données utilisateur:', error);
    }
  };

  const saveWeightData = async (newData: any) => {
    try {
      if (userData) {
        await AsyncStorage.setItem(`weight_data_${userData.id}`, JSON.stringify(newData));
        setWeightData(newData);
      }
    } catch (error) {
      console.error('Erreur sauvegarde données poids:', error);
    }
  };

  const handleWeightUpdate = async () => {
    // Remplacer la virgule par un point pour la conversion
    const normalizedWeight = tempWeight.replace(',', '.');
    const weight = parseFloat(normalizedWeight);
    if (isNaN(weight) || weight <= 0) {
      Alert.alert('Erreur', 'Veuillez entrer un poids valide');
      return;
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const nowISO = now.toISOString();
    
    // Vérifier si on doit réinitialiser le compteur hebdomadaire
    const lastWeekReset = weightData.lastWeekReset ? new Date(weightData.lastWeekReset) : null;
    const daysSinceReset = lastWeekReset ? Math.floor((today.getTime() - lastWeekReset.getTime()) / (1000 * 60 * 60 * 24)) : 7;
    
    let newWeeklyUpdates = weightData.weeklyUpdates;
    let newLastWeekReset = weightData.lastWeekReset;
    
    // Si plus de 7 jours, réinitialiser le compteur
    if (daysSinceReset >= 7) {
      newWeeklyUpdates = 1;
      newLastWeekReset = today.toISOString();
    } else {
      newWeeklyUpdates = weightData.weeklyUpdates + 1;
    }

    const newData = {
      ...weightData,
      currentWeight: weight,
      lastWeightUpdate: nowISO,
      weeklyUpdates: newWeeklyUpdates,
      lastWeekReset: newLastWeekReset,
    };

    await saveWeightData(newData);
    
    // Mettre à jour l'animation de progression
    if (newData.targetWeight && newData.startWeight) {
      const totalLoss = newData.startWeight - newData.targetWeight;
      const currentLoss = newData.startWeight - newData.currentWeight;
      const progress = Math.max(0, Math.min(1, currentLoss / totalLoss));
      progressAnimation.value = withSpring(progress);
    }

    setTempWeight('');
    setShowWeightModal(false);
    Alert.alert('Succès', 'Votre poids a été mis à jour !');
  };

  const handleTargetUpdate = async () => {
    // Remplacer la virgule par un point pour la conversion
    const normalizedTarget = tempTarget.replace(',', '.');
    const target = parseFloat(normalizedTarget);
    if (isNaN(target) || target <= 0) {
      Alert.alert('Erreur', 'Veuillez entrer un objectif valide');
      return;
    }

    const newData = {
      ...weightData,
      targetWeight: target,
    };

    await saveWeightData(newData);
    
    // Mettre à jour l'animation de progression
    if (newData.currentWeight && newData.startWeight) {
      const totalLoss = newData.startWeight - newData.targetWeight;
      const currentLoss = newData.startWeight - newData.currentWeight;
      const progress = Math.max(0, Math.min(1, currentLoss / totalLoss));
      progressAnimation.value = withSpring(progress);
    }

    setTempTarget('');
    setShowTargetModal(false);
    Alert.alert('Succès', 'Votre objectif a été défini !');
  };

  const canUpdateWeight = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Si pas de dernière mise à jour, on peut toujours mettre à jour
    if (!weightData.lastWeightUpdate) return { canUpdate: true, reason: '' };
    
    // Vérifier si on doit réinitialiser le compteur hebdomadaire
    const lastWeekReset = weightData.lastWeekReset ? new Date(weightData.lastWeekReset) : null;
    const daysSinceReset = lastWeekReset ? Math.floor((today.getTime() - lastWeekReset.getTime()) / (1000 * 60 * 60 * 24)) : 7;
    
    // Si plus de 7 jours depuis le dernier reset, on peut remettre à jour
    if (daysSinceReset >= 7) {
      return { canUpdate: true, reason: '' };
    }
    
    // Sinon, vérifier si on a encore des mises à jour disponibles cette semaine
    if (weightData.weeklyUpdates < 7) {
      return { canUpdate: true, reason: '' };
    }
    
    return { 
      canUpdate: false, 
      reason: 'Vous avez atteint la limite de 7 mises à jour par semaine.' 
    };
  };

  const getWeightTrend = () => {
    if (!weightData.lastWeightUpdate) return { text: '', color: '#28A745' };
    
    const weightDiff = weightData.startWeight - weightData.currentWeight;
    if (weightDiff > 0) {
      return { 
        text: `↓ -${formatWeight(weightDiff)} kg depuis le début`,
        color: '#28A745' // Vert pour perte de poids
      };
    } else if (weightDiff < 0) {
      return { 
        text: `↑ +${formatWeight(Math.abs(weightDiff))} kg depuis le début`,
        color: '#DC3545' // Rouge pour prise de poids
      };
    }
    return { text: 'Aucun changement', color: '#8B949E' };
  };

  const animatedProgressStyle = useAnimatedStyle(() => {
    return {
      width: `${progressAnimation.value * 100}%`,
    };
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header sans gradient */}
        <View style={styles.header}>
          <Text style={styles.title}>Mes progrès</Text>
        </View>

        {/* Tabs with improved design */}
        <View style={styles.tabsContainer}>
          {['Mesures', 'Nutrition', 'Sport'].map((tab) => (
            <TouchableOpacity 
              key={tab}
              style={[styles.tab, selectedTab === tab && styles.activeTab]}
              onPress={() => setSelectedTab(tab)}
              activeOpacity={0.8}
            >
              {selectedTab === tab && (
                <LinearGradient
                  colors={['#F5A623', '#E8941A']}
                  style={styles.tabGradient}
                />
              )}
              <Text style={[styles.tabText, selectedTab === tab && styles.activeTabText]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Onglets de mesures */}
        {selectedTab === 'Mesures' && (
          <View style={styles.measurementTabsContainer}>
            <TouchableOpacity 
              style={[styles.measurementTab, selectedMeasurementTab === 'Poids' && styles.activeMeasurementTab]}
              onPress={() => setSelectedMeasurementTab('Poids')}
            >
              <Text style={[styles.measurementTabText, selectedMeasurementTab === 'Poids' && styles.activeMeasurementTabText]}>
                Poids
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.measurementTab, selectedMeasurementTab === 'Mensurations' && styles.activeMeasurementTab]}
              onPress={() => {
                if (!isPremium) {
                  Alert.alert(
                    'Fonctionnalité Premium',
                    'Le suivi des mensurations musculaires est réservé aux abonnés premium.',
                    [{ text: 'OK' }]
                  );
                  return;
                }
                setSelectedMeasurementTab('Mensurations');
              }}
            >
              <View style={styles.measurementTabContent}>
                <Text style={[styles.measurementTabText, selectedMeasurementTab === 'Mensurations' && styles.activeMeasurementTabText]}>
                  Mensurations
                </Text>
                {!isPremium && <Text style={styles.premiumBadge}>👑</Text>}
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Statistiques selon l'onglet sélectionné */}
        {selectedTab === 'Mesures' && selectedMeasurementTab === 'Poids' && (
          <View style={styles.statsContainer}>
            <TouchableOpacity 
              style={[styles.statCard, styles.currentWeightCard]}
              onPress={() => {
                const updateStatus = canUpdateWeight();
                if (updateStatus.canUpdate) {
                  setShowWeightModal(true);
                } else {
                  Alert.alert(
                    'Mise à jour limitée',
                    updateStatus.reason,
                    [{ text: 'OK' }]
                  );
                }
              }}
            >
              <View style={styles.statIcon}>
                <Text style={styles.iconText}>⚖️</Text>
              </View>
              <Text style={styles.statLabel}>Poids actuel</Text>
              <Text style={styles.statValue}>{formatWeight(weightData.currentWeight)} kg</Text>
              <Text style={styles.updateHint}>
                Appuyez pour mettre à jour
              </Text>
            </TouchableOpacity>

            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <Text style={styles.iconText}>🎯</Text>
              </View>
              <Text style={styles.statLabel}>Poids de départ</Text>
              <Text style={styles.statValue}>{formatWeight(weightData.startWeight)} kg</Text>
            </View>

            <TouchableOpacity 
              style={styles.statCard}
              onPress={() => setShowTargetModal(true)}
            >
              <View style={styles.statIcon}>
                <Text style={styles.iconText}>🏆</Text>
              </View>
              <Text style={styles.statLabel}>Objectif</Text>
              <Text style={styles.statValue}>
                {weightData.targetWeight ? `${formatWeight(weightData.targetWeight)} kg` : 'À définir'}
              </Text>
              {weightData.targetWeight > 0 && (
                <Text style={styles.statSubtext}>
                  {formatWeight(Math.abs(weightData.currentWeight - weightData.targetWeight))} kg restants
                </Text>
              )}
              <Text style={styles.updateHint}>Appuyez pour modifier</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Mensurations musculaires (Premium uniquement) */}
        {selectedTab === 'Mesures' && selectedMeasurementTab === 'Mensurations' && isPremium && (
          <View style={styles.measurementsContainer}>
            <View style={styles.measurementRow}>
              <View style={styles.measurementCard}>
                <View style={styles.statIcon}>
                  <Text style={styles.iconText}>💪</Text>
                </View>
                <Text style={styles.statLabel}>Biceps</Text>
                <Text style={styles.statValue}>35.2 cm</Text>
                <Text style={styles.statTrend}>↑ +0.5 cm</Text>
              </View>
              
              <View style={styles.measurementCard}>
                <View style={styles.statIcon}>
                  <Text style={styles.iconText}>🦵</Text>
                </View>
                <Text style={styles.statLabel}>Cuisses</Text>
                <Text style={styles.statValue}>58.1 cm</Text>
                <Text style={styles.statTrend}>↑ +1.2 cm</Text>
              </View>
            </View>

            <View style={styles.measurementRow}>
              <View style={styles.measurementCard}>
                <View style={styles.statIcon}>
                  <Text style={styles.iconText}>🫸</Text>
                </View>
                <Text style={styles.statLabel}>Pectoraux</Text>
                <Text style={styles.statValue}>102.5 cm</Text>
                <Text style={styles.statTrend}>↑ +0.8 cm</Text>
              </View>
              
              <View style={styles.measurementCard}>
                <View style={styles.statIcon}>
                  <Text style={styles.iconText}>🤏</Text>
                </View>
                <Text style={styles.statLabel}>Taille</Text>
                <Text style={styles.statValue}>82.3 cm</Text>
                <Text style={styles.statTrend}>↓ -1.5 cm</Text>
              </View>
            </View>

            <View style={styles.measurementRow}>
              <View style={styles.measurementCard}>
                <View style={styles.statIcon}>
                  <Text style={styles.iconText}>🦾</Text>
                </View>
                <Text style={styles.statLabel}>Avant-bras</Text>
                <Text style={styles.statValue}>28.4 cm</Text>
                <Text style={styles.statTrend}>↑ +0.3 cm</Text>
              </View>
              
              <View style={styles.measurementCard}>
                <View style={styles.statIcon}>
                  <Text style={styles.iconText}>🦵</Text>
                </View>
                <Text style={styles.statLabel}>Mollets</Text>
                <Text style={styles.statValue}>36.8 cm</Text>
                <Text style={styles.statTrend}>↑ +0.4 cm</Text>
              </View>
            </View>
          </View>
        )}

        {/* Progress Card - Affiché seulement pour le suivi du poids */}
        {selectedTab === 'Mesures' && selectedMeasurementTab === 'Poids' && weightData.targetWeight > 0 && (
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Progression vers l'objectif</Text>
            <Text style={styles.progressPercentage}>
              {Math.round(((weightData.startWeight - weightData.currentWeight) / (weightData.startWeight - weightData.targetWeight)) * 100)}%
            </Text>
          </View>

          <Text style={[styles.progressTrend, { color: getWeightTrend().color }]}>
            {getWeightTrend().text}
          </Text>

          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBackground}>
              <Animated.View style={[styles.progressBarFill, animatedProgressStyle]} />
            </View>
          </View>

          <View style={styles.progressLabels}>
            <Text style={styles.progressLabel}>{formatWeight(weightData.startWeight)} kg</Text>
            <Text style={styles.progressLabel}>{formatWeight(weightData.targetWeight)} kg</Text>
          </View>
        </View>
        )}

        {/* Enhanced Chart Section - Affiché seulement pour le suivi du poids */}
        {selectedTab === 'Mesures' && selectedMeasurementTab === 'Poids' && (
        <View style={styles.chartContainer}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Évolution du poids</Text>
            <View style={styles.chartPeriod}>
              <Text style={styles.chartPeriodText}>6 mois</Text>
            </View>
          </View>

          {/* Improved Chart */}
          <View style={styles.chartArea}>
            <View style={styles.yAxis}>
              <Text style={styles.yAxisLabel}>74</Text>
              <Text style={styles.yAxisLabel}>72</Text>
              <Text style={styles.yAxisLabel}>70</Text>
              <Text style={styles.yAxisLabel}>68</Text>
              <Text style={styles.yAxisLabel}>66</Text>
              <Text style={styles.yAxisLabel}>64</Text>
            </View>

            <View style={styles.chartContent}>
              {/* Grid */}
              <View style={styles.gridContainer}>
                {[...Array(6)].map((_, i) => (
                  <View key={i} style={styles.gridLine} />
                ))}
              </View>

              {/* Enhanced Weight Line with Gradient */}
              <LinearGradient
                colors={['rgba(245, 166, 35, 0.3)', 'rgba(245, 166, 35, 0.1)']}
                style={styles.weightLineGradient}
              />
              <View style={styles.weightLine} />

              {/* Data Points */}
              <View style={styles.dataPoints}>
                <View style={[styles.dataPoint, { left: '10%', top: '20%' }]} />
                <View style={[styles.dataPoint, { left: '30%', top: '35%' }]} />
                <View style={[styles.dataPoint, { left: '50%', top: '45%' }]} />
                <View style={[styles.dataPoint, { left: '70%', top: '55%' }]} />
                <View style={[styles.dataPoint, { left: '90%', top: '65%' }]} />
              </View>

              {/* X-axis labels */}
              <View style={styles.xAxis}>
                <Text style={styles.xAxisLabel}>Janv</Text>
                <Text style={styles.xAxisLabel}>Mars</Text>
                <Text style={styles.xAxisLabel}>Mai</Text>
                <Text style={styles.xAxisLabel}>Juil</Text>
                <Text style={styles.xAxisLabel}>Sept</Text>
                <Text style={styles.xAxisLabel}>Déc</Text>
              </View>
            </View>
          </View>
        </View>
        )}

        {/* Statistics Summary - Affiché seulement pour le suivi du poids */}
        {selectedTab === 'Mesures' && selectedMeasurementTab === 'Poids' && (
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>Résumé de la période</Text>
          <View style={styles.summaryStats}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>-4.3 kg</Text>
              <Text style={styles.summaryLabel}>Perte totale</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>0.7 kg</Text>
              <Text style={styles.summaryLabel}>Perte moyenne/mois</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>86%</Text>
              <Text style={styles.summaryLabel}>Régularité</Text>
            </View>
          </View>
        </View>
        )}

        {/* Enhanced User Info */}
        <LinearGradient
          colors={['#1A2332', '#161B22']}
          style={styles.userInfoContainer}
        >
          <View style={styles.userInfoHeader}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>MP</Text>
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userInfoText}>Maxandre Pacault-Marqué</Text>
              <Text style={styles.userInfoSubtext}>Maximum</Text>
              <View style={styles.badgeContainer}>
                <Text style={styles.badge}>🔥 Série de 7 jours</Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      </ScrollView>

      {/* Modal de mise à jour du poids */}
      <Modal
        visible={showWeightModal}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Mettre à jour votre poids</Text>
            <Text style={styles.modalSubtitle}>
              Dernière mise à jour : {weightData.lastWeightUpdate ? 
                new Date(weightData.lastWeightUpdate).toLocaleDateString('fr-FR') : 
                'Jamais'
              }
            </Text>
            <Text style={styles.modalUpdateInfo}>
              {7 - (weightData.weeklyUpdates || 0)} mises à jour restantes cette semaine
            </Text>
            
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.modalInput}
                value={tempWeight}
                onChangeText={setTempWeight}
                placeholder="Votre poids actuel en kg"
                placeholderTextColor="#8B949E"
                keyboardType="numeric"
                autoFocus
              />
              <Text style={styles.inputUnit}>kg</Text>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalButtonSecondary}
                onPress={() => {
                  setTempWeight('');
                  setShowWeightModal(false);
                }}
              >
                <Text style={styles.modalButtonSecondaryText}>Annuler</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.modalButtonPrimary}
                onPress={handleWeightUpdate}
              >
                <Text style={styles.modalButtonPrimaryText}>Confirmer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de définition de l'objectif */}
      <Modal
        visible={showTargetModal}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Définir votre objectif de poids</Text>
            <Text style={styles.modalSubtitle}>
              Poids actuel : {formatWeight(weightData.currentWeight)} kg
            </Text>
            
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.modalInput}
                value={tempTarget}
                onChangeText={setTempTarget}
                placeholder="Votre objectif en kg"
                placeholderTextColor="#8B949E"
                keyboardType="numeric"
                autoFocus
              />
              <Text style={styles.inputUnit}>kg</Text>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalButtonSecondary}
                onPress={() => {
                  setTempTarget('');
                  setShowTargetModal(false);
                }}
              >
                <Text style={styles.modalButtonSecondaryText}>Annuler</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.modalButtonPrimary}
                onPress={handleTargetUpdate}
              >
                <Text style={styles.modalButtonPrimaryText}>Confirmer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingTop: 10,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },

  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 25,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginHorizontal: 3,
    backgroundColor: '#161B22',
    borderWidth: 1,
    borderColor: '#21262D',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  activeTab: {
    borderColor: 'transparent',
    elevation: 4,
    shadowColor: '#F5A623',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  tabGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  tabText: {
    fontSize: 13,
    color: '#8B949E',
    fontWeight: '600',
    zIndex: 1,
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  
  measurementTabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 25,
    gap: 12,
  },
  measurementTab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#21262D',
    alignItems: 'center',
  },
  activeMeasurementTab: {
    backgroundColor: 'transparent',
    borderColor: '#F5A623',
  },
  measurementTabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  measurementTabText: {
    fontSize: 14,
    color: '#8B949E',
    fontWeight: '600',
  },
  activeMeasurementTabText: {
    color: '#FFFFFF',
  },
  premiumBadge: {
    fontSize: 12,
  },
  
  measurementsContainer: {
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  measurementRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  measurementCard: {
    flex: 1,
    backgroundColor: '#161B22',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#21262D',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 25,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#161B22',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#21262D',
    alignItems: 'center',
  },
  currentWeightCard: {
    borderColor: '#F5A623',
    borderWidth: 2,
  },
  statIcon: {
    width: 32,
    height: 32,
    backgroundColor: '#21262D',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconText: {
    fontSize: 16,
  },
  statLabel: {
    fontSize: 12,
    color: '#8B949E',
    marginBottom: 6,
    textAlign: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statTrend: {
    fontSize: 11,
    color: '#28A745',
    fontWeight: '600',
  },
  statSubtext: {
    fontSize: 11,
    color: '#8B949E',
  },
  progressCard: {
    marginHorizontal: 20,
    backgroundColor: '#161B22',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#21262D',
    marginBottom: 25,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  progressPercentage: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F5A623',
  },
  progressTrend: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  progressBarContainer: {
    marginBottom: 12,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#21262D',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#F5A623',
    borderRadius: 4,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    fontSize: 12,
    color: '#8B949E',
  },
  chartContainer: {
    margin: 20,
    backgroundColor: '#161B22',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#21262D',
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  chartPeriod: {
    backgroundColor: '#21262D',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  chartPeriodText: {
    fontSize: 12,
    color: '#8B949E',
    fontWeight: '500',
  },
  chartArea: {
    flexDirection: 'row',
    height: 200,
  },
  yAxis: {
    justifyContent: 'space-between',
    width: 35,
    paddingRight: 12,
  },
  yAxisLabel: {
    fontSize: 12,
    color: '#8B949E',
    textAlign: 'right',
  },
  chartContent: {
    flex: 1,
    position: 'relative',
  },
  gridContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 25,
    justifyContent: 'space-between',
  },
  gridLine: {
    height: 1,
    backgroundColor: '#21262D',
  },
  weightLineGradient: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    height: 120,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  weightLine: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#F5A623',
    borderRadius: 2,
  },
  dataPoints: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 25,
  },
  dataPoint: {
    position: 'absolute',
    width: 8,
    height: 8,
    backgroundColor: '#F5A623',
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  xAxis: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  xAxisLabel: {
    fontSize: 11,
    color: '#8B949E',
    fontWeight: '500',
  },
  summaryContainer: {
    marginHorizontal: 20,
    backgroundColor: '#161B22',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#21262D',
    marginBottom: 25,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F5A623',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#8B949E',
    textAlign: 'center',
  },
  userInfoContainer: {
    margin: 20,
    marginTop: 0,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#21262D',
    marginBottom: 100,
  },
  userInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 50,
    height: 50,
    backgroundColor: '#F5A623',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  userDetails: {
    flex: 1,
  },
  userInfoText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  userInfoSubtext: {
    fontSize: 14,
    color: '#8B949E',
    marginBottom: 8,
  },
  badgeContainer: {
    alignSelf: 'flex-start',
  },
  badge: {
    fontSize: 12,
    color: '#F5A623',
    backgroundColor: 'rgba(245, 166, 35, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    fontWeight: '500',
  },
  updateHint: {
    fontSize: 10,
    color: '#F5A623',
    marginTop: 4,
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: '#161B22',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#21262D',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#8B949E',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalUpdateInfo: {
    fontSize: 13,
    color: '#F5A623',
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '500',
  },
  inputContainer: {
    position: 'relative',
    marginBottom: 24,
  },
  modalInput: {
    backgroundColor: '#0D1117',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingRight: 50,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#21262D',
    textAlign: 'center',
  },
  inputUnit: {
    position: 'absolute',
    right: 16,
    top: 16,
    fontSize: 16,
    color: '#8B949E',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButtonSecondary: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#21262D',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalButtonSecondaryText: {
    color: '#8B949E',
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonPrimary: {
    flex: 1,
    backgroundColor: '#F5A623',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalButtonPrimaryText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
});