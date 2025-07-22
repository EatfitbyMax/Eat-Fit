
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { register } from '@/utils/auth';
import { useRegistration } from '@/context/RegistrationContext';

export default function RegisterAccountScreen() {
  const router = useRouter();
  const { registrationData, updateRegistrationData, resetRegistrationData } = useRegistration();
  const [email, setEmail] = useState(registrationData.email);
  const [password, setPassword] = useState(registrationData.password);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleFinish = async () => {
    if (email.trim() && password.trim() && password === confirmPassword) {
      try {
        console.log('🔧 Validation données inscription:', {
          email: email.trim(),
          passwordLength: password.length,
          passwordType: typeof password,
          firstName: registrationData.firstName,
          lastName: registrationData.lastName
        });

        // Mettre à jour les données d'inscription avec email/password
        updateRegistrationData({
          email: email.trim().toLowerCase(),
          password: password.trim(),
        });

        // Créer l'objet utilisateur complet avec toutes les informations
        const userData = {
          email: email.trim().toLowerCase(),
          password: password.trim(),
          name: `${registrationData.firstName} ${registrationData.lastName}`,
          firstName: registrationData.firstName,
          lastName: registrationData.lastName,
          goals: registrationData.goals,
          gender: registrationData.gender,
          age: parseInt(registrationData.age),
          height: parseInt(registrationData.height),
          weight: parseInt(registrationData.weight),
          activityLevel: registrationData.activityLevel,
          userType: 'client' as const,
        };

        console.log('📋 Données utilisateur préparées:', {
          ...userData,
          password: '***'
        });

        // Créer le compte avec toutes les informations
        const user = await register(userData);
        
        if (user) {
          // Réinitialiser les données d'inscription
          resetRegistrationData();
          
          Alert.alert(
            'Compte créé !',
            'Votre compte client a été créé avec succès.',
            [
              {
                text: 'OK',
                onPress: () => router.replace('/(client)')
              }
            ]
          );
        } else {
          Alert.alert(
            'Erreur',
            'Cet email est déjà utilisé.'
          );
        }
      } catch (error) {
        Alert.alert(
          'Erreur',
          'Une erreur est survenue lors de la création du compte.'
        );
        console.error('Erreur création compte:', error);
      }
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
          <View style={[styles.progressStep, styles.activeStep]} />
        </View>
      </View>

      <Text style={styles.title}>Votre compte</Text>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#666666"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Mot de passe"
            placeholderTextColor="#666666"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity 
            style={styles.eyeButton}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Text style={styles.inputIcon}>{showPassword ? '🙈' : '👁'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Confirmer le mot de passe"
            placeholderTextColor="#666666"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPassword}
          />
          <TouchableOpacity 
            style={styles.eyeButton}
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            <Text style={styles.inputIcon}>{showConfirmPassword ? '🙈' : '👁'}</Text>
          </TouchableOpacity>
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
            (!email.trim() || !password.trim() || password !== confirmPassword) && styles.disabledButton
          ]}
          onPress={handleFinish}
          disabled={!email.trim() || !password.trim() || password !== confirmPassword}
        >
          <Text style={styles.nextButtonText}>Créer le compte</Text>
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
    gap: 6,
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
    borderColor: '#F5A623',
    shadowColor: '#F5A623',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
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
  eyeButton: {
    position: 'absolute',
    right: 16,
    top: 16,
    padding: 4,
  },
  inputIcon: {
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
