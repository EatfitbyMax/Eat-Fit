import { Platform } from 'react-native';
import { PersistentStorage } from './storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mode fantôme pour Expo Go - désactive les IAP en développement
const IS_EXPO_GO = __DEV__ && !process.env.EXPO_PUBLIC_USE_EAS_BUILD;

// Import conditionnel pour éviter les erreurs dans Expo Go
let InAppPurchases: any = null;
if (!IS_EXPO_GO) {
  try {
    InAppPurchases = require('expo-in-app-purchases');
  } catch (error) {
    console.log('📱 Mode fantôme IAP: expo-in-app-purchases non disponible, utilisation du mock');
    InAppPurchases = require('./expo-in-app-purchases-mock').default;
  }
} else {
  // Utiliser le mock en mode Expo Go
  InAppPurchases = require('./expo-in-app-purchases-mock').default;
}

export interface IAPSubscriptionPlan {
  id: string;
  name: string;
  price: string;
  currency: string;
  duration: string;
  appointmentLimits: {
    monthly: number;
    weekly: number;
  };
  features: string[];
  productId: string; // ID du produit dans App Store Connect
}

// IDs des produits configurés dans App Store Connect
export const IAP_PRODUCT_IDS = {
  bronze: 'com.eatfitbymax.app.bronze_monthly',
  silver: 'com.eatfitbymax.app.silver_monthly',
  gold: 'com.eatfitbymax.app.gold_monthly',
  diamond: 'com.eatfitbymax.app.diamond_monthly'
};

export const IAP_SUBSCRIPTION_PLANS: IAPSubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Version Gratuite',
    price: '0,00 €',
    currency: 'EUR',
    duration: 'gratuit',
    appointmentLimits: { monthly: 0, weekly: 0 },
    features: ['Fonctionnalités de base disponibles'],
    productId: ''
  },
  {
    id: 'bronze',
    name: 'BRONZE',
    price: '9,99 €',
    currency: 'EUR',
    duration: 'mois',
    appointmentLimits: { monthly: 0, weekly: 0 },
    features: [
      'Messagerie avec le coach',
      '1 programme nutritionnel/semaine',
      '1 programme sportif/semaine'
    ],
    productId: IAP_PRODUCT_IDS.bronze
  },
  {
    id: 'silver',
    name: 'ARGENT',
    price: '19,99 €',
    currency: 'EUR',
    duration: 'mois',
    appointmentLimits: { monthly: 1, weekly: 0 },
    features: [
      'Messagerie avec le coach',
      '3 programmes nutritionnels/semaine',
      '3 programmes sportifs/semaine',
      '1 rendez-vous/mois'
    ],
    productId: IAP_PRODUCT_IDS.silver
  },
  {
    id: 'gold',
    name: 'OR',
    price: '49,99 €',
    currency: 'EUR',
    duration: 'mois',
    appointmentLimits: { monthly: 4, weekly: 0 },
    features: [
      'Messagerie avec le coach',
      '5 programmes nutritionnels/semaine',
      '5 programmes sportifs/semaine',
      '4 rendez-vous/mois',
      '2 analyses vidéo/mois'
    ],
    productId: IAP_PRODUCT_IDS.gold
  },
  {
    id: 'diamond',
    name: 'DIAMANT',
    price: '99,99 €',
    currency: 'EUR',
    duration: 'mois',
    appointmentLimits: { monthly: 8, weekly: 0 },
    features: [
      'Messagerie avec le coach',
      '7 programmes nutritionnels/semaine',
      '7 programmes sportifs/semaine',
      '8 rendez-vous/mois',
      '4 analyses vidéo/mois'
    ],
    productId: IAP_PRODUCT_IDS.diamond
  }
];

export class InAppPurchaseService {
  private static isInitialized = false;
  private static availableProducts: InAppPurchases.IAPItemDetails[] = [];

