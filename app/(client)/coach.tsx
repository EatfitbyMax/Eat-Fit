import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, TextInput, FlatList, KeyboardAvoidingView, Platform, Modal, Alert } from 'react-native';
import { getMessages, saveMessages, PersistentStorage, testApiConnection } from '../../utils/storage';
import { getCurrentUser } from '../../utils/auth';
import { checkSubscriptionStatusBoolean } from '../../utils/subscription';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PanGestureHandler, GestureHandlerRootView } from 'react-native-gesture-handler';
import { useRouter } from 'expo-router';
import Animated, {
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { SUBSCRIPTION_PLANS, checkAppointmentLimit, getAppointmentLimits, PaymentService } from '../../utils/payments';
import SubscriptionModal from '../../components/SubscriptionModal';

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

interface Appointment {
  id: string;
  date: string;
  time: string;
  duration: number;
  type: 'consultation' | 'suivi' | 'urgence';
  clientId: string;
  coachId: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  notes?: string;
  createdAt: string;
}

// Composant modal de prise de rendez-vous
const AppointmentModal = ({ visible, onClose, coachInfo, currentUser, onAppointmentBooked }: {
  visible: boolean;
  onClose: () => void;
  coachInfo: CoachInfo;
  currentUser: any;
  onAppointmentBooked: (appointment: Appointment) => void;
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [appointmentType, setAppointmentType] = useState<'consultation' | 'suivi' | 'urgence'>('consultation');
  const [notes, setNotes] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [currentWeek, setCurrentWeek] = useState<Date>(new Date());

  useEffect(() => {
    if (visible) {
      generateAvailableSlots();
    }
  }, [visible, selectedDate]);

  const parseCoachAvailability = (availabilityString: string) => {
    // Parse une chaîne comme "Lun-Ven, 8h-18h / Sam, 9h-12h"
    const availability: { [key: string]: { start: number; end: number } } = {};

    try {
      const parts = availabilityString.split('/').map(part => part.trim());

      for (const part of parts) {
        const [days, hours] = part.split(',').map(s => s.trim());
        const [startHour, endHour] = hours.replace(/h/g, '').split('-').map(h => parseInt(h.trim()));

        if (days.includes('-')) {
          // Plage de jours comme "Lun-Ven"
          const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
          const [startDay, endDay] = days.split('-').map(d => d.trim());
          const startIndex = dayNames.indexOf(startDay);
          const endIndex = dayNames.indexOf(endDay);

          if (startIndex !== -1 && endIndex !== -1) {
            for (let i = startIndex; i <= endIndex; i++) {
              availability[dayNames[i]] = { start: startHour, end: endHour };
            }
          }
        } else {
          // Jour unique comme "Sam"
          availability[days] = { start: startHour, end: endHour };
        }
      }
    } catch (error) {
      console.log('Erreur parsing disponibilités:', error);
      // Fallback sur les horaires par défaut
      const defaultDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven'];
      defaultDays.forEach(day => {
        availability[day] = { start: 8, end: 18 };
      });
    }

    return availability;
  };

  const getDayAvailability = (date: Date) => {
    const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    const dayName = dayNames[date.getDay()];
    const availability = parseCoachAvailability(coachInfo.disponibilites);

    return availability[dayName] || null;
  };

  const generateAvailableSlots = () => {
    const dayAvailability = getDayAvailability(selectedDate);

    if (!dayAvailability) {
      // Le coach n'est pas disponible ce jour-là
      setAvailableSlots([]);
      return;
    }

    const slots = [];
    const { start, end } = dayAvailability;

    for (let hour = start; hour < end; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      slots.push(`${hour.toString().padStart(2, '0')}:30`);
    }

    setAvailableSlots(slots);
  };

  const getDaysOfWeek = () => {
    const startOfWeek = new Date(currentWeek);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Lundi
    startOfWeek.setDate(diff);

    const days = [];
    // Seulement du lundi au vendredi (5 jours)
    for (let i = 0; i < 5; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit'
    });
  };

  const getDayName = (date: Date) => {
    return date.toLocaleDateString('fr-FR', { weekday: 'short' });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSameDate = (date1: Date, date2: Date) => {
    return date1.toDateString() === date2.toDateString();
  };

  const isCoachAvailable = (date: Date) => {
    return getDayAvailability(date) !== null;
  };

  const nextWeek = () => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(newWeek.getDate() + 7);
    setCurrentWeek(newWeek);
  };

  const previousWeek = () => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(newWeek.getDate() - 7);
    setCurrentWeek(newWeek);
  };

  const bookAppointment = async () => {
    if (!selectedTime || !currentUser) {
      Alert.alert('Erreur', 'Veuillez sélectionner une date et une heure');
      return;
    }

    const appointment: Appointment = {
      id: Date.now().toString(),
      date: selectedDate.toISOString().split('T')[0],
      time: selectedTime,
      duration: appointmentType === 'urgence' ? 30 : 60,
      type: appointmentType,
      clientId: currentUser.id,
      coachId: 'coach-id',
      status: 'pending',
      notes: notes,
      createdAt: new Date().toISOString()
    };

    try {
      // Charger les rendez-vous existants du client
      const existingAppointments = await AsyncStorage.getItem(`appointments-${currentUser.id}`);
      const appointments = existingAppointments ? JSON.parse(existingAppointments) : [];

      // Ajouter le nouveau rendez-vous
      appointments.push(appointment);

      // Sauvegarder dans AsyncStorage
      await AsyncStorage.setItem(`appointments-${currentUser.id}`, JSON.stringify(appointments));

      // Mettre à jour l'état local via le callback
      onAppointmentBooked(appointment);

      Alert.alert(
        'Rendez-vous demandé',
        `Votre demande de rendez-vous pour le ${formatDate(selectedDate)} à ${selectedTime} a été envoyée au coach. Vous recevrez une confirmation prochainement.`,
        [
          {
            text: 'OK',
            onPress: () => {
              onClose();
              setSelectedTime('');
              setNotes('');
            }
          }
        ]
      );
    } catch (error) {
      console.error('Erreur sauvegarde rendez-vous:', error);
      Alert.alert('Erreur', 'Impossible de réserver le rendez-vous');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.appointmentModal}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.appointmentHeader}>
              <Text style={styles.appointmentTitle}>Prendre rendez-vous</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.appointmentSubtitle}>
              Avec {coachInfo.prenom} {coachInfo.nom}
            </Text>

            {/* Type de rendez-vous */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Type de consultation</Text>
              <View style={styles.typeContainer}>
                <TouchableOpacity
                  style={[styles.typeButton, appointmentType === 'consultation' && styles.typeButtonActive]}
                  onPress={() => setAppointmentType('consultation')}
                >
                  <Text style={[styles.typeButtonText, appointmentType === 'consultation' && styles.typeButtonTextActive]}>
                    🎯 Consultation (60min)
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.typeButton, appointmentType === 'suivi' && styles.typeButtonActive]}
                  onPress={() => setAppointmentType('suivi')}
                >
                  <Text style={[styles.typeButtonText, appointmentType === 'suivi' && styles.typeButtonTextActive]}>
                    📊 Suivi (60min)
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.typeButton, appointmentType === 'urgence' && styles.typeButtonActive]}
                  onPress={() => setAppointmentType('urgence')}
                >
                  <Text style={[styles.typeButtonText, appointmentType === 'urgence' && styles.typeButtonTextActive]}>
                    ⚡ Urgence (30min)
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Calendrier */}
            <View style={styles.sectionContainer}>
              <View style={styles.calendarHeader}>
                <TouchableOpacity onPress={previousWeek} style={styles.weekNavButton}>
                  <Text style={styles.weekNavText}>‹</Text>
                </TouchableOpacity>
                <Text style={styles.sectionTitle}>
                  {currentWeek.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                </Text>
                <TouchableOpacity onPress={nextWeek} style={styles.weekNavButton}>
                  <Text style={styles.weekNavText}>›</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.weekContainer}>
                {getDaysOfWeek().map((date, index) => {
                  const available = isCoachAvailable(date);
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.dayButton,
                        isSameDate(date, selectedDate) && styles.dayButtonSelected,
                        isToday(date) && styles.dayButtonToday,
                        !available && styles.dayButtonUnavailable
                      ]}
                      onPress={() => available && setSelectedDate(date)}
                      disabled={!available}
                    >
                      <Text style={[
                        styles.dayButtonTextDay,
                        isSameDate(date, selectedDate) && styles.dayButtonTextSelected,
                        !available && styles.dayButtonTextUnavailable
                      ]}>
                        {getDayName(date)}
                      </Text>
                      <Text style={[
                        styles.dayButtonTextDate,
                        isSameDate(date, selectedDate) && styles.dayButtonTextSelected,
                        !available && styles.dayButtonTextUnavailable
                      ]}>
                        {formatDate(date)}
                      </Text>
                      {!available && (
                        <Text style={styles.dayButtonUnavailableIndicator}>✕</Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Créneaux horaires */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Créneaux disponibles</Text>
              {availableSlots.length > 0 ? (
                <View style={styles.slotsContainer}>
                  {availableSlots.map((slot, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.slotButton,
                        selectedTime === slot && styles.slotButtonSelected
                      ]}
                      onPress={() => setSelectedTime(slot)}
                    >
                      <Text style={[
                        styles.slotButtonText,
                        selectedTime === slot && styles.slotButtonTextSelected
                      ]}>
                        {slot}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View style={styles.noSlotsContainer}>
                  <Text style={styles.noSlotsText}>
                    Le coach n'est pas disponible ce jour-là
                  </Text>
                  <Text style={styles.noSlotsSubtext}>
                    Veuillez sélectionner un autre jour
                  </Text>
                </View>
              )}
            </View>

            {/* Notes */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Notes (optionnel)</Text>
              <TextInput
                style={styles.notesInput}
                placeholder="Décrivez brièvement l'objet de votre rendez-vous..."
                placeholderTextColor="#8B949E"
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
                maxLength={200}
              />
            </View>

            {/* Récapitulatif */}
            {selectedTime && (
              <View style={styles.summaryContainer}>
                <Text style={styles.summaryTitle}>Récapitulatif</Text>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Date:</Text>
                  <Text style={styles.summaryValue}>
                    {selectedDate.toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Heure:</Text>
                  <Text style={styles.summaryValue}>{selectedTime}</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Type:</Text>
                  <Text style={styles.summaryValue}>
                    {appointmentType === 'consultation' ? 'Consultation (60min)' :
                     appointmentType === 'suivi' ? 'Suivi (60min)' : 'Urgence (30min)'}
                  </Text>
                </View>
              </View>
            )}

            {/* Boutons */}
            <View style={styles.appointmentButtons}>
              <TouchableOpacity
                style={[styles.bookButton, !selectedTime && styles.bookButtonDisabled]}
                onPress={bookAppointment}
                disabled={!selectedTime}
              >
                <Text style={styles.bookButtonText}>Confirmer le rendez-vous</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelAppointmentButton} onPress={onClose}>
                <Text style={styles.cancelAppointmentButtonText}>Annuler</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default function CoachScreen() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [coachInfo, setCoachInfo] = useState<CoachInfo>({
    prenom: 'Maxime',
    nom: 'Renard',
    email: 'eatfitbymax@gmail.com',
    specialite: 'Coach Nutrition & Fitness',
    disponibilites: 'Lun-Ven, 8h-18h'
  });

  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'messages' | 'appointments'>('messages');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [appointmentLimitCheck, setAppointmentLimitCheck] = useState<{ canBook: boolean; reason?: string; remaining?: number } | null>(null);
  const [userPlan, setUserPlan] = useState<string>('free');

  useEffect(() => {
    initUser();
    loadCoachInfo();
    loadAppointments();
    testConnection();
  }, []);

  // Afficher automatiquement la modal d'abonnement pour les utilisateurs non-Premium
  useEffect(() => {
    if (currentUser && !isPremium) {
      setShowSubscriptionModal(true);
    }
  }, [currentUser, isPremium]);

  // Afficher la modal à chaque fois que la page devient active (focus)
  useEffect(() => {
    const checkAndShowModal = () => {
      if (currentUser && !isPremium) {
        setShowSubscriptionModal(true);
      }
    };

    // Vérifier immédiatement
    checkAndShowModal();

    // Ajouter un listener pour quand la page devient active
    const timer = setTimeout(checkAndShowModal, 100);

    return () => clearTimeout(timer);
  }, []); // Se déclenche à chaque montage du composant

  const testConnection = async () => {
    try {
      const { testApiConnection } = await import('../../utils/storage');
      const result = await testApiConnection();
      console.log('[DEBUG] Test connexion résultat:', result);

      if (!result.success) {
        console.warn('[WARNING] Problème de connexion API:', result.message);
      }
    } catch (error) {
      console.error('[ERROR] Erreur test connexion:', error);
    }
  };

  useEffect(() => {
    if (currentUser) {
      checkAppointmentLimits();
    }
  }, [currentUser, appointments]);

  const checkAppointmentLimits = async () => {
    if (!currentUser) return;

    try {
      // Récupérer l'abonnement actuel
      const subscription = await PaymentService.getCurrentSubscription(currentUser.id);
      setUserPlan(subscription.planId);

      // Vérifier les limites de rendez-vous
      const limitCheck = await checkAppointmentLimit(currentUser.id, subscription.planId, appointments);
      setAppointmentLimitCheck(limitCheck);
    } catch (error) {
      console.error('Erreur vérification limites:', error);
      setAppointmentLimitCheck({ canBook: false, reason: 'Erreur lors de la vérification des limites' });
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadMessages();
      checkPremiumStatus();
    }
  }, [currentUser]);

  // Rechargement périodique des rendez-vous pour détecter les changements de statut
  useEffect(() => {
    if (currentUser && isPremium) {
      loadAppointments();

      // Recharger les rendez-vous toutes les 10 secondes quand l'onglet RDV est actif
      const interval = setInterval(() => {
        if (activeTab === 'appointments') {
          loadAppointments();
        }
      }, 10000);

      return () => clearInterval(interval);
    }
  }, [currentUser, isPremium, activeTab]);

  const initUser = async () => {
    const user = await getCurrentUser();
    setCurrentUser(user);
  };

  const checkPremiumStatus = async () => {
    const premium = await checkSubscriptionStatusBoolean();
    setIsPremium(premium);
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
    if (!currentUser?.id) {
      console.log('[DEBUG] Pas d\'utilisateur connecté pour charger les messages');
      return;
    }

    try {
      console.log('[DEBUG] Chargement messages pour:', currentUser.id);
      const messagesData = await getMessages(currentUser.id);
      setMessages(messagesData);
      console.log('[DEBUG] Messages chargés avec succès:', messagesData.length);

      // Ajouter un message informatif si pas de connexion serveur
      if (messagesData.length === 0) {
        const connectionTest = await testApiConnection();
        if (!connectionTest.success) {
          console.log('[INFO] Mode hors ligne - les nouveaux messages seront synchronisés plus tard');
        }
      }
    } catch (error) {
      console.error('[ERROR] Erreur chargement messages dans coach.tsx:', error);
      setMessages([]);

      // Optionnel: ajouter un message d'état pour l'utilisateur
      console.log('[INFO] Messages indisponibles - vérification de la connexion...');
    }
  };

  const sendMessage = async () => {
    if (!isPremium) {
      setShowSubscriptionModal(true);
      return;
    }

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

  const loadAppointments = async () => {
    if (!currentUser?.id) return;

    try {
      // Charger les rendez-vous depuis AsyncStorage
      const appointmentsData = await AsyncStorage.getItem(`appointments-${currentUser.id}`);
      if (appointmentsData) {
        const parsedAppointments = JSON.parse(appointmentsData);
        setAppointments(parsedAppointments);
        console.log(`Rendez-vous chargés pour ${currentUser.id}:`, parsedAppointments);
      } else {
        setAppointments([]);
      }
    } catch (error) {
      console.error('Erreur chargement rendez-vous:', error);
    }
  };

  const saveAppointments = async (newAppointments: Appointment[]) => {
    if (!currentUser?.id) return;

    try {
      // Sauvegarder les rendez-vous dans AsyncStorage
      await AsyncStorage.setItem(`appointments-${currentUser.id}`, JSON.stringify(newAppointments));
      setAppointments(newAppointments);
    } catch (error) {
      console.error('Erreur sauvegarde rendez-vous:', error);
    }
  };

  const handleCloseSubscriptionModal = () => {
    setShowSubscriptionModal(false);
    // Si l'utilisateur n'est pas Premium, le rediriger vers l'accueil
    if (!isPremium) {
      router.push('/(client)');
    }
  };

  const renderAppointmentItem = ({ item }: { item: Appointment }) => {
    const getStatusColor = (status: string) => {
      switch (status) {
        case 'pending': return '#F5A623';
        case 'confirmed': return '#00D26A';
        case 'cancelled': return '#DA3633';
        case 'completed': return '#8B949E';
        default: return '#8B949E';
      }
    };

    const getStatusText = (status: string) => {
      switch (status) {
        case 'pending': return 'En attente';
        case 'confirmed': return 'Confirmé';
        case 'cancelled': return 'Annulé';
        case 'completed': return 'Terminé';
        default: return status;
      }
    };

    const getTypeText = (type: string) => {
      switch (type) {
        case 'consultation': return 'Consultation';
        case 'suivi': return 'Suivi';
        case 'urgence': return 'Urgence';
        default: return type;
      }
    };

    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    return (
      <View style={styles.appointmentItem}>
        <View style={styles.appointmentItemHeader}>
          <Text style={styles.appointmentItemDate}>
            {formatDate(item.date)} à {item.time}
          </Text>
          <View style={[styles.appointmentStatusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.appointmentStatusText}>{getStatusText(item.status)}</Text>
          </View>
        </View>
        <Text style={styles.appointmentItemType}>
          {getTypeText(item.type)} • {item.duration}min
        </Text>
        {item.notes && (
          <Text style={styles.appointmentItemNotes}>
            💬 {item.notes}
          </Text>
        )}
      </View>
    );
  };

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

          {!isPremium ? (
            /* Affichage pour les non-abonnés */
            <View style={styles.premiumRequiredContainer}>
              <View style={styles.premiumIcon}>
                <Text style={styles.premiumIconText}>👑</Text>
              </View>

              <Text style={styles.premiumTitle}>Accès Premium Requis</Text>

              <Text style={styles.premiumDescription}>
                Cette fonctionnalité est disponible uniquement avec un abonnement Premium.
              </Text>

              <View style={styles.premiumFeatures}>
                <Text style={styles.featureItem}>✨ Accès direct à votre coach personnel</Text>
                <Text style={styles.featureItem}>💬 Messagerie illimitée</Text>
                <Text style={styles.featureItem}>📅 Prise de rendez-vous</Text>
                <Text style={styles.featureItem}>🎯 Programmes personnalisés</Text>
              </View>

              <TouchableOpacity 
                style={styles.subscribeNowButton}
                onPress={() => setShowSubscriptionModal(true)}
              >
                <Text style={styles.subscribeNowButtonText}>Découvrir nos offres Premium</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* Affichage pour les abonnés Premium */
            <>
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
                  {/* Bouton de prise de rendez-vous */}
                  <TouchableOpacity
                    style={[
                      styles.appointmentButton,
                      appointmentLimitCheck && !appointmentLimitCheck.canBook && styles.appointmentButtonDisabled
                    ]}
                    onPress={() => {
                      if (!appointmentLimitCheck?.canBook) {
                        Alert.alert(
                          'Limite atteinte',
                          appointmentLimitCheck?.reason || 'Vous ne pouvez pas prendre de rendez-vous.',
                          [
                            { text: 'OK', style: 'default' },
                            { text: 'Voir les abonnements', onPress: () => setShowSubscriptionModal(true) }
                          ]
                        );
                        return;
                      }

                      if (isPremium) {
                        setShowAppointmentModal(true);
                      } else {
                        setShowSubscriptionModal(true);
                      }
                    }}
                  >
                    <Text style={[
                      styles.appointmentButtonText,
                      appointmentLimitCheck && !appointmentLimitCheck.canBook && styles.appointmentButtonTextDisabled
                    ]}>
                      📅 Prendre rendez-vous avec le coach
                      {appointmentLimitCheck?.remaining !== undefined && (
                        ` (${appointmentLimitCheck.remaining} restant${appointmentLimitCheck.remaining > 1 ? 's' : ''})`
                      )}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Onglets */}
              <View style={styles.tabsContainer}>
                <TouchableOpacity
                  style={[styles.tab, activeTab === 'messages' && styles.activeTab]}
                  onPress={() => setActiveTab('messages')}
                >
                  <Text style={[styles.tabText, activeTab === 'messages' && styles.activeTabText]}>
                    💬 Messages
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tab, activeTab === 'appointments' && styles.activeTab]}
                  onPress={() => {
                    setActiveTab('appointments');
                    // Recharger immédiatement les rendez-vous quand on clique sur l'onglet
                    loadAppointments();
                  }}
                >
                  <Text style={[styles.tabText, activeTab === 'appointments' && styles.activeTabText]}>
                    📅 Mes RDV ({appointments.length})
                  </Text>
                </TouchableOpacity>
              </View>

              {activeTab === 'messages' ? (
                /* Section Messages */
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
              ) : (
                /* Section Rendez-vous */
                <View style={styles.messagesSection}>
                  <View style={styles.appointmentHeaderContainer}>
                    <Text style={styles.sectionTitle}>📅 Mes RDV ({appointments.length})</Text>
                    {appointmentLimitCheck && (
                      <View style={styles.limitInfoContainer}>
                        {userPlan !== 'free' && (
                          <Text style={styles.limitInfoText}>
                            {userPlan === 'silver' && `Limite: 1/mois`}
                            {userPlan === 'gold' && `Limite: 1/semaine`}
                            {userPlan === 'diamond' && `Limite: 2/semaine`}
                            {appointmentLimitCheck.remaining !== undefined && 
                              ` • ${appointmentLimitCheck.remaining} restant${appointmentLimitCheck.remaining > 1 ? 's' : ''}`}
                          </Text>
                        )}
                        {userPlan === 'free' || userPlan === 'bronze' ? (
                          <Text style={styles.limitInfoTextError}>
                            Aucun RDV autorisé avec votre plan
                          </Text>
                        ) : null}
                      </View>
                    )}
                  </View>
                  <FlatList
                    data={appointments}
                    renderItem={renderAppointmentItem}
                    keyExtractor={(item) => item.id}
                    style={styles.messagesList}
                    contentContainerStyle={styles.messagesListContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    ListEmptyComponent={
                      <View style={styles.emptyMessages}>
                        <Text style={styles.emptyMessagesText}>
                          Aucun rendez-vous pour le moment.
                        </Text>
                        <Text style={styles.emptyMessagesSubtext}>
                          Prenez un rendez-vous avec votre coach !
                        </Text>
                      </View>
                    }
                  />
                </View>
              )}
            </>
          )}
        </View>
        </KeyboardAvoidingView>

        {/* Modal d'abonnement */}
        <SubscriptionModal
          visible={showSubscriptionModal}
          onClose={handleCloseSubscriptionModal}
        />

        {/* Modal de prise de rendez-vous */}
        <AppointmentModal 
          visible={showAppointmentModal}
          onClose={() => setShowAppointmentModal(false)}
          coachInfo={coachInfo}
          currentUser={currentUser}
          onAppointmentBooked={(appointment) => {
            setAppointments(prev => [...prev, appointment]);
          }}
        />
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
  messageInputDisabled: {
    backgroundColor: '#21262D',
    opacity: 0.6,
  },
  upgradeButton: {
    backgroundColor: '#F5A623',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 16,
  },
  upgradeButtonText: {
    color: '#000000',
    fontWeight: 'bold',
    fontSize: 14,
  },
  appointmentItem: {
    backgroundColor: '#21262D',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#30363D',
  },
  appointmentItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  appointmentItemDate: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 12,
  },
  appointmentItemType: {
    color: '#F5A623',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 8,
  },
  appointmentItemNotes: {
    color: '#8B949E',
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 16,
  },
  appointmentStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  appointmentStatusText: {
    fontSize: 10,
    color: '#000000',
    fontWeight: '600',
  },
  appointmentButtonDisabled: {
    backgroundColor: '#37414b',
  },
  appointmentButtonTextDisabled: {
    color: '#6b7280',
  },
  appointmentHeaderContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  limitInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  limitInfoText: {
    fontSize: 12,
    color: '#8B949E',
    fontWeight: '500',
  },
  limitInfoTextError: {
    fontSize: 12,
    color: '#DA3633',
    fontWeight: '500',
  },
});