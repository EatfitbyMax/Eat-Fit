
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { getCurrentUser } from '@/utils/auth';
import { IntegrationsManager, IntegrationStatus } from '@/utils/integrations';

export default function IntegrationsScreen() {
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

  // Recharger les données quand la page est focus
  useFocusEffect(
    React.useCallback(() => {
      loadUserData();
      loadIntegrationStatus();
    }, [])
  );

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
  };

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
        Alert.alert(
          "Déconnecter Strava",
          "Êtes-vous sûr de vouloir déconnecter Strava ? Vos activités ne seront plus synchronisées.",
          [
            { text: "Annuler", style: "cancel" },
            { 
              text: "Déconnecter", 
              style: "destructive",
              onPress: async () => {
                await IntegrationsManager.disconnectStrava(currentUser.id);
                setIntegrationStatus(prev => ({
                  ...prev,
                  strava: { connected: false, lastSync: null, athleteId: null }
                }));
                Alert.alert("Succès", "Strava déconnecté");
              }
            }
          ]
        );
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
      await loadIntegrationStatus();
    } catch (error) {
      console.error("Failed to sync all data:", error);
      Alert.alert("Erreur", "Impossible de synchroniser toutes les données.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Intégrations</Text>
          <Text style={styles.subtitle}>
            Connectez vos applications préférées pour synchroniser automatiquement vos données
          </Text>
        </View>

        {/* Apple Health Integration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏥 Santé et bien-être</Text>
          
          <View style={styles.integrationCard}>
            <View style={styles.integrationHeader}>
              <View style={styles.integrationInfo}>
                <Text style={styles.integrationName}>🍎 Apple Health</Text>
                <Text style={styles.integrationDescription}>
                  Synchronisez vos données de santé (pas, calories, rythme cardiaque, poids, sommeil)
                </Text>
              </View>
              <TouchableOpacity 
                style={[
                  styles.connectButton, 
                  integrationStatus.appleHealth.connected && styles.connectedButton
                ]}
                onPress={handleAppleHealthToggle}
                disabled={isLoading}
              >
                <Text style={[
                  styles.connectButtonText, 
                  integrationStatus.appleHealth.connected && styles.connectedButtonText
                ]}>
                  {integrationStatus.appleHealth.connected ? 'Connecté' : 'Connecter'}
                </Text>
              </TouchableOpacity>
            </View>

            {integrationStatus.appleHealth.connected && (
              <View style={styles.statusInfo}>
                <Text style={styles.statusText}>
                  ✅ Connecté - Dernière synchronisation : {
                    integrationStatus.appleHealth.lastSync ? 
                    new Date(integrationStatus.appleHealth.lastSync).toLocaleDateString('fr-FR') : 
                    'Jamais'
                  }
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Sports Integration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏃‍♂️ Sport et activités</Text>
          
          <View style={styles.integrationCard}>
            <View style={styles.integrationHeader}>
              <View style={styles.integrationInfo}>
                <Text style={styles.integrationName}>🏃‍♂️ Strava</Text>
                <Text style={styles.integrationDescription}>
                  Synchronisez vos activités sportives (course, vélo, natation, etc.)
                </Text>
              </View>
              <TouchableOpacity 
                style={[
                  styles.connectButton, 
                  integrationStatus.strava.connected && styles.connectedButton
                ]}
                onPress={handleStravaToggle}
                disabled={isLoading}
              >
                <Text style={[
                  styles.connectButtonText, 
                  integrationStatus.strava.connected && styles.connectedButtonText
                ]}>
                  {integrationStatus.strava.connected ? 'Connecté' : 'Connecter'}
                </Text>
              </TouchableOpacity>
            </View>

            {integrationStatus.strava.connected && (
              <View style={styles.statusInfo}>
                <Text style={styles.statusText}>
                  ✅ Connecté - Athlete #{integrationStatus.strava.athleteId || '24854648'}
                </Text>
                <Text style={styles.statusText}>
                  Dernière synchronisation : {
                    integrationStatus.strava.lastSync ? 
                    new Date(integrationStatus.strava.lastSync).toLocaleDateString('fr-FR') : 
                    'Jamais'
                  }
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Nutrition Integration (Future) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🍽️ Nutrition (Bientôt disponible)</Text>
          
          <View style={[styles.integrationCard, styles.comingSoonCard]}>
            <View style={styles.integrationHeader}>
              <View style={styles.integrationInfo}>
                <Text style={[styles.integrationName, styles.comingSoonText]}>🥗 MyFitnessPal</Text>
                <Text style={[styles.integrationDescription, styles.comingSoonText]}>
                  Synchronisez vos repas et calories consommées
                </Text>
              </View>
              <View style={styles.comingSoonBadge}>
                <Text style={styles.comingSoonBadgeText}>Bientôt</Text>
              </View>
            </View>
          </View>

          <View style={[styles.integrationCard, styles.comingSoonCard]}>
            <View style={styles.integrationHeader}>
              <View style={styles.integrationInfo}>
                <Text style={[styles.integrationName, styles.comingSoonText]}>🍎 Yuka</Text>
                <Text style={[styles.integrationDescription, styles.comingSoonText]}>
                  Analysez la qualité nutritionnelle de vos aliments
                </Text>
              </View>
              <View style={styles.comingSoonBadge}>
                <Text style={styles.comingSoonBadgeText}>Bientôt</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Synchronisation globale */}
        {(integrationStatus.appleHealth.connected || integrationStatus.strava.connected) && (
          <View style={styles.section}>
            <TouchableOpacity 
              style={styles.syncAllButton}
              onPress={handleSyncAllData}
              disabled={isLoading}
            >
              <Text style={styles.syncAllButtonText}>
                🔄 Synchroniser toutes les données
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Help section */}
        <View style={styles.section}>
          <View style={styles.helpCard}>
            <Text style={styles.helpTitle}>💡 Aide</Text>
            <Text style={styles.helpText}>
              Les intégrations permettent de synchroniser automatiquement vos données entre EatFitByMax et vos applications préférées.
            </Text>
            <Text style={styles.helpText}>
              • Vos données restent privées et sécurisées
            </Text>
            <Text style={styles.helpText}>
              • La synchronisation se fait automatiquement
            </Text>
            <Text style={styles.helpText}>
              • Vous pouvez déconnecter à tout moment
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
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#8B949E',
    lineHeight: 22,
  },
  section: {
    margin: 20,
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  integrationCard: {
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#21262D',
    marginBottom: 12,
  },
  integrationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  integrationInfo: {
    flex: 1,
    marginRight: 16,
  },
  integrationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  integrationDescription: {
    fontSize: 14,
    color: '#8B949E',
    lineHeight: 20,
  },
  connectButton: {
    backgroundColor: '#28A745',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  connectButtonText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  connectedButton: {
    backgroundColor: '#2ECC71',
  },
  connectedButtonText: {
    color: '#000000',
  },
  statusInfo: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#21262D',
  },
  statusText: {
    fontSize: 12,
    color: '#8B949E',
    marginBottom: 2,
  },
  comingSoonCard: {
    opacity: 0.6,
  },
  comingSoonText: {
    color: '#6C757D',
  },
  comingSoonBadge: {
    backgroundColor: '#6C757D',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  comingSoonBadgeText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  syncAllButton: {
    backgroundColor: '#3498db',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  syncAllButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  helpCard: {
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#21262D',
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  helpText: {
    fontSize: 14,
    color: '#8B949E',
    lineHeight: 20,
    marginBottom: 4,
  },
});
