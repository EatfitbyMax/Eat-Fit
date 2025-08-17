
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { AppleHealthManager, HealthPermissions } from '../../utils/appleHealth';
import { getCurrentUser } from '../../utils/auth';

export default function AppleHealthScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [healthAvailable, setHealthAvailable] = useState(false);
  const [permissions, setPermissions] = useState<HealthPermissions>({
    steps: false,
    heartRate: false,
    activeEnergy: false,
    workouts: false
  });
  const [healthData, setHealthData] = useState({
    steps: 0,
    heartRate: [],
    workouts: []
  });

  useEffect(() => {
    checkHealthAvailability();
    loadPermissions();
  }, []);

  const checkHealthAvailability = async () => {
    try {
      const available = await AppleHealthManager.isAvailable();
      setHealthAvailable(available);
      console.log('🏥 [HEALTH] Disponibilité HealthKit:', available);
    } catch (error) {
      console.error('❌ [HEALTH] Erreur vérification disponibilité:', error);
    }
  };

  const loadPermissions = async () => {
    try {
      const currentPermissions = await AppleHealthManager.checkPermissions();
      setPermissions(currentPermissions);
      console.log('🔍 [HEALTH] Permissions actuelles:', currentPermissions);
    } catch (error) {
      console.error('❌ [HEALTH] Erreur chargement permissions:', error);
    }
  };

  const requestHealthPermissions = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    
    try {
      console.log('🔄 [HEALTH] Demande de permissions Apple Health...');
      
      if (!healthAvailable) {
        Alert.alert(
          'Apple Health non disponible',
          'Apple Health n\'est pas disponible sur cet appareil.',
          [{ text: 'OK' }]
        );
        return;
      }

      const granted = await AppleHealthManager.requestPermissions();
      
      if (granted) {
        await loadPermissions();
        await loadHealthData();
        
        Alert.alert(
          '✅ Permissions accordées',
          'Vous pouvez maintenant synchroniser vos données Apple Health.',
          [
            {
              text: 'Voir mes données',
              onPress: () => loadHealthData()
            },
            { text: 'OK', style: 'default' }
          ]
        );
      } else {
        Alert.alert(
          'Permissions refusées',
          'Pour utiliser cette fonctionnalité, vous devez autoriser l\'accès à Apple Health dans les Réglages > Confidentialité et sécurité > Santé.',
          [
            {
              text: 'Ouvrir Réglages',
              onPress: () => {
                // On peut pas ouvrir directement les réglages, mais on peut donner des instructions
                Alert.alert(
                  'Instructions',
                  'Allez dans Réglages iOS > Confidentialité et sécurité > Santé > EatFit pour autoriser l\'accès aux données.'
                );
              }
            },
            { text: 'Annuler', style: 'cancel' }
          ]
        );
      }
    } catch (error) {
      console.error('❌ [HEALTH] Erreur demande permissions:', error);
      Alert.alert(
        'Erreur',
        'Une erreur s\'est produite lors de la demande de permissions.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const loadHealthData = async () => {
    try {
      console.log('🔄 [HEALTH] Chargement données santé...');
      
      const today = new Date();
      const startDate = new Date(today);
      startDate.setDate(today.getDate() - 7); // 7 derniers jours

      const [steps, heartRate, workouts] = await Promise.all([
        AppleHealthManager.getStepsData(startDate, today),
        AppleHealthManager.getHeartRateData(startDate, today),
        AppleHealthManager.getWorkouts(startDate, today)
      ]);

      setHealthData({
        steps,
        heartRate,
        workouts
      });

      console.log('✅ [HEALTH] Données chargées:', { steps, heartRateCount: heartRate.length, workoutsCount: workouts.length });
    } catch (error) {
      console.error('❌ [HEALTH] Erreur chargement données:', error);
    }
  };

  const hasAnyPermission = Object.values(permissions).some(permission => permission);

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#0A0A0A', '#1a1a1a']}
        style={styles.gradient}
      >
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Text style={styles.backButtonText}>← Retour</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Apple Health</Text>
          </View>

          {/* Statut de disponibilité */}
          <View style={styles.statusCard}>
            <Text style={styles.statusTitle}>
              {healthAvailable ? '✅ Apple Health disponible' : '❌ Apple Health non disponible'}
            </Text>
            <Text style={styles.statusDescription}>
              {healthAvailable 
                ? 'Vous pouvez synchroniser vos données de santé avec EatFit.'
                : 'Apple Health n\'est pas disponible sur cet appareil.'
              }
            </Text>
          </View>

          {healthAvailable && (
            <>
              {/* Section Permissions */}
              <View style={styles.permissionsCard}>
                <Text style={styles.cardTitle}>Permissions Apple Health</Text>
                
                <View style={styles.permissionsList}>
                  <View style={styles.permissionItem}>
                    <Text style={styles.permissionName}>Pas</Text>
                    <Text style={[styles.permissionStatus, permissions.steps && styles.permissionGranted]}>
                      {permissions.steps ? '✅ Autorisé' : '❌ Non autorisé'}
                    </Text>
                  </View>
                  
                  <View style={styles.permissionItem}>
                    <Text style={styles.permissionName}>Fréquence cardiaque</Text>
                    <Text style={[styles.permissionStatus, permissions.heartRate && styles.permissionGranted]}>
                      {permissions.heartRate ? '✅ Autorisé' : '❌ Non autorisé'}
                    </Text>
                  </View>
                  
                  <View style={styles.permissionItem}>
                    <Text style={styles.permissionName}>Énergie active</Text>
                    <Text style={[styles.permissionStatus, permissions.activeEnergy && styles.permissionGranted]}>
                      {permissions.activeEnergy ? '✅ Autorisé' : '❌ Non autorisé'}
                    </Text>
                  </View>
                  
                  <View style={styles.permissionItem}>
                    <Text style={styles.permissionName}>Séances d'entraînement</Text>
                    <Text style={[styles.permissionStatus, permissions.workouts && styles.permissionGranted]}>
                      {permissions.workouts ? '✅ Autorisé' : '❌ Non autorisé'}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.actionButton, hasAnyPermission && styles.actionButtonSecondary]}
                  onPress={requestHealthPermissions}
                  disabled={isLoading}
                >
                  <Text style={[styles.actionButtonText, hasAnyPermission && styles.actionButtonTextSecondary]}>
                    {isLoading ? 'Chargement...' : hasAnyPermission ? 'Mettre à jour les permissions' : 'Demander les permissions'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Données de santé */}
              {hasAnyPermission && (
                <View style={styles.dataCard}>
                  <Text style={styles.cardTitle}>Vos données (7 derniers jours)</Text>
                  
                  <View style={styles.dataGrid}>
                    <View style={styles.dataItem}>
                      <Text style={styles.dataLabel}>Pas</Text>
                      <Text style={styles.dataValue}>{healthData.steps.toLocaleString()}</Text>
                    </View>
                    
                    <View style={styles.dataItem}>
                      <Text style={styles.dataLabel}>Mesures FC</Text>
                      <Text style={styles.dataValue}>{healthData.heartRate.length}</Text>
                    </View>
                    
                    <View style={styles.dataItem}>
                      <Text style={styles.dataLabel}>Séances</Text>
                      <Text style={styles.dataValue}>{healthData.workouts.length}</Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.refreshButton}
                    onPress={loadHealthData}
                  >
                    <Text style={styles.refreshButtonText}>🔄 Actualiser les données</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}

          {/* Informations */}
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>À propos de l'intégration Apple Health</Text>
            <Text style={styles.infoText}>
              • EatFit peut lire vos données de pas, fréquence cardiaque et séances d'entraînement{'\n'}
              • EatFit peut écrire vos séances créées dans l'app{'\n'}
              • Vos données restent privées et chiffrées{'\n'}
              • Vous pouvez révoquer les permissions à tout moment dans les Réglages iOS
            </Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 30,
  },
  backButton: {
    marginRight: 15,
  },
  backButtonText: {
    fontSize: 16,
    color: '#28A745',
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statusCard: {
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#21262D',
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  statusDescription: {
    fontSize: 14,
    color: '#8B949E',
    lineHeight: 20,
  },
  permissionsCard: {
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#21262D',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  permissionsList: {
    gap: 12,
    marginBottom: 20,
  },
  permissionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  permissionName: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  permissionStatus: {
    fontSize: 12,
    color: '#F85149',
    fontWeight: '600',
  },
  permissionGranted: {
    color: '#28A745',
  },
  actionButton: {
    backgroundColor: '#28A745',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonSecondary: {
    backgroundColor: '#21262D',
  },
  actionButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  actionButtonTextSecondary: {
    color: '#8B949E',
  },
  dataCard: {
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#21262D',
  },
  dataGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dataItem: {
    alignItems: 'center',
    flex: 1,
  },
  dataLabel: {
    fontSize: 12,
    color: '#8B949E',
    marginBottom: 4,
  },
  dataValue: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  refreshButton: {
    backgroundColor: '#3498db',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  refreshButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  infoCard: {
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#21262D',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#8B949E',
    lineHeight: 20,
  },
});
