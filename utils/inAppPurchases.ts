import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Types pour les produits
export interface SubscriptionProduct {
  productId: string;
  title: string;
  description: string;
  price: string;
  priceAmountMicros: number;
  priceCurrencyCode: string;
  type: 'subs' | 'inapp';
}

// Configuration des produits (IDs définis dans App Store Connect)
const SUBSCRIPTION_PRODUCTS = {
  BRONZE: 'com.eatfitbymax.app.bronze_monthly',
  SILVER: 'com.eatfitbymax.app.silver_monthly',
  GOLD: 'com.eatfitbymax.app.gold_monthly',
  DIAMOND: 'com.eatfitbymax.app.diamond_monthly'
};

// Plans d'abonnement pour l'interface utilisateur
export const IAP_SUBSCRIPTION_PLANS = [
  {
    id: 'free',
    name: 'Version Gratuite',
    price: '0€',
    duration: 'mois',
    productId: null,
    features: [
      'Fonctionnalités de base',
      'Suivi nutritionnel limité'
    ],
    appointmentLimits: { monthly: 0, yearly: 0 }
  },
  {
    id: 'bronze',
    name: 'BRONZE',
    price: '9,99€',
    duration: 'mois',
    productId: SUBSCRIPTION_PRODUCTS.BRONZE,
    features: [
      'Coach personnel par messages',
      'Programmes d\'entraînement de base',
      'Suivi nutritionnel'
    ],
    appointmentLimits: { monthly: 1, yearly: 12 }
  },
  {
    id: 'silver',
    name: 'SILVER',
    price: '19,99€',
    duration: 'mois',
    productId: SUBSCRIPTION_PRODUCTS.SILVER,
    features: [
      'Tout du plan Bronze',
      'Programmes d\'entraînement avancés',
      'Analyses de forme détaillées',
      'Rendez-vous vidéo'
    ],
    appointmentLimits: { monthly: 2, yearly: 24 }
  },
  {
    id: 'gold',
    name: 'GOLD',
    price: '49,99€',
    duration: 'mois',
    productId: SUBSCRIPTION_PRODUCTS.GOLD,
    features: [
      'Tout du plan Silver',
      'Coaching personnalisé 24h/24',
      'Programmes ultra-personnalisés',
      'Analyses vidéo de mouvement'
    ],
    appointmentLimits: { monthly: 4, yearly: 48 }
  },
  {
    id: 'diamond',
    name: 'DIAMOND',
    price: '99,99€',
    duration: 'mois',
    productId: SUBSCRIPTION_PRODUCTS.DIAMOND,
    features: [
      'Tout du plan Gold',
      'Accès prioritaire au coach',
      'Consultations illimitées',
      'Suivi en temps réel'
    ],
    appointmentLimits: { monthly: -1, yearly: -1 } // -1 = illimité
  }
];

// Mock des produits pour le développement
const MOCK_PRODUCTS: SubscriptionProduct[] = [
  {
    productId: SUBSCRIPTION_PRODUCTS.BRONZE,
    title: 'Abonnement BRONZE',
    description: 'Plan Bronze mensuel',
    price: '9,99 €',
    priceAmountMicros: 9990000,
    priceCurrencyCode: 'EUR',
    type: 'subs'
  },
  {
    productId: SUBSCRIPTION_PRODUCTS.SILVER,
    title: 'Abonnement SILVER',
    description: 'Plan Silver mensuel',
    price: '19,99 €',
    priceAmountMicros: 19990000,
    priceCurrencyCode: 'EUR',
    type: 'subs'
  },
  {
    productId: SUBSCRIPTION_PRODUCTS.GOLD,
    title: 'Abonnement GOLD',
    description: 'Plan Gold mensuel',
    price: '49,99 €',
    priceAmountMicros: 49990000,
    priceCurrencyCode: 'EUR',
    type: 'subs'
  },
  {
    productId: SUBSCRIPTION_PRODUCTS.DIAMOND,
    title: 'Abonnement DIAMOND',
    description: 'Plan Diamond mensuel',
    price: '99,99 €',
    priceAmountMicros: 99990000,
    priceCurrencyCode: 'EUR',
    type: 'subs'
  }
];

class InAppPurchaseManager {
  private isConnected = false;
  private products: SubscriptionProduct[] = MOCK_PRODUCTS;

  async initialize(): Promise<boolean> {
    console.log('🛒 Initialisation InAppPurchases (MODE MOCK)...');

    // Simulation d'une initialisation
    await new Promise(resolve => setTimeout(resolve, 500));

    this.isConnected = true;
    console.log('✅ InAppPurchases initialisé en mode mock');
    return true;
  }

  async loadProducts(): Promise<void> {
    console.log('📦 Chargement des produits (MODE MOCK)...');
    // Les produits sont déjà chargés en mock
    console.log('✅ Produits chargés:', this.products.length);
  }

  async getProducts(): Promise<SubscriptionProduct[]> {
    if (!this.isConnected) {
      await this.initialize();
    }
    return this.products;
  }

  async purchaseProduct(productId: string): Promise<{ success: boolean; error?: string }> {
    console.log('💳 Tentative d\'achat (MODE MOCK):', productId);

    // Vérifier que le produit existe
    const product = this.products.find(p => p.productId === productId);
    if (!product) {
      console.error('❌ Produit non trouvé:', productId);
      return { success: false, error: 'Produit non disponible' };
    }

    // Simulation d'un achat
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock d'un achat réussi
    const mockPurchase = {
      productId: productId,
      transactionId: `mock_${Date.now()}`,
      purchaseTime: Date.now(),
      acknowledged: true
    };

    await this.savePurchase(mockPurchase);
    console.log('✅ Achat simulé avec succès');

    return { success: true };
  }

  private async savePurchase(purchase: any): Promise<void> {
    try {
      const purchaseData = {
        productId: purchase.productId,
        transactionId: purchase.transactionId,
        purchaseTime: purchase.purchaseTime,
        acknowledged: purchase.acknowledged
      };

      await AsyncStorage.setItem(
        `purchase_${purchase.productId}`, 
        JSON.stringify(purchaseData)
      );

      console.log('💾 Achat sauvegardé (MOCK):', purchaseData);
    } catch (error) {
      console.error('❌ Erreur sauvegarde achat:', error);
    }
  }

  async restorePurchases(): Promise<{ success: boolean; purchases?: any[] }> {
    console.log('🔄 Restauration des achats (MODE MOCK)...');

    // Simulation de restauration
    await new Promise(resolve => setTimeout(resolve, 500));

    return { 
      success: true, 
      purchases: [] 
    };
  }

  async disconnect(): Promise<void> {
    this.isConnected = false;
    console.log('🔌 InAppPurchases déconnecté (MOCK)');
  }

  isInMockMode(): boolean {
    return true; // Toujours en mode mock maintenant
  }
}

// Instance globale
export const purchaseManager = new InAppPurchaseManager();