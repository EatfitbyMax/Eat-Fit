import { Platform } from 'react-native';

// Import conditionnel de Stripe uniquement sur mobile
let initPaymentSheet: any = null;
let presentPaymentSheet: any = null;
let confirmPaymentSheetPayment: any = null;

if (Platform.OS !== 'web') {
  try {
    const stripe = require('@stripe/stripe-react-native');
    initPaymentSheet = stripe.initPaymentSheet;
    presentPaymentSheet = stripe.presentPaymentSheet;
    confirmPaymentSheetPayment = stripe.confirmPaymentSheetPayment;
  } catch (error) {
    console.warn('Stripe non disponible:', error);
  }
}

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
    appointmentLimits: { monthly: 0, weekly: 0 },
    features: ['Fonctionnalités de base disponibles']
  },
  {
    id: 'bronze',
    name: 'Abonnement Bronze',
    price: 9.99,
    currency: 'EUR',
    duration: 'mois',
    appointmentLimits: { monthly: 0, weekly: 0 },
    features: [
      'Messagerie avec le coach',
      '1 programme nutrition de base',
      'Suivi hebdomadaire',
      'Aucun rendez-vous inclus'
    ]
  },
  {
    id: 'silver',
    name: 'Abonnement Argent',
    price: 19.99,
    currency: 'EUR',
    duration: 'mois',
    appointmentLimits: { monthly: 1, weekly: 0 },
    features: [
      'Tout du Bronze',
      'Programmes nutrition personnalisés',
      'Programmes d\'entraînement',
      '1 rendez-vous par mois'
    ]
  },
  {
    id: 'gold',
    name: 'Abonnement Or',
    price: 49.99,
    currency: 'EUR',
    duration: 'mois',
    appointmentLimits: { monthly: 0, weekly: 1 },
    features: [
      'Tout de l\'Argent',
      'Coaching 24h/24 7j/7',
      'Programmes ultra-personnalisés',
      '1 rendez-vous par semaine',
      'Suivi en temps réel'
    ]
  },
  {
    id: 'diamond',
    name: 'Abonnement Diamant',
    price: 99.99,
    currency: 'EUR',
    duration: 'mois',
    appointmentLimits: { monthly: 0, weekly: 2 },
    features: [
      'Tout de l\'Or',
      'Coach personnel dédié VIP',
      'Accès aux événements exclusifs',
      'Consultations nutrition expert',
      'Support premium 24h/24',
      '2 rendez-vous par semaine',
      'Programmes sur mesure illimités'
    ]
  }
];

// Fonctions utilitaires pour les limites de rendez-vous
export const getAppointmentLimits = (planId: string): AppointmentLimits => {
  const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
  return plan?.appointmentLimits || { monthly: 0, weekly: 0 };
};

export const checkAppointmentLimit = async (
  userId: string, 
  userPlanId: string, 
  appointments: any[]
): Promise<{ canBook: boolean; reason?: string; remaining?: number }> => {
  const limits = getAppointmentLimits(userPlanId);
  
  // Si aucune limite (plan gratuit ou bronze)
  if (limits.monthly === 0 && limits.weekly === 0) {
    return { 
      canBook: false, 
      reason: 'Votre abonnement ne permet pas de prendre de rendez-vous. Passez à un plan supérieur.' 
    };
  }

  const now = new Date();
  const userAppointments = appointments.filter(apt => 
    apt.clientId === userId && 
    apt.status !== 'cancelled'
  );

  // Vérification limite mensuelle (Argent)
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

  // Vérification limite hebdomadaire (Or et Diamant)
  if (limits.weekly > 0) {
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + 1); // Lundi
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Dimanche
    endOfWeek.setHours(23, 59, 59, 999);

    const weeklyAppointments = userAppointments.filter(apt => {
      const aptDate = new Date(apt.date);
      return aptDate >= startOfWeek && aptDate <= endOfWeek;
    });

    if (weeklyAppointments.length >= limits.weekly) {
      return { 
        canBook: false, 
        reason: `Vous avez atteint votre limite hebdomadaire de ${limits.weekly} rendez-vous.` 
      };
    }

    return { 
      canBook: true, 
      remaining: limits.weekly - weeklyAppointments.length 
    };
  }

  return { canBook: false, reason: 'Plan non reconnu.' };
};

export class PaymentService {
  private static stripePublishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_your_key_here';

  static async initializeStripe() {
    // Configuration Stripe déjà gérée dans _layout.tsx principal
  }

