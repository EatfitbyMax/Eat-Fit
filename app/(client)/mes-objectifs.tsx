
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { getCurrentUser } from '@/utils/auth';
import { PersistentStorage } from '@/utils/storage';

export default function MesObjectifsScreen() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [isEditing, setIsEditing] = useState(false);

  const availableGoals = [
    'Perdre du poids',
    'Maintenir poids',
    'Prendre du poids',
    'Me muscler',
    'Planifier mes repas',
    'Gagner en performance',
    'Améliorer ma santé',
    'Réduire le stress',
    'Mieux dormir'
  ];

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        setSelectedGoals(currentUser.goals || []);
      }
    } catch (error) {
      console.error('Erreur chargement utilisateur:', error);
    }
  };

  const toggleGoal = (goal: string) => {
    if (!isEditing) return;
    
    setSelectedGoals(prev => 
      prev.includes(goal) 
        ? prev.filter(g => g !== goal)
        : [...prev, goal]
    );
  };

  const handleSave = async () => {
    try {
      const users = await PersistentStorage.getUsers();
      const userIndex = users.findIndex(u => u.email === user.email);
      
      if (userIndex !== -1) {
        users[userIndex] = { ...users[userIndex], goals: selectedGoals };
        await PersistentStorage.saveUsers(users);
        await PersistentStorage.setCurrentUser(users[userIndex]);
        setUser(users[userIndex]);
        setIsEditing(false);
        Alert.alert('Succès', 'Objectifs mis à jour avec succès');
      }
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder les modifications');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Mes objectifs</Text>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => isEditing ? handleSave() : setIsEditing(true)}
          >
            <Text style={styles.editText}>{isEditing ? 'Sauvegarder' : 'Modifier'}</Text>
          </TouchableOpacity>
        </View>

        {/* Current Goals */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎯 Objectifs actuels</Text>
          {selectedGoals.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Aucun objectif défini</Text>
              <Text style={styles.emptySubtext}>Appuyez sur "Modifier" pour définir vos objectifs</Text>
            </View>
          ) : (
            <View style={styles.currentGoals}>
              {selectedGoals.map((goal, index) => (
                <View key={index} style={styles.currentGoalItem}>
                  <Text style={styles.currentGoalText}>• {goal}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Available Goals */}
        {isEditing && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📋 Objectifs disponibles</Text>
            <Text style={styles.sectionSubtitle}>Sélectionnez vos objectifs</Text>
            
            <View style={styles.goalsGrid}>
              {availableGoals.map((goal) => (
                <TouchableOpacity
                  key={goal}
                  style={[
                    styles.goalButton,
                    selectedGoals.includes(goal) && styles.selectedGoal
                  ]}
                  onPress={() => toggleGoal(goal)}
                >
                  <Text style={[
                    styles.goalText,
                    selectedGoals.includes(goal) && styles.selectedGoalText
                  ]}>
                    {goal}
                  </Text>
                  {selectedGoals.includes(goal) && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Progress Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📈 Suivi des progrès</Text>
          <View style={styles.progressCard}>
            <Text style={styles.progressTitle}>Objectifs définis</Text>
            <Text style={styles.progressValue}>{selectedGoals.length}/3 recommandés</Text>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${Math.min((selectedGoals.length / 3) * 100, 100)}%` }
                ]} 
              />
            </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#21262D',
  },
  backButton: {
    padding: 8,
  },
  backText: {
    fontSize: 24,
    color: '#FFFFFF',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  editButton: {
    padding: 8,
  },
  editText: {
    fontSize: 16,
    color: '#1F6FEB',
    fontWeight: '600',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#8B949E',
    marginBottom: 16,
  },
  emptyState: {
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#21262D',
  },
  emptyText: {
    fontSize: 16,
    color: '#8B949E',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6E7681',
    textAlign: 'center',
  },
  currentGoals: {
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#21262D',
  },
  currentGoalItem: {
    marginBottom: 8,
  },
  currentGoalText: {
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 24,
  },
  goalsGrid: {
    gap: 12,
  },
  goalButton: {
    backgroundColor: '#161B22',
    borderWidth: 1,
    borderColor: '#21262D',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedGoal: {
    backgroundColor: '#1F6FEB',
    borderColor: '#1F6FEB',
  },
  goalText: {
    fontSize: 16,
    color: '#FFFFFF',
    flex: 1,
  },
  selectedGoalText: {
    fontWeight: '600',
  },
  checkmark: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  progressCard: {
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#21262D',
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  progressValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F6FEB',
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#21262D',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#1F6FEB',
    borderRadius: 4,
  },
});
