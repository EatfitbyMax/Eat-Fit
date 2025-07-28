
import React from 'react';

// Mock de Stripe pour le web - évite les erreurs dans Expo Go
export const StripeProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

// Mock des autres fonctions Stripe si nécessaire
export const useStripe = () => ({
  confirmPayment: async () => ({ error: null }),
  confirmSetupIntent: async () => ({ error: null }),
  createPaymentMethod: async () => ({ error: null }),
  createToken: async () => ({ error: null }),
  retrievePaymentIntent: async () => ({ error: null }),
});

export const useConfirmPayment = () => ({
  confirmPayment: async () => ({ error: null }),
});

export const useConfirmSetupIntent = () => ({
  confirmSetupIntent: async () => ({ error: null }),
});

// Export par défaut pour la compatibilité
export default {
  StripeProvider,
  useStripe,
  useConfirmPayment,
  useConfirmSetupIntent,
};
