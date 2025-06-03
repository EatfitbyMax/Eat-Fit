
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, TextInput } from 'react-native';

export default function CoachScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>EatFitByMax</Text>
        </View>

        {/* Coach Info */}
        <View style={styles.coachCard}>
          <View style={styles.coachHeader}>
            <View style={styles.coachAvatar}>
              <Text style={styles.coachAvatarText}>MR</Text>
            </View>
            <View style={styles.coachInfo}>
              <Text style={styles.coachName}>Maxime Renard</Text>
              <Text style={styles.coachRole}>Coach Nutrition & Fitness</Text>
              <Text style={styles.coachLocation}>Disponibilité: Lun-Ven, 8h-18h</Text>
            </View>
          </View>
          
          <View style={styles.coachActions}>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionButtonText}>📞 Appel vidéo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionButtonText}>📧 Appel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionButtonText}>📅 Rendez-vous</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity style={[styles.tab, styles.activeTab]}>
            <Text style={[styles.tabText, styles.activeTabText]}>Messages</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tab}>
            <Text style={styles.tabText}>Rendez-vous</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tab}>
            <Text style={styles.tabText}>Plans</Text>
          </TouchableOpacity>
        </View>

        {/* Messages Section */}
        <View style={styles.messagesContainer}>
          <Text style={styles.sectionTitle}>Conversation</Text>
          
          <View style={styles.emptyMessages}>
            <Text style={styles.emptyTitle}>Aucun message dans cette conversation.</Text>
            <Text style={styles.emptySubtitle}>Envoyez un message pour commencer!</Text>
          </View>
        </View>
      </ScrollView>

      {/* Message Input */}
      <View style={styles.messageInputContainer}>
        <TextInput
          style={styles.messageInput}
          placeholder="Tapez votre message..."
          placeholderTextColor="#8B949E"
          multiline
        />
        <TouchableOpacity style={styles.sendButton}>
          <Text style={styles.sendButtonText}>➤</Text>
        </TouchableOpacity>
      </View>
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
  coachCard: {
    margin: 20,
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#21262D',
  },
  coachHeader: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  coachAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F5A623',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  coachAvatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
  },
  coachInfo: {
    flex: 1,
  },
  coachName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  coachRole: {
    fontSize: 14,
    color: '#8B949E',
    marginBottom: 4,
  },
  coachLocation: {
    fontSize: 12,
    color: '#8B949E',
  },
  coachActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#21262D',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 4,
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
    fontSize: 14,
    color: '#8B949E',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  messagesContainer: {
    margin: 20,
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#21262D',
    minHeight: 300,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  emptyMessages: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 16,
    color: '#8B949E',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#8B949E',
    textAlign: 'center',
  },
  messageInputContainer: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#161B22',
    borderTopWidth: 1,
    borderTopColor: '#21262D',
    alignItems: 'flex-end',
  },
  messageInput: {
    flex: 1,
    backgroundColor: '#0D1117',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#21262D',
    maxHeight: 100,
    marginRight: 12,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F5A623',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonText: {
    fontSize: 18,
    color: '#000000',
  },
});
