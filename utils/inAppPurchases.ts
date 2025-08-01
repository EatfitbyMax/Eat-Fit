
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import direct du module natif - fonctionne uniquement avec EAS Build
import * as InAppPurchases from 'expo-in-app-purchases';

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

  static isInMockMode(): boolean {
    return false; // Plus de mock, uniquement natif
  }

  static async initialize(): Promise<boolean> {
    if (this.isInitialized) {
      console.log('✅ IAP déjà initialisés');
      return true;
    }

    try {
      // Vérifier si nous sommes dans un environnement qui supporte les IAP
      if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
        console.log('🚫 Plateforme non supportée pour les IAP:', Platform.OS);
        return false;
      }

      console.log('🔄 Initialisation des IAP natifs (EAS Build uniquement)');

      await InAppPurchases.connectAsync();
      console.log('✅ IAP initialisés avec succès');
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('❌ Erreur initialisation IAP:', error);
      console.log('ℹ️ Les achats intégrés nécessitent EAS Build, pas Expo Go');
      this.isInitialized = false;
      return false;
    }
  }

  static async getAvailableProducts(): Promise<InAppPurchases.IAPItemDetails[]> {
    if (!this.isInitialized) {
      const initialized = await this.initialize();
      if (!initialized) {
        console.log('⚠️ IAP non disponibles, retour de produits vides');
        return [];
      }
    }

    if (this.availableProducts.length > 0) {
      return this.availableProducts;
    }

    try {
      const productIds = Object.values(IAP_PRODUCT_IDS);
      console.log('🔍 Récupération des produits IAP:', productIds);

      const { responseCode, results } = await InAppPurchases.getProductsAsync(productIds);

      if (responseCode === InAppPurchases.IAPResponseCode.OK && results) {
        this.availableProducts = results;
        console.log('✅ Produits IAP récupérés:', results.length);
        return results;
      } else {
        console.error('❌ Erreur récupération produits - Code:', responseCode);
        return [];
      }
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des produits:', error);
      return [];
    }
  }

  static async purchaseSubscription(productId: string, userId?: string): Promise<boolean> {
    try {
      // Récupérer l'utilisateur si non fourni
      if (!userId) {
        const { getCurrentUser } = require('./auth');
        const currentUser = await getCurrentUser();
        userId = currentUser?.id || 'anonymous';
      }

      console.log('🛒 Début purchaseSubscription:', { 
        productId, 
        userId, 
        platform: Platform.OS
      });

      if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
        throw new Error(`IAP non supporté sur la plateforme: ${Platform.OS}`);
      }

      if (!this.isInitialized) {
        console.log('🔄 Initialisation requise avant achat...');
        const initialized = await this.initialize();
        if (!initialized) {
          throw new Error('Les achats intégrés ne sont disponibles qu\'avec EAS Build');
        }
      }

      console.log('🔄 Démarrage achat IAP pour:', productId);

      // Effectuer l'achat
      const { responseCode, results } = await InAppPurchases.purchaseItemAsync(productId);

      console.log('📱 Réponse IAP:', { responseCode, resultsLength: results?.length });

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
        console.error('❌ Erreur achat IAP - Code de réponse:', responseCode);
        return false;
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'achat:', error);
      throw error;
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

      // Créer l'abonnement
      const subscription = {
        userId,
        planId: plan.id,
        planName: plan.name,
        productId: purchase.productId,
        transactionId: purchase.transactionId,
        originalTransactionId: purchase.originalTransactionId,
        purchaseDate: new Date(purchase.transactionDate || Date.now()).toISOString(),
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 jours
        isActive: true,
        autoRenew: true,
        receipt: purchase.transactionReceipt
      };

      // Sauvegarder localement
      await AsyncStorage.setItem('currentSubscription', JSON.stringify(subscription));
      console.log('✅ Abonnement sauvé localement:', plan.name);

      // Synchroniser avec le serveur
      await this.syncSubscriptionWithServer(subscription);

    } catch (error) {
      console.error('❌ Erreur traitement achat réussi:', error);
      throw error;
    }
  }

  private static async syncSubscriptionWithServer(subscription: any): Promise<void> {
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/subscriptions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: subscription.userId,
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

  static async getCurrentSubscription(userId: string): Promise<any> {
    try {
      const subscriptionData = await AsyncStorage.getItem('currentSubscription');
      if (subscriptionData) {
        const subscription = JSON.parse(subscriptionData);
        
        // Vérifier si l'abonnement est encore valide
        const expiryDate = new Date(subscription.expiryDate);
        const now = new Date();
        
        if (expiryDate > now && subscription.isActive) {
          return subscription;
        } else {
          // Supprimer l'abonnement expiré
          await AsyncStorage.removeItem('currentSubscription');
        }
      }
      
      return null;
    } catch (error) {
      console.error('❌ Erreur récupération abonnement:', error);
      return null;
    }
  }

  static async cancelSubscription(userId: string): Promise<boolean> {
    try {
      await AsyncStorage.removeItem('currentSubscription');
      console.log('✅ Abonnement annulé localement');
      return true;
    } catch (error) {
      console.error('❌ Erreur annulation abonnement:', error);
      return false;
    }
  }
}
