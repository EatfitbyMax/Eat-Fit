import { Platform } from 'react-native';

// Mock pour expo-in-app-purchases quand le module natif n'est pas disponible
const mockInAppPurchases = {
  connectAsync: async () => {
    console.log('🛒 [MOCK] InAppPurchases connectAsync');
    return Promise.resolve();
  },

  disconnectAsync: async () => {
    console.log('🛒 [MOCK] InAppPurchases disconnectAsync');
    return Promise.resolve();
  },

  getProductsAsync: async (productIds: string[]) => {
    console.log('🛒 [MOCK] InAppPurchases getProductsAsync:', productIds);
    return Promise.resolve({
      results: productIds.map(id => ({
        productId: id,
        price: '4.99',
        title: 'Premium Access',
        description: 'Accès premium à toutes les fonctionnalités',
      })),
      errorCode: null,
    });
  },

  purchaseItemAsync: async (productId: string) => {
    console.log('🛒 [MOCK] InAppPurchases purchaseItemAsync:', productId);
    return Promise.resolve({
      responseCode: 0,
      results: [{
        productId,
        purchaseToken: 'mock_token_' + Date.now(),
      }],
      errorCode: null,
    });
  },

  finishTransactionAsync: async (purchase: any) => {
    console.log('🛒 [MOCK] InAppPurchases finishTransactionAsync:', purchase);
    return Promise.resolve();
  },

  getPurchaseHistoryAsync: async () => {
    console.log('🛒 [MOCK] InAppPurchases getPurchaseHistoryAsync');
    return Promise.resolve({
      results: [],
      errorCode: null,
    });
  },

  // Types mock
  IAPResponseCode: {
    OK: 0,
    USER_CANCELED: 1,
    SERVICE_UNAVAILABLE: 2,
    BILLING_UNAVAILABLE: 3,
    ITEM_UNAVAILABLE: 4,
    DEVELOPER_ERROR: 5,
    ERROR: 6,
    ITEM_ALREADY_OWNED: 7,
    ITEM_NOT_OWNED: 8,
  },

  IAPItemType: {
    PURCHASE: 'purchase',
    SUBSCRIPTION: 'subscription',
  },
};

// Fonction pour obtenir le module (natif ou mock)
export function getInAppPurchases() {
  try {
    // Essayer d'importer le module natif
    const InAppPurchases = require('expo-in-app-purchases');
    console.log('🛒 Utilisation du module natif expo-in-app-purchases');
    return InAppPurchases;
  } catch (error) {
    console.log('🛒 Module natif non disponible, utilisation du mock');
    return mockInAppPurchases;
  }
}

export default mockInAppPurchases;