
// Mock complet pour expo-in-app-purchases
// Utilisé quand le package n'est pas disponible (Expo Go)

export const IAPResponseCode = {
  OK: 0,
  USER_CANCELED: 1,
  PAYMENT_INVALID: 2,
  PAYMENT_NOT_ALLOWED: 3,
  STORE_PRODUCT_NOT_AVAILABLE: 4,
  CLOUD_SERVICE_PERMISSION_DENIED: 5,
  CLOUD_SERVICE_NETWORK_CONNECTION_FAILED: 6,
  CLOUD_SERVICE_REVOKED: 7,
  PRIVACY_ACKNOWLEDGEMENT_REQUIRED: 8,
  UNAUTHORIZED_REQUEST_DATA: 9,
  INVALID_OFFER_IDENTIFIER: 10,
  INVALID_SIGNATURE: 11,
  MISSING_OFFER_PARAMS: 12,
  INVALID_OFFER_PRICE: 13,
  DEFERRED: 2,
  UNKNOWN: 999
};

export interface IAPItemDetails {
  productId: string;
  price: string;
  currency: string;
  title: string;
  description: string;
  priceAmountMicros?: number;
  subscriptionPeriod?: string;
  freeTrialPeriod?: string;
  introductoryPrice?: string;
  introductoryPriceAmountMicros?: number;
  introductoryPricePeriod?: string;
  introductoryPriceCycles?: number;
}

export interface InAppPurchase {
  productId: string;
  transactionId: string;
  originalTransactionId: string;
  transactionDate: number;
  transactionReceipt: string;
  purchaseState?: number;
  developerPayload?: string;
  acknowledged?: boolean;
}

export interface IAPQueryResponse {
  responseCode: number;
  results?: IAPItemDetails[];
  errorCode?: number;
}

export interface IAPPurchaseResponse {
  responseCode: number;
  results?: InAppPurchase[];
  errorCode?: number;
}

export interface IAPHistoryResponse {
  responseCode: number;
  results?: InAppPurchase[];
  errorCode?: number;
}

// Mock des fonctions principales
export const connectAsync = async (): Promise<void> => {
  console.log('👻 Mock IAP: Connexion simulée');
  return Promise.resolve();
};

export const disconnectAsync = async (): Promise<void> => {
  console.log('👻 Mock IAP: Déconnexion simulée');
  return Promise.resolve();
};

export const getProductsAsync = async (productIds: string[]): Promise<IAPQueryResponse> => {
  console.log('👻 Mock IAP: Récupération produits simulée pour:', productIds);
  
  const mockProducts: IAPItemDetails[] = productIds.map(id => ({
    productId: id,
    price: id.includes('bronze') ? '9,99 €' : 
           id.includes('silver') ? '19,99 €' : 
           id.includes('gold') ? '49,99 €' : 
           id.includes('diamond') ? '99,99 €' : '9,99 €',
    currency: 'EUR',
    title: `Abonnement ${id.split('.').pop()?.toUpperCase() || 'PREMIUM'}`,
    description: `Description pour ${id}`,
    priceAmountMicros: id.includes('bronze') ? 9990000 : 
                       id.includes('silver') ? 19990000 : 
                       id.includes('gold') ? 49990000 : 
                       id.includes('diamond') ? 99990000 : 9990000,
    subscriptionPeriod: 'P1M', // 1 mois
    freeTrialPeriod: 'P7D' // 7 jours gratuits
  }));

  return {
    responseCode: IAPResponseCode.OK,
    results: mockProducts
  };
};

export const purchaseItemAsync = async (productId: string): Promise<IAPPurchaseResponse> => {
  console.log('👻 Mock IAP: Achat simulé pour:', productId);
  
  // Simuler un délai d'achat
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Simuler différents scénarios
  const random = Math.random();
  
  if (random > 0.8) {
    // 20% de chance d'annulation utilisateur
    console.log('👻 Mock IAP: Achat annulé par l\'utilisateur simulé');
    return {
      responseCode: IAPResponseCode.USER_CANCELED
    };
  }
  
  if (random > 0.9) {
    // 10% de chance d'erreur
    console.log('👻 Mock IAP: Erreur d\'achat simulée');
    return {
      responseCode: IAPResponseCode.PAYMENT_INVALID
    };
  }

  // Simuler un achat réussi
  const mockPurchase: InAppPurchase = {
    productId,
    transactionId: `mock_transaction_${Date.now()}`,
    originalTransactionId: `mock_original_${Date.now()}`,
    transactionDate: Date.now(),
    transactionReceipt: `mock_receipt_${Date.now()}`,
    purchaseState: 1, // Purchased
    acknowledged: false
  };

  console.log('👻 Mock IAP: Achat réussi simulé');
  return {
    responseCode: IAPResponseCode.OK,
    results: [mockPurchase]
  };
};

export const finishTransactionAsync = async (
  purchase: InAppPurchase, 
  consumeItem: boolean = false
): Promise<void> => {
  console.log('👻 Mock IAP: Transaction finalisée simulée pour:', purchase.productId);
  return Promise.resolve();
};

export const getPurchaseHistoryAsync = async (): Promise<IAPHistoryResponse> => {
  console.log('👻 Mock IAP: Historique des achats simulé');
  
  // Simuler aucun achat dans l'historique pour les tests
  return {
    responseCode: IAPResponseCode.OK,
    results: []
  };
};

// Export par défaut
export default {
  IAPResponseCode,
  connectAsync,
  disconnectAsync,
  getProductsAsync,
  purchaseItemAsync,
  finishTransactionAsync,
  getPurchaseHistoryAsync
};
