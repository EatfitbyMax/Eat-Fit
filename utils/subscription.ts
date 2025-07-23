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
      'Toutes les fonctionnalités gratuites',
      'Plans d\'entraînement avancés',
      'Suivi nutritionnel détaillé',
      'Support prioritaire'
    ]
  },
  {
    id: 'silver',
    name: 'SILVER',
    price: 19.99,
    duration: 'month',
    currency: 'EUR',
    features: [
      'Toutes les fonctionnalités Bronze',
      'Coaching personnalisé',
      'Intégrations avancées',
      'Analyses détaillées'
    ]
  },
  {
    id: 'gold',
    name: 'GOLD',
    price: 29.99,
    duration: 'month',
    currency: 'EUR',
    features: [
      'Toutes les fonctionnalités Silver',
      'Suivi en temps réel',
      'API complète',
      'Support 24/7'
    ]
  },
  {
    id: 'diamond',
    name: 'DIAMOND',
    price: 49.99,
    duration: 'month',
    currency: 'EUR',
    features: [
      'Toutes les fonctionnalités Gold',
      'Coach personnel dédié',
      'Accès anticipé aux nouvelles fonctionnalités',
      'Personnalisation complète'
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