
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

class StoreKitManager {
  private isConnected = false;
  private products: SubscriptionProduct[] = [];
  private purchasedProductIDs: Set<string> = new Set();

  async initialize(): Promise<boolean> {
    console.log('🛒 Initialisation StoreKit 2...');
    
    if (Platform.OS !== 'ios') {
      console.log('⚠️ StoreKit uniquement disponible sur iOS');
      return false;
    }

    try {
      // Initialisation de StoreKit via le module natif
      const StoreKit = require('react-native').NativeModules.StoreKit;
      
      if (!StoreKit) {
        console.error('❌ Module StoreKit non disponible');
        return false;
      }

      await StoreKit.initialize();
      this.isConnected = true;
      console.log('✅ StoreKit 2 initialisé');
      
      // Charger les produits et vérifier les achats existants
      await this.loadProducts();
      await this.checkCurrentEntitlements();
      
      return true;
    } catch (error) {
      console.error('❌ Erreur initialisation StoreKit:', error);
      return false;
    }
  }

  async loadProducts(): Promise<void> {
    console.log('📦 Chargement des produits StoreKit...');
    
    try {
      const StoreKit = require('react-native').NativeModules.StoreKit;
      const productIds = Object.values(SUBSCRIPTION_PRODUCTS);
      
      const products = await StoreKit.loadProducts(productIds);
      
      this.products = products.map((product: any) => ({
        productId: product.id,
        title: product.displayName,
        description: product.description,
        price: product.displayPrice,
        priceAmountMicros: Math.round(product.price * 1000000),
        priceCurrencyCode: product.priceFormatStyle.currency || 'EUR',
        type: 'subs' as const
      }));
      
      console.log('✅ Produits chargés:', this.products.length);
    } catch (error) {
      console.error('❌ Erreur chargement produits:', error);
      this.products = [];
    }
  }

  async getProducts(): Promise<SubscriptionProduct[]> {
    if (!this.isConnected) {
      await this.initialize();
    }
    return this.products;
  }

  async purchaseProduct(productId: string): Promise<{ success: boolean; error?: string }> {
    console.log('💳 Tentative d\'achat StoreKit:', productId);

    if (Platform.OS !== 'ios') {
      return { success: false, error: 'Achats intégrés disponibles uniquement sur iOS' };
    }

    try {
      const StoreKit = require('react-native').NativeModules.StoreKit;
      
      // Trouver le produit
      const product = this.products.find(p => p.productId === productId);
      if (!product) {
        console.error('❌ Produit non trouvé:', productId);
        return { success: false, error: 'Produit non disponible' };
      }

      console.log('🛒 Démarrage achat pour:', product.title);
      
      // Effectuer l'achat avec StoreKit 2
      const result = await StoreKit.purchase(productId);
      
      switch (result.status) {
        case 'success':
          console.log('✅ Achat réussi');
          this.purchasedProductIDs.add(productId);
          
          // Sauvegarder l'achat localement
          await this.savePurchase({
            productId: productId,
            transactionId: result.transaction.id,
            purchaseTime: result.transaction.purchaseDate,
            expirationDate: result.transaction.expirationDate,
            verified: result.transaction.verified
          });
          
          return { success: true };
          
        case 'userCancelled':
          console.log('ℹ️ Achat annulé par l\'utilisateur');
          return { success: false, error: 'Achat annulé' };
          
        case 'pending':
          console.log('⏳ Achat en attente');
          return { success: false, error: 'Achat en attente d\'approbation' };
          
        default:
          console.error('❌ Erreur achat:', result.error);
          return { success: false, error: result.error || 'Erreur inconnue' };
      }
    } catch (error) {
      console.error('❌ Erreur achat:', error);
      return { success: false, error: error.message || 'Erreur lors de l\'achat' };
    }
  }

  async checkCurrentEntitlements(): Promise<void> {
    console.log('🔍 Vérification des droits actuels...');
    
    try {
      const StoreKit = require('react-native').NativeModules.StoreKit;
      const entitlements = await StoreKit.currentEntitlements();
      
      this.purchasedProductIDs.clear();
      
      for (const entitlement of entitlements) {
        if (entitlement.verified) {
          this.purchasedProductIDs.add(entitlement.productID);
          console.log('✅ Droit vérifié pour:', entitlement.productID);
          
          // Mettre à jour le stockage local
          await this.savePurchase({
            productId: entitlement.productID,
            transactionId: entitlement.id,
            purchaseTime: entitlement.purchaseDate,
            expirationDate: entitlement.expirationDate,
            verified: true
          });
        }
      }
      
      console.log('📊 Droits actuels:', Array.from(this.purchasedProductIDs));
    } catch (error) {
      console.error('❌ Erreur vérification droits:', error);
    }
  }

