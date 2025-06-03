
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

export default function ProgrammesScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#FF6B6B', '#FF8E53']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Programmes</Text>
        <Text style={styles.headerSubtitle}>Gérez vos programmes d'entraînement</Text>
      </LinearGradient>
      
      <ScrollView style={styles.content}>
        <TouchableOpacity style={styles.addButton}>
          <Text style={styles.addButtonText}>+ Créer un nouveau programme</Text>
        </TouchableOpacity>
        
        <View style={styles.programCard}>
          <Text style={styles.programTitle}>Programme Force</Text>
          <Text style={styles.programDescription}>Programme de 12 semaines pour développer la force</Text>
          <Text style={styles.programClients}>5 clients assignés</Text>
        </View>
        
        <View style={styles.programCard}>
          <Text style={styles.programTitle}>Programme Cardio</Text>
          <Text style={styles.programDescription}>Programme de perte de poids sur 8 semaines</Text>
          <Text style={styles.programClients}>3 clients assignés</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    paddingVertical: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  addButton: {
    backgroundColor: '#FF6B6B',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  programCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  programTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3748',
    marginBottom: 8,
  },
  programDescription: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 10,
  },
  programClients: {
    fontSize: 12,
    color: '#FF6B6B',
    fontWeight: '600',
  },
});
