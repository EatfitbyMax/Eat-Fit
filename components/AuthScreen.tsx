
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface AuthScreenProps {
  onSelectUserType: (userType: 'coach' | 'client') => void;
}

export default function AuthScreen({ onSelectUserType }: AuthScreenProps) {
  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <Text style={styles.title}>eatfitbymax</Text>
          <Text style={styles.subtitle}>Choisissez votre profil</Text>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.coachButton]}
              onPress={() => onSelectUserType('coach')}
            >
              <Text style={styles.coachButtonText}>👨‍💼 Coach</Text>
              <Text style={styles.buttonSubtext}>Gérer vos clients et programmes</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.clientButton]}
              onPress={() => onSelectUserType('client')}
            >
              <Text style={styles.clientButtonText}>🏃‍♂️ Client</Text>
              <Text style={styles.buttonSubtext}>Accéder à vos programmes</Text>
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
    paddingHorizontal: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 60,
    textAlign: 'center',
    opacity: 0.9,
  },
  buttonContainer: {
    width: '100%',
    gap: 20,
  },
  button: {
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  coachButton: {
    backgroundColor: '#FF6B6B',
  },
  clientButton: {
    backgroundColor: '#4ECDC4',
  },
  coachButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  clientButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  buttonSubtext: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    textAlign: 'center',
  },
});
