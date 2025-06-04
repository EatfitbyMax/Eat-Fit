import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';

export default function ClientHomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Bonjour Martin ! 👋</Text>
          <Text style={styles.subtitle}>Prêt pour votre séance d'aujourd'hui ?</Text>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>5</Text>
            <Text style={styles.statLabel}>Séances cette semaine</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>2.1kg</Text>
            <Text style={styles.statLabel}>Progression</Text>
          </View>
        </View>

        {/* Today's Workout */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Séance du jour</Text>
          <View style={styles.workoutCard}>
            <View style={styles.workoutHeader}>
              <Text style={styles.workoutTitle}>💪 Push Day - Haut du corps</Text>
              <Text style={styles.workoutDuration}>45 min</Text>
            </View>
            <Text style={styles.workoutDescription}>
              Développé couché, développé incliné, dips, développé épaules
            </Text>
            <TouchableOpacity 
              style={styles.startButton}
              onPress={() => router.push('/(client)/entrainement')}
            >
              <Text style={styles.startButtonText}>Commencer la séance</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Nutrition Today */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nutrition aujourd'hui</Text>
          <View style={styles.nutritionCard}>
            <View style={styles.caloriesRow}>
              <Text style={styles.caloriesConsumed}>1,847</Text>
              <Text style={styles.caloriesTotal}> / 2,200 kcal</Text>
            </View>
            <View style={styles.macrosRow}>
              <View style={styles.macroItem}>
                <Text style={styles.macroLabel}>Protéines</Text>
                <Text style={styles.macroValue}>87g</Text>
              </View>
              <View style={styles.macroItem}>
                <Text style={styles.macroLabel}>Glucides</Text>
                <Text style={styles.macroValue}>165g</Text>
              </View>
              <View style={styles.macroItem}>
                <Text style={styles.macroLabel}>Lipides</Text>
                <Text style={styles.macroValue}>61g</Text>
              </View>
            </View>
            <TouchableOpacity 
              style={styles.addMealButton}
              onPress={() => router.push('/(client)/nutrition')}
            >
              <Text style={styles.addMealButtonText}>+ Ajouter un repas</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions rapides</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/(client)/progres')}
            >
              <Text style={styles.actionIcon}>📊</Text>
              <Text style={styles.actionText}>Voir mes progrès</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/(client)/coach')}
            >
              <Text style={styles.actionIcon}>💬</Text>
              <Text style={styles.actionText}>Contacter mon coach</Text>
            </TouchableOpacity>
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
  content: {
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
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#161B22',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F5A623',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#8B949E',
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  workoutCard: {
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#21262D',
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  workoutTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  workoutDuration: {
    fontSize: 14,
    color: '#8B949E',
  },
  workoutDescription: {
    fontSize: 14,
    color: '#8B949E',
    marginBottom: 16,
  },
  startButton: {
    backgroundColor: '#F5A623',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  nutritionCard: {
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#21262D',
  },
  caloriesRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  caloriesConsumed: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F5A623',
  },
  caloriesTotal: {
    fontSize: 16,
    color: '#8B949E',
  },
  macrosRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  macroItem: {
    alignItems: 'center',
  },
  macroLabel: {
    fontSize: 12,
    color: '#8B949E',
    marginBottom: 4,
  },
  macroValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  addMealButton: {
    backgroundColor: '#21262D',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  addMealButtonText: {
    color: '#F5A623',
    fontSize: 14,
    fontWeight: '500',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#161B22',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#21262D',
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  actionText: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
  },
});