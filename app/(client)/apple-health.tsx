
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  SafeAreaView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import useHealthData from '@/hooks/useHealthData';

export default function AppleHealthScreen() {
  const { theme } = useTheme();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);
  
  const {
    steps,
    flights,
    distance,
    heartRate,
    weight,
    activeEnergy,
    sleepHours,
    hasPermissions,
    isLoading,
    error,
    writeWeight
  } = useHealthData(selectedDate);

  const onRefresh = async () => {
    setRefreshing(true);
    // Force refresh by changing date slightly
    setSelectedDate(new Date(selectedDate.getTime() + 1));
    setTimeout(() => {
      setSelectedDate(new Date(selectedDate.getTime() - 1));
      setRefreshing(false);
    }, 1000);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    setSelectedDate(newDate);
  };

  const HealthMetricCard = ({ 
    icon, 
    title, 
    value, 
    unit, 
    color,
    onPress 
  }: {
    icon: string;
    title: string;
    value: string | number;
    unit: string;
    color: string;
    onPress?: () => void;
  }) => (
    <TouchableOpacity 
      style={[styles.metricCard, { backgroundColor: theme.card, borderColor: theme.border }]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.metricHeader}>
        <Ionicons name={icon as any} size={24} color={color} />
        <Text style={[styles.metricTitle, { color: theme.text }]}>{title}</Text>
      </View>
      <Text style={[styles.metricValue, { color: theme.text }]}>{value}</Text>
      <Text style={[styles.metricUnit, { color: theme.secondaryText }]}>{unit}</Text>
    </TouchableOpacity>
  );

  if (Platform.OS !== 'ios') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.messageContainer}>
          <Ionicons name="phone-portrait-outline" size={80} color="#FF9500" />
          <Text style={[styles.title, { color: theme.text }]}>
            iOS uniquement
          </Text>
          <Text style={[styles.message, { color: theme.secondaryText }]}>
            Apple Health est disponible uniquement sur les appareils iOS.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!hasPermissions && !isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.messageContainer}>
          <Ionicons name="shield-outline" size={80} color="#FF9500" />
          <Text style={[styles.title, { color: theme.text }]}>
            Permissions requises
          </Text>
          <Text style={[styles.message, { color: theme.secondaryText }]}>
            Veuillez autoriser l'accès à Apple Health dans les réglages de votre iPhone.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.messageContainer}>
          <Ionicons name="alert-circle-outline" size={80} color="#FF3B30" />
          <Text style={[styles.title, { color: theme.text }]}>
            Erreur
          </Text>
          <Text style={[styles.message, { color: theme.secondaryText }]}>
            {error}
          </Text>
          <TouchableOpacity 
            style={[styles.retryButton, { backgroundColor: theme.primary }]}
            onPress={onRefresh}
          >
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient
        colors={[theme.primary + '20', 'transparent']}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Apple Health</Text>
          <View style={styles.dateNavigation}>
            <TouchableOpacity onPress={() => navigateDate('prev')}>
              <Ionicons name="chevron-back" size={24} color={theme.text} />
            </TouchableOpacity>
            <Text style={[styles.dateText, { color: theme.text }]}>
              {formatDate(selectedDate)}
            </Text>
            <TouchableOpacity 
              onPress={() => navigateDate('next')}
              disabled={selectedDate.toDateString() === new Date().toDateString()}
            >
              <Ionicons 
                name="chevron-forward" 
                size={24} 
                color={selectedDate.toDateString() === new Date().toDateString() ? theme.border : theme.text} 
              />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.metricsGrid}>
          <HealthMetricCard
            icon="walk"
            title="Pas"
            value={steps.toLocaleString()}
            unit="pas"
            color="#00C896"
          />
          
          <HealthMetricCard
            icon="trending-up"
            title="Étages"
            value={flights}
            unit="étages"
            color="#FF6B35"
          />
          
          <HealthMetricCard
            icon="location"
            title="Distance"
            value={(distance / 1000).toFixed(2)}
            unit="km"
            color="#007AFF"
          />
          
          <HealthMetricCard
            icon="heart"
            title="Fréquence cardiaque"
            value={heartRate || '--'}
            unit="bpm"
            color="#FF3B30"
          />
          
          <HealthMetricCard
            icon="scale"
            title="Poids"
            value={weight ? weight.toFixed(1) : '--'}
            unit="kg"
            color="#8E8E93"
          />
          
          <HealthMetricCard
            icon="flame"
            title="Calories actives"
            value={Math.round(activeEnergy)}
            unit="cal"
            color="#FF9500"
          />
          
          <HealthMetricCard
            icon="moon"
            title="Sommeil"
            value={sleepHours || '--'}
            unit="heures"
            color="#5856D6"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerGradient: {
    paddingTop: 20,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  dateNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricCard: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  metricUnit: {
    fontSize: 12,
  },
  messageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 24,
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
