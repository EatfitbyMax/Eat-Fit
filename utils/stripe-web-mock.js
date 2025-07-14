
// Mock pour Stripe sur web - évite les erreurs d'import
const StripeProvider = ({ children, publishableKey, merchantIdentifier }) => {
  console.warn('Stripe non disponible sur web, utilisation du mock');
  return children;
};

const useStripe = () => {
  console.warn('Stripe non disponible sur web');
  return null;
};

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
  usePaymentSheet,
};

// Export par défaut
module.exports.default = StripeProvider;
