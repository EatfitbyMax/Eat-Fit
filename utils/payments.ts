export interface AppointmentLimits {
  monthly: number;
  weekly: number;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  duration: string;
  appointmentLimits: AppointmentLimits;
  features: string[];
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Version Gratuite',
    price: 0,
    currency: 'EUR',
    duration: 'gratuit',
    appointmentLimits: { monthly: 1, weekly: 0 },
    features: [
      'Fonctionnalités de base disponibles',
      '1 rendez-vous par mois',
      'Messagerie avec le coach',
      'Suivi de base'
    ]
  }
];

// Fonctions utilitaires pour les limites de rendez-vous
export const getAppointmentLimits = (planId: string): AppointmentLimits => {
  const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
  return plan?.appointmentLimits || { monthly: 1, weekly: 0 };
};

export const checkAppointmentLimit = async (
  userId: string, 
  userPlanId: string, 
  appointments: any[]
): Promise<{ canBook: boolean; reason?: string; remaining?: number }> => {
  const limits = getAppointmentLimits(userPlanId);

  const now = new Date();
  const userAppointments = appointments.filter(apt => 
    apt.clientId === userId && 
    apt.status !== 'cancelled'
  );

  // Vérification limite mensuelle (1 par mois pour tous)
  if (limits.monthly > 0) {
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const monthlyAppointments = userAppointments.filter(apt => {
      const aptDate = new Date(apt.date);
      return aptDate >= startOfMonth && aptDate <= endOfMonth;
    });

    if (monthlyAppointments.length >= limits.monthly) {
      return { 
        canBook: false, 
        reason: `Vous avez atteint votre limite mensuelle de ${limits.monthly} rendez-vous.` 
      };
    }

    return { 
      canBook: true, 
      remaining: limits.monthly - monthlyAppointments.length 
    };
  }

  return { canBook: false, reason: 'Plan non reconnu.' };
};

export class PaymentService {
  static async getCurrentSubscription(userId: string) {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const subscriptionData = await AsyncStorage.getItem(`subscription_${userId}`);

      if (subscriptionData) {
        const subscription = JSON.parse(subscriptionData);
        return subscription;
      }

      // Retourner l'abonnement gratuit par défaut
      const freeSubscription = {
        planId: 'free',
        planName: 'Version Gratuite',
        price: 0,
        currency: 'EUR',
        status: 'active',
        paymentMethod: 'none',
        startDate: new Date().toISOString(),
        features: SUBSCRIPTION_PLANS[0].features
      };

      // Sauvegarder l'abonnement gratuit
      await AsyncStorage.setItem(`subscription_${userId}`, JSON.stringify(freeSubscription));
      return freeSubscription;

    } catch (error) {
      console.error('Erreur récupération abonnement:', error);

      // En cas d'erreur, retourner un abonnement gratuit par défaut
      return {
        planId: 'free',
        planName: 'Version Gratuite',
        price: 0,
        currency: 'EUR',
        status: 'active',
        paymentMethod: 'none',
        features: SUBSCRIPTION_PLANS[0].features
      };
    }
  }

  static async cancelSubscription(userId: string): Promise<boolean> {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;

      // Remettre l'abonnement gratuit
      const freeSubscription = {
        planId: 'free',
        planName: 'Version Gratuite',
        price: 0,
        currency: 'EUR',
        status: 'active',
        paymentMethod: 'none',
        startDate: new Date().toISOString(),
        features: SUBSCRIPTION_PLANS[0].features
      };

      await AsyncStorage.setItem(`subscription_${userId}`, JSON.stringify(freeSubscription));
      console.log('✅ Retour à l\'abonnement gratuit');
      return true;
    } catch (error) {
      console.error('Erreur retour abonnement gratuit:', error);
      return false;
    }
  }
}