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

  // Vérification limite mensuelle
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
        reason: `Limite mensuelle atteinte (${limits.monthly} rendez-vous/mois)`,
        remaining: 0
      };
    }

    return { 
      canBook: true, 
      remaining: limits.monthly - monthlyAppointments.length 
    };
  }

  return { canBook: true };
};

export class PaymentService {
  static async initialize(): Promise<boolean> {
    if (Platform.OS === 'ios') {
      return await InAppPurchaseService.initialize();
    }
    return false;
  }

  static async presentApplePayPayment(plan: SubscriptionPlan, userId: string): Promise<boolean> {
    try {
      if (Platform.OS === 'ios') {
        console.log('🍎 Lancement Apple Pay pour:', plan.name);

        // Utiliser directement le service IAP pour l'achat
        return await InAppPurchaseService.purchaseSubscription(plan.productId, userId);
      } else {
        console.log('⚠️ Apple Pay non disponible sur cette plateforme');
        return false;
      }
    } catch (error) {
      console.error('❌ Erreur Apple Pay:', error);
      return false;
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
    return null;
  }

  static async cancelSubscription(userId: string): Promise<boolean> {
    if (Platform.OS === 'ios') {
      return await InAppPurchaseService.cancelSubscription(userId);
    }
    return false;
  }
}