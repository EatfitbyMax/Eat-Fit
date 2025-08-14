
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getCurrentUser } from '@/utils/auth';
import { PersistentStorage } from '@/utils/storage';
import { NotificationService } from '@/utils/notifications';

export default function HorairesNotificationsScreen() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [showPicker, setShowPicker] = useState<string | null>(null);
  const [horaires, setHoraires] = useState({
    petitDejeuner: new Date(2025, 0, 1, 8, 0), // 08:00
    dejeuner: new Date(2025, 0, 1, 12, 30),    // 12:30
    diner: new Date(2025, 0, 1, 19, 0),        // 19:00
    entrainement: new Date(2025, 0, 1, 18, 0)  // 18:00
  });

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        await loadNotificationSchedule(currentUser.id);
      }
    } catch (error) {
      console.error('Erreur chargement utilisateur:', error);
    }
  };

  const loadNotificationSchedule = async (userId: string) => {
    try {
      console.log('🔔 Chargement horaires notifications pour:', userId);
      const savedSchedule = await PersistentStorage.getNotificationSchedule(userId);
      
      if (savedSchedule) {
        // Convertir les heures sauvegardées en objets Date
        const schedule = {
          petitDejeuner: new Date(2025, 0, 1, savedSchedule.petitDejeuner?.hour || 8, savedSchedule.petitDejeuner?.minute || 0),
          dejeuner: new Date(2025, 0, 1, savedSchedule.dejeuner?.hour || 12, savedSchedule.dejeuner?.minute || 30),
          diner: new Date(2025, 0, 1, savedSchedule.diner?.hour || 19, savedSchedule.diner?.minute || 0),
          entrainement: new Date(2025, 0, 1, savedSchedule.entrainement?.hour || 18, savedSchedule.entrainement?.minute || 0)
        };
        setHoraires(schedule);
        console.log('✅ Horaires chargés:', schedule);
      }
    } catch (error) {
      console.error('Erreur chargement horaires notifications:', error);
    }
  };

  const saveNotificationSchedule = async (newSchedule: any) => {
    try {
      if (!user?.id) return;

      // Convertir les objets Date en format simple pour la sauvegarde
      const scheduleToSave = {
        petitDejeuner: {
          hour: newSchedule.petitDejeuner.getHours(),
          minute: newSchedule.petitDejeuner.getMinutes()
        },
        dejeuner: {
          hour: newSchedule.dejeuner.getHours(),
          minute: newSchedule.dejeuner.getMinutes()
        },
        diner: {
          hour: newSchedule.diner.getHours(),
          minute: newSchedule.diner.getMinutes()
        },
        entrainement: {
          hour: newSchedule.entrainement.getHours(),
          minute: newSchedule.entrainement.getMinutes()
        }
      };

      await PersistentStorage.saveNotificationSchedule(user.id, scheduleToSave);

      // Reprogrammer les notifications avec les nouveaux horaires
      await NotificationService.updateScheduledNotifications(user.id, scheduleToSave);

      console.log('✅ Horaires notifications sauvegardés et reprogrammés');
      Alert.alert('Succès', 'Les horaires de notifications ont été mis à jour');
    } catch (error) {
      console.error('Erreur sauvegarde horaires:', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder les horaires');
    }
  };

  const handleTimeChange = (event: any, selectedDate?: Date, type?: string) => {
    setShowPicker(null);
    
    if (selectedDate && type) {
      const newHoraires = { ...horaires, [type]: selectedDate };
      setHoraires(newHoraires);
      saveNotificationSchedule(newHoraires);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const scheduleItems = [
    {
      key: 'petitDejeuner',
      title: 'Rappel petit-déjeuner',
      icon: '🌅',
      time: horaires.petitDejeuner
    },
    {
      key: 'dejeuner',
      title: 'Rappel déjeuner',
      icon: '☀️',
      time: horaires.dejeuner
    },
    {
      key: 'diner',
      title: 'Rappel dîner',
      icon: '🌆',
      time: horaires.diner
    },
    {
      key: 'entrainement',
      title: 'Rappel entraînement',
      icon: '🏋️‍♂️',
      time: horaires.entrainement
    }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Horaires des notifications</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Info */}
        <View style={styles.infoSection}>
          <Text style={styles.infoText}>
            ⏰ Personnalisez les horaires de vos rappels quotidiens
          </Text>
        </View>

        {/* Schedule Items */}
        <View style={styles.section}>
          {scheduleItems.map((item) => (
            <TouchableOpacity
              key={item.key}
              style={styles.scheduleItem}
              onPress={() => setShowPicker(item.key)}
            >
              <View style={styles.scheduleInfo}>
                <Text style={styles.scheduleIcon}>{item.icon}</Text>
                <View>
                  <Text style={styles.scheduleTitle}>{item.title}</Text>
                  <Text style={styles.scheduleTime}>{formatTime(item.time)}</Text>
                </View>
              </View>
              <Text style={styles.scheduleArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Time Picker */}
        {showPicker && (
          <DateTimePicker
            value={horaires[showPicker as keyof typeof horaires]}
            mode="time"
            is24Hour={true}
            display="default"
            onChange={(event, selectedDate) => handleTimeChange(event, selectedDate, showPicker)}
          />
        )}

        {/* Note */}
        <View style={styles.noteSection}>
          <Text style={styles.noteText}>
            💡 Les modifications sont automatiquement sauvegardées et appliquées immédiatement.
          </Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#21262D',
  },
  backButton: {
    padding: 8,
  },
  backText: {
    fontSize: 24,
    color: '#FFFFFF',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  placeholder: {
    width: 40,
  },
  infoSection: {
    padding: 20,
    backgroundColor: '#161B22',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#21262D',
  },
  infoText: {
    color: '#8B949E',
    fontSize: 14,
    textAlign: 'center',
  },
  section: {
    padding: 20,
  },
  scheduleItem: {
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#21262D',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scheduleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scheduleIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  scheduleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  scheduleTime: {
    fontSize: 18,
    color: '#1F6FEB',
    fontWeight: 'bold',
  },
  scheduleArrow: {
    fontSize: 20,
    color: '#8B949E',
  },
  noteSection: {
    padding: 20,
    backgroundColor: '#161B22',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#21262D',
  },
  noteText: {
    color: '#8B949E',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
