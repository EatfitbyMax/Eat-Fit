
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
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>← Retour</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Mes intégrations</Text>
        </View>

        {/* Description */}
        <View style={styles.descriptionCard}>
          <Text style={styles.descriptionTitle}>Connectez vos applications</Text>
          <Text style={styles.descriptionText}>
            Synchronisez vos données de santé et d'activité avec EatFitByMax pour un suivi personnalisé et complet.
          </Text>
        </View>

        {/* Apple Health Integration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📱 Apple Health</Text>
          
          <View style={styles.integrationCard}>
            <View style={styles.integrationHeader}>
              <Text style={styles.integrationName}>🍎 Apple Health</Text>
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
            
            <Text style={styles.integrationDescription}>
              Synchronisez vos données de santé (pas, calories, rythme cardiaque, poids, sommeil) pour un suivi automatique et précis.
            </Text>

            {integrationStatus.appleHealth.connected && (
              <View style={styles.statusInfo}>
                <Text style={styles.statusTitle}>📊 Statut</Text>
                <Text style={styles.statusText}>
                  Dernière synchronisation : {integrationStatus.appleHealth.lastSync ? 
                    new Date(integrationStatus.appleHealth.lastSync).toLocaleDateString('fr-FR') : 
                    'Jamais'
                  }
                </Text>
                <Text style={styles.statusText}>
                  Données synchronisées : Pas, Calories, Rythme cardiaque, Poids, Sommeil
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Strava Integration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏃‍♂️ Strava</Text>
          
          <View style={styles.integrationCard}>
            <View style={styles.integrationHeader}>
              <Text style={styles.integrationName}>🏃‍♂️ Strava</Text>
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
            
            <Text style={styles.integrationDescription}>
              Importez automatiquement vos activités sportives pour un suivi complet de vos performances et calories brûlées.
            </Text>

            {integrationStatus.strava.connected && (
              <View style={styles.statusInfo}>
                <Text style={styles.statusTitle}>📊 Statut</Text>
                <Text style={styles.statusText}>
                  Athlete #{integrationStatus.strava.athleteId || '24854648'} connecté à EatFitByMax
                </Text>
                <Text style={styles.statusText}>
                  Dernière synchronisation : {integrationStatus.strava.lastSync ? 
                    new Date(integrationStatus.strava.lastSync).toLocaleDateString('fr-FR') : 
                    'Jamais'
                  }
                </Text>
                <Text style={styles.statusText}>
                  Données synchronisées : Activités, Distance, Durée, Calories, Rythme cardiaque
                </Text>
              </View>
            )}
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
                🔄 Synchroniser toutes les données maintenant
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Info card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>🔒 Vos données sont sécurisées</Text>
          <Text style={styles.infoText}>
            Toutes les données synchronisées sont chiffrées et restent privées. Elles sont uniquement utilisées pour améliorer votre expérience EatFitByMax.
          </Text>
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 16,
  },
  backButtonText: {
    color: '#F5A623',
    fontSize: 16,
    fontWeight: '500',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
  },
  descriptionCard: {
    margin: 20,
    marginTop: 0,
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#21262D',
  },
  descriptionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: '#8B949E',
    lineHeight: 20,
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
    padding: 20,
    borderWidth: 1,
    borderColor: '#21262D',
  },
  integrationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  integrationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  integrationDescription: {
    fontSize: 14,
    color: '#8B949E',
    lineHeight: 20,
    marginBottom: 16,
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
    backgroundColor: '#2ecc71',
  },
  connectedButtonText: {
    color: '#000000',
  },
  statusInfo: {
    backgroundColor: '#0D1117',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#21262D',
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 13,
    color: '#8B949E',
    lineHeight: 18,
    marginBottom: 4,
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
  infoCard: {
    margin: 20,
    marginTop: 0,
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#374151',
    marginBottom: 40,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#9CA3AF',
    lineHeight: 20,
  },
});
