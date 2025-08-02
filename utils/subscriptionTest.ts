
export const testSubscriptionFlow = async (userId: string) => {
  console.log('🧪 === TEST ABONNEMENT COMPLET ===');
  
  try {
    // 1. Test initialisation IAP
    console.log('1️⃣ Test initialisation IAP...');
    const { InAppPurchaseService } = await import('./inAppPurchases');
    const iapInitialized = await InAppPurchaseService.initialize();
    console.log('   IAP Initialisés:', iapInitialized);
    
    // 2. Test récupération produits
    console.log('2️⃣ Test récupération produits...');
    const products = await InAppPurchaseService.getAvailableProducts();
    console.log('   Produits disponibles:', products.length);
    
    // 3. Test statut abonnement
    console.log('3️⃣ Test statut abonnement...');
    const { getCurrentSubscription } = await import('./subscription');
    const currentSub = await getCurrentSubscription(userId);
    console.log('   Abonnement actuel:', currentSub);
    
    // 4. Test PaymentService
    console.log('4️⃣ Test PaymentService...');
    const { PaymentService } = await import('./payments');
    const paymentInitialized = await PaymentService.initialize();
    console.log('   PaymentService initialisé:', paymentInitialized);
    
    console.log('✅ === TESTS TERMINÉS ===');
    
    return {
      iapInitialized,
      productsCount: products.length,
      currentSubscription: currentSub,
      paymentInitialized
    };
  } catch (error) {
    console.error('❌ Erreur test abonnement:', error);
    throw error;
  }
};

export const simulateSuccessfulPurchase = async (userId: string, planId: string = 'gold') => {
  console.log('🎭 === SIMULATION ACHAT RÉUSSI ===');
  
  try {
    const { InAppPurchaseService, IAP_SUBSCRIPTION_PLANS } = await import('./inAppPurchases');
    const plan = IAP_SUBSCRIPTION_PLANS.find(p => p.id === planId);
    
    if (!plan) {
      throw new Error(`Plan ${planId} introuvable`);
    }
    
    // Simuler un achat réussi en sauvegardant directement l'abonnement
    const AsyncStorage = await import('@react-native-async-storage/async-storage');
    
    const mockSubscription = {
      userId,
      planId: plan.id,
      planName: plan.name,
      productId: plan.productId,
      transactionId: `mock_${Date.now()}`,
      originalTransactionId: `mock_original_${Date.now()}`,
      purchaseDate: new Date().toISOString(),
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      isActive: true,
      autoRenew: true,
      receipt: 'mock_receipt'
    };
    
    await AsyncStorage.default.setItem('currentSubscription', JSON.stringify(mockSubscription));
    console.log('✅ Abonnement simulé sauvé:', plan.name);
    
    return mockSubscription;
  } catch (error) {
    console.error('❌ Erreur simulation achat:', error);
    throw error;
  }
};
