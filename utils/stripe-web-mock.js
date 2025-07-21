
// Mock Stripe pour le web - évite les erreurs d'import
const StripeProvider = ({ children }) => {
  console.warn('Stripe non disponible sur web, utilisation du mock');
  return children;
};

const useStripe = () => {
  console.warn('Stripe non disponible sur web');
  return {
    createPaymentMethod: () => Promise.resolve({ error: null }),
    confirmPayment: () => Promise.resolve({ error: null }),
  };
};

const useConfirmPayment = () => [
  () => Promise.resolve({ error: null }),
  { loading: false }
];

const usePaymentSheet = () => {
  console.warn('Stripe non disponible sur web');
  return {
    initPaymentSheet: () => Promise.resolve({ error: null }),
    presentPaymentSheet: () => Promise.resolve({ error: { message: 'Stripe non disponible sur web' } }),
    loading: false,
  };
};

// Export par défaut et nommés pour compatibilité
module.exports = {
  StripeProvider,
  useStripe,
  useConfirmPayment,
  usePaymentSheet,
  default: StripeProvider,
};
