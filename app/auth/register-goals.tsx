
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useRegistration } from '@/context/RegistrationContext';

export default function RegisterGoalsScreen() {
  const router = useRouter();
  const { registrationData, updateRegistrationData } = useRegistration();
  const [selectedGoals, setSelectedGoals] = useState<string[]>(registrationData.goals);

  const goals = [
    'Perdre du poids',
    'Maintenir poids',
    'Prendre du poids',
    'Me muscler',
    'Planifier mes repas',
    'Gagner en performance'
  ];

  const toggleGoal = (goal: string) => {
    setSelectedGoals(prev => 
      prev.includes(goal) 
        ? prev.filter(g => g !== goal)
        : [...prev, goal]
    );
  };

  const handleNext = () => {
    if (selectedGoals.length > 0) {
      updateRegistrationData({ goals: selectedGoals });
      router.push('/auth/register-profile');
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Text style={styles.backText}>←</Text>
      </TouchableOpacity>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressStep, styles.activeStep]} />
          <View style={[styles.progressStep, styles.activeStep]} />
          <View style={styles.progressStep} />
          <View style={styles.progressStep} />
          <View style={styles.progressStep} />
          <View style={styles.progressStep} />
        </View>
      </View>

      <Text style={styles.title}>Objectifs</Text>

      <View style={styles.form}>
        {goals.map((goal) => (
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
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.navigationContainer}>
        <TouchableOpacity 
          style={styles.backNavButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backNavText}>← Retour</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.nextButton, selectedGoals.length === 0 && styles.disabledButton]}
          onPress={handleNext}
          disabled={selectedGoals.length === 0}
        >
          <Text style={styles.nextButtonText}>Suivant</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    paddingHorizontal: 40,
    paddingTop: 60,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 1,
  },
  backText: {
    color: '#FFFFFF',
    fontSize: 24,
  },
  progressContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 60,
  },
  progressBar: {
    flexDirection: 'row',
    gap: 8,
  },
  progressStep: {
    width: 40,
    height: 6,
    backgroundColor: '#2A2A2A',
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#404040',
  },
  activeStep: {
    backgroundColor: '#F5A623',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 60,
  },
  form: {
    gap: 16,
    flex: 1,
  },
  goalButton: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#333333',
  },
  selectedGoal: {
    backgroundColor: '#F5A623',
    borderColor: '#F5A623',
  },
  goalText: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '600',
  },
  selectedGoalText: {
    color: '#000000',
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 40,
  },
  backNavButton: {
    padding: 16,
  },
  backNavText: {
    color: '#CCCCCC',
    fontSize: 16,
  },
  nextButton: {
    backgroundColor: '#F5A623',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  disabledButton: {
    backgroundColor: '#333333',
  },
  nextButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
});
