
// Mock pour expo-in-app-purchases
export const InAppPurchases = {
  IAPResponseCode: {
    OK: 0,
    USER_CANCELED: 1,
    PAYMENT_INVALID: 2,
    DEFERRED: 3,
  },
  
  connectAsync: jest.fn().mockResolvedValue(undefined),
  disconnectAsync: jest.fn().mockResolvedValue(undefined),
  getProductsAsync: jest.fn().mockResolvedValue([]),
  purchaseItemAsync: jest.fn().mockResolvedValue({
    responseCode: 0,
    results: [],
  }),
  finishTransactionAsync: jest.fn().mockResolvedValue(undefined),
  getBillingResponseCodeAsync: jest.fn().mockResolvedValue(0),
  getPurchaseHistoryAsync: jest.fn().mockResolvedValue({
    responseCode: 0,
    results: [],
  }),
};

export default InAppPurchases;
