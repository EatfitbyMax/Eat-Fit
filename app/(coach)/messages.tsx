
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  TextInput, 
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import { getClients, getMessages, saveMessages } from '../../utils/storage';

interface Client {
  id: string;
  name?: string;
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
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [showClientList, setShowClientList] = useState(true);

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    if (selectedClientId) {
      loadMessages();
    }
  }, [selectedClientId]);

  const loadClients = async () => {
    try {
      const clientsData = await getClients();
      setClients(clientsData);
    } catch (error) {
      console.error('Erreur chargement clients:', error);
    }
  };

  const loadMessages = async () => {
    if (!selectedClientId) return;
    
    try {
      const messagesData = await getMessages(selectedClientId);
      setMessages(messagesData);
    } catch (error) {
      console.error('Erreur chargement messages:', error);
    }
  };

  const saveMessagesToServer = async (newMessages: Message[]) => {
    if (!selectedClientId) return;
    
    try {
      await saveMessages(selectedClientId, newMessages);
    } catch (error) {
      console.error('Erreur sauvegarde messages:', error);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'XX';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const selectedClient = clients.find(c => c.id === selectedClientId);

  const selectClient = (clientId: string) => {
    setSelectedClientId(clientId);
    setShowClientList(false);
    setMessages([]); // Réinitialiser les messages
  };

  const backToClientList = () => {
    setShowClientList(true);
    setSelectedClientId(null);
  };

  const sendMessage = async () => {
    if (messageText.trim() && selectedClientId) {
      const newMessage: Message = {
        id: Date.now().toString(),
        text: messageText.trim(),
        sender: 'coach',
        timestamp: new Date()
      };
      const updatedMessages = [...messages, newMessage];
      setMessages(updatedMessages);
      setMessageText('');
      
      // Sauvegarder sur le serveur
      await saveMessagesToServer(updatedMessages);
    }
  };

  const renderClientItem = ({ item }: { item: Client }) => (
    <TouchableOpacity
      style={styles.clientCard}
      onPress={() => selectClient(item.id)}
    >
      <View style={styles.clientAvatar}>
        <Text style={styles.clientAvatarText}>{getInitials(item.name)}</Text>
      </View>
      <View style={styles.clientInfo}>
        <Text style={styles.clientName}>{item.name || 'Client sans nom'}</Text>
        <Text style={styles.clientEmail}>{item.email}</Text>
        <Text style={styles.lastMessage}>Appuyez pour démarrer la conversation</Text>
      </View>
      <View style={styles.clientArrow}>
        <Text style={styles.arrowText}>›</Text>
      </View>
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
          <View style={styles.messagesContainer}>
            {showClientList ? (
              /* Liste des clients */
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Vos clients</Text>
                  <Text style={styles.sectionSubtitle}>
                    Sélectionnez un client pour commencer une conversation
                  </Text>
                </View>
                
                <FlatList
                  data={clients}
                  renderItem={renderClientItem}
                  keyExtractor={(item) => item.id}
                  showsVerticalScrollIndicator={false}
                  style={styles.clientsList}
                  contentContainerStyle={styles.clientsListContent}
                />
              </>
            ) : (
              /* Interface de chat */
              <>
                {/* Header du chat */}
                <View style={styles.chatHeader}>
                  <TouchableOpacity style={styles.backButton} onPress={backToClientList}>
                    <Text style={styles.backButtonText}>‹ Retour</Text>
                  </TouchableOpacity>
                  <View style={styles.chatHeaderClient}>
                    <View style={styles.chatHeaderAvatar}>
                      <Text style={styles.chatHeaderAvatarText}>
                        {selectedClient ? getInitials(selectedClient.name) : ''}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.chatHeaderName}>
                        {selectedClient?.name || 'Client'}
                      </Text>
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
                  contentContainerStyle={styles.messagesListContent}
                  ListEmptyComponent={
                    <View style={styles.emptyMessages}>
                      <Text style={styles.emptyMessagesText}>
                        Aucun message dans cette conversation.
                      </Text>
                      <Text style={styles.emptyMessagesSubtext}>
                        Envoyez un message pour commencer !
                      </Text>
                    </View>
                  }
                />

                {/* Input de message */}
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
            )}
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
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    lineHeight: 28,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#21262D',
    alignItems: 'center',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    marginHorizontal: 1,
  },
  activeTab: {
    backgroundColor: '#161B22',
    borderBottomWidth: 2,
    borderBottomColor: '#F5A623',
  },
  tabText: {
    fontSize: 13,
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
    marginBottom: 16,
    backgroundColor: '#161B22',
    borderRadius: 16,
    overflow: 'hidden',
  },
  sectionHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#21262D',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#8B949E',
    lineHeight: 18,
  },
  clientsList: {
    flex: 1,
  },
  clientsListContent: {
    padding: 16,
    paddingBottom: 32,
  },
  clientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#21262D',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  clientAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F5A623',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  clientAvatarText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#000000',
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 3,
  },
  clientEmail: {
    fontSize: 13,
    color: '#8B949E',
    marginBottom: 3,
  },
  lastMessage: {
    fontSize: 11,
    color: '#8B949E',
    fontStyle: 'italic',
  },
  clientArrow: {
    marginLeft: 8,
  },
  arrowText: {
    fontSize: 18,
    color: '#F5A623',
    fontWeight: 'bold',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#1C2128',
    borderBottomWidth: 1,
    borderBottomColor: '#21262D',
    minHeight: 60,
  },
  backButton: {
    marginRight: 12,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  backButtonText: {
    fontSize: 15,
    color: '#F5A623',
    fontWeight: '600',
  },
  chatHeaderClient: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  chatHeaderAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5A623',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  chatHeaderAvatarText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#000000',
  },
  chatHeaderName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 1,
  },
  chatHeaderStatus: {
    fontSize: 11,
    color: '#00D26A',
  },
  messagesList: {
    flex: 1,
  },
  messagesListContent: {
    padding: 16,
    flexGrow: 1,
    paddingBottom: 32,
  },
  messageContainer: {
    marginBottom: 10,
    maxWidth: '85%',
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
    fontSize: 10,
    color: '#8B949E',
    marginTop: 3,
    textAlign: 'right',
  },
  emptyMessages: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyMessagesText: {
    fontSize: 16,
    color: '#8B949E',
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '500',
  },
  emptyMessagesSubtext: {
    fontSize: 13,
    color: '#8B949E',
    textAlign: 'center',
    lineHeight: 18,
  },
  messageInputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1C2128',
    borderTopWidth: 1,
    borderTopColor: '#21262D',
    alignItems: 'flex-end',
    minHeight: 56,
  },
  messageInput: {
    flex: 1,
    backgroundColor: '#0D1117',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#21262D',
    maxHeight: 80,
    marginRight: 10,
    fontSize: 14,
    lineHeight: 18,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5A623',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  sendButtonDisabled: {
    backgroundColor: '#21262D',
  },
  sendButtonText: {
    fontSize: 16,
    color: '#000000',
    fontWeight: 'bold',
  },
  announcesContainer: {
    flex: 1,
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#161B22',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  announcesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  announcesSubtitle: {
    fontSize: 13,
    color: '#8B949E',
    textAlign: 'center',
    lineHeight: 18,
  },
});
