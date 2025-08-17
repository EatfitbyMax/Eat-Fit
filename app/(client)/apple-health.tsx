
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import useHealthData from '@/hooks/useHealthData';
import Svg, { Circle } from 'react-native-svg';

const { width } = Dimensions.get('window');

interface HealthMetric {
  title: string;
  value: string;
  unit: string;
  icon: string;
  color: string;
  progress?: number;
}

export default function AppleHealthScreen() {
  const { theme } = useTheme();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isMounted, setIsMounted] = useState(false);
  const { 
    steps, 
    flights, 
    distance, 
    heartRate, 
    weight, 
    activeEnergy,
    hasPermissions, 
    isLoading,
    error,
    writeWeight 
  } = useHealthData(currentDate);

  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    // Délai plus long pour s'assurer que tout est initialisé
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const onRefresh = async () => {
    setIsRefreshing(true);
    // Force un nouveau rendu en changeant la date puis en la remettant
    const temp = new Date();
    setCurrentDate(new Date(temp.getTime() + 1));
    setTimeout(() => {
      setCurrentDate(temp);
      setIsRefreshing(false);
    }, 1500);
  };

  const handleWeightUpdate = () => {
    if (!hasPermissions) {
      Alert.alert('Permissions requises', 'Vous devez d\'abord autoriser l\'accès à Apple Health.');
      return;
    }

    Alert.prompt(
      'Mettre à jour le poids',
      'Entrez votre poids en kg:',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'OK',
          onPress: async (text) => {
            const weightValue = parseFloat(text || '0');
            if (weightValue > 0 && weightValue < 300) {
              const success = await writeWeight(weightValue);
              if (success) {
                Alert.alert('Succès', 'Poids mis à jour dans HealthKit');
              } else {
                Alert.alert('Erreur', 'Impossible de mettre à jour le poids');
              }
            } else {
              Alert.alert('Erreur', 'Veuillez entrer un poids valide');
            }
          }
        }
      ],
      'plain-text',
      weight?.toString() || ''
    );
  };

  const getHealthMetrics = (): HealthMetric[] => {
    return [
      {
        title: 'Pas',
        value: steps.toLocaleString(),
        unit: 'pas',
        icon: 'footsteps',
        color: '#007AFF',
        progress: steps ? Math.min((steps / 10000) * 100, 100) : 0
      },
      {
        title: 'Fréquence cardiaque',
        value: heartRate > 0 ? heartRate.toString() : '--',
        unit: 'bpm',
        icon: 'heart',
        color: '#FF3B30'
      },
      {
        title: 'Poids',
        value: weight ? weight.toFixed(1) : '--',
        unit: 'kg',
        icon: 'barbell',
        color: '#34C759'
      },
      {
        title: 'Calories brûlées',
        value: activeEnergy > 0 ? Math.round(activeEnergy).toString() : '--',
        unit: 'kcal',
        icon: 'flame',
        color: '#FF9500'
      },
      {
        title: 'Distance',
        value: distance > 0 ? (distance / 1000).toFixed(1) : '--',
        unit: 'km',
        icon: 'walk',
        color: '#5856D6'
      },
      {
        title: 'Étages montés',
        value: flights > 0 ? flights.toString() : '--',
        unit: 'étages',
        icon: 'trending-up',
        color: '#AF52DE'
      }
    ];
  };

  const CircularProgress = ({ progress, size = 60, strokeWidth = 6, color = '#007AFF' }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#E5E5EA"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>
        <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={{ fontSize: 12, fontWeight: 'bold', color: theme.text }}>
            {Math.round(progress)}%
          </Text>
        </View>
      </View>
    );
  };

  const HealthMetricCard = ({ metric }: { metric: HealthMetric }) => (
    <TouchableOpacity 
      style={[styles.metricCard, { backgroundColor: theme.cardBackground }]}
      onPress={metric.title === 'Poids' ? handleWeightUpdate : undefined}
      disabled={!hasPermissions}
    >
      <View style={styles.metricHeader}>
        <Ionicons name={metric.icon as any} size={24} color={metric.color} />
        <Text style={[styles.metricTitle, { color: theme.text }]}>{metric.title}</Text>
        {metric.title === 'Poids' && hasPermissions && (
          <Ionicons name="create-outline" size={16} color={theme.secondaryText} style={{ marginLeft: 'auto' }} />
        )}
      </View>

      <View style={styles.metricContent}>
        <View style={styles.metricValue}>
          <Text style={[styles.value, { color: theme.text }]}>{metric.value}</Text>
          <Text style={[styles.unit, { color: theme.secondaryText }]}>{metric.unit}</Text>
        </View>

        {metric.progress !== undefined && (
          <CircularProgress 
            progress={metric.progress} 
            color={metric.color}
            size={50}
          />
        )}
      </View>
    </TouchableOpacity>
  );

  // Attendre que le composant soit complètement monté
  if (!isMounted) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={[styles.loadingText, { color: theme.text }]}>
            Préparation d'Apple Health...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (Platform.OS !== 'ios') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.permissionContainer}>
          <Ionicons name="phone-portrait" size={80} color="#FF9500" />
          <Text style={[styles.permissionTitle, { color: theme.text }]}>
            iOS uniquement
          </Text>
          <Text style={[styles.permissionText, { color: theme.secondaryText }]}>
            Apple Health n'est disponible que sur les appareils iOS
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={[styles.loadingText, { color: theme.text }]}>
            Initialisation HealthKit...
          </Text>
          {error && (
            <Text style={[styles.errorText, { color: '#FF3B30', marginTop: 16 }]}>
              {error}
            </Text>
          )}
        </View>
      </SafeAreaView>
    );
  }

  if (!hasPermissions || error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.permissionContainer}>
          <Ionicons name="medical" size={80} color="#007AFF" />
          <Text style={[styles.permissionTitle, { color: theme.text }]}>
            Apple Health
          </Text>
          
          {error ? (
            <>
              <Text style={[styles.permissionText, { color: '#FF3B30', fontWeight: '600' }]}>
                Erreur: {error}
              </Text>
              
              <Text style={[styles.permissionText, { color: theme.secondaryText, marginTop: 16, fontSize: 14 }]}>
                🔧 Solutions possibles:
                {'\n\n'}
                • Si "non disponible sur cet appareil" : l'app doit être installée via TestFlight ou App Store avec un provisioning profile incluant HealthKit
                {'\n\n'}
                • Si "entitlements manquants" : le build EAS doit être refait avec la bonne configuration
                {'\n\n'}
                • Si "accès refusé" : allez dans Réglages iOS > Confidentialité et sécurité > Santé > EatFit
                {'\n\n'}
                • Si "undefined is not a function" : problème de version du module react-native-health
              </Text>
            </>
          ) : (
            <Text style={[styles.permissionText, { color: theme.secondaryText }]}>
              Pour utiliser cette fonctionnalité, vous devez autoriser l'accès à HealthKit.
            </Text>
          )}

          <Text style={[styles.permissionText, { color: theme.secondaryText, marginTop: 16 }]}>
            📋 Instructions:
            {'\n\n'}
            1. L'application doit demander automatiquement les permissions HealthKit
            {'\n'}
            2. Si rien ne s'affiche, allez dans Réglages iOS > Confidentialité et sécurité > Santé > EatFit
            {'\n'}
            3. Activez toutes les permissions pour les données de santé
            {'\n\n'}
            ⚠️ Note: HealthKit ne fonctionne que sur un vrai appareil iOS (pas sur simulateur) et avec une app correctement signée.
          </Text>

          <TouchableOpacity 
            style={styles.permissionButton}
            onPress={() => {
              // Forcer une nouvelle initialisation
              setIsMounted(false);
              setTimeout(() => {
                setIsMounted(true);
              }, 100);
            }}
          >
            <Text style={styles.permissionButtonText}>Réessayer</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.permissionButton, { backgroundColor: '#34C759', marginTop: 16 }]}
            onPress={() => {
              Alert.alert(
                'Configuration manuelle',
                'Si la demande automatique ne fonctionne pas :\n\n1. Allez dans Réglages iOS\n2. Confidentialité et sécurité\n3. Santé\n4. Données et accès\n5. EatFit\n6. Activez toutes les permissions',
                [{ text: 'OK' }]
              );
            }}
          >
            <Text style={styles.permissionButtonText}>Guide configuration</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Apple Health</Text>
          <Text style={[styles.subtitle, { color: theme.secondaryText }]}>
            Données synchronisées depuis HealthKit
          </Text>
        </View>

        <View style={styles.metricsGrid}>
          {getHealthMetrics().map((metric, index) => (
            <HealthMetricCard key={index} metric={metric} />
          ))}
        </View>

        <View style={[styles.infoCard, { backgroundColor: theme.cardBackground }]}>
          <Ionicons name="information-circle" size={24} color="#007AFF" />
          <View style={styles.infoContent}>
            <Text style={[styles.infoTitle, { color: theme.text }]}>
              Synchronisation en temps réel
            </Text>
            <Text style={[styles.infoText, { color: theme.secondaryText }]}>
              Vos données sont récupérées directement depuis Apple Health. Tirez vers le bas pour actualiser.
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  permissionTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 24,
    marginBottom: 16,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 16,
  },
  permissionButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25,
    marginTop: 16,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
  },
  metricsGrid: {
    padding: 16,
  },
  metricCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  metricContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricValue: {
    flex: 1,
  },
  value: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  unit: {
    fontSize: 14,
    marginTop: 2,
  },
  infoCard: {
    margin: 16,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
