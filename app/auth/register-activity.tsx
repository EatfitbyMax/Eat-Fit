import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useRegistration } from '@/context/RegistrationContext';

export default function RegisterActivityScreen() {
  const router = useRouter();
  const { registrationData, updateRegistrationData } = useRegistration();
  const [selectedActivity, setSelectedActivity] = useState(registrationData.activityLevel);

  const activityLevels = [
    { id: 'sedentaire', label: 'Sédentaire', description: 'Peu ou pas d\'exercice' },
    { id: 'leger', label: 'Légèrement actif', description: 'Exercice léger 1-3 jours/semaine' },
    { id: 'modere', label: 'Modérément actif', description: 'Exercice modéré 3-5 jours/semaine' },
    { id: 'actif', label: 'Très actif', description: 'Exercice intense 6-7 jours/semaine' },
    { id: 'extreme', label: 'Extrêmement actif', description: 'Exercice très intense, travail physique' },
  ];

  const handleNext = () => {
    if (selectedActivity) {
      updateRegistrationData({ activityLevel: selectedActivity });
      router.push('/auth/register-account');
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
          <View style={[styles.progressStep, styles.activeStep]} />
          <View style={[styles.progressStep, styles.activeStep]} />
          <View style={[styles.progressStep, styles.activeStep]} />
          <View style={styles.progressStep} />
        </View>
      </View>

      <Text style={styles.title}>Activité physique</Text>

      <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
        {activityLevels.map((level) => (
          <TouchableOpacity
            key={level.id}
            style={[
              styles.activityButton,
              selectedActivity === level.id && styles.selectedActivity
            ]}
            onPress={() => setSelectedActivity(level.id)}
          >
            <Text style={[
              styles.activityLabel,
              selectedActivity === level.id && styles.selectedActivityText
            ]}>
              {level.label}
            </Text>
            <Text style={[
              styles.activityDescription,
              selectedActivity === level.id && styles.selectedActivityDescription
            ]}>
              {level.description}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.navigationContainer}>
        <TouchableOpacity 
          style={styles.backNavButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backNavText}>← Retour</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.nextButton, !selectedActivity && styles.disabledButton]}
          onPress={handleNext}
          disabled={!selectedActivity}
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
    width: 60,
    height: 4,
    backgroundColor: '#333333',
    borderRadius: 2,
  },
  activeStep: {
    backgroundColor: '#F5A623',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 40,
  },
  form: {
    flex: 1,
  },
  activityButton: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  selectedActivity: {
    backgroundColor: '#F5A623',
    borderColor: '#F5A623',
  },
  activityLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  selectedActivityText: {
    color: '#000000',
  },
  activityDescription: {
    fontSize: 14,
    color: '#888888',
  },
  selectedActivityDescription: {
    color: '#333333',
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 40,
    paddingTop: 20,
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