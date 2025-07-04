
// Mock de Stripe React Native pour la plateforme web
export const StripeProvider = ({ children }) => children;

export const useStripe = () => ({
  initPaymentSheet: () => Promise.resolve({ error: null }),
  presentPaymentSheet: () => Promise.resolve({ error: { message: 'Non supporté sur web' } }),
  confirmPaymentSheetPayment: () => Promise.resolve({ error: { message: 'Non supporté sur web' } }),
});

export const usePaymentSheet = () => ({
  initPaymentSheet: () => Promise.resolve({ error: null }),
  presentPaymentSheet: () => Promise.resolve({ error: { message: 'Non supporté sur web' } }),
  loading: false,
});

export const CardField = () => null;
export const ApplePayButton = () => null;
export const GooglePayButton = () => null;

// Mock des fonctions de paiement
export const initPaymentSheet = () => Promise.resolve({ error: null });
export const presentPaymentSheet = () => Promise.resolve({ error: { message: 'Non supporté sur web' } });
export const confirmPaymentSheetPayment = () => Promise.resolve({ error: { message: 'Non supporté sur web' } });

export default {
  StripeProvider,
  useStripe,
  usePaymentSheet,
  CardField,
  ApplePayButton,
  GooglePayButton,
  initPaymentSheet,
  presentPaymentSheet,
  confirmPaymentSheetPayment,
};
