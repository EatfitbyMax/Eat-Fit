
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Dimensions, Alert, TextInput, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring } from 'react-native-reanimated';
import { checkSubscriptionStatus } from '@/utils/subscription';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PersistentStorage } from '@/utils/storage';

const { width } = Dimensions.get('window');

interface FormeData {
  sleep: {
    hours: number;
    quality: 'Excellent' | 'Bien' | 'Moyen' | 'Mauvais';
    bedTime: string;
    wakeTime: string;
  };
  stress: {
    level: number; // 1-10
    factors: string[];
    notes: string;
  };
  heartRate: {
    resting: number;
    variability: number;
  };
  rpe: {
    value: number; // 1-10
    workoutId?: string;
    notes: string;
  };
  date: string;
}

export default function FormeScreen() {
  const [isPremium, setIsPremium] = useState(false);
  const [selectedTab, setSelectedTab] = useState('Aujourd\'hui');
  const [userData, setUserData] = useState<any>(null);
  const [formeData, setFormeData] = useState<FormeData>({
    sleep: { hours: 0, quality: 'Moyen', bedTime: '', wakeTime: '' },
    stress: { level: 5, factors: [], notes: '' },
    heartRate: { resting: 0, variability: 0 },
    rpe: { value: 5, notes: '' },
    date: new Date().toISOString().split('T')[0]
  });
  const [weeklyData, setWeeklyData] = useState<FormeData[]>([]);
  const [formeScore, setFormeScore] = useState(76);

  // Modals state
  const [showSleepModal, setShowSleepModal] = useState(false);
  const [showStressModal, setShowStressModal] = useState(false);
  const [showHeartRateModal, setShowHeartRateModal] = useState(false);
  const [showRPEModal, setShowRPEModal] = useState(false);

  // Temporary form data
  const [tempSleep, setTempSleep] = useState({ hours: '', quality: 'Moyen', bedTime: '', wakeTime: '' });
  const [tempStress, setTempStress] = useState({ level: 5, factors: [], notes: '' });
  const [tempHeartRate, setTempHeartRate] = useState({ resting: '', variability: '' });
  const [tempRPE, setTempRPE] = useState({ value: 5, notes: '' });

  const stressFactors = [
    'Travail', 'Famille', 'Finances', 'Santé', 'Relations',
    'Transport', 'Sommeil', 'Alimentation', 'Exercice', 'Autre'
  ];

  useEffect(() => {
    loadUserData();
    loadFormeData();
  }, []);

  useEffect(() => {
    calculateFormeScore();
  }, [formeData]);

  const loadUserData = async () => {
    try {
      const currentUserString = await AsyncStorage.getItem('currentUser');
      if (currentUserString) {
        const user = JSON.parse(currentUserString);
        setUserData(user);
        
        // Vérifier le statut premium
        const subscription = await checkSubscriptionStatus();
        setIsPremium(subscription.planId !== 'free');
      }
    } catch (error) {
      console.error('Erreur chargement données utilisateur:', error);
    }
  };

  const loadFormeData = async () => {
    try {
      if (!userData) return;
      
      const today = new Date().toISOString().split('T')[0];
      const formeDataString = await AsyncStorage.getItem(`forme_data_${userData.id}_${today}`);
      
      if (formeDataString) {
        const savedData = JSON.parse(formeDataString);
        setFormeData(savedData);
      }

      // Charger les données de la semaine
      const weekData = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateString = date.toISOString().split('T')[0];
        
        const dayDataString = await AsyncStorage.getItem(`forme_data_${userData.id}_${dateString}`);
        if (dayDataString) {
          weekData.push(JSON.parse(dayDataString));
        } else {
          weekData.push({
            sleep: { hours: 0, quality: 'Moyen', bedTime: '', wakeTime: '' },
            stress: { level: 5, factors: [], notes: '' },
            heartRate: { resting: 0, variability: 0 },
            rpe: { value: 5, notes: '' },
            date: dateString
          });
        }
      }
      setWeeklyData(weekData);

    } catch (error) {
      console.error('Erreur chargement données forme:', error);
    }
  };

  const saveFormeData = async (newData: FormeData) => {
    try {
      if (!userData) return;
      
      await AsyncStorage.setItem(`forme_data_${userData.id}_${newData.date}`, JSON.stringify(newData));
      setFormeData(newData);
      
      // Essayer de sauvegarder sur le serveur
      try {
        // Implementation future pour le serveur VPS
      } catch (serverError) {
        console.warn('Impossible de sauvegarder sur le serveur:', serverError);
      }
    } catch (error) {
      console.error('Erreur sauvegarde données forme:', error);
    }
  };

  const calculateFormeScore = () => {
    let score = 0;
    let factors = 0;

    // Sommeil (30% du score)
    if (formeData.sleep.hours > 0) {
      const sleepScore = Math.min(100, (formeData.sleep.hours / 8) * 100);
      const qualityMultiplier = {
        'Excellent': 1.2,
        'Bien': 1.0,
        'Moyen': 0.8,
        'Mauvais': 0.6
      };
      score += sleepScore * qualityMultiplier[formeData.sleep.quality] * 0.3;
      factors++;
    }

    // Stress (25% du score) - inversé
    const stressScore = (10 - formeData.stress.level) * 10;
    score += stressScore * 0.25;
    factors++;

    // FC repos (25% du score) - Premium
    if (isPremium && formeData.heartRate.resting > 0) {
      const optimalResting = userData?.gender === 'Homme' ? 65 : 70;
      const diff = Math.abs(formeData.heartRate.resting - optimalResting);
      const hrScore = Math.max(0, 100 - (diff * 2));
      score += hrScore * 0.25;
      factors++;
    }

    // RPE (20% du score) - Premium
    if (isPremium && formeData.rpe.value > 0) {
      const rpeScore = (10 - formeData.rpe.value) * 10;
      score += rpeScore * 0.2;
      factors++;
    }

    if (factors === 0) {
      setFormeScore(50);
    } else {
      setFormeScore(Math.round(score / (factors * 0.01)));
    }
  };

  const handleSaveSleep = async () => {
    const hours = parseFloat(tempSleep.hours.replace(',', '.'));
    if (isNaN(hours) || hours < 0 || hours > 24) {
      Alert.alert('Erreur', 'Veuillez entrer un nombre d\'heures valide (0-24)');
      return;
    }

    const newData = {
      ...formeData,
      sleep: {
        hours: hours,
        quality: tempSleep.quality as 'Excellent' | 'Bien' | 'Moyen' | 'Mauvais',
        bedTime: tempSleep.bedTime,
        wakeTime: tempSleep.wakeTime
      }
    };

    await saveFormeData(newData);
    setShowSleepModal(false);
    setTempSleep({ hours: '', quality: 'Moyen', bedTime: '', wakeTime: '' });
    Alert.alert('Succès', 'Données de sommeil enregistrées !');
  };

  const handleSaveStress = async () => {
    const newData = {
      ...formeData,
      stress: {
        level: tempStress.level,
        factors: tempStress.factors,
        notes: tempStress.notes
      }
    };

    await saveFormeData(newData);
    setShowStressModal(false);
    setTempStress({ level: 5, factors: [], notes: '' });
    Alert.alert('Succès', 'Niveau de stress enregistré !');
  };

  const handleSaveHeartRate = async () => {
    if (!isPremium) {
      Alert.alert('Fonctionnalité Premium', 'Le suivi de la fréquence cardiaque est réservé aux abonnés premium.');
      return;
    }

    const resting = parseInt(tempHeartRate.resting);
    const variability = parseInt(tempHeartRate.variability);

    if (isNaN(resting) || resting < 30 || resting > 200) {
      Alert.alert('Erreur', 'Veuillez entrer une FC repos valide (30-200 bpm)');
      return;
    }

    if (isNaN(variability) || variability < 0 || variability > 200) {
      Alert.alert('Erreur', 'Veuillez entrer une variabilité FC valide (0-200 ms)');
      return;
    }

    const newData = {
      ...formeData,
      heartRate: {
        resting: resting,
        variability: variability
      }
    };

    await saveFormeData(newData);
    setShowHeartRateModal(false);
    setTempHeartRate({ resting: '', variability: '' });
    Alert.alert('Succès', 'Données de fréquence cardiaque enregistrées !');
  };

  const handleSaveRPE = async () => {
    if (!isPremium) {
      Alert.alert('Fonctionnalité Premium', 'Le suivi RPE est réservé aux abonnés premium.');
      return;
    }

    const newData = {
      ...formeData,
      rpe: {
        value: tempRPE.value,
        notes: tempRPE.notes
      }
    };

    await saveFormeData(newData);
    setShowRPEModal(false);
    setTempRPE({ value: 5, notes: '' });
    Alert.alert('Succès', 'RPE post-entraînement enregistré !');
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#28A745';
    if (score >= 60) return '#F5A623';
    return '#DC3545';
  };

  const getScoreStatus = (score: number) => {
    if (score >= 80) return 'Excellente forme';
    if (score >= 60) return 'Forme correcte';
    return 'Fatigue détectée';
  };

  const renderWeeklyChart = () => {
    const maxScore = Math.max(...weeklyData.map(d => calculateDayScore(d)), 100);
    
    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Évolution de la forme (7 jours)</Text>
        
        <View style={styles.chartArea}>
          <View style={styles.yAxis}>
            {['100', '80', '60', '40', '20', '0'].map((label, index) => (
              <Text key={index} style={styles.yAxisLabel}>{label}</Text>
            ))}
          </View>

          <View style={styles.chartContent}>
            <View style={styles.gridContainer}>
              {[...Array(6)].map((_, i) => (
                <View key={i} style={styles.gridLine} />
              ))}
            </View>

            <View style={styles.scorePoints}>
              {weeklyData.map((dayData, index) => {
                const dayScore = calculateDayScore(dayData);
                const height = (dayScore / 100) * 80;
                return (
                  <View key={index} style={styles.scorePointContainer}>
                    <View 
                      style={[
                        styles.scorePoint, 
                        { 
                          bottom: `${height}%`,
                          backgroundColor: getScoreColor(dayScore)
                        }
                      ]} 
                    />
                    <Text style={styles.dayLabel}>
                      {new Date(dayData.date).toLocaleDateString('fr-FR', { weekday: 'short' })}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      </View>
    );
  };

  const calculateDayScore = (dayData: FormeData) => {
    let score = 0;
    let factors = 0;

    if (dayData.sleep.hours > 0) {
      const sleepScore = Math.min(100, (dayData.sleep.hours / 8) * 100);
      const qualityMultiplier = {
        'Excellent': 1.2,
        'Bien': 1.0,
        'Moyen': 0.8,
        'Mauvais': 0.6
      };
      score += sleepScore * qualityMultiplier[dayData.sleep.quality] * 0.4;
      factors++;
    }

    const stressScore = (10 - dayData.stress.level) * 10;
    score += stressScore * 0.3;
    factors++;

    if (isPremium && dayData.heartRate.resting > 0) {
      const optimalResting = userData?.gender === 'Homme' ? 65 : 70;
      const diff = Math.abs(dayData.heartRate.resting - optimalResting);
      const hrScore = Math.max(0, 100 - (diff * 2));
      score += hrScore * 0.3;
      factors++;
    }

    return factors > 0 ? Math.round(score / (factors * 0.01)) : 50;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Ma Forme</Text>
          <Text style={styles.subtitle}>Score: {formeScore}/100</Text>
        </View>

        {/* Score principal */}
        <View style={styles.scoreCard}>
          <View style={styles.scoreCircle}>
            <LinearGradient
              colors={[getScoreColor(formeScore), getScoreColor(formeScore) + '80']}
              style={styles.scoreGradient}
            >
              <Text style={styles.scoreText}>{formeScore}</Text>
              <Text style={styles.scoreSubtext}>/ 100</Text>
            </LinearGradient>
          </View>
          <Text style={[styles.scoreStatus, { color: getScoreColor(formeScore) }]}>
            {getScoreStatus(formeScore)}
          </Text>
          <Text style={styles.scoreDescription}>
            Basé sur votre sommeil, stress{isPremium ? ', FC et RPE' : ''}
          </Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          {['Aujourd\'hui', 'Historique'].map((tab) => (
            <TouchableOpacity 
              key={tab}
              style={[styles.tab, selectedTab === tab && styles.activeTab]}
              onPress={() => setSelectedTab(tab)}
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

        {selectedTab === 'Aujourd\'hui' && (
          <View style={styles.todayContainer}>
            {/* Sommeil */}
            <TouchableOpacity 
              style={styles.metricCard}
              onPress={() => {
                setTempSleep({
                  hours: formeData.sleep.hours.toString(),
                  quality: formeData.sleep.quality,
                  bedTime: formeData.sleep.bedTime,
                  wakeTime: formeData.sleep.wakeTime
                });
                setShowSleepModal(true);
              }}
            >
              <View style={styles.metricIcon}>
                <Text style={styles.iconText}>😴</Text>
              </View>
              <View style={styles.metricInfo}>
                <Text style={styles.metricLabel}>Sommeil</Text>
                <Text style={styles.metricValue}>
                  {formeData.sleep.hours > 0 ? `${formeData.sleep.hours}h` : 'Non renseigné'}
                </Text>
                <Text style={styles.metricDetail}>
                  {formeData.sleep.quality}
                </Text>
              </View>
              <Text style={styles.updateHint}>Appuyez pour modifier</Text>
            </TouchableOpacity>

            {/* Stress */}
            <TouchableOpacity 
              style={styles.metricCard}
              onPress={() => {
                setTempStress({
                  level: formeData.stress.level,
                  factors: formeData.stress.factors,
                  notes: formeData.stress.notes
                });
                setShowStressModal(true);
              }}
            >
              <View style={styles.metricIcon}>
                <Text style={styles.iconText}>😤</Text>
              </View>
              <View style={styles.metricInfo}>
                <Text style={styles.metricLabel}>Niveau de stress</Text>
                <Text style={styles.metricValue}>{formeData.stress.level}/10</Text>
                <Text style={styles.metricDetail}>
                  {formeData.stress.level <= 3 ? 'Faible' : 
                   formeData.stress.level <= 6 ? 'Modéré' : 'Élevé'}
                </Text>
              </View>
              <Text style={styles.updateHint}>Appuyez pour modifier</Text>
            </TouchableOpacity>

            {/* FC Repos - Premium */}
            <TouchableOpacity 
              style={[styles.metricCard, !isPremium && styles.premiumCard]}
              onPress={() => {
                if (!isPremium) {
                  Alert.alert('Fonctionnalité Premium', 'Le suivi de la fréquence cardiaque est réservé aux abonnés premium.');
                  return;
                }
                setTempHeartRate({
                  resting: formeData.heartRate.resting.toString(),
                  variability: formeData.heartRate.variability.toString()
                });
                setShowHeartRateModal(true);
              }}
            >
              <View style={styles.metricIcon}>
                <Text style={styles.iconText}>❤️</Text>
              </View>
              <View style={styles.metricInfo}>
                <Text style={styles.metricLabel}>
                  FC Repos {!isPremium && '👑'}
                </Text>
                <Text style={styles.metricValue}>
                  {isPremium ? 
                    (formeData.heartRate.resting > 0 ? `${formeData.heartRate.resting} bpm` : 'Non renseigné') :
                    'Premium requis'
                  }
                </Text>
                {isPremium && formeData.heartRate.variability > 0 && (
                  <Text style={styles.metricDetail}>
                    Variabilité: {formeData.heartRate.variability}ms
                  </Text>
                )}
              </View>
              <Text style={styles.updateHint}>
                {isPremium ? 'Appuyez pour modifier' : 'Mise à niveau requise'}
              </Text>
            </TouchableOpacity>

            {/* RPE - Premium */}
            <TouchableOpacity 
              style={[styles.metricCard, !isPremium && styles.premiumCard]}
              onPress={() => {
                if (!isPremium) {
                  Alert.alert('Fonctionnalité Premium', 'Le suivi RPE est réservé aux abonnés premium.');
                  return;
                }
                setTempRPE({
                  value: formeData.rpe.value,
                  notes: formeData.rpe.notes
                });
                setShowRPEModal(true);
              }}
            >
              <View style={styles.metricIcon}>
                <Text style={styles.iconText}>💪</Text>
              </View>
              <View style={styles.metricInfo}>
                <Text style={styles.metricLabel}>
                  RPE Post-Entraînement {!isPremium && '👑'}
                </Text>
                <Text style={styles.metricValue}>
                  {isPremium ? `${formeData.rpe.value}/10` : 'Premium requis'}
                </Text>
                <Text style={styles.metricDetail}>
                  {isPremium ? 
                    (formeData.rpe.value <= 3 ? 'Très facile' :
                     formeData.rpe.value <= 5 ? 'Modéré' :
                     formeData.rpe.value <= 7 ? 'Difficile' : 'Très difficile') :
                    'Évaluation fatigue'
                  }
                </Text>
              </View>
              <Text style={styles.updateHint}>
                {isPremium ? 'Appuyez pour modifier' : 'Mise à niveau requise'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {selectedTab === 'Historique' && (
          <View style={styles.historyContainer}>
            {renderWeeklyChart()}
            
            {/* Recommandations */}
            <View style={styles.recommendationsCard}>
              <Text style={styles.recommendationsTitle}>💡 Recommandations</Text>
              
              {formeData.sleep.hours < 7 && (
                <Text style={styles.recommendation}>
                  • Essayez de dormir au moins 7-8h par nuit pour une meilleure récupération
                </Text>
              )}
              
              {formeData.stress.level > 6 && (
                <Text style={styles.recommendation}>
                  • Votre niveau de stress est élevé. Considérez des techniques de relaxation
                </Text>
              )}
              
              {isPremium && formeData.heartRate.resting > 80 && (
                <Text style={styles.recommendation}>
                  • Votre FC repos est élevée. Augmentez progressivement votre activité cardio
                </Text>
              )}
              
              {isPremium && formeData.rpe.value > 7 && (
                <Text style={styles.recommendation}>
                  • RPE élevé détecté. Prévoyez une récupération active ou un jour de repos
                </Text>
              )}
              
              {formeScore > 80 && (
                <Text style={styles.recommendation}>
                  • Excellente forme ! C'est le moment idéal pour un entraînement intensif
                </Text>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Modal Sommeil */}
      <Modal visible={showSleepModal} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Sommeil</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Heures de sommeil</Text>
              <TextInput
                style={styles.modalInput}
                value={tempSleep.hours}
                onChangeText={(text) => setTempSleep({...tempSleep, hours: text})}
                placeholder="7.5"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Qualité du sommeil</Text>
              <View style={styles.qualityButtons}>
                {['Excellent', 'Bien', 'Moyen', 'Mauvais'].map((quality) => (
                  <TouchableOpacity
                    key={quality}
                    style={[
                      styles.qualityButton,
                      tempSleep.quality === quality && styles.selectedQualityButton
                    ]}
                    onPress={() => setTempSleep({...tempSleep, quality})}
                  >
                    <Text style={[
                      styles.qualityButtonText,
                      tempSleep.quality === quality && styles.selectedQualityButtonText
                    ]}>
                      {quality}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalButtonSecondary}
                onPress={() => setShowSleepModal(false)}
              >
                <Text style={styles.modalButtonSecondaryText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalButtonPrimary}
                onPress={handleSaveSleep}
              >
                <Text style={styles.modalButtonPrimaryText}>Sauvegarder</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Stress */}
      <Modal visible={showStressModal} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Niveau de stress</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Niveau (1-10)</Text>
              <View style={styles.stressSlider}>
                {[...Array(10)].map((_, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[
                      styles.stressLevel,
                      tempStress.level === i + 1 && styles.selectedStressLevel
                    ]}
                    onPress={() => setTempStress({...tempStress, level: i + 1})}
                  >
                    <Text style={[
                      styles.stressLevelText,
                      tempStress.level === i + 1 && styles.selectedStressLevelText
                    ]}>
                      {i + 1}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Facteurs de stress</Text>
              <View style={styles.factorsGrid}>
                {stressFactors.map((factor) => (
                  <TouchableOpacity
                    key={factor}
                    style={[
                      styles.factorButton,
                      tempStress.factors.includes(factor) && styles.selectedFactorButton
                    ]}
                    onPress={() => {
                      const factors = tempStress.factors.includes(factor)
                        ? tempStress.factors.filter(f => f !== factor)
                        : [...tempStress.factors, factor];
                      setTempStress({...tempStress, factors});
                    }}
                  >
                    <Text style={[
                      styles.factorButtonText,
                      tempStress.factors.includes(factor) && styles.selectedFactorButtonText
                    ]}>
                      {factor}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalButtonSecondary}
                onPress={() => setShowStressModal(false)}
              >
                <Text style={styles.modalButtonSecondaryText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalButtonPrimary}
                onPress={handleSaveStress}
              >
                <Text style={styles.modalButtonPrimaryText}>Sauvegarder</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal FC */}
      <Modal visible={showHeartRateModal} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Fréquence Cardiaque</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>FC au repos (bpm)</Text>
              <TextInput
                style={styles.modalInput}
                value={tempHeartRate.resting}
                onChangeText={(text) => setTempHeartRate({...tempHeartRate, resting: text})}
                placeholder="65"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Variabilité FC (ms)</Text>
              <TextInput
                style={styles.modalInput}
                value={tempHeartRate.variability}
                onChangeText={(text) => setTempHeartRate({...tempHeartRate, variability: text})}
                placeholder="45"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalButtonSecondary}
                onPress={() => setShowHeartRateModal(false)}
              >
                <Text style={styles.modalButtonSecondaryText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalButtonPrimary}
                onPress={handleSaveHeartRate}
              >
                <Text style={styles.modalButtonPrimaryText}>Sauvegarder</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal RPE */}
      <Modal visible={showRPEModal} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>RPE Post-Entraînement</Text>
            <Text style={styles.modalSubtitle}>
              Évaluez la difficulté ressentie lors de votre dernier entraînement
            </Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Difficulté ressentie (1-10)</Text>
              <View style={styles.rpeSlider}>
                {[...Array(10)].map((_, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[
                      styles.rpeLevel,
                      tempRPE.value === i + 1 && styles.selectedRPELevel
                    ]}
                    onPress={() => setTempRPE({...tempRPE, value: i + 1})}
                  >
                    <Text style={[
                      styles.rpeLevelText,
                      tempRPE.value === i + 1 && styles.selectedRPELevelText
                    ]}>
                      {i + 1}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.rpeLabels}>
                <Text style={styles.rpeLabel}>Très facile</Text>
                <Text style={styles.rpeLabel}>Très difficile</Text>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Notes (optionnel)</Text>
              <TextInput
                style={[styles.modalInput, styles.notesInput]}
                value={tempRPE.notes}
                onChangeText={(text) => setTempRPE({...tempRPE, notes: text})}
                placeholder="Ressenti général, zones difficiles..."
                multiline={true}
                numberOfLines={3}
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalButtonSecondary}
                onPress={() => setShowRPEModal(false)}
              >
                <Text style={styles.modalButtonSecondaryText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalButtonPrimary}
                onPress={handleSaveRPE}
              >
                <Text style={styles.modalButtonPrimaryText}>Sauvegarder</Text>
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
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#8B949E',
  },
  scoreCard: {
    marginHorizontal: 20,
    backgroundColor: '#161B22',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#21262D',
    alignItems: 'center',
    marginBottom: 20,
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
    overflow: 'hidden',
  },
  scoreGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  scoreSubtext: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  scoreStatus: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  scoreDescription: {
    fontSize: 14,
    color: '#8B949E',
    textAlign: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 10,
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
  },
  tabGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  tabText: {
    fontSize: 14,
    color: '#8B949E',
    fontWeight: '600',
    zIndex: 1,
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  todayContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  metricCard: {
    backgroundColor: '#161B22',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#21262D',
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  premiumCard: {
    borderColor: '#F5A623',
    borderWidth: 1,
  },
  metricIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#21262D',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  iconText: {
    fontSize: 20,
  },
  metricInfo: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 14,
    color: '#8B949E',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  metricDetail: {
    fontSize: 12,
    color: '#8B949E',
  },
  updateHint: {
    fontSize: 10,
    color: '#F5A623',
    fontStyle: 'italic',
  },
  historyContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  chartContainer: {
    backgroundColor: '#161B22',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#21262D',
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  chartArea: {
    flexDirection: 'row',
    height: 200,
  },
  yAxis: {
    justifyContent: 'space-between',
    width: 40,
    paddingRight: 8,
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
    bottom: 0,
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  gridLine: {
    height: 1,
    backgroundColor: '#21262D',
  },
  scorePoints: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingBottom: 25,
    paddingHorizontal: 10,
  },
  scorePointContainer: {
    alignItems: 'center',
    flex: 1,
    height: '100%',
    position: 'relative',
  },
  scorePoint: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  dayLabel: {
    position: 'absolute',
    bottom: -20,
    fontSize: 11,
    color: '#8B949E',
    fontWeight: '500',
  },
  recommendationsCard: {
    backgroundColor: '#161B22',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#21262D',
  },
  recommendationsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  recommendation: {
    fontSize: 14,
    color: '#8B949E',
    lineHeight: 20,
    marginBottom: 8,
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
    maxHeight: '80%',
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
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 8,
    fontWeight: '500',
  },
  modalInput: {
    backgroundColor: '#0D1117',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#21262D',
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  qualityButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  qualityButton: {
    backgroundColor: '#21262D',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#30363D',
  },
  selectedQualityButton: {
    backgroundColor: '#F5A623',
    borderColor: '#F5A623',
  },
  qualityButtonText: {
    fontSize: 14,
    color: '#8B949E',
    fontWeight: '500',
  },
  selectedQualityButtonText: {
    color: '#000000',
  },
  stressSlider: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  stressLevel: {
    width: 32,
    height: 32,
    backgroundColor: '#21262D',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#30363D',
  },
  selectedStressLevel: {
    backgroundColor: '#F5A623',
    borderColor: '#F5A623',
  },
  stressLevelText: {
    fontSize: 14,
    color: '#8B949E',
    fontWeight: '600',
  },
  selectedStressLevelText: {
    color: '#000000',
  },
  factorsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  factorButton: {
    backgroundColor: '#21262D',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#30363D',
  },
  selectedFactorButton: {
    backgroundColor: '#F5A623',
    borderColor: '#F5A623',
  },
  factorButtonText: {
    fontSize: 12,
    color: '#8B949E',
    fontWeight: '500',
  },
  selectedFactorButtonText: {
    color: '#000000',
  },
  rpeSlider: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  rpeLevel: {
    width: 28,
    height: 28,
    backgroundColor: '#21262D',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#30363D',
  },
  selectedRPELevel: {
    backgroundColor: '#F5A623',
    borderColor: '#F5A623',
  },
  rpeLevelText: {
    fontSize: 12,
    color: '#8B949E',
    fontWeight: '600',
  },
  selectedRPELevelText: {
    color: '#000000',
  },
  rpeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rpeLabel: {
    fontSize: 12,
    color: '#8B949E',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButtonSecondary: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#21262D',
    borderRadius: 12,
    paddingVertical: 12,
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
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalButtonPrimaryText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
});
