
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView, 
  TextInput, 
  FlatList,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { getClients } from '../../utils/storage';

interface Client {
  id: string;
  nom: string;
  email: string;
  avatar?: string;
}

interface Message {
  id: string;
  text: string;
  sender: 'coach' | 'client';
  timestamp: Date;
}

export default function MessagesScreen() {
  const [selectedTab, setSelectedTab] = useState<'direct' | 'annonces'>('direct');
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      const clientsData = await getClients();
      setClients(clientsData);
    } catch (error) {
      console.error('Erreur chargement clients:', error);
    }
  };

  const getInitials = (nom: string) => {
    return nom.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const filteredClients = clients.filter(client =>
    client.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedClient = clients.find(c => c.id === selectedClientId);

  const sendMessage = () => {
    if (messageText.trim() && selectedClientId) {
      const newMessage: Message = {
        id: Date.now().toString(),
        text: messageText.trim(),
        sender: 'coach',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, newMessage]);
      setMessageText('');
    }
  };

  const renderClientItem = ({ item }: { item: Client }) => (
    <TouchableOpacity
      style={[
        styles.clientItem,
        selectedClientId === item.id && styles.clientItemSelected
      ]}
      onPress={() => setSelectedClientId(item.id)}
    >
      <View style={styles.clientAvatar}>
        <Text style={styles.clientAvatarText}>{getInitials(item.nom)}</Text>
      </View>
      <View style={styles.clientInfo}>
        <Text style={styles.clientName} numberOfLines={1}>{item.nom}</Text>
        <Text style={styles.clientEmail} numberOfLines={1}>{item.email}</Text>
      </View>
      {selectedClientId === item.id && (
        <View style={styles.activeIndicator} />
      )}
    </TouchableOpacity>
  );

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[
      styles.messageContainer,
      item.sender === 'coach' ? styles.messageFromCoach : styles.messageFromClient
    ]}>
      <Text style={[
        styles.messageText,
        item.sender === 'coach' ? styles.messageTextCoach : styles.messageTextClient
      ]}>
        {item.text}
      </Text>
      <Text style={styles.messageTime}>
        {item.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Communication avec les clients</Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, selectedTab === 'direct' && styles.activeTab]}
            onPress={() => setSelectedTab('direct')}
          >
            <Text style={[styles.tabText, selectedTab === 'direct' && styles.activeTabText]}>
              Messages directs
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tab, selectedTab === 'annonces' && styles.activeTab]}
            onPress={() => setSelectedTab('annonces')}
          >
            <Text style={[styles.tabText, selectedTab === 'annonces' && styles.activeTabText]}>
              Annonces
            </Text>
          </TouchableOpacity>
        </View>

        {selectedTab === 'direct' ? (
          <View style={styles.mainContent}>
            {/* Left Panel - Clients List */}
            <View style={styles.leftPanel}>
              <View style={styles.panelHeader}>
                <Text style={styles.panelTitle}>Clients</Text>
                <Text style={styles.panelSubtitle}>Sélectionnez un client pour discuter</Text>
              </View>
              
              <TextInput
                style={styles.searchInput}
                placeholder="Rechercher un client..."
                placeholderTextColor="#8B949E"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              
              <FlatList
                data={filteredClients}
                renderItem={renderClientItem}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                style={styles.clientsList}
              />
            </View>

            {/* Right Panel - Chat */}
            <View style={styles.rightPanel}>
              {selectedClient ? (
                <>
                  {/* Chat Header */}
                  <View style={styles.chatHeader}>
                    <View style={styles.chatHeaderClient}>
                      <View style={styles.chatHeaderAvatar}>
                        <Text style={styles.chatHeaderAvatarText}>
                          {getInitials(selectedClient.nom)}
                        </Text>
                      </View>
                      <View>
                        <Text style={styles.chatHeaderName}>{selectedClient.nom}</Text>
                        <Text style={styles.chatHeaderStatus}>En ligne</Text>
                      </View>
                    </View>
                  </View>

                  {/* Messages */}
                  <FlatList
                    data={messages}
                    renderItem={renderMessage}
                    keyExtractor={(item) => item.id}
                    style={styles.messagesList}
                    showsVerticalScrollIndicator={false}
                  />

                  {/* Message Input */}
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
                </>
              ) : (
                <View style={styles.emptyChat}>
                  <View style={styles.emptyChatIcon}>
                    <Text style={styles.emptyChatIconText}>💬</Text>
                  </View>
                  <Text style={styles.emptyChatTitle}>Sélectionnez un client</Text>
                  <Text style={styles.emptyChatSubtitle}>
                    Choisissez un client dans la liste pour commencer une conversation
                  </Text>
                </View>
              )}
            </View>
          </View>
        ) : (
          <View style={styles.announcesContainer}>
            <Text style={styles.announcesTitle}>Annonces groupées</Text>
            <Text style={styles.announcesSubtitle}>
              Fonctionnalité à venir - Envoyez des messages à tous vos clients
            </Text>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1117',
  },
  header: {
    padding: 20,
    paddingTop: 10,
    paddingBottom: 15,
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
  mainContent: {
    flex: 1,
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
  },
  leftPanel: {
    width: '38%',
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: 16,
    marginRight: 15,
  },
  panelHeader: {
    marginBottom: 16,
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
    lineHeight: 16,
  },
  searchInput: {
    backgroundColor: '#0D1117',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#21262D',
  },
  clientsList: {
    flex: 1,
  },
  clientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#21262D',
    position: 'relative',
  },
  clientItemSelected: {
    backgroundColor: '#F5A623',
  },
  clientAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0D1117',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  clientAvatarText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#F5A623',
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  clientEmail: {
    fontSize: 11,
    color: '#8B949E',
  },
  activeIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0D1117',
    position: 'absolute',
    right: 12,
  },
  rightPanel: {
    flex: 1,
    backgroundColor: '#161B22',
    borderRadius: 12,
    overflow: 'hidden',
  },
  chatHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#21262D',
    backgroundColor: '#1C2128',
  },
  chatHeaderClient: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatHeaderAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5A623',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  chatHeaderAvatarText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000000',
  },
  chatHeaderName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  chatHeaderStatus: {
    fontSize: 12,
    color: '#00D26A',
  },
  messagesList: {
    flex: 1,
    padding: 16,
  },
  messageContainer: {
    marginBottom: 12,
    maxWidth: '80%',
  },
  messageFromCoach: {
    alignSelf: 'flex-end',
  },
  messageFromClient: {
    alignSelf: 'flex-start',
  },
  messageText: {
    padding: 12,
    borderRadius: 16,
    fontSize: 14,
    lineHeight: 20,
  },
  messageTextCoach: {
    backgroundColor: '#F5A623',
    color: '#000000',
    borderBottomRightRadius: 4,
  },
  messageTextClient: {
    backgroundColor: '#21262D',
    color: '#FFFFFF',
    borderBottomLeftRadius: 4,
  },
  messageTime: {
    fontSize: 11,
    color: '#8B949E',
    marginTop: 4,
    textAlign: 'right',
  },
  messageInputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#1C2128',
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
    fontSize: 14,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F5A623',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#21262D',
  },
  sendButtonText: {
    fontSize: 18,
    color: '#000000',
    fontWeight: 'bold',
  },
  emptyChat: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyChatIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#21262D',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyChatIconText: {
    fontSize: 32,
  },
  emptyChatTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyChatSubtitle: {
    fontSize: 14,
    color: '#8B949E',
    textAlign: 'center',
    lineHeight: 20,
  },
  announcesContainer: {
    flex: 1,
    margin: 20,
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  announcesTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  announcesSubtitle: {
    fontSize: 14,
    color: '#8B949E',
    textAlign: 'center',
    lineHeight: 20,
  },
});
