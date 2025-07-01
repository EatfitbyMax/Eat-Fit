
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { PersistentStorage } from '@/utils/storage';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir votre adresse email');
      return;
    }

    setLoading(true);
    try {
      // Récupérer les utilisateurs depuis le serveur VPS
      const users = await PersistentStorage.getUsers();
      
      // Normaliser l'email
      const normalizedEmail = email.toLowerCase().trim();
      
      // Vérifier si l'utilisateur existe
      const user = users.find((u: any) => u.email.toLowerCase().trim() === normalizedEmail);
      
      if (user) {
        // Générer un nouveau mot de passe temporaire
        const tempPassword = generateTempPassword();
        
        // Mettre à jour le mot de passe de l'utilisateur
        const updatedUsers = users.map((u: any) => 
          u.email.toLowerCase().trim() === normalizedEmail 
            ? { ...u, password: tempPassword, needsPasswordReset: true }
            : u
        );
        
        // Sauvegarder sur le serveur VPS
        await PersistentStorage.saveUsers(updatedUsers);
        
        Alert.alert(
          'Réinitialisation réussie',
          `Un nouveau mot de passe temporaire a été généré :\n\n${tempPassword}\n\nVeuillez le noter et le changer lors de votre prochaine connexion.`,
          [
            {
              text: 'OK',
              onPress: () => router.push('/auth/login')
            }
          ]
        );
      } else {
        Alert.alert('Erreur', 'Aucun compte trouvé avec cette adresse email');
      }
    } catch (error) {
      console.error('Erreur réinitialisation mot de passe:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de la réinitialisation');
    } finally {
      setLoading(false);
    }
  };

  const generateTempPassword = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 12; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>← Retour</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Mot de passe oublié</Text>
        <Text style={styles.subtitle}>
          Saisissez votre adresse email pour recevoir un nouveau mot de passe temporaire
        </Text>
        
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#666"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          
          <TouchableOpacity 
            style={[styles.button, loading && styles.buttonDisabled]} 
            onPress={handleResetPassword}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'}
            </Text>
          </TouchableOpacity>

          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>
              💡 Un nouveau mot de passe temporaire sera généré et affiché à l'écran.
              Notez-le bien car vous devrez le changer lors de votre prochaine connexion.
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1117',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  backButton: {
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  backText: {
    fontSize: 18,
    color: '#58A6FF',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#8B949E',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 22,
  },
  form: {
    gap: 20,
  },
  input: {
    backgroundColor: '#161B22',
    borderWidth: 1,
    borderColor: '#21262D',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF',
  },
  button: {
    backgroundColor: '#F5A623',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoContainer: {
    backgroundColor: '#161B22',
    borderWidth: 1,
    borderColor: '#21262D',
    borderRadius: 8,
    padding: 16,
    marginTop: 20,
  },
  infoText: {
    color: '#8B949E',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
});
