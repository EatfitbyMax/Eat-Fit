
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
  nom?: string;
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

  const getInitials = (nom: string) => {
    if (!nom) return 'XX';
    return nom.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
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
        <Text style={styles.clientAvatarText}>{getInitials(item.nom)}</Text>
      </View>
      <View style={styles.clientInfo}>
        <Text style={styles.clientName}>{item.nom || 'Client sans nom'}</Text>
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
                        {selectedClient ? getInitials(selectedClient.nom) : ''}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.chatHeaderName}>
                        {selectedClient?.nom || 'Client'}
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
  messagesContainer: {
    flex: 1,
    margin: 20,
    backgroundColor: '#161B22',
    borderRadius: 12,
    overflow: 'hidden',
  },
  sectionHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#21262D',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#8B949E',
    lineHeight: 20,
  },
  clientsList: {
    flex: 1,
  },
  clientsListContent: {
    padding: 20,
  },
  clientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#21262D',
    borderRadius: 12,
    marginBottom: 12,
  },
  clientAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F5A623',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  clientAvatarText: {
    fontSize: 16,
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
    marginBottom: 4,
  },
  clientEmail: {
    fontSize: 14,
    color: '#8B949E',
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 12,
    color: '#8B949E',
    fontStyle: 'italic',
  },
  clientArrow: {
    marginLeft: 12,
  },
  arrowText: {
    fontSize: 20,
    color: '#F5A623',
    fontWeight: 'bold',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1C2128',
    borderBottomWidth: 1,
    borderBottomColor: '#21262D',
  },
  backButton: {
    marginRight: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  backButtonText: {
    fontSize: 16,
    color: '#F5A623',
    fontWeight: '600',
  },
  chatHeaderClient: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  chatHeaderAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
  },
  messagesListContent: {
    padding: 16,
    flexGrow: 1,
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
  emptyMessages: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyMessagesText: {
    fontSize: 16,
    color: '#8B949E',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyMessagesSubtext: {
    fontSize: 14,
    color: '#8B949E',
    textAlign: 'center',
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
