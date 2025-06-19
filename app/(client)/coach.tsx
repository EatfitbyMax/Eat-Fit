import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, TextInput, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { getMessages, saveMessages, PersistentStorage } from '../../utils/storage';
import { getCurrentUser } from '../../utils/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PanGestureHandler, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';

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
      // Récupérer les vraies données du coach depuis le serveur
      const users = await PersistentStorage.getUsers();
      const coach = users.find(user => user.userType === 'coach' && user.email === 'eatfitbymax@gmail.com');

      if (coach) {
        setCoachInfo({
          prenom: coach.firstName || coach.name.split(' ')[0] || 'Maxime',
          nom: coach.lastName || coach.name.split(' ')[1] || 'Renard',
          email: coach.email,
          specialite: coach.specialite || 'Coach Nutrition & Fitness',
          disponibilites: coach.disponibilites || 'Lun-Ven, 8h-18h'
        });
      } else {
        // Fallback sur les données par défaut si le coach n'est pas trouvé
        console.log('Coach non trouvé, utilisation des données par défaut');
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

  const SwipeableMessage = ({ message }: { message: Message }) => {
    const translateX = useSharedValue(0);
    const timeOpacity = useSharedValue(0);

    const gestureHandler = useAnimatedGestureHandler({
      onStart: (_, context) => {
        context.startX = translateX.value;
      },
      onActive: (event, context) => {
        const newTranslateX = context.startX + event.translationX;
        if (message.sender === 'client') {
          // Pour les messages du client (à droite), on glisse vers la gauche
          translateX.value = Math.min(0, Math.max(-80, newTranslateX));
          timeOpacity.value = Math.abs(translateX.value) / 80;
        } else {
          // Pour les messages du coach (à gauche), on glisse vers la droite
          translateX.value = Math.max(0, Math.min(80, newTranslateX));
          timeOpacity.value = translateX.value / 80;
        }
      },
      onEnd: () => {
        translateX.value = withSpring(0);
        timeOpacity.value = withSpring(0);
      },
    });

    const animatedStyle = useAnimatedStyle(() => {
      return {
        transform: [{ translateX: translateX.value }],
      };
    });

    const timeStyle = useAnimatedStyle(() => {
      return {
        opacity: timeOpacity.value,
      };
    });

    return (
      <View style={[
        styles.messageContainer,
        message.sender === 'client' ? styles.messageFromClient : styles.messageFromCoach
      ]}>
        <PanGestureHandler onGestureEvent={gestureHandler}>
          <Animated.View style={animatedStyle}>
            <View style={[
              styles.messageWrapper,
              message.sender === 'client' ? styles.messageWrapperClient : styles.messageWrapperCoach
            ]}>
              <Text style={[
                styles.messageText,
                message.sender === 'client' ? styles.messageTextClient : styles.messageTextCoach
              ]}>
                {message.text}
              </Text>
            </View>
          </Animated.View>
        </PanGestureHandler>

        <Animated.View style={[
          styles.messageTimeContainer,
          message.sender === 'client' ? styles.messageTimeContainerClient : styles.messageTimeContainerCoach,
          timeStyle
        ]}>
          <Text style={styles.messageTimeSwipe}>
            {new Date(message.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </Animated.View>
      </View>
    );
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <SwipeableMessage message={item} />
  );

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView 
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
        <View style={styles.mainContainer}>
          {/* Header fixe */}
          <View style={styles.header}>
            <Text style={styles.title}>Coach</Text>
          </View>

          {/* Coach Info fixe */}
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

          {/* Section Messages */}
          <View style={styles.messagesSection}>
            <View style={styles.messagesSectionHeader}>
              <View style={styles.messagesSectionIcon}>
                <Text style={styles.messagesSectionIconText}>💬</Text>
              </View>
              <Text style={styles.messagesSectionTitle}>Messages avec votre coach</Text>
            </View>

            <FlatList
              data={messages}
              renderItem={renderMessage}
              keyExtractor={(item) => item.id}
              style={styles.messagesList}
              contentContainerStyle={styles.messagesListContent}
              showsVerticalScrollIndicator={false}
              inverted={false}
              keyboardShouldPersistTaps="handled"
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

            {/* Zone de saisie intégrée */}
            <View style={styles.integratedMessageInput}>
              <TextInput
                style={styles.messageInput}
                placeholder="Tapez votre message..."
                placeholderTextColor="#8B949E"
                value={messageText}
                onChangeText={setMessageText}
                multiline
                maxLength={500}
                textAlignVertical="top"
              />
              <TouchableOpacity 
                style={[styles.sendButton, !messageText.trim() && styles.sendButtonDisabled]}
                onPress={sendMessage}
                disabled={!messageText.trim()}
              >
                <Text style={styles.sendButtonText}>➤</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1117',
  },
  mainContainer: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  coachCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#21262D',
  },
  coachHeader: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'center',
  },
  coachAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F5A623',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  coachAvatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
  },
  coachInfo: {
    flex: 1,
  },
  coachName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  coachRole: {
    fontSize: 13,
    color: '#8B949E',
    marginBottom: 3,
  },
  coachLocation: {
    fontSize: 11,
    color: '#8B949E',
  },
  coachActions: {
    marginTop: 12,
  },
  appointmentButton: {
    backgroundColor: '#F5A623',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
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
    fontSize: 12,
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
  messagesSection: {
    flex: 1,
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#161B22',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#21262D',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  messagesSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    backgroundColor: '#1C2128',
    borderBottomWidth: 1,
    borderBottomColor: '#21262D',
  },
  messagesSectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5A623',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  messagesSectionIconText: {
    fontSize: 16,
  },
  messagesSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
  },
  messagesList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  messagesListContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 16,
    flexGrow: 1,
  },
  messageContainer: {
    marginBottom: 12,
    maxWidth: '80%',
    position: 'relative',
  },
  messageFromClient: {
    alignSelf: 'flex-end',
  },
  messageFromCoach: {
    alignSelf: 'flex-start',
  },
  messageWrapper: {
    position: 'relative',
    zIndex: 2,
  },
  messageWrapperClient: {
    alignSelf: 'flex-end',
  },
  messageWrapperCoach: {
    alignSelf: 'flex-start',
  },
  messageText: {
    padding: 10,
    borderRadius: 16,
    fontSize: 13,
    lineHeight: 18,
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
  messageTimeContainer: {
    position: 'absolute',
    top: '50%',
    transform: [{ translateY: -10 }],
    zIndex: 1,
  },
  messageTimeContainerClient: {
    right: '100%',
    marginRight: 8,
  },
  messageTimeContainerCoach: {
    left: '100%',
    marginLeft: 8,
  },
  messageTimeSwipe: {
    fontSize: 11,
    color: '#8B949E',
    fontWeight: '500',
  },
  emptyMessages: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    paddingHorizontal: 20,
  },
  emptyMessagesText: {
    fontSize: 14,
    color: '#8B949E',
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '500',
  },
  emptyMessagesSubtext: {
    fontSize: 12,
    color: '#8B949E',
    textAlign: 'center',
    lineHeight: 16,
  },
  integratedMessageInput: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#21262D',
    alignItems: 'flex-end',
    backgroundColor: '#161B22',
  },
  messageInputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#1C2128',
    borderTopWidth: 1,
    borderTopColor: '#21262D',
    alignItems: 'flex-end',
    minHeight: 68,
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
    lineHeight: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5A623',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
    shadowColor: '#F5A623',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
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