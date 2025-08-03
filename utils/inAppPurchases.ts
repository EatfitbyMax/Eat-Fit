import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  getAvailablePurchasesAsync,
  getPurchaseHistoryAsync,
  purchaseItemAsync,
  finishTransactionAsync,
  connectAsync,
  disconnectAsync,
  IAPResponseCode,
  InAppPurchase,
  IAPItemDetails
} from 'expo-in-app-purchases';

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
  BRONZE: 'com.eatfitbymax.subscription.bronze.monthly',
  ARGENT: 'com.eatfitbymax.subscription.argent.monthly',
  OR: 'com.eatfitbymax.subscription.or.monthly'
};

class InAppPurchaseManager {
  private isConnected = false;
  private products: IAPItemDetails[] = [];
  private isInitializing = false;

  async initialize(): Promise<boolean> {
    try {
      console.log('🛒 Initialisation InAppPurchases...');

      if (this.isConnected) {
        console.log('✅ InAppPurchases déjà connecté');
        return true;
      }

      if (this.isInitializing) {
        console.log('⏳ Initialisation en cours...');
        return false;
      }

      this.isInitializing = true;

      const result = await connectAsync();
      console.log('🔗 Connexion InAppPurchases:', result);

      if (result.responseCode === IAPResponseCode.OK) {
        this.isConnected = true;
        await this.loadProducts();
        console.log('✅ InAppPurchases initialisé avec succès');
        this.isInitializing = false;
        return true;
      } else {
        console.error('❌ Échec connexion InAppPurchases:', result);
        this.isInitializing = false;
        return false;
      }
    } catch (error) {
      console.error('❌ Erreur initialisation InAppPurchases:', error);
      this.isInitializing = false;
      return false;
    }
  }

  async loadProducts(): Promise<void> {
    try {
      console.log('📦 Chargement des produits...');

      const result = await getAvailablePurchasesAsync();
      console.log('📦 Produits disponibles:', result);

      if (result.responseCode === IAPResponseCode.OK) {
        this.products = result.results || [];
        console.log('✅ Produits chargés:', this.products.length);
      } else {
        console.error('❌ Erreur chargement produits:', result);
      }
    } catch (error) {
      console.error('❌ Erreur chargement produits:', error);
    }
  }

  async getProducts(): Promise<SubscriptionProduct[]> {
    if (!this.isConnected && !this.isInitializing) {
      await this.initialize();
    }

    return this.products.map(product => ({
      productId: product.productId,
      title: product.title || 'Abonnement Premium',
      description: product.description || 'Accès illimité à toutes les fonctionnalités',
      price: product.price || '9,99 €',
      priceAmountMicros: product.priceAmountMicros || 9990000,
      priceCurrencyCode: product.priceCurrencyCode || 'EUR',
      type: product.type as 'subs' | 'inapp' || 'subs'
    }));
  }

  async purchaseProduct(productId: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('💳 Tentative d\'achat:', productId);

      if (!this.isConnected && !this.isInitializing) {
        const connected = await this.initialize();
        if (!connected) {
          return { success: false, error: 'Service d\'achat non disponible' };
        }
      }

      const result = await purchaseItemAsync(productId);
      console.log('💳 Résultat achat:', result);

      if (result.responseCode === IAPResponseCode.OK && result.results) {
        const purchase = result.results[0];

        // Finaliser la transaction
        await finishTransactionAsync(purchase, false);

        // Sauvegarder l'achat
        await this.savePurchase(purchase);

        console.log('✅ Achat réussi:', purchase);
        return { success: true };
      } else {
        console.error('❌ Achat échoué:', result);
        return { 
          success: false, 
          error: this.getErrorMessage(result.responseCode) 
        };
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'achat:', error);
      return { 
        success: false, 
        error: 'Erreur technique: Veuillez redémarrer l\'application' 
      };
    }
  }

  private async savePurchase(purchase: InAppPurchase): Promise<void> {
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

      console.log('💾 Achat sauvegardé:', purchaseData);
    } catch (error) {
      console.error('❌ Erreur sauvegarde achat:', error);
    }
  }

  async restorePurchases(): Promise<{ success: boolean; purchases?: any[] }> {
    try {
      console.log('🔄 Restauration des achats...');

      if (!this.isConnected && !this.isInitializing) {
        await this.initialize();
      }

      const result = await getPurchaseHistoryAsync();
      console.log('🔄 Historique achats:', result);

      if (result.responseCode === IAPResponseCode.OK) {
        return { 
          success: true, 
          purchases: result.results || [] 
        };
      } else {
        return { 
          success: false 
        };
      }
    } catch (error) {
      console.error('❌ Erreur restauration achats:', error);
      return { success: false };
    }
  }

  private getErrorMessage(responseCode: IAPResponseCode): string {
    switch (responseCode) {
      case IAPResponseCode.USER_CANCELED:
        return 'Achat annulé par l\'utilisateur';
      case IAPResponseCode.SERVICE_UNAVAILABLE:
        return 'Service d\'achat temporairement indisponible';
      case IAPResponseCode.BILLING_UNAVAILABLE:
        return 'Facturation non disponible';
      case IAPResponseCode.ITEM_UNAVAILABLE:
        return 'Produit non disponible';
      case IAPResponseCode.DEVELOPER_ERROR:
        return 'Erreur de configuration';
      case IAPResponseCode.ERROR:
        return 'Erreur inconnue';
      default:
        return 'Erreur lors de l\'achat';
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.isConnected) {
        await disconnectAsync();
        this.isConnected = false;
        console.log('🔌 InAppPurchases déconnecté');
      }
    } catch (error) {
      console.error('❌ Erreur déconnexion InAppPurchases:', error);
    }
  }
}

// Instance globale
export const purchaseManager = new InAppPurchaseManager();