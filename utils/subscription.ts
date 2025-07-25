import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentUser } from './auth';

// Plans d'abonnement disponibles
export const SUBSCRIPTION_PLANS = [
  {
    id: 'free',
    name: 'Version Gratuite',
    price: 0,
    duration: 'month',
    currency: 'EUR',
    features: [
      'Fonctionnalités de base',
      'Suivi simple des repas',
      'Plans d\'entraînement basiques'
    ]
  },
  {
    id: 'bronze',
    name: 'BRONZE',
    price: 9.99,
    duration: 'month',
    currency: 'EUR',
    features: [
      'Messagerie avec le coach',
      '1 programme nutritionnel/semaine',
      '1 programme sportif/semaine'
    ]
  },
  {
    id: 'silver',
    name: 'ARGENT',
    price: 19.99,
    duration: 'month',
    currency: 'EUR',
    features: [
      'Messagerie avec le coach',
      '3 programmes nutritionnels/semaine',
      '3 programmes sportifs/semaine',
      '1 rendez-vous/mois'
    ]
  },
  {
    id: 'gold',
    name: 'OR',
    price: 49.99,
    duration: 'month',
    currency: 'EUR',
    features: [
      'Messagerie avec le coach',
      '5 programmes nutritionnels/semaine',
      '5 programmes sportifs/semaine',
      '4 rendez-vous/mois',
      '2 analyses vidéo/mois'
    ]
  },
  {
    id: 'diamond',
    name: 'DIAMANT',
    price: 99.99,
    duration: 'month',
    currency: 'EUR',
    features: [
      'Messagerie avec le coach',
      '7 programmes nutritionnels/semaine',
      '7 programmes sportifs/semaine',
      '8 rendez-vous/mois',
      '4 analyses vidéo/mois'
    ]
  }
];

export interface Subscription {
  planId: string;
  planName: string;
  status: 'active' | 'inactive' | 'cancelled';
  price: number;
  currency: string;
  paymentMethod: string;
}

export const checkSubscriptionStatus = async (): Promise<{ isPremium: boolean; planId: string }> => {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return { isPremium: false, planId: 'free' };

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

    // Utiliser checkSubscriptionStatus pour obtenir les données d'abonnement
    const subscriptionStatus = await checkSubscriptionStatus();
    console.log('🔍 Statut abonnement récupéré:', subscriptionStatus);

    if (subscriptionStatus.isPremium && subscriptionStatus.planId && subscriptionStatus.planId !== 'free') {
      const plan = SUBSCRIPTION_PLANS.find(p => p.id === subscriptionStatus.planId);
      if (plan) {
        const subscription = {
          planId: subscriptionStatus.planId,
          planName: plan.name,
          status: 'active' as const,
          price: plan.price,
          currency: 'EUR',
          paymentMethod: 'none'
        };

        console.log('💎 Configuration abonnement premium:', subscription);
        return subscription;
      }
    }

    // Plan gratuit par défaut
    const freeSubscription = {
      planId: 'free',
      planName: 'Version Gratuite',
      status: 'active' as const,
      price: 0,
      currency: 'EUR',
      paymentMethod: 'none'
    };

    console.log('🆓 Utilisation du plan gratuit');
    return freeSubscription;
  } catch (error) {
    console.error('❌ Erreur récupération abonnement:', error);

    // Fallback sur le plan gratuit
    const freeSubscription = {
      planId: 'free',
      planName: 'Version Gratuite', 
      status: 'active' as const,
      price: 0,
      currency: 'EUR',
      paymentMethod: 'none'
    };

    console.log('🆓 Fallback vers plan gratuit après erreur');
    return freeSubscription;
  }
};