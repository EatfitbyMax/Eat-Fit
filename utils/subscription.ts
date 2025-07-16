
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