  async restorePurchases(): Promise<{ success: boolean; purchases?: any[] }> {
    console.log('🔄 Restauration des achats...');

    try {
      await this.checkCurrentEntitlements();
      
      const purchases = Array.from(this.purchasedProductIDs).map(productId => ({
        productId,
        restored: true
      }));
      
      console.log('✅ Achats restaurés:', purchases.length);
      
      return { 
        success: true, 
        purchases 
      };
    } catch (error) {
      console.error('❌ Erreur restauration:', error);
      return { success: false };
    }
  }

  async getCurrentSubscription(userId: string): Promise<any> {
    console.log('🔍 Récupération abonnement actuel pour:', userId);
    
    try {
      // Vérifier les droits actuels
      await this.checkCurrentEntitlements();
      
      // Trouver l'abonnement actif le plus récent
      for (const productId of this.purchasedProductIDs) {
        const plan = IAP_SUBSCRIPTION_PLANS.find(p => p.productId === productId);
        if (plan) {
          const subscription = {
            planId: plan.id,
            planName: plan.name,
            status: 'active',
            price: plan.price,
            currency: 'EUR',
            paymentMethod: 'apple_iap'
          };
          
          console.log('💎 Abonnement actif trouvé:', subscription);
          return subscription;
        }
      }
      
      // Aucun abonnement actif, retourner le plan gratuit
      const freeSubscription = {
        planId: 'free',
        planName: 'Version Gratuite',
        status: 'active',
        price: '0€',
        currency: 'EUR',
        paymentMethod: 'none'
      };
      
      console.log('🆓 Plan gratuit retourné');
      return freeSubscription;
      
    } catch (error) {
      console.error('❌ Erreur récupération abonnement:', error);
      return {
        planId: 'free',
        planName: 'Version Gratuite',
        status: 'active',
        price: '0€',
        currency: 'EUR',
        paymentMethod: 'none'
      };
    }
  }

  async purchaseSubscription(productId: string, userId: string): Promise<boolean> {
    console.log('🛒 Achat abonnement:', productId, 'pour:', userId);
    
    const result = await this.purchaseProduct(productId);
    return result.success;
  }

  private async savePurchase(purchase: any): Promise<void> {
    try {
      const purchaseData = {
        productId: purchase.productId,
        transactionId: purchase.transactionId,
        purchaseTime: purchase.purchaseTime,
        expirationDate: purchase.expirationDate,
        verified: purchase.verified,
        savedAt: Date.now()
      };

      await AsyncStorage.setItem(
        `storekit_purchase_${purchase.productId}`, 
        JSON.stringify(purchaseData)
      );

      console.log('💾 Achat sauvegardé:', purchaseData);
    } catch (error) {
      console.error('❌ Erreur sauvegarde achat:', error);
    }
  }

  async disconnect(): Promise<void> {
    this.isConnected = false;
    this.products = [];
    this.purchasedProductIDs.clear();
    console.log('🔌 StoreKit déconnecté');
  }

  hasActiveSubscription(): boolean {
    return this.purchasedProductIDs.size > 0;
  }

  getActivePlan(): string | null {
    for (const productId of this.purchasedProductIDs) {
      const plan = IAP_SUBSCRIPTION_PLANS.find(p => p.productId === productId);
      if (plan) return plan.id;
    }
    return null;
  }

  isInMockMode(): boolean {
    return false; // Plus de mode mock
  }
}

// Instance globale
export const purchaseManager = new StoreKitManager();

// Service InAppPurchase pour la compatibilité
export const InAppPurchaseService = {
  async getCurrentSubscription(userId: string) {
    return await purchaseManager.getCurrentSubscription(userId);
  },
  
  async purchaseSubscription(productId: string, userId: string): Promise<boolean> {
    return await purchaseManager.purchaseSubscription(productId, userId);
  },
  
  async restorePurchases() {
    return await purchaseManager.restorePurchases();
  },
  
  async initialize() {
    return await purchaseManager.initialize();
  }
};
