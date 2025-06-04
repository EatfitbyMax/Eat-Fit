
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView,
  Alert 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/config/firebase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // La redirection se fera automatiquement via le _layout.tsx principal
    } catch (error: any) {
      console.error('Erreur de connexion:', error);
      Alert.alert('Erreur', 'Email ou mot de passe incorrect');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#0D1117', '#1F2937', '#374151']}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <Text style={styles.title}>👑</Text>
          <Text style={styles.brandText}>Eat Fit</Text>
          <Text style={styles.subtitle}>BY MAX</Text>
          <Text style={styles.tagline}>Connexion</Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#9CA3AF"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            
            <TextInput
              style={styles.input}
              placeholder="Mot de passe"
              placeholderTextColor="#9CA3AF"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity 
            style={[styles.loginButton, isLoading && styles.disabledButton]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            <Text style={styles.loginButtonText}>
              {isLoading ? 'Connexion...' : 'Se connecter'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.registerLink}
            onPress={() => router.push('/auth/register')}
          >
            <Text style={styles.registerText}>
              Pas encore de compte ? <Text style={styles.registerHighlight}>S'inscrire</Text>
            </Text>
          </TouchableOpacity>

          <View style={styles.testAccounts}>
            <Text style={styles.testTitle}>Comptes de test :</Text>
            <TouchableOpacity onPress={() => {
              setEmail('admin@eatfitbymax.com');
              setPassword('admin123');
            }}>
              <Text style={styles.testAccount}>👑 Coach: admin@eatfitbymax.com</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => {
              setEmail('m.pacullmarquie@gmail.com');
              setPassword('client123');
            }}>
              <Text style={styles.testAccount}>👤 Client: m.pacullmarquie@gmail.com</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  title: {
    fontSize: 60,
    marginBottom: 10,
  },
  brandText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    marginBottom: 10,
  },
  tagline: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 40,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 30,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    color: '#FFFFFF',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  loginButton: {
    backgroundColor: '#10B981',
    paddingVertical: 15,
    paddingHorizontal: 60,
    borderRadius: 25,
    marginBottom: 20,
    width: '100%',
  },
  disabledButton: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  registerLink: {
    marginBottom: 30,
  },
  registerText: {
    color: '#9CA3AF',
    fontSize: 16,
  },
  registerHighlight: {
    color: '#10B981',
    fontWeight: 'bold',
  },
  testAccounts: {
    alignItems: 'center',
  },
  testTitle: {
    color: '#9CA3AF',
    fontSize: 14,
    marginBottom: 10,
  },
  testAccount: {
    color: '#60A5FA',
    fontSize: 12,
    marginBottom: 5,
    textDecorationLine: 'underline',
  },
});
