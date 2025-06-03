
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';

export default function ClientHomeScreen() {
  const [currentDate] = useState(new Date().toLocaleDateString('fr-FR', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }));

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Bonjour, Maxandre</Text>
          <Text style={styles.subtitle}>Prêt à atteindre vos objectifs nutritionnels ?</Text>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Aujourd'hui (mardi 3 juin)</Text>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statUnit}>Calories</Text>
            <Text style={styles.statSubtext}>2695 kcal</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Entraînement</Text>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statUnit}>Fatigue</Text>
          </View>
        </View>

        {/* Activity Tracker */}
        <View style={styles.activityCard}>
          <Text style={styles.activityTitle}>💪 Compteur de pas</Text>
          <View style={styles.stepsContainer}>
            <Text style={styles.stepsValue}>0</Text>
            <Text style={styles.stepsTotal}>/ 10000 pas</Text>
          </View>
          <Text style={styles.activitySubtext}>Objectif</Text>
          <View style={styles.progressBar}>
            <View style={styles.progressFill} />
          </View>
          <TouchableOpacity style={styles.addStepsButton}>
            <Text style={styles.addStepsText}>Ajouter des pas</Text>
          </TouchableOpacity>
        </View>

        {/* Sleep Tracker */}
        <View style={styles.sleepCard}>
          <Text style={styles.sleepTitle}>🌙 Suivi du sommeil</Text>
          <Text style={styles.sleepSubtitle}>Sommeil aujourd'hui</Text>
          <Text style={styles.sleepTime}>0h 0min</Text>
          <Text style={styles.sleepDuration}>0h 0min / 8h 0min</Text>
          <Text style={styles.sleepQuality}>Durée du sommeil</Text>
          <View style={styles.sleepInputContainer}>
            <Text style={styles.sleepInputLabel}>Heures</Text>
            <Text style={styles.sleepInputLabel}>Minutes</Text>
          </View>
          <TouchableOpacity style={styles.saveButton}>
            <Text style={styles.saveButtonText}>Enregistrer mon sommeil</Text>
          </TouchableOpacity>
        </View>

        {/* Health Data */}
        <View style={styles.healthCard}>
          <Text style={styles.healthTitle}>Données de santé</Text>
          <Text style={styles.healthSubtitle}>Mise à jour: 3 juin à 19:17</Text>
          <Text style={styles.healthSync}>Synchronisé avec Apple Health</Text>
          
          <View style={styles.healthStats}>
            <View style={styles.healthStat}>
              <Text style={styles.healthStatValue}>8 295 / 10 000</Text>
              <Text style={styles.healthStatLabel}>Sommeil</Text>
            </View>
            <View style={styles.healthStat}>
              <Text style={styles.healthStatValue}>70 bpm / 8h</Text>
              <Text style={styles.healthStatLabel}>Fréquence cardiaque</Text>
            </View>
            <View style={styles.healthStat}>
              <Text style={styles.healthStatValue}>65 bpm</Text>
              <Text style={styles.healthStatLabel}>Voir toutes les données de santé</Text>
            </View>
          </View>
        </View>

        {/* Recent Activities */}
        <View style={styles.activitiesCard}>
          <Text style={styles.activitiesTitle}>Activités récentes</Text>
          
          <View style={styles.activityItem}>
            <View style={styles.activityIcon}>
              <Text style={styles.activityIconText}>🎯</Text>
            </View>
            <View style={styles.activityInfo}>
              <Text style={styles.activityName}>Objectif Nutrition</Text>
              <Text style={styles.activityDescription}>Vous êtes à 30% de votre objectif calorique</Text>
            </View>
            <Text style={styles.activityTime}>Aujourd'hui</Text>
          </View>

          <View style={styles.activityItem}>
            <View style={styles.activityIcon}>
              <Text style={styles.activityIconText}>💪</Text>
            </View>
            <View style={styles.activityInfo}>
              <Text style={styles.activityName}>Entraînement</Text>
              <Text style={styles.activityDescription}>Aucun entraînement enregistré aujourd'hui</Text>
            </View>
            <Text style={styles.activityTime}>Aujourd'hui</Text>
          </View>

          <View style={styles.activityItem}>
            <View style={styles.activityIcon}>
              <Text style={styles.activityIconText}>💧</Text>
            </View>
            <View style={styles.activityInfo}>
              <Text style={styles.activityName}>Hydratation</Text>
              <Text style={styles.activityDescription}>0/8 L d'eau consommée</Text>
            </View>
            <Text style={styles.activityTime}>Aujourd'hui</Text>
          </View>

          <View style={styles.activityItem}>
            <View style={styles.activityIcon}>
              <Text style={styles.activityIconText}>📊</Text>
            </View>
            <View style={styles.activityInfo}>
              <Text style={styles.activityName}>Activité physique</Text>
              <Text style={styles.activityDescription}>0 pas sur un objectif de 10000</Text>
            </View>
            <Text style={styles.activityTime}>Aujourd'hui</Text>
          </View>

          <View style={styles.activityItem}>
            <View style={styles.activityIcon}>
              <Text style={styles.activityIconText}>😴</Text>
            </View>
            <View style={styles.activityInfo}>
              <Text style={styles.activityName}>Sommeil</Text>
              <Text style={styles.activityDescription}>0h 0min - Qualité: 0/5</Text>
            </View>
            <Text style={styles.activityTime}>Aujourd'hui</Text>
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
    padding: 20,
    paddingTop: 10,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
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
  },
  statLabel: {
    fontSize: 12,
    color: '#8B949E',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statUnit: {
    fontSize: 14,
    color: '#8B949E',
    marginBottom: 4,
  },
  statSubtext: {
    fontSize: 12,
    color: '#8B949E',
  },
  activityCard: {
    margin: 20,
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#21262D',
  },
  activityTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  stepsContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  stepsValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  stepsTotal: {
    fontSize: 16,
    color: '#8B949E',
    marginLeft: 8,
  },
  activitySubtext: {
    fontSize: 14,
    color: '#8B949E',
    marginBottom: 12,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#21262D',
    borderRadius: 2,
    marginBottom: 16,
  },
  progressFill: {
    height: '100%',
    width: '0%',
    backgroundColor: '#F85149',
    borderRadius: 2,
  },
  addStepsButton: {
    backgroundColor: '#1F6FEB',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  addStepsText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  sleepCard: {
    margin: 20,
    marginTop: 0,
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#21262D',
  },
  sleepTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  sleepSubtitle: {
    fontSize: 14,
    color: '#8B949E',
    marginBottom: 16,
  },
  sleepTime: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  sleepDuration: {
    fontSize: 14,
    color: '#8B949E',
    marginBottom: 16,
  },
  sleepQuality: {
    fontSize: 14,
    color: '#8B949E',
    marginBottom: 16,
  },
  sleepInputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sleepInputLabel: {
    fontSize: 14,
    color: '#8B949E',
  },
  saveButton: {
    backgroundColor: '#F5A623',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
  healthCard: {
    margin: 20,
    marginTop: 0,
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#21262D',
  },
  healthTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  healthSubtitle: {
    fontSize: 12,
    color: '#8B949E',
    marginBottom: 4,
  },
  healthSync: {
    fontSize: 12,
    color: '#58A6FF',
    marginBottom: 16,
  },
  healthStats: {
    gap: 12,
  },
  healthStat: {
    backgroundColor: '#0D1117',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#21262D',
  },
  healthStatValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  healthStatLabel: {
    fontSize: 12,
    color: '#8B949E',
  },
  activitiesCard: {
    margin: 20,
    marginTop: 0,
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#21262D',
    marginBottom: 100,
  },
  activitiesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#21262D',
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#21262D',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityIconText: {
    fontSize: 18,
  },
  activityInfo: {
    flex: 1,
  },
  activityName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  activityDescription: {
    fontSize: 14,
    color: '#8B949E',
  },
  activityTime: {
    fontSize: 12,
    color: '#8B949E',
  },
});
