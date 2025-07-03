
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useRegistration } from '@/context/RegistrationContext';

export default function RegisterProfileScreen() {
  const router = useRouter();
  const { registrationData, updateRegistrationData } = useRegistration();
  const [gender, setGender] = useState<'Homme' | 'Femme' | null>(registrationData.gender);
  const [age, setAge] = useState(registrationData.age);
  const [height, setHeight] = useState(registrationData.height);
  const [weight, setWeight] = useState(registrationData.weight);

  const handleNext = () => {
    if (gender && age.trim() && height.trim() && weight.trim()) {
      updateRegistrationData({
        gender,
        age: age.trim(),
        height: height.trim(),
        weight: weight.trim(),
      });
      router.push('/auth/register-sport');
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
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
          <View style={styles.progressStep} />
        </View>
      </View>

      <Text style={styles.title}>Vous</Text>

      <View style={styles.form}>
        <View style={styles.genderContainer}>
          <TouchableOpacity
            style={[
              styles.genderButton,
              gender === 'Homme' && styles.selectedGender
            ]}
            onPress={() => setGender('Homme')}
          >
            <Text style={[
              styles.genderText,
              gender === 'Homme' && styles.selectedGenderText
            ]}>Homme</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.genderButton,
              gender === 'Femme' && styles.selectedGender
            ]}
            onPress={() => setGender('Femme')}
          >
            <Text style={[
              styles.genderText,
              gender === 'Femme' && styles.selectedGenderText
            ]}>Femme</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Âge"
            placeholderTextColor="#666666"
            value={age}
            onChangeText={setAge}
            keyboardType="numeric"
          />
          <Text style={styles.inputIcon}>📅</Text>
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Taille (cm)"
            placeholderTextColor="#666666"
            value={height}
            onChangeText={setHeight}
            keyboardType="numeric"
          />
          <Text style={styles.inputIcon}>📏</Text>
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Poids (kg)"
            placeholderTextColor="#666666"
            value={weight}
            onChangeText={setWeight}
            keyboardType="numeric"
          />
          <Text style={styles.inputIcon}>⚖️</Text>
        </View>
      </View>

      <View style={styles.navigationContainer}>
        <TouchableOpacity 
          style={styles.backNavButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backNavText}>← Retour</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[
            styles.nextButton, 
            (!gender || !age.trim() || !height.trim() || !weight.trim()) && styles.disabledButton
          ]}
          onPress={handleNext}
          disabled={!gender || !age.trim() || !height.trim() || !weight.trim()}
        >
          <Text style={styles.nextButtonText}>Suivant</Text>
        </TouchableOpacity>
      </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 40,
    paddingTop: 60,
    paddingBottom: 40,
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
    width: 30,
    height: 4,
    backgroundColor: '#2A2A2A',
    borderRadius: 2,
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
    flex: 1,
    gap: 20,
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  genderButton: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
  },
  selectedGender: {
    backgroundColor: '#F5A623',
    borderColor: '#F5A623',
  },
  genderText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  selectedGenderText: {
    color: '#000000',
  },
  inputContainer: {
    position: 'relative',
  },
  input: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingRight: 50,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#333333',
  },
  inputIcon: {
    position: 'absolute',
    right: 16,
    top: 16,
    fontSize: 16,
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
