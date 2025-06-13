
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentUser } from './auth';

export const checkSubscriptionStatus = async (): Promise<boolean> => {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return false;

    // Utilisateurs premium par défaut
    const premiumEmails = ['m.pacullmarquie@gmail.com'];
    
    if (premiumEmails.includes(currentUser.email)) {
      return true;
    }

    // Vérifier le statut d'abonnement depuis le stockage local ou serveur
    const subscriptionStatus = await AsyncStorage.getItem(`subscription_${currentUser.id}`);
    return subscriptionStatus === 'premium';
  } catch (error) {
    console.error('Erreur vérification abonnement:', error);
    return false;
  }
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
