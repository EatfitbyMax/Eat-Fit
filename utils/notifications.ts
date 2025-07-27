
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { PersistentStorage } from './storage';

// Configuration des notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Configuration du canal de notification par défaut (Android)
if (Platform.OS === 'android') {
  Notifications.setNotificationChannelAsync('default', {
    name: 'EatFit By Max',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#1E1E1E',
  });
}

export class NotificationService {
  
  // Demander les permissions de notifications
  static async requestPermissions(): Promise<boolean> {
    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.warn('⚠️ Permission notifications refusée');
        return false;
      }
      
      console.log('✅ Permissions notifications accordées');
      return true;
    } else {
      console.warn('⚠️ Notifications non supportées sur émulateur');
      return false;
    }
  }

  // Programmer les rappels de repas
  static async scheduleNutritionReminders(userId: string): Promise<void> {
    try {
      const settings = await PersistentStorage.getNotificationSettings(userId);
      
      if (!settings.mealReminders || !settings.pushNotifications) {
        console.log('🔔 Rappels de repas désactivés');
        return;
      }

      // Annuler les anciennes notifications
      await Notifications.cancelAllScheduledNotificationsAsync();

      // Sons personnalisés selon les préférences
      const soundConfig = settings.soundEnabled ? 'default' : undefined;

      // Programmer petit-déjeuner (8h00)
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🌅 Petit-déjeuner',
          body: 'C\'est l\'heure de votre petit-déjeuner ! Bon appétit 🍳',
          sound: soundConfig,
          vibrate: settings.vibrationEnabled ? [0, 250, 250, 250] : [],
        },
        trigger: {
          hour: 8,
          minute: 0,
          repeats: true,
        },
      });

      // Programmer déjeuner (12h30)
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '☀️ Déjeuner',
          body: 'Il est temps de déjeuner ! Prenez une pause 🥗',
          sound: soundConfig,
          vibrate: settings.vibrationEnabled ? [0, 250, 250, 250] : [],
        },
        trigger: {
          hour: 12,
          minute: 30,
          repeats: true,
        },
      });

      // Programmer dîner (19h00)
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🌆 Dîner',
          body: 'L\'heure du dîner est arrivée ! Bon repas 🍽️',
          sound: soundConfig,
          vibrate: settings.vibrationEnabled ? [0, 250, 250, 250] : [],
        },
        trigger: {
          hour: 19,
          minute: 0,
          repeats: true,
        },
      });

      console.log('✅ Rappels de repas programmés');
    } catch (error) {
      console.error('❌ Erreur programmation rappels repas:', error);
    }
  }

  // Programmer les rappels d'entraînement
  static async scheduleWorkoutReminders(userId: string): Promise<void> {
    try {
      const settings = await PersistentStorage.getNotificationSettings(userId);
      
      if (!settings.workoutReminders || !settings.pushNotifications) {
        console.log('🔔 Rappels d\'entraînement désactivés');
        return;
      }

      const soundConfig = settings.soundEnabled ? 'default' : undefined;

      // Programmer rappel entraînement (18h00)
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🏋️‍♂️ Entraînement',
          body: 'C\'est l\'heure de votre séance d\'entraînement ! 💪',
          sound: soundConfig,
          vibrate: settings.vibrationEnabled ? [0, 250, 250, 250] : [],
        },
        trigger: {
          hour: 18,
          minute: 0,
          repeats: true,
        },
      });

      console.log('✅ Rappels d\'entraînement programmés');
    } catch (error) {
      console.error('❌ Erreur programmation rappels entraînement:', error);
    }
  }

  // Envoyer notification de motivation
  static async sendMotivationNotification(userId: string, message: string): Promise<void> {
    try {
      const settings = await PersistentStorage.getNotificationSettings(userId);
      
      if (!settings.progressUpdates || !settings.pushNotifications) {
        return;
      }

      const soundConfig = settings.soundEnabled ? 'default' : undefined;

      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🎯 Motivation',
          body: message,
          sound: soundConfig,
          vibrate: settings.vibrationEnabled ? [0, 250, 250, 250] : [],
        },
        trigger: null, // Immédiate
      });

      console.log('✅ Notification de motivation envoyée');
    } catch (error) {
      console.error('❌ Erreur envoi notification motivation:', error);
    }
  }

  // Envoyer notification du coach
  static async sendCoachNotification(userId: string, coachName: string, message: string): Promise<void> {
    try {
      const settings = await PersistentStorage.getNotificationSettings(userId);
      
      if (!settings.coachMessages || !settings.pushNotifications) {
        return;
      }

      const soundConfig = settings.soundEnabled ? 'default' : undefined;

      await Notifications.scheduleNotificationAsync({
        content: {
          title: `💬 Message de ${coachName}`,
          body: message,
          sound: soundConfig,
          vibrate: settings.vibrationEnabled ? [0, 250, 250, 250] : [],
        },
        trigger: null, // Immédiate
      });

      console.log('✅ Notification coach envoyée');
    } catch (error) {
      console.error('❌ Erreur envoi notification coach:', error);
    }
  }

  // Programmer rapport hebdomadaire
  static async scheduleWeeklyReport(userId: string): Promise<void> {
    try {
      const settings = await PersistentStorage.getNotificationSettings(userId);
      
      if (!settings.weeklyReports || !settings.pushNotifications) {
        return;
      }

      const soundConfig = settings.soundEnabled ? 'default' : undefined;

      // Tous les dimanches à 20h
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '📊 Rapport hebdomadaire',
          body: 'Votre résumé de la semaine est disponible ! 📈',
          sound: soundConfig,
          vibrate: settings.vibrationEnabled ? [0, 250, 250, 250] : [],
        },
        trigger: {
          weekday: 1, // Dimanche
          hour: 20,
          minute: 0,
          repeats: true,
        },
      });

      console.log('✅ Rapport hebdomadaire programmé');
    } catch (error) {
      console.error('❌ Erreur programmation rapport hebdomadaire:', error);
    }
  }

  // Initialiser toutes les notifications pour un utilisateur
  static async initializeNotifications(userId: string): Promise<void> {
    try {
      console.log('🔔 Initialisation des notifications pour:', userId);
      
      // Demander les permissions
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.warn('⚠️ Permissions notifications non accordées');
        return;
      }

      // Programmer toutes les notifications
      await this.scheduleNutritionReminders(userId);
      await this.scheduleWorkoutReminders(userId);
      await this.scheduleWeeklyReport(userId);

      console.log('✅ Toutes les notifications ont été initialisées');
    } catch (error) {
      console.error('❌ Erreur initialisation notifications:', error);
    }
  }

  // Tester les notifications
  static async testNotification(userId: string): Promise<void> {
    try {
      const settings = await PersistentStorage.getNotificationSettings(userId);
      const soundConfig = settings.soundEnabled ? 'default' : undefined;

      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🧪 Test de notification',
          body: 'Votre système de notifications fonctionne parfaitement ! 🎉',
          sound: soundConfig,
          vibrate: settings.vibrationEnabled ? [0, 250, 250, 250] : [],
        },
        trigger: {
          seconds: 2,
        },
      });

      console.log('✅ Notification de test programmée');
    } catch (error) {
      console.error('❌ Erreur test notification:', error);
    }
  }

  // Annuler toutes les notifications
  static async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('✅ Toutes les notifications annulées');
    } catch (error) {
      console.error('❌ Erreur annulation notifications:', error);
    }
  }

  // Mettre à jour les notifications quand les paramètres changent
  static async updateNotifications(userId: string): Promise<void> {
    try {
      // Annuler les anciennes
      await this.cancelAllNotifications();
      
      // Reprogrammer avec les nouveaux paramètres
      await this.initializeNotifications(userId);
      
      console.log('✅ Notifications mises à jour');
    } catch (error) {
      console.error('❌ Erreur mise à jour notifications:', error);
    }
  }
}
