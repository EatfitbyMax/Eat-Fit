
// Mock de Stripe pour le web - évite les erreurs d'import
export const StripeProvider = ({ children }) => children;
export const initPaymentSheet = () => Promise.resolve({ error: null });
export const presentPaymentSheet = () => Promise.resolve({ error: null });
export const confirmPaymentSheetPayment = () => Promise.resolve({ error: null });

// Export par défaut
export default {
  StripeProvider,
  initPaymentSheet,
  presentPaymentSheet,
  confirmPaymentSheetPayment,
};
