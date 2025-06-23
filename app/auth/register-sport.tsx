
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useRegistration } from '@/context/RegistrationContext';

export default function RegisterSportScreen() {
  const router = useRouter();
  const { registrationData, updateRegistrationData } = useRegistration();
  const [selectedSport, setSelectedSport] = useState(registrationData.favoriteSport || '');

  const sports = [
    { id: 'musculation', name: 'Musculation', emoji: '💪', description: 'Force et développement musculaire' },
    { id: 'course', name: 'Course à pied', emoji: '🏃', description: 'Endurance cardiovasculaire' },
    { id: 'cyclisme', name: 'Cyclisme', emoji: '🚴', description: 'Endurance et jambes' },
    { id: 'natation', name: 'Natation', emoji: '🏊', description: 'Sport complet' },
    { id: 'yoga', name: 'Yoga', emoji: '🧘', description: 'Flexibilité et bien-être' },
    { id: 'boxe', name: 'Boxe/Arts martiaux', emoji: '🥊', description: 'Combat et cardio' },
    { id: 'tennis', name: 'Tennis', emoji: '🎾', description: 'Sport de raquette' },
    { id: 'football', name: 'Football', emoji: '⚽', description: 'Sport collectif' },
    { id: 'basketball', name: 'Basketball', emoji: '🏀', description: 'Sport collectif' },
    { id: 'escalade', name: 'Escalade', emoji: '🧗', description: 'Force et technique' },
    { id: 'crossfit', name: 'CrossFit', emoji: '🏋️', description: 'Entraînement fonctionnel' },
    { id: 'danse', name: 'Danse', emoji: '💃', description: 'Rythme et coordination' },
  ];

  const handleNext = () => {
    if (selectedSport) {
      updateRegistrationData({ favoriteSport: selectedSport });
      router.push('/auth/register-activity');
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
          <View style={styles.progressStep} />
          <View style={styles.progressStep} />
        </View>
      </View>

      <Text style={styles.title}>Sport favori</Text>
      <Text style={styles.subtitle}>Choisissez votre sport principal pour personnaliser vos entraînements</Text>

      <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
        {sports.map((sport) => (
          <TouchableOpacity
            key={sport.id}
            style={[
              styles.sportButton,
              selectedSport === sport.id && styles.selectedSport
            ]}
            onPress={() => setSelectedSport(sport.id)}
          >
            <View style={styles.sportContent}>
              <View style={styles.sportLeft}>
                <Text style={styles.sportEmoji}>{sport.emoji}</Text>
                <View style={styles.sportInfo}>
                  <Text style={[
                    styles.sportName,
                    selectedSport === sport.id && styles.selectedSportText
                  ]}>
                    {sport.name}
                  </Text>
                  <Text style={[
                    styles.sportDescription,
                    selectedSport === sport.id && styles.selectedSportDescription
                  ]}>
                    {sport.description}
                  </Text>
                </View>
              </View>
              {selectedSport === sport.id && (
                <Text style={styles.checkMark}>✓</Text>
              )}
            </View>
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
          style={[styles.nextButton, !selectedSport && styles.disabledButton]}
          onPress={handleNext}
          disabled={!selectedSport}
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
    marginBottom: 40,
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
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  form: {
    flex: 1,
  },
  sportButton: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  selectedSport: {
    backgroundColor: '#F5A623',
    borderColor: '#F5A623',
  },
  sportContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sportLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sportEmoji: {
    fontSize: 24,
    marginRight: 16,
  },
  sportInfo: {
    flex: 1,
  },
  sportName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  selectedSportText: {
    color: '#000000',
  },
  sportDescription: {
    fontSize: 12,
    color: '#888888',
  },
  selectedSportDescription: {
    color: '#333333',
  },
  checkMark: {
    fontSize: 18,
    color: '#000000',
    fontWeight: 'bold',
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
