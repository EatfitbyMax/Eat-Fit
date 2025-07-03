
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useRegistration } from '@/context/RegistrationContext';

export default function RegisterScreen() {
  const router = useRouter();
  const { registrationData, updateRegistrationData } = useRegistration();
  const [firstName, setFirstName] = useState(registrationData.firstName);
  const [lastName, setLastName] = useState(registrationData.lastName);

  const handleNext = () => {
    if (firstName.trim() && lastName.trim()) {
      updateRegistrationData({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });
      router.push('/auth/register-goals');
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
          <View style={styles.progressStep} />
          <View style={styles.progressStep} />
          <View style={styles.progressStep} />
          <View style={styles.progressStep} />
          <View style={styles.progressStep} />
        </View>
      </View>

      <Text style={styles.title}>Bienvenue</Text>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Prénom"
          placeholderTextColor="#666666"
          value={firstName}
          onChangeText={setFirstName}
        />

        <TextInput
          style={styles.input}
          placeholder="Nom"
          placeholderTextColor="#666666"
          value={lastName}
          onChangeText={setLastName}
        />
      </View>

      <View style={styles.navigationContainer}>
        <TouchableOpacity 
          style={styles.backNavButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backNavText}>← Retour</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.nextButton, (!firstName.trim() || !lastName.trim()) && styles.disabledButton]}
          onPress={handleNext}
          disabled={!firstName.trim() || !lastName.trim()}
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
    gap: 20,
    flex: 1,
  },
  input: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#333333',
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
