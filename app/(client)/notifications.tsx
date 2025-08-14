import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Switch, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { getCurrentUser } from '@/utils/auth';
import { PersistentStorage } from '@/utils/storage';
import { NotificationService } from '@/utils/notifications';

export default function NotificationsScreen() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [settings, setSettings] = useState({
    pushNotifications: true,
    mealReminders: true,
    workoutReminders: true,
    progressUpdates: true,
    coachMessages: true,
    weeklyReports: true,
    soundEnabled: true,
    vibrationEnabled: true,
  });

  useEffect(() => {
    loadUserData();
  }, []);

  // Supprimer l'initialisation automatique des notifications
  // Elles seront initialisées uniquement lors des changements de paramètres

  const loadUserData = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        // Charger les paramètres de notification existants
        loadNotificationSettings();
      }
    } catch (error) {
      console.error('Erreur chargement utilisateur:', error);
    }
  };

  const updateSetting = async (key: string, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    try {
      if (user?.id) {
        // Sauvegarder directement sur le serveur
        await saveNotificationSettings(newSettings);
        
        // Mettre à jour seulement les notifications concernées par le paramètre modifié
        switch (key) {
          case 'mealReminders':
            await NotificationService.updateMealNotifications(user.id);
            break;
          case 'workoutReminders':
            await NotificationService.updateWorkoutNotifications(user.id);
            break;
          case 'weeklyReports':
            await NotificationService.updateWeeklyReportNotifications(user.id);
            break;
          case 'pushNotifications':
            // Si les notifications push sont désactivées, tout annuler
            if (!value) {
              await NotificationService.cancelAllNotifications();
            } else {
              // Si réactivées, tout reprogrammer
              await NotificationService.updateNotifications(user.id);
            }
            break;
          // Les autres paramètres (soundEnabled, vibrationEnabled, etc.) n'ont pas besoin de reprogrammation
          default:
            console.log(`🔔 Paramètre ${key} mis à jour sans reprogrammation`);
            break;
        }
        
        console.log('✅ Paramètre de notification mis à jour:', key, '=', value);
      }
    } catch (error) {
      console.error('Erreur sauvegarde paramètres:', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder les paramètres');
      // Revenir à l'ancienne valeur en cas d'erreur
      setSettings(settings);
    }
  };

  const notificationTypes = [
    {
      key: 'pushNotifications',
      title: 'Notifications push',
      description: 'Recevoir des notifications sur votre appareil',
      icon: '🔔'
    },
    {
      key: 'mealReminders',
      title: 'Rappels de repas',
      description: 'Vous rappeler de prendre vos repas',
      icon: '🍽️'
    },
    {
      key: 'workoutReminders',
      title: 'Rappels d\'entraînement',
      description: 'Vous rappeler vos séances d\'entraînement',
      icon: '🏋️‍♂️'
    },
    {
      key: 'progressUpdates',
      title: 'Mises à jour de progrès',
      description: 'Notifications sur vos progrès et réussites',
      icon: '📈'
    },
    {
      key: 'coachMessages',
      title: 'Messages du coach',
      description: 'Notifications des nouveaux messages de votre coach',
      icon: '💬'
    },
    {
      key: 'weeklyReports',
      title: 'Rapports hebdomadaires',
      description: 'Résumé de votre semaine chaque dimanche',
      icon: '📊'
    }
  ];

  const soundSettings = [
    {
      key: 'soundEnabled',
      title: 'Son des notifications',
      description: 'Jouer un son lors des notifications',
      icon: '🔊'
    },
    {
      key: 'vibrationEnabled',
      title: 'Vibration',
      description: 'Vibrer lors des notifications',
      icon: '📳'
    }
  ];

  const loadNotificationSettings = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (currentUser?.id) {
        console.log('🔔 Chargement paramètres notifications pour utilisateur:', currentUser.id);
        const savedSettings = await PersistentStorage.getNotificationSettings(currentUser.id);
        
        // Vérifier que les paramètres sont valides (pas juste une erreur)
        if (savedSettings && typeof savedSettings === 'object' && !savedSettings.error) {
          setSettings(savedSettings);
          console.log('✅ Paramètres notifications chargés:', savedSettings);
        } else {
          console.log('⚠️ Paramètres invalides, utilisation des paramètres par défaut');
          throw new Error('Paramètres notifications invalides');
        }
      } else {
        console.error('❌ Aucun utilisateur connecté pour charger les paramètres notifications');
        throw new Error('Aucun utilisateur connecté');
      }
    } catch (error) {
      console.error('Erreur chargement paramètres notifications:', error);
      // Utiliser les paramètres par défaut en cas d'erreur (notifications activées)
      const defaultSettings = {
        pushNotifications: true,
        mealReminders: true,
        workoutReminders: true,
        progressUpdates: true,
        coachMessages: true,
        weeklyReports: true,
        soundEnabled: true,
        vibrationEnabled: true,
      };
      setSettings(defaultSettings);
      console.log('✅ Paramètres par défaut appliqués');
    }
  };

  const saveNotificationSettings = async (settings: NotificationSettings) => {
    try {
      const currentUser = await PersistentStorage.getCurrentUser();
      if (currentUser) {
        // Sauvegarder les paramètres sur le serveur VPS
        await PersistentStorage.saveNotificationSettings(currentUser.id, settings);

        // Mettre à jour l'utilisateur local
        const updatedUser = { ...currentUser, notificationSettings: settings };
        await PersistentStorage.setCurrentUser(updatedUser);
        console.log('Paramètres de notifications sauvegardés');
      }
    } catch (error) {
      console.error('Erreur sauvegarde paramètres notifications:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.push('/(client)/parametres-application')}
          >
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Notifications</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Notification Types */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔔 Types de notifications</Text>

          {notificationTypes.map((item) => (
            <View key={item.key} style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingIcon}>{item.icon}</Text>
                <View style={styles.settingTextContainer}>
                  <Text style={styles.settingTitle}>{item.title}</Text>
                  <Text style={styles.settingDescription}>{item.description}</Text>
                </View>
              </View>
              <Switch
                value={settings[item.key as keyof typeof settings] as boolean}
                onValueChange={(value) => updateSetting(item.key, value)}
                trackColor={{ false: '#21262D', true: '#1F6FEB' }}
                thumbColor={settings[item.key as keyof typeof settings] ? '#FFFFFF' : '#8B949E'}
              />
            </View>
          ))}
        </View>

        {/* Sound & Vibration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔊 Son et vibration</Text>

          {soundSettings.map((item) => (
            <View key={item.key} style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingIcon}>{item.icon}</Text>
                <View style={styles.settingTextContainer}>
                  <Text style={styles.settingTitle}>{item.title}</Text>
                  <Text style={styles.settingDescription}>{item.description}</Text>
                </View>
              </View>
              <Switch
                value={settings[item.key as keyof typeof settings] as boolean}
                onValueChange={(value) => updateSetting(item.key, value)}
                trackColor={{ false: '#21262D', true: '#1F6FEB' }}
                thumbColor={settings[item.key as keyof typeof settings] ? '#FFFFFF' : '#8B949E'}
              />
            </View>
          ))}
        </View>

        {/* Schedule */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⏰ Horaires des notifications</Text>

          <TouchableOpacity 
            style={styles.scheduleItem}
            onPress={() => router.push('/(client)/horaires-notifications')}
          >
            <View style={styles.scheduleInfo}>
              <Text style={styles.scheduleIcon}>⏰</Text>
              <View>
                <Text style={styles.scheduleTitle}>Modifier les horaires</Text>
                <Text style={styles.scheduleDescription}>Personnaliser vos rappels</Text>
              </View>
            </View>
            <Text style={styles.scheduleArrow}>›</Text>
          </TouchableOpacity>
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
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  settingItem: {
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#21262D',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    color: '#8B949E',
  },
  scheduleItem: {
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
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
    fontSize: 20,
    marginRight: 12,
  },
  scheduleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  scheduleTime: {
    fontSize: 14,
    color: '#1F6FEB',
    fontWeight: '500',
  },
  scheduleDescription: {
    fontSize: 14,
    color: '#8B949E',
  },
  scheduleArrow: {
    fontSize: 18,
    color: '#8B949E',
  },
  actionButton: {
    backgroundColor: '#1F6FEB',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});