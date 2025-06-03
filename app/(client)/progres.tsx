
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export default function ProgresScreen() {
  const [selectedTab, setSelectedTab] = useState('Poids');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>EatFitByMax</Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity 
            style={[styles.tab, selectedTab === 'Poids' && styles.activeTab]}
            onPress={() => setSelectedTab('Poids')}
          >
            <Text style={[styles.tabText, selectedTab === 'Poids' && styles.activeTabText]}>
              Poids
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, selectedTab === 'Mensurations' && styles.activeTab]}
            onPress={() => setSelectedTab('Mensurations')}
          >
            <Text style={[styles.tabText, selectedTab === 'Mensurations' && styles.activeTabText]}>
              Mensurations
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, selectedTab === 'Nutrition' && styles.activeTab]}
            onPress={() => setSelectedTab('Nutrition')}
          >
            <Text style={[styles.tabText, selectedTab === 'Nutrition' && styles.activeTabText]}>
              Nutrition
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, selectedTab === 'Fitness' && styles.activeTab]}
            onPress={() => setSelectedTab('Fitness')}
          >
            <Text style={[styles.tabText, selectedTab === 'Fitness' && styles.activeTabText]}>
              Fitness
            </Text>
          </TouchableOpacity>
        </View>

        {/* Weight Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Poids actuel</Text>
            <Text style={styles.statValue}>68.5 kg</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Poids de départ</Text>
            <Text style={styles.statValue}>72.8 kg</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Objectif</Text>
            <Text style={styles.statValue}>65.0 kg</Text>
            <Text style={styles.statSubtext}>- 3.5 kg</Text>
          </View>
        </View>

        {/* Chart Section */}
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Évolution du poids</Text>
          
          {/* Mock Chart */}
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
              
              {/* Weight Loss Line */}
              <View style={styles.weightLine} />
              
              {/* X-axis labels */}
              <View style={styles.xAxis}>
                <Text style={styles.xAxisLabel}>Janv 24</Text>
                <Text style={styles.xAxisLabel}>Mars 24</Text>
                <Text style={styles.xAxisLabel}>Mai 24</Text>
                <Text style={styles.xAxisLabel}>Juil 24</Text>
                <Text style={styles.xAxisLabel}>Sept 24</Text>
                <Text style={styles.xAxisLabel}>Déc 24</Text>
              </View>
            </View>
          </View>
        </View>

        {/* User Info */}
        <View style={styles.userInfoContainer}>
          <Text style={styles.userInfoText}>Maxandre Pacault-Marqué</Text>
          <Text style={styles.userInfoSubtext}>Maximum</Text>
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
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginHorizontal: 2,
    backgroundColor: '#161B22',
    borderWidth: 1,
    borderColor: '#21262D',
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#1F6FEB',
    borderColor: '#1F6FEB',
  },
  tabText: {
    fontSize: 12,
    color: '#8B949E',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 15,
    marginBottom: 30,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#21262D',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#8B949E',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statSubtext: {
    fontSize: 12,
    color: '#8B949E',
    marginTop: 4,
  },
  chartContainer: {
    margin: 20,
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#21262D',
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  chartArea: {
    flexDirection: 'row',
    height: 200,
  },
  yAxis: {
    justifyContent: 'space-between',
    width: 30,
    paddingRight: 10,
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
    bottom: 20,
    justifyContent: 'space-between',
  },
  gridLine: {
    height: 1,
    backgroundColor: '#21262D',
  },
  weightLine: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    height: 100,
    backgroundColor: 'rgba(88, 166, 255, 0.3)',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
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
    fontSize: 10,
    color: '#8B949E',
  },
  userInfoContainer: {
    margin: 20,
    marginTop: 0,
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#21262D',
    marginBottom: 100,
  },
  userInfoText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  userInfoSubtext: {
    fontSize: 14,
    color: '#8B949E',
  },
});
