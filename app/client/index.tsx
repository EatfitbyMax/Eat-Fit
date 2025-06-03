
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

export default function ClientHomeScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.greeting}>
          <Text style={styles.greetingText}>Bonjour, Maxandre</Text>
          <Text style={styles.subtitle}>Resté motivé et gardez la bonne trace !</Text>
        </View>
        <TouchableOpacity style={styles.notificationButton}>
          <Text style={styles.notificationIcon}>🔔</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>🔥</Text>
          <Text style={styles.statLabel}>Calories</Text>
          <Text style={styles.statValue}>2490 kcal</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>💪</Text>
          <Text style={styles.statLabel}>Entrainement</Text>
          <Text style={styles.statValue}>1 séance</Text>
        </View>
      </View>

      <View style={styles.stepCounter}>
        <View style={styles.stepCircle}>
          <Text style={styles.stepCount}>0</Text>
          <Text style={styles.stepGoal}>/ 10000 pas</Text>
        </View>
        <View style={styles.stepInfo}>
          <Text style={styles.stepLabel}>Objectif</Text>
          <Text style={styles.stepPercentage}>0%</Text>
          <Text style={styles.stepFooter}>Ajouter des pas</Text>
        </View>
        <TouchableOpacity style={styles.addButton}>
          <Text style={styles.addButtonText}>Ajouter</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.sleepSection}>
        <View style={styles.sleepHeader}>
          <Text style={styles.sleepIcon}>😴</Text>
          <Text style={styles.sleepTitle}>Suivi du sommeil</Text>
        </View>
        <View style={styles.sleepCard}>
          <Text style={styles.sleepQuality}>Qualité du sommeil</Text>
          <View style={styles.sleepTime}>
            <Text style={styles.sleepHours}>0h 0min</Text>
            <Text style={styles.sleepLabel}>Durée de sommeil</Text>
          </View>
          <TouchableOpacity style={styles.sleepButton}>
            <Text style={styles.sleepButtonText}>Enregistrer mon sommeil</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.healthSection}>
        <Text style={styles.healthTitle}>Données de santé</Text>
        <Text style={styles.healthSubtitle}>Synchronisées avec Apple Health</Text>
        
        <View style={styles.healthStats}>
          <View style={styles.healthStat}>
            <Text style={styles.healthValue}>8 246 / 10 000</Text>
            <Text style={styles.healthLabel}>Sommeil</Text>
          </View>
          <View style={styles.healthStat}>
            <Text style={styles.healthValue}>70 bpm</Text>
            <Text style={styles.healthLabel}>Fréquence cardiaque</Text>
          </View>
          <View style={styles.healthStat}>
            <Text style={styles.healthValue}>68 bpm</Text>
            <Text style={styles.healthLabel}>Voir toutes les données de santé</Text>
          </View>
        </View>
      </View>

      <View style={styles.recentActivities}>
        <Text style={styles.activitiesTitle}>Activités récentes</Text>
        
        <View style={styles.activityItem}>
          <View style={styles.activityIcon}>
            <Text>🥗</Text>
          </View>
          <View style={styles.activityDetails}>
            <Text style={styles.activityText}>Objectif Nutrition</Text>
            <Text style={styles.activitySubtext}>Vous êtes à 39% de votre objectif calorique</Text>
          </View>
          <Text style={styles.activityTime}>Aujourd'hui</Text>
        </View>

        <View style={styles.activityItem}>
          <View style={styles.activityIcon}>
            <Text>💪</Text>
          </View>
          <View style={styles.activityDetails}>
            <Text style={styles.activityText}>Entraînement</Text>
            <Text style={styles.activitySubtext}>Aucun entraînement enregistré aujourd'hui</Text>
          </View>
          <Text style={styles.activityTime}>Aujourd'hui</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  greeting: {
    flex: 1,
  },
  greetingText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 14,
    color: '#CCCCCC',
    marginTop: 4,
  },
  notificationButton: {
    padding: 8,
  },
  notificationIcon: {
    fontSize: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#CCCCCC',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  stepCounter: {
    backgroundColor: '#1A1A1A',
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  stepCircle: {
    alignItems: 'center',
    marginRight: 20,
  },
  stepCount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  stepGoal: {
    fontSize: 12,
    color: '#CCCCCC',
  },
  stepInfo: {
    flex: 1,
  },
  stepLabel: {
    fontSize: 14,
    color: '#CCCCCC',
  },
  stepPercentage: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  stepFooter: {
    fontSize: 12,
    color: '#CCCCCC',
  },
  addButton: {
    backgroundColor: '#F5A623',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: '#000000',
    fontWeight: '600',
  },
  sleepSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sleepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sleepIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  sleepTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  sleepCard: {
    backgroundColor: '#1A1A1A',
    padding: 20,
    borderRadius: 12,
  },
  sleepQuality: {
    fontSize: 14,
    color: '#CCCCCC',
    marginBottom: 8,
  },
  sleepTime: {
    marginBottom: 16,
  },
  sleepHours: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  sleepLabel: {
    fontSize: 12,
    color: '#CCCCCC',
  },
  sleepButton: {
    backgroundColor: '#F5A623',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  sleepButtonText: {
    color: '#000000',
    fontWeight: '600',
  },
  healthSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  healthTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  healthSubtitle: {
    fontSize: 14,
    color: '#CCCCCC',
    marginBottom: 16,
  },
  healthStats: {
    gap: 12,
  },
  healthStat: {
    backgroundColor: '#1A1A1A',
    padding: 16,
    borderRadius: 12,
  },
  healthValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  healthLabel: {
    fontSize: 12,
    color: '#CCCCCC',
  },
  recentActivities: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  activitiesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  activityIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  activityDetails: {
    flex: 1,
  },
  activityText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  activitySubtext: {
    fontSize: 12,
    color: '#CCCCCC',
  },
  activityTime: {
    fontSize: 12,
    color: '#F5A623',
  },
});
