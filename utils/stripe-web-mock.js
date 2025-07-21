
// Mock générique pour les modules non disponibles sur web
console.warn('⚠️ Utilisation du mock générique pour modules natifs');

// Mock Stripe
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

// Mock MaskedView
const MaskedView = ({ children }) => {
  console.warn('MaskedView non disponible sur web');
  return children;
};

// Mock HealthKit  
const HealthKit = {
  isAvailable: () => Promise.resolve(false),
  requestPermissions: () => Promise.resolve({ granted: false }),
  queryQuantitySamples: () => Promise.resolve([]),
};

// Export par défaut et nommés pour compatibilité maximale
const defaultExport = {
  StripeProvider,
  useStripe,
  useConfirmPayment,
  usePaymentSheet,
  MaskedView,
  HealthKit,
};

module.exports = {
  // Exports Stripe
  StripeProvider,
  useStripe,
  useConfirmPayment,
  usePaymentSheet,
  
  // Exports MaskedView
  MaskedView,
  default: MaskedView,
  
  // Exports HealthKit
  HealthKit,
  
  // Export par défaut
  ...defaultExport,
};

// Support pour les imports ES6
module.exports.default = defaultExport;