  static async createPaymentIntent(planId: string, userId: string): Promise<{ clientSecret: string; ephemeralKey: string; customer: string }> {
    try {
      const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
      if (!plan || plan.price === 0) {
        throw new Error('Plan invalide ou gratuit');
      }

      // Appel au vrai serveur backend
      const response = await this.callServerAPI(plan, userId);
      return response;
    } catch (error) {
      console.error('Erreur création PaymentIntent:', error);
      throw error;
    }
  }

  private static async callServerAPI(plan: SubscriptionPlan, userId: string): Promise<{ clientSecret: string; ephemeralKey: string; customer: string }> {
    try {
      const serverUrl = process.env.EXPO_PUBLIC_VPS_URL || 'https://workspace.eatfitbymax.replit.dev:5000';
      
      const response = await fetch(`${serverUrl}/api/stripe/create-payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: plan.id,
          planName: plan.name,
          userId: userId,
          amount: plan.price,
          currency: plan.currency.toLowerCase()
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Erreur serveur: ${errorData.error || 'Erreur inconnue'}`);
      }

      const data = await response.json();
      return {
        clientSecret: data.clientSecret,
        ephemeralKey: data.ephemeralKey,
        customer: data.customer
      };
    } catch (error) {
      console.error('Erreur appel serveur:', error);
      throw new Error('Impossible de créer le paiement. Vérifiez votre connexion.');
    }
  }

  static async presentApplePayPayment(plan: SubscriptionPlan, userId: string): Promise<boolean> {
    try {
      if (Platform.OS !== 'ios') {
        throw new Error('Apple Pay uniquement disponible sur iOS');
      }

      if (!initPaymentSheet || !presentPaymentSheet) {
        throw new Error('Stripe non disponible sur cette plateforme');
      }

      // Créer le PaymentIntent
      const { clientSecret, ephemeralKey, customer } = await this.createPaymentIntent(plan.id, userId);

      // Initialiser le Payment Sheet avec Apple Pay
      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: 'EatFit By Max',
        customerId: customer,
        customerEphemeralKeySecret: ephemeralKey,
        paymentIntentClientSecret: clientSecret,
        allowsDelayedPaymentMethods: true,
        applePay: {
          merchantCountryCode: 'FR',
          currencyCode: plan.currency,
          requiredBillingContactFields: ['name', 'email'],
          requiredShippingContactFields: [],
        },
        returnURL: 'eatfitbymax://payment-success',
        style: 'automatic',
        appearance: {
          colors: {
            primary: '#D4A574',
            background: '#1E1E1E',
            componentBackground: '#2A2A2A',
            componentBorder: '#3A3A3A',
            componentDivider: '#3A3A3A',
            primaryText: '#FFFFFF',
            secondaryText: '#CCCCCC',
            componentText: '#FFFFFF',
            placeholderText: '#888888'
          }
        }
      });

      if (initError) {
        console.error('Erreur initialisation Payment Sheet:', initError);
        return false;
      }

      // Présenter le Payment Sheet
      const { error: presentError } = await presentPaymentSheet();

      if (presentError) {
        if (presentError.code !== 'Canceled') {
          console.error('Erreur présentation Payment Sheet:', presentError);
        }
        return false;
      }

      // Paiement réussi - confirmer côté serveur
      await this.confirmPaymentOnServer(clientSecret.split('_secret_')[0], userId);
      await this.handleSuccessfulPayment(plan, userId);
      return true;

    } catch (error) {
      console.error('Erreur Apple Pay:', error);
      return false;
    }
  }

  static async presentGooglePayPayment(plan: SubscriptionPlan, userId: string): Promise<boolean> {
    try {
      if (Platform.OS !== 'android') {
        throw new Error('Google Pay uniquement disponible sur Android');
      }

      if (!initPaymentSheet || !presentPaymentSheet) {
        throw new Error('Stripe non disponible sur cette plateforme');
      }

      // Créer le PaymentIntent
      const { clientSecret, ephemeralKey, customer } = await this.createPaymentIntent(plan.id, userId);

      // Initialiser le Payment Sheet avec Google Pay
      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: 'EatFit By Max',
        customerId: customer,
        customerEphemeralKeySecret: ephemeralKey,
        paymentIntentClientSecret: clientSecret,
        allowsDelayedPaymentMethods: true,
        googlePay: {
          merchantCountryCode: 'FR',
          currencyCode: plan.currency,
          testEnv: __DEV__,
        },
        returnURL: 'eatfitbymax://payment-success',
        style: 'automatic',
        appearance: {
          colors: {
            primary: '#D4A574',
            background: '#1E1E1E',
            componentBackground: '#2A2A2A',
            componentBorder: '#3A3A3A',
            componentDivider: '#3A3A3A',
            primaryText: '#FFFFFF',
            secondaryText: '#CCCCCC',
            componentText: '#FFFFFF',
            placeholderText: '#888888'
          }
        }
      });

      if (initError) {
        console.error('Erreur initialisation Payment Sheet:', initError);
        return false;
      }

      // Présenter le Payment Sheet
      const { error: presentError } = await presentPaymentSheet();

      if (presentError) {
        if (presentError.code !== 'Canceled') {
          console.error('Erreur présentation Payment Sheet:', presentError);
        }
        return false;
      }

      // Paiement réussi - confirmer côté serveur
      await this.confirmPaymentOnServer(clientSecret.split('_secret_')[0], userId);
      await this.handleSuccessfulPayment(plan, userId);
      return true;

    } catch (error) {
      console.error('Erreur Google Pay:', error);
      return false;
    }
  }

  private static async handleSuccessfulPayment(plan: SubscriptionPlan, userId: string) {
    try {
      // Sauvegarder l'abonnement localement
      const subscription = {
        planId: plan.id,
        planName: plan.name,
        price: plan.price,
        currency: plan.currency,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 jours
        status: 'active',
        paymentMethod: Platform.OS === 'ios' ? 'apple_pay' : 'google_pay'
      };

      const { PersistentStorage } = await import('./storage');
      await PersistentStorage.setItem(`subscription_${userId}`, JSON.stringify(subscription));

      console.log('✅ Abonnement activé:', subscription);
    } catch (error) {
      console.error('Erreur sauvegarde abonnement:', error);
    }
  }

  static async getCurrentSubscription(userId: string) {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const subscriptionData = await AsyncStorage.getItem(`subscription_${userId}`);

      if (subscriptionData) {
        const subscription = JSON.parse(subscriptionData);

        // Vérifier si l'abonnement est encore valide
        if (subscription.endDate && new Date(subscription.endDate) > new Date()) {
          return subscription;
        } else if (subscription.endDate) {
          // Abonnement expiré
          subscription.status = 'expired';
          await AsyncStorage.setItem(`subscription_${userId}`, JSON.stringify(subscription));
          return subscription;
        }

        return subscription;
      }

      // Aucun abonnement trouvé, retourner gratuit
      return {
        planId: 'free',
        planName: 'Version Gratuite',
        price: 0,
        currency: 'EUR',
        status: 'active',
        paymentMethod: 'none'
      };
    } catch (error) {
      console.error('Erreur récupération abonnement:', error);

      // En cas d'erreur, retourner un abonnement gratuit par défaut
      return {
        planId: 'free',
        planName: 'Version Gratuite',
        price: 0,
        currency: 'EUR',
        status: 'active',
        paymentMethod: 'none'
      };
    }
  }

  static async cancelSubscription(userId: string): Promise<boolean> {
    try {
      const { PersistentStorage } = await import('./storage');
      const subscriptionData = await PersistentStorage.getItem(`subscription_${userId}`);

      if (subscriptionData) {
        const subscription = JSON.parse(subscriptionData);
        subscription.status = 'cancelled';
        subscription.cancelledAt = new Date().toISOString();

        await PersistentStorage.setItem(`subscription_${userId}`, JSON.stringify(subscription));
        console.log('✅ Abonnement annulé');
        return true;
      }

      return false;
    } catch (error) {
      console.error('Erreur annulation abonnement:', error);
      return false;
    }
  }

  private static async confirmPaymentOnServer(paymentIntentId: string, userId: string): Promise<void> {
    try {
      const serverUrl = process.env.EXPO_PUBLIC_VPS_URL || 'https://workspace.eatfitbymax.replit.dev:5000';
      
      const response = await fetch(`${serverUrl}/api/stripe/confirm-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentIntentId: paymentIntentId,
          userId: userId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Erreur confirmation PaymentIntent sur le serveur:', errorData);
        throw new Error('Erreur lors de la confirmation du PaymentIntent sur le serveur');
      }

      const confirmationResult = await response.json();
      console.log('✅ PaymentIntent confirmé sur le serveur:', confirmationResult);
    } catch (error) {
      console.error('Erreur lors de la communication avec le serveur de confirmation:', error);
      throw error;
    }
  }
}