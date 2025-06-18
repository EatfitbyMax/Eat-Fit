import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export default function ProgresScreen() {
  const [selectedTab, setSelectedTab] = useState('Mesures');
  const progressAnimation = useSharedValue(0);

  React.useEffect(() => {
    progressAnimation.value = withSpring(0.65); // 65% progress towards goal
  }, []);

  const animatedProgressStyle = useAnimatedStyle(() => {
    return {
      width: `${progressAnimation.value * 100}%`,
    };
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header with Gradient */}
        <LinearGradient
          colors={['#F5A623', '#E8941A']}
          style={styles.headerGradient}
        >
          <Text style={styles.title}>Mes progrès</Text>
        </LinearGradient>

        {/* Tabs with improved design */}
        <View style={styles.tabsContainer}>
          {['Mesures', 'Nutrition', 'Sport'].map((tab) => (
            <TouchableOpacity 
              key={tab}
              style={[styles.tab, selectedTab === tab && styles.activeTab]}
              onPress={() => setSelectedTab(tab)}
              activeOpacity={0.8}
            >
              {selectedTab === tab && (
                <LinearGradient
                  colors={['#F5A623', '#E8941A']}
                  style={styles.tabGradient}
                />
              )}
              <Text style={[styles.tabText, selectedTab === tab && styles.activeTabText]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Enhanced Weight Stats */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, styles.currentWeightCard]}>
            <View style={styles.statIcon}>
              <Text style={styles.iconText}>⚖️</Text>
            </View>
            <Text style={styles.statLabel}>Poids actuel</Text>
            <Text style={styles.statValue}>68.5 kg</Text>
            <Text style={styles.statTrend}>↓ -0.8 kg cette semaine</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Text style={styles.iconText}>🎯</Text>
            </View>
            <Text style={styles.statLabel}>Poids de départ</Text>
            <Text style={styles.statValue}>72.8 kg</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Text style={styles.iconText}>🏆</Text>
            </View>
            <Text style={styles.statLabel}>Objectif</Text>
            <Text style={styles.statValue}>65.0 kg</Text>
            <Text style={styles.statSubtext}>- 3.5 kg restants</Text>
          </View>
        </View>

        {/* Progress Card */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Progression vers l'objectif</Text>
            <Text style={styles.progressPercentage}>65%</Text>
          </View>

          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBackground}>
              <Animated.View style={[styles.progressBarFill, animatedProgressStyle]} />
            </View>
          </View>

          <View style={styles.progressLabels}>
            <Text style={styles.progressLabel}>72.8 kg</Text>
            <Text style={styles.progressLabel}>65.0 kg</Text>
          </View>
        </View>

        {/* Enhanced Chart Section */}
        <View style={styles.chartContainer}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Évolution du poids</Text>
            <View style={styles.chartPeriod}>
              <Text style={styles.chartPeriodText}>6 mois</Text>
            </View>
          </View>

          {/* Improved Chart */}
          <View style={styles.chartArea}>
            <View style={styles.yAxis}>
              <Text style={styles.yAxisLabel}>74</Text>
              <Text style={styles.yAxisLabel}>72</Text>
              <Text style={styles.yAxisLabel}>70</Text>
              <Text style={styles.yAxisLabel}>68</Text>
              <Text style={styles.yAxisLabel}>66</Text>
              <Text style={styles.yAxisLabel}>64</Text>
            </View>

            <View style={styles.chartContent}>
              {/* Grid */}
              <View style={styles.gridContainer}>
                {[...Array(6)].map((_, i) => (
                  <View key={i} style={styles.gridLine} />
                ))}
              </View>

              {/* Enhanced Weight Line with Gradient */}
              <LinearGradient
                colors={['rgba(245, 166, 35, 0.3)', 'rgba(245, 166, 35, 0.1)']}
                style={styles.weightLineGradient}
              />
              <View style={styles.weightLine} />

              {/* Data Points */}
              <View style={styles.dataPoints}>
                <View style={[styles.dataPoint, { left: '10%', top: '20%' }]} />
                <View style={[styles.dataPoint, { left: '30%', top: '35%' }]} />
                <View style={[styles.dataPoint, { left: '50%', top: '45%' }]} />
                <View style={[styles.dataPoint, { left: '70%', top: '55%' }]} />
                <View style={[styles.dataPoint, { left: '90%', top: '65%' }]} />
              </View>

              {/* X-axis labels */}
              <View style={styles.xAxis}>
                <Text style={styles.xAxisLabel}>Janv</Text>
                <Text style={styles.xAxisLabel}>Mars</Text>
                <Text style={styles.xAxisLabel}>Mai</Text>
                <Text style={styles.xAxisLabel}>Juil</Text>
                <Text style={styles.xAxisLabel}>Sept</Text>
                <Text style={styles.xAxisLabel}>Déc</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Statistics Summary */}
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>Résumé de la période</Text>
          <View style={styles.summaryStats}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>-4.3 kg</Text>
              <Text style={styles.summaryLabel}>Perte totale</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>0.7 kg</Text>
              <Text style={styles.summaryLabel}>Perte moyenne/mois</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>86%</Text>
              <Text style={styles.summaryLabel}>Régularité</Text>
            </View>
          </View>
        </View>

        {/* Enhanced User Info */}
        <LinearGradient
          colors={['#1A2332', '#161B22']}
          style={styles.userInfoContainer}
        >
          <View style={styles.userInfoHeader}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>MP</Text>
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userInfoText}>Maxandre Pacault-Marqué</Text>
              <Text style={styles.userInfoSubtext}>Maximum</Text>
              <View style={styles.badgeContainer}>
                <Text style={styles.badge}>🔥 Série de 7 jours</Text>
              </View>
            </View>
          </View>
        </LinearGradient>
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
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingTop: 10,
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },

  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 25,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginHorizontal: 3,
    backgroundColor: '#161B22',
    borderWidth: 1,
    borderColor: '#21262D',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  activeTab: {
    borderColor: 'transparent',
    elevation: 4,
    shadowColor: '#F5A623',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  tabGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  tabText: {
    fontSize: 13,
    color: '#8B949E',
    fontWeight: '600',
    zIndex: 1,
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 25,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#161B22',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#21262D',
    alignItems: 'center',
  },
  currentWeightCard: {
    borderColor: '#F5A623',
    borderWidth: 2,
  },
  statIcon: {
    width: 32,
    height: 32,
    backgroundColor: '#21262D',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconText: {
    fontSize: 16,
  },
  statLabel: {
    fontSize: 12,
    color: '#8B949E',
    marginBottom: 6,
    textAlign: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statTrend: {
    fontSize: 11,
    color: '#28A745',
    fontWeight: '600',
  },
  statSubtext: {
    fontSize: 11,
    color: '#8B949E',
  },
  progressCard: {
    marginHorizontal: 20,
    backgroundColor: '#161B22',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#21262D',
    marginBottom: 25,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  progressPercentage: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F5A623',
  },
  progressBarContainer: {
    marginBottom: 12,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#21262D',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#F5A623',
    borderRadius: 4,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    fontSize: 12,
    color: '#8B949E',
  },
  chartContainer: {
    margin: 20,
    backgroundColor: '#161B22',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#21262D',
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  chartPeriod: {
    backgroundColor: '#21262D',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  chartPeriodText: {
    fontSize: 12,
    color: '#8B949E',
    fontWeight: '500',
  },
  chartArea: {
    flexDirection: 'row',
    height: 200,
  },
  yAxis: {
    justifyContent: 'space-between',
    width: 35,
    paddingRight: 12,
  },
  yAxisLabel: {
    fontSize: 12,
    color: '#8B949E',
    textAlign: 'right',
  },
  chartContent: {
    flex: 1,
    position: 'relative',
  },
  gridContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 25,
    justifyContent: 'space-between',
  },
  gridLine: {
    height: 1,
    backgroundColor: '#21262D',
  },
  weightLineGradient: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    height: 120,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  weightLine: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#F5A623',
    borderRadius: 2,
  },
  dataPoints: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 25,
  },
  dataPoint: {
    position: 'absolute',
    width: 8,
    height: 8,
    backgroundColor: '#F5A623',
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  xAxis: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  xAxisLabel: {
    fontSize: 11,
    color: '#8B949E',
    fontWeight: '500',
  },
  summaryContainer: {
    marginHorizontal: 20,
    backgroundColor: '#161B22',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#21262D',
    marginBottom: 25,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F5A623',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#8B949E',
    textAlign: 'center',
  },
  userInfoContainer: {
    margin: 20,
    marginTop: 0,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#21262D',
    marginBottom: 100,
  },
  userInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 50,
    height: 50,
    backgroundColor: '#F5A623',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  userDetails: {
    flex: 1,
  },
  userInfoText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  userInfoSubtext: {
    fontSize: 14,
    color: '#8B949E',
    marginBottom: 8,
  },
  badgeContainer: {
    alignSelf: 'flex-start',
  },
  badge: {
    fontSize: 12,
    color: '#F5A623',
    backgroundColor: 'rgba(245, 166, 35, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    fontWeight: '500',
  },
});