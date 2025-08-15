
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import HealthKitService, { connectToAppleHealth } from '../../utils/healthKit';
import { Ionicons } from '@expo/vector-icons';

export default function SanteDonneesScreen() {
  const { currentTheme } = useTheme();
  const { currentUser } = useAuth();
  const [healthData, setHealthData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    checkHealthKitConnection();
  }, []);

  const checkHealthKitConnection = async () => {
    try {
      const available = await HealthKitService.isAvailable();
      setIsConnected(available);
      
      if (available) {
        await loadHealthData();
      }
    } catch (error) {
      console.error('Erreur vérification HealthKit:', error);
    }
  };

  const loadHealthData = async () => {
    setIsLoading(true);
    try {
      const today = new Date();
      const data = await HealthKitService.getHealthData(today);
      setHealthData(data);
    } catch (error) {
      console.error('Erreur chargement données santé:', error);
      Alert.alert('Erreur', 'Impossible de charger les données de santé.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectHealthKit = async () => {
    try {
      const success = await connectToAppleHealth();
      if (success) {
        setIsConnected(true);
        await loadHealthData();
        Alert.alert(
          '🎉 Connecté !',
          'Apple Health est maintenant connecté. Vos données de santé seront synchronisées automatiquement.'
        );
      }
    } catch (error) {
      console.error('Erreur connexion:', error);
      Alert.alert('Erreur', 'Impossible de connecter Apple Health.');
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: currentTheme.backgroundColor,
    },
    header: {
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: currentTheme.borderColor,
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: currentTheme.textColor,
      marginTop: 10,
    },
    headerSubtitle: {
      fontSize: 16,
      color: currentTheme.textColor,
      textAlign: 'center',
      marginTop: 8,
      opacity: 0.7,
    },
    content: {
      flex: 1,
      padding: 20,
    },
    connectionStatus: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: currentTheme.surfaceColor,
      padding: 16,
      borderRadius: 12,
      marginBottom: 20,
    },
    statusText: {
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 8,
    },
    connectButton: {
      backgroundColor: '#4CAF50',
      padding: 16,
      borderRadius: 12,
      alignItems: 'center',
      marginBottom: 20,
    },
    connectButtonText: {
      color: 'white',
      fontSize: 18,
      fontWeight: 'bold',
    },
    dataSection: {
      backgroundColor: currentTheme.surfaceColor,
      padding: 16,
      borderRadius: 12,
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: currentTheme.textColor,
      marginBottom: 12,
    },
    dataGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    dataCard: {
      backgroundColor: currentTheme.backgroundColor,
      padding: 12,
      borderRadius: 8,
      alignItems: 'center',
      minWidth: '45%',
      flex: 1,
    },
    dataIcon: {
      fontSize: 24,
      marginBottom: 8,
    },
    dataValue: {
      fontSize: 18,
      fontWeight: 'bold',
      color: currentTheme.textColor,
    },
    dataLabel: {
      fontSize: 14,
      color: currentTheme.textColor,
      opacity: 0.7,
      textAlign: 'center',
    },
    refreshButton: {
      backgroundColor: '#007AFF',
      padding: 12,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: 16,
    },
    refreshButtonText: {
      color: 'white',
      fontWeight: '600',
    },
    placeholderText: {
      color: currentTheme.textColor,
      textAlign: 'center',
      fontSize: 16,
      opacity: 0.7,
      fontStyle: 'italic',
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="fitness" size={48} color="#4CAF50" />
        <Text style={styles.headerTitle}>Données de Santé</Text>
        <Text style={styles.headerSubtitle}>
          Synchronisez vos données Apple Health pour un suivi personnalisé
        </Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.connectionStatus}>
          <Ionicons 
            name={isConnected ? "checkmark-circle" : "close-circle"} 
            size={24} 
            color={isConnected ? "#4CAF50" : "#FF5722"} 
          />
          <Text style={[styles.statusText, { color: isConnected ? "#4CAF50" : "#FF5722" }]}>
            {isConnected ? "Apple Health Connecté" : "Apple Health Non Connecté"}
          </Text>
        </View>

        {!isConnected && (
          <TouchableOpacity style={styles.connectButton} onPress={handleConnectHealthKit}>
            <Text style={styles.connectButtonText}>
              🍎 Connecter Apple Health
            </Text>
          </TouchableOpacity>
        )}

        {isConnected && (
          <View style={styles.dataSection}>
            <Text style={styles.sectionTitle}>Données d'aujourd'hui</Text>
            
            {isLoading ? (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#4CAF50" />
                <Text style={[styles.placeholderText, { marginTop: 10 }]}>
                  Chargement des données...
                </Text>
              </View>
            ) : healthData ? (
              <View style={styles.dataGrid}>
                <View style={styles.dataCard}>
                  <Text style={styles.dataIcon}>👟</Text>
                  <Text style={styles.dataValue}>
                    {healthData.steps ? healthData.steps.toLocaleString() : '0'}
                  </Text>
                  <Text style={styles.dataLabel}>Pas</Text>
                </View>
                
                <View style={styles.dataCard}>
                  <Text style={styles.dataIcon}>🔥</Text>
                  <Text style={styles.dataValue}>
                    {healthData.calories ? Math.round(healthData.calories) : '0'}
                  </Text>
                  <Text style={styles.dataLabel}>Calories brûlées</Text>
                </View>
                
                <View style={styles.dataCard}>
                  <Text style={styles.dataIcon}>❤️</Text>
                  <Text style={styles.dataValue}>
                    {healthData.heartRate ? Math.round(healthData.heartRate) : '--'}
                  </Text>
                  <Text style={styles.dataLabel}>BPM</Text>
                </View>
                
                <View style={styles.dataCard}>
                  <Text style={styles.dataIcon}>📏</Text>
                  <Text style={styles.dataValue}>
                    {healthData.distance ? `${(healthData.distance / 1000).toFixed(1)}` : '0'}
                  </Text>
                  <Text style={styles.dataLabel}>km parcourus</Text>
                </View>
              </View>
            ) : (
              <Text style={styles.placeholderText}>
                Aucune donnée disponible pour aujourd'hui
              </Text>
            )}
            
            <TouchableOpacity style={styles.refreshButton} onPress={loadHealthData}>
              <Text style={styles.refreshButtonText}>
                Actualiser les données
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.dataSection}>
          <Text style={styles.sectionTitle}>Pourquoi connecter Apple Health ?</Text>
          <Text style={[styles.placeholderText, { textAlign: 'left' }]}>
            • Suivi automatique de vos activités{'\n'}
            • Programmes personnalisés basés sur vos données réelles{'\n'}
            • Historique complet de votre progression{'\n'}
            • Synchronisation avec tous vos appareils Apple{'\n'}
            • Données sécurisées et privées
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
