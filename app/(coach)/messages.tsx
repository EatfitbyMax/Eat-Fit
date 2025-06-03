
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, TextInput } from 'react-native';

export default function MessagesScreen() {
  const [selectedTab, setSelectedTab] = useState('Messages directs');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Communication avec les clients</Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, selectedTab === 'Messages directs' && styles.activeTab]}
            onPress={() => setSelectedTab('Messages directs')}
          >
            <Text style={[styles.tabText, selectedTab === 'Messages directs' && styles.activeTabText]}>
              Messages directs
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tab, selectedTab === 'Annonces' && styles.activeTab]}
            onPress={() => setSelectedTab('Annonces')}
          >
            <Text style={[styles.tabText, selectedTab === 'Annonces' && styles.activeTabText]}>
              Annonces
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.mainContent}>
          {/* Left Panel - Clients */}
          <View style={styles.leftPanel}>
            <Text style={styles.panelTitle}>Clients</Text>
            <Text style={styles.panelSubtitle}>Sélectionnez un client pour discuter</Text>
            
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher un client..."
              placeholderTextColor="#8B949E"
            />
            
            <TouchableOpacity style={styles.clientItem}>
              <View style={styles.clientAvatar}>
                <Text style={styles.clientAvatarText}>MP</Text>
              </View>
              <View style={styles.clientInfo}>
                <Text style={styles.clientName}>Maxandre Pacull-Marquié</Text>
                <Text style={styles.clientEmail}>m.pacullmarquie@gmail.com</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Right Panel - Chat */}
          <View style={styles.rightPanel}>
            <View style={styles.chatHeader}>
              <Text style={styles.chatTitle}>Sélectionnez un client</Text>
              <Text style={styles.chatSubtitle}>Choisissez un client dans la liste pour commencer une conversation</Text>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1117',
  },
  content: {
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
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#21262D',
    alignItems: 'center',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  activeTab: {
    backgroundColor: '#161B22',
    borderBottomWidth: 2,
    borderBottomColor: '#F5A623',
  },
  tabText: {
    fontSize: 14,
    color: '#8B949E',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  mainContent: {
    flex: 1,
    flexDirection: 'row',
    marginHorizontal: 20,
  },
  leftPanel: {
    width: '35%',
    backgroundColor: '#161B22',
    borderRadius: 8,
    padding: 16,
    marginRight: 20,
  },
  panelTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  panelSubtitle: {
    fontSize: 12,
    color: '#8B949E',
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: '#0D1117',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 16,
  },
  clientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: '#F5A623',
    borderRadius: 6,
  },
  clientAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0D1117',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  clientAvatarText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#F5A623',
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  clientEmail: {
    fontSize: 10,
    color: '#333333',
  },
  rightPanel: {
    flex: 1,
    backgroundColor: '#161B22',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  chatHeader: {
    alignItems: 'center',
  },
  chatTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  chatSubtitle: {
    fontSize: 14,
    color: '#8B949E',
    textAlign: 'center',
    lineHeight: 20,
  },
});
