
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView, 
  Dimensions,
  Alert 
} from 'react-native';
import { useRouter } from 'expo-router';
import { getCurrentUser } from '@/utils/auth';

const { width } = Dimensions.get('window');

export default function AccueilScreen() {
  const router = useRouter();
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
    } catch (error) {
      console.error('Erreur chargement utilisateur:', error);
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
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>
            Bonjour, {user?.firstName || 'Utilisateur'}
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

      {/* Bottom Navigation Placeholder */}
      <View style={styles.bottomNavPlaceholder} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#888888',
    lineHeight: 22,
  },
  date: {
    fontSize: 14,
    color: '#CCCCCC',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  cardsContainer: {
    paddingHorizontal: 20,
    gap: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    flex: 1,
  },
  caloriesCard: {
    backgroundColor: '#1A1A1A',
  },
  trainingCard: {
    backgroundColor: '#1A1A1A',
  },
  cardTitle: {
    fontSize: 12,
    color: '#888888',
    marginBottom: 12,
  },
  cardValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  cardLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 2,
  },
  cardSubLabel: {
    fontSize: 12,
    color: '#888888',
  },
  stepsCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
  },
  stepsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
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
    marginBottom: 8,
  },
  stepsValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  stepsGoal: {
    fontSize: 16,
    color: '#888888',
    marginLeft: 8,
  },
  stepsObjective: {
    fontSize: 14,
    color: '#888888',
    marginBottom: 16,
  },
  addStepsButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  addStepsButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  sleepCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
  },
  sleepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
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
    fontSize: 14,
    color: '#888888',
    marginBottom: 8,
  },
  sleepTime: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  sleepDuration: {
    fontSize: 14,
    color: '#888888',
    marginBottom: 8,
  },
  sleepLabel: {
    fontSize: 14,
    color: '#888888',
  },
  bottomNavPlaceholder: {
    height: 80,
  },
});
