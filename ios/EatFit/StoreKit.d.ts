
declare module 'react-native' {
  namespace NativeModules {
    interface StoreKit {
      initialize(): Promise<boolean>;
      loadProducts(productIds: string[]): Promise<any[]>;
      purchase(productId: string): Promise<any>;
      currentEntitlements(): Promise<any[]>;
      restorePurchases(): Promise<{ success: boolean; purchases: any[] }>;
    }
  }
}
