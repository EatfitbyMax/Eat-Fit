import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function AdminScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#0D1117', '#1F2937']}
        style={styles.gradient}
      >
        <ScrollView style={styles.content}>
          <Text style={styles.title}>👑 Administration</Text>
          <Text style={styles.subtitle}>Tableau de bord Coach</Text>

          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>15</Text>
              <Text style={styles.statLabel}>Clients actifs</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statNumber}>8</Text>
              <Text style={styles.statLabel}>Programmes créés</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statNumber}>42</Text>
              <Text style={styles.statLabel}>Séances cette semaine</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Activité récente</Text>
            <Text style={styles.activityText}>• Nouveau client inscrit: Marie D.</Text>
            <Text style={styles.activityText}>• Programme modifié: Prise de masse</Text>
            <Text style={styles.activityText}>• Séance complétée: Training legs</Text>
          </View>
        </ScrollView>
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
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    marginBottom: 30,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  statCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#10B981',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  section: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 20,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  activityText: {
    color: '#9CA3AF',
    fontSize: 14,
    marginBottom: 8,
  },
});