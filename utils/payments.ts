
import { Platform } from 'react-native';
import { InAppPurchaseService, IAP_SUBSCRIPTION_PLANS, IAPSubscriptionPlan } from './inAppPurchases';

// Utiliser les plans IAP comme référence principale
export const SUBSCRIPTION_PLANS = IAP_SUBSCRIPTION_PLANS;
export type SubscriptionPlan = IAPSubscriptionPlan;

export interface AppointmentLimits {
  monthly: number;
  weekly: number;
}

// Fonctions utilitaires pour les limites de rendez-vous
export const getAppointmentLimits = (planId: string): AppointmentLimits => {
  const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
  return plan?.appointmentLimits || { monthly: 0, weekly: 0 };
};

export const checkAppointmentLimit = async (
  userId: string, 
  userPlanId: string, 
  appointments: any[]
): Promise<{ canBook: boolean; reason?: string; remaining?: number }> => {
  const limits = getAppointmentLimits(userPlanId);

  // Si aucune limite (plan gratuit ou bronze)
  if (limits.monthly === 0 && limits.weekly === 0) {
    return { 
      canBook: false, 
      reason: 'Votre abonnement ne permet pas de prendre de rendez-vous. Passez à un plan supérieur.' 
    };
  }

  const now = new Date();
  const userAppointments = appointments.filter(apt => 
    apt.clientId === userId && 
    apt.status !== 'cancelled'
  );

  // Vérification limite mensuelle (Argent)
  if (limits.monthly > 0) {
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const monthlyAppointments = userAppointments.filter(apt => {
      const aptDate = new Date(apt.date);
      return aptDate >= startOfMonth && aptDate <= endOfMonth;
    });

    if (monthlyAppointments.length >= limits.monthly) {
      return { 
        canBook: false, 
        reason: `Vous avez atteint votre limite mensuelle de ${limits.monthly} rendez-vous.` 
      };
    }

    return { 
      canBook: true, 
      remaining: limits.monthly - monthlyAppointments.length 
    };
  }

  // Vérification limite hebdomadaire (Or et Diamant)
  if (limits.weekly > 0) {
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + 1); // Lundi
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Dimanche
    endOfWeek.setHours(23, 59, 59, 999);

    const weeklyAppointments = userAppointments.filter(apt => {
      const aptDate = new Date(apt.date);
      return aptDate >= startOfWeek && aptDate <= endOfWeek;
    });

    if (weeklyAppointments.length >= limits.weekly) {
      return { 
        canBook: false, 
        reason: `Vous avez atteint votre limite hebdomadaire de ${limits.weekly} rendez-vous.` 
      };
    }

    return { 
      canBook: true, 
      remaining: limits.weekly - weeklyAppointments.length 
    };
  }

  return { canBook: false, reason: 'Plan non reconnu.' };
};

export class PaymentService {
  static async initialize(): Promise<boolean> {
    if (Platform.OS === 'ios') {
      const success = await InAppPurchaseService.initialize();
      if (InAppPurchaseService.isInMockMode()) {
        console.log('💳 PaymentService en mode MOCK pour le développement');
      }
      return success;
    }
    return false;
  }

  static async presentApplePayPayment(plan: SubscriptionPlan, userId: string): Promise<boolean> {
    try {
      if (Platform.OS !== 'ios') {
        throw new Error('Apple Pay disponible uniquement sur iOS');
      }

      console.log('🍎 Démarrage paiement Apple Pay pour:', plan.name);

      // Utiliser le service IAP pour l'achat
      const success = await InAppPurchaseService.purchaseSubscription(plan.productId, userId);

      if (success) {
        console.log('✅ Paiement Apple Pay réussi pour:', plan.name);
        return true;
      } else {
        console.log('❌ Paiement Apple Pay échoué pour:', plan.name);
        return false;
      }
    } catch (error) {
      console.error('❌ Erreur paiement Apple Pay:', error);
      throw error;
    }
  }

  static async restorePurchases(userId: string): Promise<boolean> {
    if (Platform.OS === 'ios') {
      return await InAppPurchaseService.restorePurchases(userId);
    }
    return false;
  }

  static async getCurrentSubscription(userId: string) {
    if (Platform.OS === 'ios') {
      return await InAppPurchaseService.getCurrentSubscription(userId);
    }

    // Fallback pour autres plateformes
    return {
      planId: 'free',
      planName: 'Version Gratuite',
      price: '0,00 €',
      currency: 'EUR',
      status: 'active',
      paymentMethod: 'none'
    };
  }
}
