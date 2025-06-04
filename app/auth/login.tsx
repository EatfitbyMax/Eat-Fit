
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { login } from '@/utils/auth';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs.');
      return;
    }

    setIsLoading(true);

    try {
      const user = await login(email.trim().toLowerCase(), password);
      
      if (user) {
        // Rediriger selon le type d'utilisateur
        if (user.userType === 'coach') {
          router.replace('/(coach)');
        } else {
          router.replace('/(client)');
        }
      } else {
        Alert.alert(
          'Erreur de connexion',
          'Email ou mot de passe incorrect.'
        );
      }
    } catch (error) {
      console.error('Erreur connexion:', error);
      Alert.alert(
        'Erreur',
        'Une erreur est survenue lors de la connexion.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Text style={styles.logo}>🏋️‍♂️</Text>
        <Text style={styles.appName}>EatFitByMax</Text>
      </View>

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

        <TextInput
          style={styles.input}
          placeholder="Mot de passe"
          placeholderTextColor="#666666"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!isLoading}
        />

        <TouchableOpacity 
          style={[styles.loginButton, isLoading && styles.disabledButton]}
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#000000" size="small" />
          ) : (
            <Text style={styles.loginButtonText}>Se connecter</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => router.push('/auth/register')}
          disabled={isLoading}
        >
          <Text style={styles.registerText}>
            Pas de compte ? <Text style={styles.registerLink}>S'inscrire</Text>
          </Text>
        </TouchableOpacity>

        <View style={styles.testAccountsContainer}>
          <Text style={styles.testAccountsTitle}>Comptes de test :</Text>
          <Text style={styles.testAccount}>Coach: eatfitbymax@gmail.com</Text>
          <Text style={styles.testAccount}>Client: m.pacullmarquie@gmail.com</Text>
          <Text style={styles.testAccount}>Mot de passe: motdepasse123</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    paddingHorizontal: 40,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logo: {
    fontSize: 60,
    marginBottom: 20,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#F5A623',
  },
  form: {
    gap: 20,
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
  loginButton: {
    backgroundColor: '#F5A623',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  disabledButton: {
    backgroundColor: '#333333',
  },
  loginButtonText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '600',
  },
  registerText: {
    color: '#CCCCCC',
    textAlign: 'center',
    marginTop: 20,
  },
  registerLink: {
    color: '#F5A623',
    fontWeight: '600',
  },
  testAccountsContainer: {
    marginTop: 40,
    padding: 20,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  testAccountsTitle: {
    color: '#F5A623',
    fontWeight: '600',
    marginBottom: 10,
  },
  testAccount: {
    color: '#CCCCCC',
    fontSize: 12,
    marginBottom: 5,
  },
});
