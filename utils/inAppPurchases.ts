
import { Platform } from 'react-native';
import * as InAppPurchases from 'expo-in-app-purchases';
import { PersistentStorage } from './storage';

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
    try {
      if (Platform.OS !== 'ios') {
        console.log('ℹ️ IAP disponible uniquement sur iOS');
        return false;
      }

      if (this.isInitialized) {
        return true;
      }

      // Connecter au store
      await InAppPurchases.connectAsync();
      console.log('✅ Connexion IAP établie');

      // Récupérer les produits disponibles
      const productIds = Object.values(IAP_PRODUCT_IDS);
      const { results, responseCode } = await InAppPurchases.getProductsAsync(productIds);

      if (responseCode === InAppPurchases.IAPResponseCode.OK) {
        this.availableProducts = results || [];
        console.log('✅ Produits IAP récupérés:', this.availableProducts.length);
        this.isInitialized = true;
        return true;
      } else {
        console.error('❌ Erreur récupération produits IAP:', responseCode);
        return false;
      }
    } catch (error) {
      console.error('❌ Erreur initialisation IAP:', error);
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
      if (Platform.OS !== 'ios') {
        throw new Error('IAP disponible uniquement sur iOS');
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
      await PersistentStorage.setItem(`subscription_${userId}`, JSON.stringify(subscription));

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
      if (Platform.OS !== 'ios') {
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
      const subscriptionData = await PersistentStorage.getItem(`subscription_${userId}`);

      if (subscriptionData) {
        const subscription = JSON.parse(subscriptionData);

        // Vérifier si l'abonnement est encore valide
        if (subscription.endDate && new Date(subscription.endDate) > new Date()) {
          return subscription;
        } else if (subscription.endDate) {
          // Abonnement expiré
          subscription.status = 'expired';
          await PersistentStorage.setItem(`subscription_${userId}`, JSON.stringify(subscription));
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
      if (this.isInitialized) {
        await InAppPurchases.disconnectAsync();
        this.isInitialized = false;
        console.log('✅ Déconnexion IAP réussie');
      }
    } catch (error) {
      console.error('❌ Erreur déconnexion IAP:', error);
    }
  }
}
