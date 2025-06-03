
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';

export default function EntrainementScreen() {
  const [selectedTab, setSelectedTab] = useState('À venir');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Entraînement</Text>
          <Text style={styles.weekInfo}>Cette semaine</Text>
          <Text style={styles.dateRange}>2 juin - 8 juin</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>0 / 6</Text>
            <Text style={styles.statLabel}>Séances</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Calories</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>0%</Text>
            <Text style={styles.statLabel}>Objectif</Text>
          </View>
        </View>

        <View style={styles.progressContainer}>
          <Text style={styles.progressLabel}>Progression</Text>
          <Text style={styles.progressSubtext}>0/6 séances (0 %)</Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity 
            style={[styles.tab, selectedTab === 'À venir' && styles.activeTab]}
            onPress={() => setSelectedTab('À venir')}
          >
            <Text style={[styles.tabText, selectedTab === 'À venir' && styles.activeTabText]}>
              À venir
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, selectedTab === 'Terminés' && styles.activeTab]}
            onPress={() => setSelectedTab('Terminés')}
          >
            <Text style={[styles.tabText, selectedTab === 'Terminés' && styles.activeTabText]}>
              Terminés
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, selectedTab === 'Programmes' && styles.activeTab]}
            onPress={() => setSelectedTab('Programmes')}
          >
            <Text style={[styles.tabText, selectedTab === 'Programmes' && styles.activeTabText]}>
              Programmes
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.contentContainer}>
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Text style={styles.emptyIconText}>🏋️‍♂️</Text>
            </View>
            <Text style={styles.emptyTitle}>Semaine 23 - 2 juin - 8 juin</Text>
            <Text style={styles.emptyMessage}>
              Aucun entraînement prévu cette semaine
            </Text>
            <Text style={styles.emptySubmessage}>
              Utilisez les onglets pour parcourir votre programmation
              ou ajoutez un nouvel entraînement
            </Text>
            <TouchableOpacity style={styles.addWorkoutButton}>
              <Text style={styles.addWorkoutText}>Accéder au programme</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab}>
        <Text style={styles.fabText}>Ajouter</Text>
      </TouchableOpacity>
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
    padding: 20,
    paddingTop: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  weekInfo: {
    fontSize: 16,
    color: '#8B949E',
    marginBottom: 2,
  },
  dateRange: {
    fontSize: 14,
    color: '#8B949E',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 15,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#21262D',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#8B949E',
  },
  progressContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  progressLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  progressSubtext: {
    fontSize: 14,
    color: '#8B949E',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 4,
    backgroundColor: '#161B22',
    borderWidth: 1,
    borderColor: '#21262D',
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#1F6FEB',
    borderColor: '#1F6FEB',
  },
  tabText: {
    fontSize: 14,
    color: '#8B949E',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  emptyState: {
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: 40,
    borderWidth: 1,
    borderColor: '#21262D',
    alignItems: 'center',
    marginTop: 40,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#21262D',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyIconText: {
    fontSize: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 16,
    color: '#8B949E',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubmessage: {
    fontSize: 14,
    color: '#8B949E',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  addWorkoutButton: {
    backgroundColor: '#F5A623',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  addWorkoutText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#F5A623',
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  fabText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '600',
  },
});
