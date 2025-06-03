
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';

export default function ClientsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Gestion des Clients</Text>
          <TouchableOpacity style={styles.addClientButton}>
            <Text style={styles.addClientButtonText}>+ Ajouter un client</Text>
          </TouchableOpacity>
        </View>

        {/* Mes clients Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mes clients</Text>
          
          <View style={styles.clientCard}>
            <View style={styles.clientHeader}>
              <View style={styles.clientAvatar}>
                <Text style={styles.clientAvatarText}>👤</Text>
              </View>
              <View style={styles.clientInfo}>
                <Text style={styles.clientName}>Maxandre Pacull-Marquié</Text>
                <Text style={styles.clientDetail}>Email: m.pacullmarquie@gmail.com</Text>
                <Text style={styles.clientDetail}>Age: 23 ans</Text>
                <Text style={styles.clientDetail}>Poids: 75 kg</Text>
                <Text style={styles.clientDetail}>Taille: 175 cm</Text>
              </View>
            </View>
            
            <View style={styles.programButtons}>
              <TouchableOpacity style={styles.programButton}>
                <Text style={styles.programButtonIcon}>📄</Text>
                <Text style={styles.programButtonText}>Programme nutrition</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.programButton}>
                <Text style={styles.programButtonIcon}>💪</Text>
                <Text style={styles.programButtonText}>Programme entrainement</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1117',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  addClientButton: {
    backgroundColor: '#F5A623',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  addClientButtonText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    margin: 20,
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  clientCard: {
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#21262D',
  },
  clientHeader: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  clientAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F5A623',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  clientAvatarText: {
    fontSize: 20,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  clientDetail: {
    fontSize: 12,
    color: '#8B949E',
    marginBottom: 2,
  },
  programButtons: {
    gap: 12,
  },
  programButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0D1117',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  programButtonIcon: {
    fontSize: 16,
    marginRight: 12,
  },
  programButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
});
