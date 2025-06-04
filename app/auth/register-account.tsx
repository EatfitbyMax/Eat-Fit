
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { register } from '@/utils/auth';
import { debugSupabaseConfig } from '@/utils/debug';

export default function RegisterAccountScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Diagnostic Supabase au chargement
    debugSupabaseConfig();
  }, []);

  const handleFinish = async () => {
    if (!email.trim() || !password.trim() || password !== confirmPassword) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs correctement.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    setIsLoading(true);

    try {
      const userData = {
        email: email.trim().toLowerCase(),
        password: password,
        name: 'Nouvel utilisateur', // Vous pouvez récupérer le nom des étapes précédentes
        userType: 'client' as const
      };

      const user = await register(userData);
      
      if (user) {
        Alert.alert(
          'Compte créé !',
          'Votre compte a été créé avec succès. Vous pouvez maintenant vous connecter.',
          [
            {
              text: 'OK',
              onPress: () => router.replace('/auth/login')
            }
          ]
        );
      } else {
        Alert.alert(
          'Erreur',
          'Une erreur est survenue lors de la création du compte. Veuillez réessayer.'
        );
      }
    } catch (error: any) {
      console.error('Erreur création compte:', error);
      Alert.alert(
        'Erreur',
        error.message || 'Une erreur est survenue lors de la création du compte.'
      );
    } finally {
      setIsLoading(false);
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
          editable={!isLoading}
        />

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Mot de passe (min. 6 caractères)"
            placeholderTextColor="#666666"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!isLoading}
          />
          <Text style={styles.inputIcon}>👁</Text>
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Confirmer le mot de passe"
            placeholderTextColor="#666666"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            editable={!isLoading}
          />
          <Text style={styles.inputIcon}>👁</Text>
        </View>
      </View>

      <View style={styles.navigationContainer}>
        <TouchableOpacity 
          style={styles.backNavButton}
          onPress={() => router.back()}
          disabled={isLoading}
        >
          <Text style={styles.backNavText}>← Retour</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[
            styles.nextButton, 
            (!email.trim() || !password.trim() || password !== confirmPassword || isLoading) && styles.disabledButton
          ]}
          onPress={handleFinish}
          disabled={!email.trim() || !password.trim() || password !== confirmPassword || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#000000" size="small" />
          ) : (
            <Text style={styles.nextButtonText}>Créer le compte</Text>
          )}
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
    minWidth: 120,
    alignItems: 'center',
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
