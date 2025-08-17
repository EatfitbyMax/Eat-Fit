
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
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { getCurrentUser } from '@/utils/auth';
import HealthKitService, { HealthKitData } from '@/utils/healthKit';
import Svg, { Circle, Path } from 'react-native-svg';

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
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasPermissions, setHasPermissions] = useState(false);
  const [healthData, setHealthData] = useState<HealthKitData[]>([]);
  const [todayData, setTodayData] = useState<HealthKitData | null>(null);

  useEffect(() => {
    initializeHealthKit();
  }, []);

  const initializeHealthKit = async () => {
    setIsLoading(true);
    try {
      const initialized = await HealthKitService.initialize();
      
      if (initialized) {
        const permissions = await HealthKitService.hasPermissions();
        setHasPermissions(permissions);
        
        if (permissions) {
          await loadHealthData();
        }
      } else {
        Alert.alert(
          'HealthKit non disponible',
          'HealthKit n\'est pas disponible sur cet appareil ou cette version iOS.'
        );
      }
    } catch (error) {
      console.error('Erreur initialisation HealthKit:', error);
      Alert.alert('Erreur', 'Impossible d\'initialiser HealthKit');
    } finally {
      setIsLoading(false);
    }
  };

  const requestPermissions = async () => {
    try {
      const granted = await HealthKitService.requestPermissions();
      
      if (granted) {
        setHasPermissions(true);
        await loadHealthData();
        Alert.alert('Succès', 'Permissions HealthKit accordées');
      } else {
        Alert.alert(
          'Permissions refusées',
          'Pour utiliser cette fonctionnalité, veuillez autoriser l\'accès à HealthKit dans les Réglages.'
        );
      }
    } catch (error) {
      console.error('Erreur demande permissions:', error);
      Alert.alert('Erreur', 'Impossible de demander les permissions HealthKit');
    }
  };

  const loadHealthData = async () => {
    try {
      const data = await HealthKitService.getAllHealthData(7);
      setHealthData(data);
      
      if (data.length > 0) {
        setTodayData(data[0]); // Données du jour le plus récent
      }

      // Synchroniser avec le serveur
      const user = await getCurrentUser();
      if (user && data.length > 0) {
        await HealthKitService.syncWithServer(user.id, data);
      }
    } catch (error) {
      console.error('Erreur chargement données HealthKit:', error);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadHealthData();
    setIsRefreshing(false);
  };

  const getHealthMetrics = (): HealthMetric[] => {
    if (!todayData) return [];

    return [
      {
        title: 'Pas',
        value: todayData.steps?.toLocaleString() || '0',
        unit: 'pas',
        icon: 'footsteps',
        color: '#007AFF',
        progress: todayData.steps ? Math.min((todayData.steps / 10000) * 100, 100) : 0
      },
      {
        title: 'Fréquence cardiaque',
        value: todayData.heartRate?.toString() || '0',
        unit: 'bpm',
        icon: 'heart',
        color: '#FF3B30'
      },
      {
        title: 'Poids',
        value: todayData.weight?.toFixed(1) || '0',
        unit: 'kg',
        icon: 'barbell',
        color: '#34C759'
      },
      {
        title: 'Calories brûlées',
        value: todayData.activeEnergyBurned?.toString() || '0',
        unit: 'kcal',
        icon: 'flame',
        color: '#FF9500'
      },
      {
        title: 'Distance',
        value: todayData.distanceWalkingRunning?.toFixed(1) || '0',
        unit: 'km',
        icon: 'walk',
        color: '#5856D6'
      },
      {
        title: 'Sommeil',
        value: todayData.sleepHours?.toFixed(1) || '0',
        unit: 'h',
        icon: 'moon',
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
    <View style={[styles.metricCard, { backgroundColor: theme.cardBackground }]}>
      <View style={styles.metricHeader}>
        <Ionicons name={metric.icon as any} size={24} color={metric.color} />
        <Text style={[styles.metricTitle, { color: theme.text }]}>{metric.title}</Text>
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
    </View>
  );

  const WeeklyChart = () => (
    <View style={[styles.chartContainer, { backgroundColor: theme.cardBackground }]}>
      <Text style={[styles.chartTitle, { color: theme.text }]}>Activité de la semaine</Text>
      
      <View style={styles.chartContent}>
        {healthData.slice(0, 7).reverse().map((day, index) => {
          const dayName = new Date(day.timestamp).toLocaleDateString('fr-FR', { weekday: 'short' });
          const stepsHeight = day.steps ? Math.min((day.steps / 15000) * 80, 80) : 0;
          
          return (
            <View key={index} style={styles.chartBar}>
              <View 
                style={[
                  styles.bar, 
                  { 
                    height: stepsHeight,
                    backgroundColor: '#007AFF'
                  }
                ]} 
              />
              <Text style={[styles.chartLabel, { color: theme.secondaryText }]}>
                {dayName}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={[styles.loadingText, { color: theme.text }]}>
            Initialisation HealthKit...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!hasPermissions) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.permissionContainer}>
          <Ionicons name="medical" size={80} color="#007AFF" />
          <Text style={[styles.permissionTitle, { color: theme.text }]}>
            Apple Health
          </Text>
          <Text style={[styles.permissionText, { color: theme.secondaryText }]}>
            Connectez Apple Health pour synchroniser vos données de santé et fitness
          </Text>
          
          <TouchableOpacity 
            style={styles.permissionButton}
            onPress={requestPermissions}
          >
            <Text style={styles.permissionButtonText}>Connecter HealthKit</Text>
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

        {healthData.length > 0 && <WeeklyChart />}

        <View style={[styles.infoCard, { backgroundColor: theme.cardBackground }]}>
          <Ionicons name="information-circle" size={24} color="#007AFF" />
          <View style={styles.infoContent}>
            <Text style={[styles.infoTitle, { color: theme.text }]}>
              Synchronisation automatique
            </Text>
            <Text style={[styles.infoText, { color: theme.secondaryText }]}>
              Vos données sont automatiquement synchronisées depuis Apple Health
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
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
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
    marginBottom: 32,
  },
  permissionButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25,
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
  chartContainer: {
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  chartContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
  },
  chartBar: {
    alignItems: 'center',
    flex: 1,
  },
  bar: {
    width: 20,
    borderRadius: 10,
    marginBottom: 8,
  },
  chartLabel: {
    fontSize: 12,
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
