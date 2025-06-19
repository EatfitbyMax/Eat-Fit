
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { logout, getCurrentUser } from '@/utils/auth';
import { IntegrationsManager, IntegrationStatus } from '@/utils/integrations';

export default function ProfilScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [integrationStatus, setIntegrationStatus] = useState({
    appleHealth: { connected: false, lastSync: null },
    strava: { connected: false, lastSync: null, athleteId: null },
  });

  useEffect(() => {
    loadUserData();
    loadIntegrationStatus();
  }, []);

  const loadUserData = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Erreur chargement utilisateur:', error);
    }
  };

  const loadIntegrationStatus = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) return;

      const status = await IntegrationsManager.getIntegrationStatus(currentUser.id);
      setIntegrationStatus(status);
    } catch (error) {
      console.error("Failed to load integration status:", error);
    }
  };;

  const handleAppleHealthToggle = async () => {
    setIsLoading(true);
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        Alert.alert("Erreur", "Utilisateur non connecté");
        return;
      }

      if (integrationStatus.appleHealth.connected) {
        Alert.alert(
          "Déconnecter Apple Health",
          "Êtes-vous sûr de vouloir déconnecter Apple Health ? Vos données ne seront plus synchronisées.",
          [
            { text: "Annuler", style: "cancel" },
            { 
              text: "Déconnecter", 
              style: "destructive",
              onPress: async () => {
                await IntegrationsManager.disconnectAppleHealth(currentUser.id);
                setIntegrationStatus(prev => ({
                  ...prev,
                  appleHealth: { connected: false, lastSync: null }
                }));
                Alert.alert("Succès", "Apple Health déconnecté");
              }
            }
          ]
        );
      } else {
        Alert.alert(
          "Connecter Apple Health",
          "EatFitByMax va demander l'autorisation d'accéder à vos données de santé (pas, calories, rythme cardiaque, poids, sommeil). Ces données resteront privées et sécurisées.",
          [
            { text: "Annuler", style: "cancel" },
            { 
              text: "Autoriser", 
              onPress: async () => {
                const success = await IntegrationsManager.connectAppleHealth(currentUser.id);
                if (success) {
                  await loadIntegrationStatus();
                  Alert.alert(
                    "Succès", 
                    "Apple Health connecté avec succès ! Vos données de santé seront maintenant synchronisées automatiquement."
                  );
                } else {
                  Alert.alert(
                    "Erreur", 
                    "Impossible de connecter Apple Health. Assurez-vous d'avoir autorisé l'accès aux données de santé dans les réglages."
                  );
                }
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error("Failed to toggle Apple Health:", error);
      Alert.alert("Erreur", "Une erreur est survenue lors de la connexion à Apple Health.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStravaToggle = async () => {
    setIsLoading(true);
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        Alert.alert("Erreur", "Utilisateur non connecté");
        return;
      }

      if (integrationStatus.strava.connected) {
        await IntegrationsManager.disconnectStrava(currentUser.id);
        setIntegrationStatus(prev => ({
          ...prev,
          strava: { connected: false, lastSync: null, athleteId: null }
        }));
        Alert.alert("Succès", "Strava déconnecté");
      } else {
        const success = await IntegrationsManager.connectStrava(currentUser.id);
        if (success) {
          await loadIntegrationStatus();
          Alert.alert("Succès", "Strava connecté avec succès");
        } else {
          Alert.alert("Erreur", "Impossible de connecter Strava");
        }
      }
    } catch (error) {
      console.error("Failed to toggle Strava:", error);
      Alert.alert("Erreur", "Impossible de connecter/déconnecter Strava.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncAllData = async () => {
    setIsLoading(true);
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        Alert.alert("Erreur", "Utilisateur non connecté");
        return;
      }

      await IntegrationsManager.syncAllData(currentUser.id);
      Alert.alert("Succès", "Toutes les données ont été synchronisées.");
      await loadIntegrationStatus(); // Refresh statuses after sync
    } catch (error) {
      console.error("Failed to sync all data:", error);
      Alert.alert("Erreur", "Impossible de synchroniser toutes les données.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        { 
          text: 'Déconnexion', 
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/auth/login');
          }
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header avec gradient */}
        <LinearGradient
          colors={['#F5A623', '#E8941A', '#0D1117']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.headerGradient}
        >
          <Text style={styles.title}>Mon profil</Text>
          
          {/* User Card avec un design plus moderne */}
          <View style={styles.userCard}>
            <LinearGradient
              colors={['#F5A623', '#FFB84D']}
              style={styles.userAvatar}
            >
              <Text style={styles.userAvatarText}>
                {user ? (
                  (user.firstName?.[0] || user.name?.[0] || '?').toUpperCase() + 
                  (user.lastName?.[0] || user.name?.split(' ')?.[1]?.[0] || '').toUpperCase()
                ) : '?'}
              </Text>
            </LinearGradient>
            <Text style={styles.userName}>
              {user ? (
                user.firstName && user.lastName 
                  ? `${user.firstName} ${user.lastName}`
                  : user.name || 'Utilisateur'
              ) : 'Chargement...'}
            </Text>
            <Text style={styles.userEmail}>
              {user?.email || 'email@example.com'}
            </Text>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          {/* Personal Information */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>📋 Informations personnelles</Text>
              <TouchableOpacity 
                onPress={() => router.push('/informations-personnelles')}
                style={styles.modifyButton}
              >
                <LinearGradient
                  colors={['#F5A623', '#FFB84D']}
                  style={styles.modifyButtonGradient}
                >
                  <Text style={styles.modifyText}>Modifier</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Informations de base avec design amélioré */}
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <View style={styles.infoLabelContainer}>
                  <Text style={styles.infoIcon}>👤</Text>
                  <Text style={styles.infoLabel}>Sexe</Text>
                </View>
                <Text style={styles.infoValue}>{user?.gender || 'Non renseigné'}</Text>
              </View>
              <View style={styles.infoRow}>
                <View style={styles.infoLabelContainer}>
                  <Text style={styles.infoIcon}>📅</Text>
                  <Text style={styles.infoLabel}>Âge</Text>
                </View>
                <Text style={styles.infoValue}>{user?.age ? `${user.age} ans` : 'Non renseigné'}</Text>
              </View>
              <View style={styles.infoRow}>
                <View style={styles.infoLabelContainer}>
                  <Text style={styles.infoIcon}>📏</Text>
                  <Text style={styles.infoLabel}>Taille</Text>
                </View>
                <Text style={styles.infoValue}>{user?.height ? `${user.height} cm` : 'Non renseignée'}</Text>
              </View>
              <View style={styles.infoRow}>
                <View style={styles.infoLabelContainer}>
                  <Text style={styles.infoIcon}>⚖️</Text>
                  <Text style={styles.infoLabel}>Poids</Text>
                </View>
                <Text style={styles.infoValue}>{user?.weight ? `${user.weight} kg` : 'Non renseigné'}</Text>
              </View>
              <View style={[styles.infoRow, styles.lastInfoRow]}>
                <View style={styles.infoLabelContainer}>
                  <Text style={styles.infoIcon}>🏃‍♂️</Text>
                  <Text style={styles.infoLabel}>Activité</Text>
                </View>
                <Text style={styles.infoValue}>{user?.activityLevel || 'Non renseigné'}</Text>
              </View>
            </View>

            {/* Objectifs avec design amélioré */}
            <View style={styles.goalsCard}>
              <Text style={styles.goalsSectionTitle}>🎯 Mes objectifs</Text>
              {user?.goals && user.goals.length > 0 ? (
                user.goals.map((goal: string, index: number) => (
                  <View key={index} style={styles.goalItem}>
                    <View style={styles.goalBullet} />
                    <Text style={styles.goalText}>{goal}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.noGoalsText}>Aucun objectif défini</Text>
              )}
            </View>

            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => router.push('/notifications')}
            >
              <Text style={styles.menuItemText}>🔔 Notifications</Text>
              <Text style={styles.menuItemArrow}>›</Text>
            </TouchableOpacity>
          </View>

          {/* Integrations avec design amélioré */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔗 Intégrations</Text>

            <View style={styles.integrationCard}>
              <View style={styles.integrationItem}>
                <View style={styles.integrationIconContainer}>
                  <Text style={styles.integrationIcon}>🍎</Text>
                </View>
                <View style={styles.integrationInfo}>
                  <Text style={styles.integrationName}>Apple Health</Text>
                  <Text style={styles.integrationDescription}>
                    Synchronisez vos données de santé
                  </Text>
                </View>
                <TouchableOpacity 
                  style={[styles.connectButton, integrationStatus.appleHealth.connected && styles.connectedButton]}
                  onPress={handleAppleHealthToggle}
                  disabled={isLoading}
                >
                  <Text style={[styles.connectButtonText, integrationStatus.appleHealth.connected && styles.connectedButtonText]}>
                    {integrationStatus.appleHealth.connected ? 'Connecté' : 'Connecter'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.separator} />

              <View style={styles.integrationItem}>
                <View style={styles.integrationIconContainer}>
                  <Text style={styles.integrationIcon}>🏃‍♂️</Text>
                </View>
                <View style={styles.integrationInfo}>
                  <Text style={styles.integrationName}>Strava</Text>
                  <Text style={styles.integrationDescription}>
                    Synchronisez vos activités sportives
                  </Text>
                </View>
                <TouchableOpacity 
                  style={[styles.connectButton, integrationStatus.strava.connected && styles.connectedButton]}
                  onPress={handleStravaToggle}
                  disabled={isLoading}
                >
                  <Text style={[styles.connectButtonText, integrationStatus.strava.connected && styles.connectedButtonText]}>
                    {integrationStatus.strava.connected ? 'Connecté' : 'Connecter'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Synchronisation globale */}
            {(integrationStatus.appleHealth.connected || integrationStatus.strava.connected) && (
              <TouchableOpacity 
                style={styles.syncAllButton}
                onPress={handleSyncAllData}
                disabled={isLoading}
              >
                <LinearGradient
                  colors={['#3498db', '#2980b9']}
                  style={styles.syncAllButtonGradient}
                >
                  <Text style={styles.syncAllButtonText}>
                    🔄 Synchroniser toutes les données
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            )}

            {/* Informations de statut */}
            {integrationStatus.appleHealth.connected && (
              <View style={styles.statusCard}>
                <Text style={styles.statusTitle}>📱 Apple Health</Text>
                <Text style={styles.statusDescription}>
                  Dernière synchronisation : {integrationStatus.appleHealth.lastSync ? 
                    new Date(integrationStatus.appleHealth.lastSync).toLocaleDateString('fr-FR') : 
                    'Jamais'
                  }
                </Text>
              </View>
            )}

            {integrationStatus.strava.connected && (
              <View style={styles.statusCard}>
                <Text style={styles.statusTitle}>🏃‍♂️ Strava</Text>
                <Text style={styles.statusDescription}>
                  Athlete #{integrationStatus.strava.athleteId || '24854648'} connecté à EatFitByMax.
                </Text>
                <Text style={styles.statusDescription}>
                  Dernière synchronisation : {integrationStatus.strava.lastSync ? 
                    new Date(integrationStatus.strava.lastSync).toLocaleDateString('fr-FR') : 
                    'Jamais'
                  }
                </Text>
              </View>
            )}
          </View>

          {/* Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚙️ Paramètres</Text>

            <View style={styles.settingsCard}>
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => router.push('/(client)/parametres-application')}
              >
                <Text style={styles.menuItemText}>⚙️ Paramètres de l'application</Text>
                <Text style={styles.menuItemArrow}>›</Text>
              </TouchableOpacity>

              <View style={styles.separator} />

              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => router.push('/(client)/securite-confidentialite')}
              >
                <Text style={styles.menuItemText}>🔒 Sécurité et confidentialité</Text>
                <Text style={styles.menuItemArrow}>›</Text>
              </TouchableOpacity>

              <View style={styles.separator} />

              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => router.push('/(client)/aide-feedback')}
              >
                <Text style={styles.menuItemText}>💬 Aide et feedback</Text>
                <Text style={styles.menuItemArrow}>›</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Logout */}
          <View style={styles.section}>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <LinearGradient
                colors={['#F85149', '#DC3545']}
                style={styles.logoutButtonGradient}
              >
                <Text style={styles.logoutButtonText}>🚪 Se déconnecter</Text>
              </LinearGradient>
            </TouchableOpacity>
            <Text style={styles.versionText}>Version 1.0.0</Text>
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
  headerGradient: {
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 30,
  },
  userCard: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  userAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#F5A623',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  userAvatarText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  content: {
    flex: 1,
    backgroundColor: '#0D1117',
    marginTop: -20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
  },
  section: {
    margin: 20,
    marginTop: 0,
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modifyButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  modifyButtonGradient: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  modifyText: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: '#161B22',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#21262D',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#21262D',
  },
  lastInfoRow: {
    borderBottomWidth: 0,
  },
  infoLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  infoLabel: {
    fontSize: 16,
    color: '#8B949E',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  goalsCard: {
    backgroundColor: '#161B22',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#21262D',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  goalsSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  goalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  goalBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F5A623',
    marginRight: 12,
  },
  goalText: {
    fontSize: 16,
    color: '#FFFFFF',
    flex: 1,
  },
  noGoalsText: {
    fontSize: 16,
    color: '#8B949E',
    fontStyle: 'italic',
  },
  integrationCard: {
    backgroundColor: '#161B22',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#21262D',
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  integrationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  integrationIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#21262D',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  integrationIcon: {
    fontSize: 24,
  },
  integrationInfo: {
    flex: 1,
  },
  integrationName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  integrationDescription: {
    fontSize: 14,
    color: '#8B949E',
  },
  connectButton: {
    backgroundColor: '#28A745',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  connectButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  connectedButton: {
    backgroundColor: '#2ecc71',
  },
  connectedButtonText: {
    color: '#000000',
  },
  separator: {
    height: 1,
    backgroundColor: '#21262D',
    marginHorizontal: 20,
  },
  syncAllButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  syncAllButtonGradient: {
    padding: 16,
    alignItems: 'center',
  },
  syncAllButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  statusCard: {
    backgroundColor: '#2c3e50',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  statusDescription: {
    fontSize: 14,
    color: '#ecf0f1',
  },
  settingsCard: {
    backgroundColor: '#161B22',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#21262D',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  menuItemText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  menuItemArrow: {
    fontSize: 20,
    color: '#8B949E',
    fontWeight: 'bold',
  },
  logoutButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  logoutButtonGradient: {
    padding: 16,
    alignItems: 'center',
  },
  logoutButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  versionText: {
    fontSize: 14,
    color: '#8B949E',
    textAlign: 'center',
  },
});
