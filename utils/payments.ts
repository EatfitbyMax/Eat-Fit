import { Platform } from 'react-native';
import { initPaymentSheet, presentPaymentSheet, confirmPaymentSheetPayment } from '@stripe/stripe-react-native';

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  duration: string;
  features: string[];
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Version Gratuite',
    price: 0,
    currency: 'EUR',
    duration: 'gratuit',
    features: ['Fonctionnalités de base disponibles']
  },
  {
    id: 'bronze',
    name: 'Abonnement Bronze',
    price: 9.99,
    currency: 'EUR',
    duration: 'mois',
    features: [
      'Coach personnel 24h/24',
      'Programmes nutrition personnalisés',
      'Entraînements sur mesure'
    ]
  },
  {
    id: 'silver',
    name: 'Abonnement Silver',
    price: 19.99,
    currency: 'EUR',
    duration: 'mois',
    features: [
      'Tout du Bronze',
      'Suivi avancé des performances',
      'Analyses nutritionnelles détaillées',
      'Support prioritaire'
    ]
  },
  {
    id: 'gold',
    name: 'Abonnement Gold',
    price: 29.99,
    currency: 'EUR',
    duration: 'mois',
    features: [
      'Tout du Silver',
      'Coach personnel dédié',
      'Plans de repas personnalisés',
      'Consultations vidéo illimitées'
    ]
  }
];

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

      // Dans un vrai projet, ceci serait un appel à votre serveur backend
      // Pour la demo, on simule la réponse
      const response = await this.mockServerCall(plan, userId);
      return response;
    } catch (error) {
      console.error('Erreur création PaymentIntent:', error);
      throw error;
    }
  }

  private static async mockServerCall(plan: SubscriptionPlan, userId: string) {
    // Simulation d'un appel serveur - remplacez par votre vraie API
    return new Promise<{ clientSecret: string; ephemeralKey: string; customer: string }>((resolve) => {
      setTimeout(() => {
        resolve({
          clientSecret: `pi_mock_${Date.now()}_secret_mock`,
          ephemeralKey: `ek_mock_${Date.now()}`,
          customer: `cus_mock_${userId}`
        });
      }, 1000);
    });
  }

  static async presentApplePayPayment(plan: SubscriptionPlan, userId: string): Promise<boolean> {
    try {
      if (Platform.OS !== 'ios') {
        throw new Error('Apple Pay uniquement disponible sur iOS');
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
      // Remplacez par l'URL de votre endpoint de confirmation sur le serveur
      const response = await fetch('/api/confirm-payment', {
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