  static async initialize(): Promise<boolean> {
    if (IS_EXPO_GO) {
      console.log('🚫 Mode Expo Go détecté - IAP désactivés');
      return false;
    }

    try {
      // Vérifier si nous sommes dans un environnement qui supporte les IAP
      if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
        console.log('🚫 Plateforme non supportée pour les IAP');
        return false;
      }

      // Import conditionnel uniquement pour les vraies builds
      const { InAppPurchases } = await import('expo-in-app-purchases');

      // Vérifier que le module est bien chargé
      if (!InAppPurchases || typeof InAppPurchases.connectAsync !== 'function') {
        console.warn('⚠️ Module expo-in-app-purchases non disponible');
        return false;
      }

      const result = await InAppPurchases.connectAsync();
      console.log('✅ IAP initialisés avec succès:', result);
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('❌ Erreur initialisation IAP:', error);
      this.isInitialized = false;
      return false;
    }
  }

  static async getAvailableProducts(): Promise<InAppPurchases.IAPItemDetails[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    return this.availableProducts;
  }

  static async purchaseSubscription(productId: string, userId: string): Promise<boolean> {
    try {
      if (IS_EXPO_GO) {
        console.log('👻 Mode fantôme IAP: Simulation achat réussi pour:', productId);
        // Simuler un achat réussi
        const mockPurchase = {
          productId,
          transactionId: `mock_${Date.now()}`,
          originalTransactionId: `mock_original_${Date.now()}`,
          transactionDate: Date.now()
        };
        await this.handleSuccessfulPurchase(mockPurchase as any, userId);
        return true;
      }

      if (Platform.OS !== 'ios') {
        throw new Error('IAP disponible uniquement sur iOS');
      }

      if (!InAppPurchases) {
        throw new Error('InAppPurchases non disponible');
      }

      if (!this.isInitialized) {
        const initialized = await this.initialize();
        if (!initialized) {
          throw new Error('Impossible d\'initialiser les achats intégrés');
        }
      }

      console.log('🔄 Démarrage achat IAP pour:', productId);

      // Effectuer l'achat
      const { responseCode, results } = await InAppPurchases.purchaseItemAsync(productId);

      if (responseCode === InAppPurchases.IAPResponseCode.OK && results && results.length > 0) {
        const purchase = results[0];
        console.log('✅ Achat IAP réussi:', purchase.productId);

        // Sauvegarder l'abonnement localement
        await this.handleSuccessfulPurchase(purchase, userId);

        // Finaliser la transaction
        await InAppPurchases.finishTransactionAsync(purchase, true);

        return true;
      } else if (responseCode === InAppPurchases.IAPResponseCode.USER_CANCELED) {
        console.log('ℹ️ Achat annulé par l\'utilisateur');
        return false;
      } else {
        console.error('❌ Erreur achat IAP:', responseCode);
        return false;
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'achat:', error);
      return false;
    }
  }

  private static async handleSuccessfulPurchase(
    purchase: InAppPurchases.InAppPurchase,
    userId: string
  ): Promise<void> {
    try {
      // Trouver le plan correspondant
      const plan = IAP_SUBSCRIPTION_PLANS.find(p => p.productId === purchase.productId);
      if (!plan) {
        throw new Error(`Plan non trouvé pour le produit: ${purchase.productId}`);
      }

      // Créer l'objet abonnement
      const subscription = {
        planId: plan.id,
        planName: plan.name,
        price: plan.price,
        currency: plan.currency,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 jours
        status: 'active',
        paymentMethod: 'apple_iap',
        transactionId: purchase.transactionId,
        originalTransactionId: purchase.originalTransactionId,
        purchaseDate: purchase.transactionDate ? new Date(purchase.transactionDate).toISOString() : new Date().toISOString()
      };

      // Sauvegarder localement
      await AsyncStorage.setItem(`subscription_${userId}`, JSON.stringify(subscription));

      // Sauvegarder sur le serveur VPS
      await this.syncSubscriptionWithServer(subscription, userId);

      console.log('✅ Abonnement IAP activé:', subscription);
    } catch (error) {
      console.error('Erreur sauvegarde abonnement IAP:', error);
    }
  }

  private static async syncSubscriptionWithServer(subscription: any, userId: string): Promise<void> {
    try {
      const serverUrl = process.env.EXPO_PUBLIC_VPS_URL || 'https://eatfitbymax.cloud';

      const response = await fetch(`${serverUrl}/api/subscriptions/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          subscription
        }),
      });

      if (response.ok) {
        console.log('✅ Abonnement synchronisé avec le serveur');
      } else {
        console.warn('⚠️ Erreur synchronisation serveur, abonnement sauvé localement');
      }
    } catch (error) {
      console.warn('⚠️ Impossible de synchroniser avec le serveur:', error);
    }
  }

  static async restorePurchases(userId: string): Promise<boolean> {
    try {
      if (IS_EXPO_GO) {
        console.log('👻 Mode fantôme IAP: Simulation restauration (aucun achat trouvé)');
        return false;
      }

      if (Platform.OS !== 'ios') {
        return false;
      }

      if (!InAppPurchases) {
        return false;
      }

      if (!this.isInitialized) {
        await this.initialize();
      }

      const { responseCode, results } = await InAppPurchases.getPurchaseHistoryAsync();

      if (responseCode === InAppPurchases.IAPResponseCode.OK && results) {
        console.log('📦 Restauration des achats:', results.length, 'transactions trouvées');

        // Trouver l'abonnement actif le plus récent
        const activePurchases = results.filter(purchase => {
          // Vérifier si c'est un de nos produits
          return Object.values(IAP_PRODUCT_IDS).includes(purchase.productId);
        });

        if (activePurchases.length > 0) {
          // Prendre le plus récent
          const latestPurchase = activePurchases.sort((a, b) => 
            (b.transactionDate || 0) - (a.transactionDate || 0)
          )[0];

          await this.handleSuccessfulPurchase(latestPurchase, userId);
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('❌ Erreur restauration achats:', error);
      return false;
    }
  }

  static async getCurrentSubscription(userId: string) {
    try {
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
        price: '0,00 €',
        currency: 'EUR',
        status: 'active',
        paymentMethod: 'none'
      };
    } catch (error) {
      console.error('Erreur récupération abonnement IAP:', error);

      // En cas d'erreur, retourner un abonnement gratuit par défaut
      return {
        planId: 'free',
        planName: 'Version Gratuite',
        price: '0,00 €',
        currency: 'EUR',
        status: 'active',
        paymentMethod: 'none'
      };
    }
  }

  static async disconnect(): Promise<void> {
    try {
      if (IS_EXPO_GO) {
        console.log('👻 Mode fantôme IAP: Simulation déconnexion réussie');
        this.isInitialized = false;
        return;
      }

      if (this.isInitialized && InAppPurchases) {
        await InAppPurchases.disconnectAsync();
        this.isInitialized = false;
        console.log('✅ Déconnexion IAP réussie');
      }
    } catch (error) {
      console.error('❌ Erreur déconnexion IAP:', error);
    }
  }
}