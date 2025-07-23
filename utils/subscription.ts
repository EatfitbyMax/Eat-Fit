import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentUser } from './auth';

export const checkSubscriptionStatus = async (): Promise<{ isPremium: boolean; planId: string }> => {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return { isPremium: false, planId: 'free' };

    // Utilisateurs premium par défaut (pour les tests)
    const premiumEmails: string[] = ['m.pacullmarquie@gmail.com'];

    if (premiumEmails.includes(currentUser.email)) {
      // Configuration spécifique pour m.pacullmarquie@gmail.com
      if (currentUser.email === 'm.pacullmarquie@gmail.com') {
        return { isPremium: true, planId: 'bronze' };
      }
      return { isPremium: true, planId: 'diamond' };
    }

    // Vérifier le statut d'abonnement depuis le stockage local ou serveur
    const subscriptionStatus = await AsyncStorage.getItem(`subscription_${currentUser.id}`);
    const isPremium = subscriptionStatus === 'premium';

    return { 
      isPremium, 
      planId: isPremium ? 'gold' : 'free' 
    };
  } catch (error) {
    console.error('Erreur vérification abonnement:', error);
    return { isPremium: false, planId: 'free' };
  }
};

// Fonction de compatibilité pour l'ancien code
export const checkSubscriptionStatusBoolean = async (): Promise<boolean> => {
  const result = await checkSubscriptionStatus();
  return result.isPremium;
};

export const setSubscriptionStatus = async (isPremium: boolean): Promise<void> => {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return;

    await AsyncStorage.setItem(`subscription_${currentUser.id}`, isPremium ? 'premium' : 'free');
  } catch (error) {
    console.error('Erreur mise à jour abonnement:', error);
  }
};

export const getCurrentSubscription = async (userId: string): Promise<Subscription> => {
  try {
    console.log('🔍 Récupération abonnement pour:', userId);

    // Récupérer depuis le serveur VPS
    const response = await fetch(`${process.env.EXPO_PUBLIC_VPS_URL}/api/subscription/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const subscriptionData = await response.json();
      console.log('🔍 Données d\'abonnement récupérées:', subscriptionData);

      if (subscriptionData.isPremium && subscriptionData.planId && subscriptionData.planId !== 'free') {
        const plan = SUBSCRIPTION_PLANS.find(p => p.id === subscriptionData.planId);
        if (plan) {
          const subscription = {
            planId: subscriptionData.planId,
            planName: plan.name,
            status: 'active',
            price: plan.price,
            currency: 'EUR',
            paymentMethod: subscriptionData.paymentMethod || 'none'
          };

          console.log('💎 Configuration abonnement premium:', subscription);
          return subscription;
        }
      }
    }

    // Fallback sur le plan gratuit
    const freeSubscription = {
      planId: 'free',
      planName: 'Version Gratuite',
      status: 'active',
      price: 0,
      currency: 'EUR',
      paymentMethod: 'none'
    };

    console.log('🆓 Utilisation du plan gratuit par défaut');
    return freeSubscription;
  } catch (error) {
    console.error('❌ Erreur récupération abonnement:', error);

    // Fallback sur le plan gratuit
    const freeSubscription = {
      planId: 'free',
      planName: 'Version Gratuite', 
      status: 'active',
      price: 0,
      currency: 'EUR',
      paymentMethod: 'none'
    };

    console.log('🆓 Fallback vers plan gratuit après erreur');
    return freeSubscription;
  }
};