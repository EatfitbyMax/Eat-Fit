
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { getAllUsers, getAllProgrammes } from '@/utils/storage';

interface DashboardStats {
  totalClients: number;
  activeProgrammes: number;
  messagesNonLus: number;
  rdvAujourdhui: number;
}

export default function CoachHomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalClients: 0,
    activeProgrammes: 0,
    messagesNonLus: 0,
    rdvAujourdhui: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Charger les clients
      const clients = await getAllUsers();
      const clientsCount = clients.filter(u => u.userType === 'client').length;
      
      // Charger les programmes (simulation)
      const programmes = await getAllProgrammes();
      
      setStats({
        totalClients: clientsCount,
        activeProgrammes: programmes.length,
        messagesNonLus: 3, // Simulation
        rdvAujourdhui: 2, // Simulation
      });
    } catch (error) {
      console.error('Erreur chargement dashboard coach:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      title: 'Créer un programme nutrition',
      icon: '🥗',
      route: '/(coach)/creer-programme-nutrition',
    },
    {
      title: 'Créer un programme sport',
      icon: '💪',
      route: '/(coach)/creer-programme-sport',
    },
    {
      title: 'Voir mes clients',
      icon: '👥',
      route: '/(coach)/clients',
    },
    {
      title: 'Gérer mes RDV',
      icon: '📅',
      route: '/(coach)/rdv',
    },
  ];

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.welcomeText}>Bonjour Coach</Text>
          <Text style={styles.coachName}>
            {user?.firstName} {user?.lastName}
          </Text>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statsCard}>
            <Text style={styles.statsNumber}>{stats.totalClients}</Text>
            <Text style={styles.statsLabel}>Clients</Text>
          </View>
          <View style={styles.statsCard}>
            <Text style={styles.statsNumber}>{stats.activeProgrammes}</Text>
            <Text style={styles.statsLabel}>Programmes</Text>
          </View>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statsCard}>
            <Text style={styles.statsNumber}>{stats.messagesNonLus}</Text>
            <Text style={styles.statsLabel}>Messages</Text>
          </View>
          <View style={styles.statsCard}>
            <Text style={styles.statsNumber}>{stats.rdvAujourdhui}</Text>
            <Text style={styles.statsLabel}>RDV aujourd'hui</Text>
          </View>
        </View>

        {/* Actions rapides */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Actions rapides</Text>
          <View style={styles.actionsGrid}>
            {quickActions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={styles.actionCard}
                onPress={() => router.push(action.route as any)}
              >
                <Text style={styles.actionIcon}>{action.icon}</Text>
                <Text style={styles.actionTitle}>{action.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Activité récente */}
        <View style={styles.activitySection}>
          <Text style={styles.sectionTitle}>Activité récente</Text>
          <View style={styles.activityCard}>
            <Text style={styles.activityText}>
              • Nouveau client inscrit il y a 2h
            </Text>
            <Text style={styles.activityText}>
              • Programme nutrition mis à jour
            </Text>
            <Text style={styles.activityText}>
              • 3 nouveaux messages reçus
            </Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 18,
  },
  scrollContainer: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 40,
  },
  welcomeText: {
    color: '#8B949E',
    fontSize: 16,
    marginBottom: 5,
  },
  coachName: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 15,
    gap: 15,
  },
  statsCard: {
    flex: 1,
    backgroundColor: '#21262D',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#30363D',
  },
  statsNumber: {
    color: '#FF6B6B',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  statsLabel: {
    color: '#8B949E',
    fontSize: 14,
  },
  actionsSection: {
    padding: 20,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  actionCard: {
    backgroundColor: '#21262D',
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
    width: '47%',
    borderWidth: 1,
    borderColor: '#30363D',
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: 10,
  },
  actionTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  activitySection: {
    padding: 20,
  },
  activityCard: {
    backgroundColor: '#21262D',
    padding: 20,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#30363D',
  },
  activityText: {
    color: '#8B949E',
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
});
