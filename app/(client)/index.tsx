import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView, 
  Dimensions,
  Alert,
  Platform,
  StatusBar 
} from 'react-native';
import { useRouter } from 'expo-router';
import { getCurrentUser } from '@/utils/auth';
import { IntegrationsManager } from '@/utils/integrations';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

export default function AccueilScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState<any>(null);
  const [currentDate, setCurrentDate] = useState('');
  const [steps, setSteps] = useState(0);
  const [calories, setCalories] = useState(0);
  const [training, setTraining] = useState(0);
  const [fatigue, setFatigue] = useState(0);
  const [sleepTime, setSleepTime] = useState('0h 0min');

  useEffect(() => {
    loadUserData();
    updateDate();
  }, []);

  const loadUserData = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      
      if (currentUser) {
        // Charger les données synchronisées
        await loadSyncedData(currentUser.id);
      }
    } catch (error) {
      console.error('Erreur chargement utilisateur:', error);
    }
  };

  const loadSyncedData = async (userId: string) => {
    try {
      // Charger les données Apple Health
      const healthData = await IntegrationsManager.getHealthData(userId);
      if (healthData.length > 0) {
        const todayData = healthData[healthData.length - 1];
        setSteps(todayData.steps || 0);
        setCalories(todayData.calories || 0);
        if (todayData.sleep) {
          const hours = Math.floor(todayData.sleep.duration / 60);
          const minutes = todayData.sleep.duration % 60;
          setSleepTime(`${hours}h ${minutes}min`);
        }
      }

      // Charger les activités Strava
      const stravaActivities = await IntegrationsManager.getStravaActivities(userId);
      if (stravaActivities.length > 0) {
        // Calculer le niveau de fatigue basé sur les activités récentes
        const recentActivities = stravaActivities.filter(activity => {
          const activityDate = new Date(activity.date);
          const today = new Date();
          const diffTime = Math.abs(today.getTime() - activityDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return diffDays <= 7; // Activités de la semaine
        });
        
        const totalDuration = recentActivities.reduce((sum, activity) => sum + activity.duration, 0);
        const fatigueLevel = Math.min(Math.floor(totalDuration / 3600), 10); // Max 10
        setFatigue(fatigueLevel);
      }
    } catch (error) {
      console.error('Erreur chargement données synchronisées:', error);
    }
  };

  const updateDate = () => {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    };
    const dateStr = now.toLocaleDateString('fr-FR', options);
    setCurrentDate(dateStr);
  };

  const handleAddSteps = () => {
    Alert.prompt(
      'Ajouter des pas',
      'Combien de pas voulez-vous ajouter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Ajouter', 
          onPress: (value) => {
            const newSteps = parseInt(value || '0');
            if (!isNaN(newSteps)) {
              setSteps(prev => prev + newSteps);
            }
          }
        }
      ],
      'plain-text',
      '',
      'numeric'
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 } // Espace pour la tab bar
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>
            Bonjour, {user?.firstName || user?.name || 'Utilisateur'}
          </Text>
          <Text style={styles.subtitle}>
            Prêt à atteindre vos objectifs nutritionnels ?
          </Text>
        </View>

        {/* Date */}
        <Text style={styles.date}>{currentDate}</Text>

        {/* Cards Container */}
        <View style={styles.cardsContainer}>
          {/* Calories & Training Row */}
          <View style={styles.row}>
            <TouchableOpacity 
              style={[styles.card, styles.caloriesCard]}
              onPress={() => router.push('/(client)/nutrition')}
            >
              <Text style={styles.cardTitle}>Aujourd'hui (mardi 3 juin)</Text>
              <Text style={styles.cardValue}>{calories}</Text>
              <Text style={styles.cardLabel}>Calories</Text>
              <Text style={styles.cardSubLabel}>2695 kcal</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.card, styles.trainingCard]}
              onPress={() => router.push('/(client)/entrainement')}
            >
              <Text style={styles.cardTitle}>Entraînement</Text>
              <Text style={styles.cardValue}>{training}</Text>
              <Text style={styles.cardLabel}>Fatigue</Text>
            </TouchableOpacity>
          </View>

          {/* Progrès Section */}
          <View style={styles.progressSection}>
            <Text style={styles.progressTitle}>📊 Vos Progrès</Text>
            
            <View style={styles.progressRow}>
              <View style={styles.progressCard}>
                <Text style={styles.progressLabel}>Poids actuel</Text>
                <Text style={styles.progressValue}>68.5 kg</Text>
              </View>
              <View style={styles.progressCard}>
                <Text style={styles.progressLabel}>Objectif</Text>
                <Text style={styles.progressValue}>65.0 kg</Text>
                <Text style={styles.progressSubtext}>- 3.5 kg</Text>
              </View>
            </View>
          </View>

          {/* Steps Counter */}
          <TouchableOpacity 
            style={styles.stepsCard}
            onPress={handleAddSteps}
          >
            <View style={styles.stepsHeader}>
              <Text style={styles.stepsIcon}>💪</Text>
              <Text style={styles.stepsTitle}>Compteur de pas</Text>
            </View>
            <View style={styles.stepsContent}>
              <Text style={styles.stepsValue}>{steps}</Text>
              <Text style={styles.stepsGoal}>/ 10000 pas</Text>
            </View>
            <Text style={styles.stepsObjective}>Objectif</Text>
            <TouchableOpacity style={styles.addStepsButton} onPress={handleAddSteps}>
              <Text style={styles.addStepsButtonText}>Ajouter des pas</Text>
            </TouchableOpacity>
          </TouchableOpacity>

          {/* Sleep Tracking */}
          <TouchableOpacity 
            style={styles.sleepCard}
            onPress={() => router.push('/(client)/profil')}
          >
            <View style={styles.sleepHeader}>
              <Text style={styles.sleepIcon}>🌙</Text>
              <Text style={styles.sleepTitle}>Suivi du sommeil</Text>
            </View>
            <Text style={styles.sleepSubtitle}>Sommeil aujourd'hui</Text>
            <Text style={styles.sleepTime}>{sleepTime}</Text>
            <Text style={styles.sleepDuration}>0h 0min / 8h 0min</Text>
            <Text style={styles.sleepLabel}>Durée du sommeil</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
  },
  greeting: {
    fontSize: width < 375 ? 22 : 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: width < 375 ? 14 : 16,
    color: '#888888',
    lineHeight: 22,
  },
  date: {
    fontSize: 14,
    color: '#CCCCCC',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  cardsContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  card: {
    borderRadius: 16,
    padding: 14,
    flex: 1,
    minHeight: 120,
  },
  caloriesCard: {
    backgroundColor: '#1A1A1A',
  },
  trainingCard: {
    backgroundColor: '#1A1A1A',
  },
  cardTitle: {
    fontSize: 11,
    color: '#888888',
    marginBottom: 8,
    lineHeight: 14,
  },
  cardValue: {
    fontSize: width < 375 ? 28 : 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  cardLabel: {
    fontSize: 13,
    color: '#FFFFFF',
    marginBottom: 2,
  },
  cardSubLabel: {
    fontSize: 11,
    color: '#888888',
  },
  stepsCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 18,
  },
  stepsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  stepsIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  stepsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  stepsContent: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 6,
  },
  stepsValue: {
    fontSize: width < 375 ? 32 : 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  stepsGoal: {
    fontSize: 15,
    color: '#888888',
    marginLeft: 8,
  },
  stepsObjective: {
    fontSize: 13,
    color: '#888888',
    marginBottom: 14,
  },
  addStepsButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
  },
  addStepsButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  sleepCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 18,
  },
  sleepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sleepIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  sleepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  sleepSubtitle: {
    fontSize: 13,
    color: '#888888',
    marginBottom: 6,
  },
  sleepTime: {
    fontSize: width < 375 ? 22 : 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  sleepDuration: {
    fontSize: 13,
    color: '#888888',
    marginBottom: 6,
  },
  sleepLabel: {
    fontSize: 13,
    color: '#888888',
  },
  progressSection: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 18,
    marginTop: 12,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 14,
  },
  progressRow: {
    flexDirection: 'row',
    gap: 12,
  },
  progressCard: {
    flex: 1,
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 12,
    color: '#888888',
    marginBottom: 6,
  },
  progressValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  progressSubtext: {
    fontSize: 11,
    color: '#888888',
    marginTop: 2,
  },
});