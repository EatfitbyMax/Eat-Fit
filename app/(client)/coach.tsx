
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, TextInput, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { getMessages, saveMessages } from '../../utils/storage';
import { getCurrentUser } from '../../utils/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Message {
  id: string;
  text: string;
  sender: 'coach' | 'client';
  timestamp: Date;
}

interface CoachInfo {
  prenom: string;
  nom: string;
  email: string;
  specialite: string;
  disponibilites: string;
}

export default function CoachScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [coachInfo, setCoachInfo] = useState<CoachInfo>({
    prenom: 'Maxime',
    nom: 'Renard',
    email: 'eatfitbymax@gmail.com',
    specialite: 'Coach Nutrition & Fitness',
    disponibilites: 'Lun-Ven, 8h-18h'
  });

  useEffect(() => {
    initUser();
    loadCoachInfo();
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadMessages();
    }
  }, [currentUser]);

  const initUser = async () => {
    const user = await getCurrentUser();
    setCurrentUser(user);
  };

  const loadCoachInfo = async () => {
    try {
      const savedInfo = await AsyncStorage.getItem('coachInfo');
      if (savedInfo) {
        setCoachInfo(JSON.parse(savedInfo));
      }
    } catch (error) {
      console.error('Erreur chargement infos coach:', error);
    }
  };

  const loadMessages = async () => {
    if (!currentUser?.id) return;
    
    try {
      const messagesData = await getMessages(currentUser.id);
      setMessages(messagesData);
    } catch (error) {
      console.error('Erreur chargement messages:', error);
    }
  };

  const sendMessage = async () => {
    if (messageText.trim() && currentUser?.id) {
      const newMessage: Message = {
        id: Date.now().toString(),
        text: messageText.trim(),
        sender: 'client',
        timestamp: new Date()
      };
      const updatedMessages = [...messages, newMessage];
      setMessages(updatedMessages);
      setMessageText('');
      
      // Sauvegarder sur le serveur
      try {
        await saveMessages(currentUser.id, updatedMessages);
      } catch (error) {
        console.error('Erreur sauvegarde messages:', error);
      }
    }
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[
      styles.messageContainer,
      item.sender === 'client' ? styles.messageFromClient : styles.messageFromCoach
    ]}>
      <Text style={[
        styles.messageText,
        item.sender === 'client' ? styles.messageTextClient : styles.messageTextCoach
      ]}>
        {item.text}
      </Text>
      <Text style={styles.messageTime}>
        {new Date(item.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Coach</Text>
        </View>

        {/* Coach Info */}
        <View style={styles.coachCard}>
          <View style={styles.coachHeader}>
            <View style={styles.coachAvatar}>
              <Text style={styles.coachAvatarText}>
                {coachInfo.prenom[0]?.toUpperCase()}{coachInfo.nom[0]?.toUpperCase()}
              </Text>
            </View>
            <View style={styles.coachInfo}>
              <Text style={styles.coachName}>{coachInfo.prenom} {coachInfo.nom}</Text>
              <Text style={styles.coachRole}>{coachInfo.specialite}</Text>
              <Text style={styles.coachLocation}>Disponibilité: {coachInfo.disponibilites}</Text>
            </View>
          </View>
          
          <View style={styles.coachActions}>
            <TouchableOpacity style={styles.appointmentButton}>
              <Text style={styles.appointmentButtonText}>📅 Prendre rendez-vous avec le coach</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Messages Interface */}
        <KeyboardAvoidingView 
          style={styles.messagesContainer} 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.messagesHeader}>
            <Text style={styles.messagesTitle}>💬 Messages avec votre coach</Text>
          </View>
          
          <FlatList
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            style={styles.messagesList}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.messagesListContent}
            ListEmptyComponent={
              <View style={styles.emptyMessages}>
                <Text style={styles.emptyMessagesText}>
                  Aucun message avec votre coach.
                </Text>
                <Text style={styles.emptyMessagesSubtext}>
                  Envoyez un message pour commencer !
                </Text>
              </View>
            }
          />

          <View style={styles.messageInputContainer}>
            <TextInput
              style={styles.messageInput}
              placeholder="Tapez votre message..."
              placeholderTextColor="#8B949E"
              value={messageText}
              onChangeText={setMessageText}
              multiline
              maxLength={500}
            />
            <TouchableOpacity 
              style={[styles.sendButton, !messageText.trim() && styles.sendButtonDisabled]}
              onPress={sendMessage}
              disabled={!messageText.trim()}
            >
              <Text style={styles.sendButtonText}>➤</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>

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
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  coachCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#161B22',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#21262D',
  },
  coachHeader: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'center',
  },
  coachAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F5A623',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  coachAvatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
  },
  coachInfo: {
    flex: 1,
  },
  coachName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  coachRole: {
    fontSize: 15,
    color: '#8B949E',
    marginBottom: 4,
  },
  coachLocation: {
    fontSize: 13,
    color: '#8B949E',
  },
  coachActions: {
    marginTop: 16,
  },
  appointmentButton: {
    backgroundColor: '#F5A623',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  appointmentButtonText: {
    fontSize: 14,
    color: '#000000',
    fontWeight: 'bold',
    textAlign: 'center',
    numberOfLines: 1,
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
  tabsContainer: {
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
    marginHorizontal: 2,
  },
  activeTab: {
    backgroundColor: '#161B22',
    borderBottomWidth: 3,
    borderBottomColor: '#F5A623',
  },
  tabText: {
    fontSize: 14,
    color: '#8B949E',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  messagesContainer: {
    flex: 1,
    marginHorizontal: 16,
    marginBottom: 20,
    backgroundColor: '#161B22',
    borderRadius: 16,
    overflow: 'hidden',
  },
  messagesHeader: {
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#21262D',
  },
  messagesTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  messagesList: {
    flex: 1,
    minHeight: 200,
  },
  messagesListContent: {
    padding: 16,
    flexGrow: 1,
    paddingBottom: 20,
  },
  messageContainer: {
    marginBottom: 14,
    maxWidth: '85%',
  },
  messageFromClient: {
    alignSelf: 'flex-end',
  },
  messageFromCoach: {
    alignSelf: 'flex-start',
  },
  messageText: {
    padding: 14,
    borderRadius: 18,
    fontSize: 15,
    lineHeight: 22,
  },
  messageTextClient: {
    backgroundColor: '#F5A623',
    color: '#000000',
    borderBottomRightRadius: 6,
  },
  messageTextCoach: {
    backgroundColor: '#21262D',
    color: '#FFFFFF',
    borderBottomLeftRadius: 6,
  },
  messageTime: {
    fontSize: 11,
    color: '#8B949E',
    marginTop: 6,
    textAlign: 'right',
  },
  emptyMessages: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    paddingHorizontal: 20,
  },
  emptyMessagesText: {
    fontSize: 17,
    color: '#8B949E',
    textAlign: 'center',
    marginBottom: 10,
    fontWeight: '500',
  },
  emptyMessagesSubtext: {
    fontSize: 15,
    color: '#8B949E',
    textAlign: 'center',
    lineHeight: 20,
  },
  messageInputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#1C2128',
    borderTopWidth: 1,
    borderTopColor: '#21262D',
    alignItems: 'flex-end',
    paddingBottom: 20,
  },
  messageInput: {
    flex: 1,
    backgroundColor: '#0D1117',
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 14,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#21262D',
    maxHeight: 120,
    marginRight: 12,
    fontSize: 15,
    lineHeight: 20,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F5A623',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#21262D',
  },
  sendButtonText: {
    fontSize: 20,
    color: '#000000',
    fontWeight: 'bold',
  },
});
