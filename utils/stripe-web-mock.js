
<old_str>// Mock pour Stripe sur web
export const StripeProvider = ({ children }) => children;
export const CardField = () => null;
export const CardForm = () => null;
export const useStripe = () => ({ confirmPayment: async () => ({ error: null }) });
export const useConfirmPayment = () => ({ confirmPayment: async () => ({ error: null }) });
export const initStripe = async () => {};

// Export par défaut
export default {
  StripeProvider,
  CardField,
  CardForm,
  useStripe,
  useConfirmPayment,
  initStripe,
};</old_str>
<new_str>// Mock complet pour Stripe sur web
const React = require('react');

const StripeProvider = ({ children }) => React.createElement('div', {}, children);
const CardField = () => React.createElement('div', { style: { display: 'none' } });
const CardForm = () => React.createElement('div', { style: { display: 'none' } });

const useStripe = () => ({
  confirmPayment: async () => ({ error: null }),
  createPaymentMethod: async () => ({ error: null }),
  initPaymentSheet: async () => ({ error: null }),
  presentPaymentSheet: async () => ({ error: null }),
});

const useConfirmPayment = () => ({
  confirmPayment: async () => ({ error: null })
});

const initStripe = async () => {
  console.log('Stripe mock initialized for web');
  return Promise.resolve();
};

// Exports CommonJS et ES6
module.exports = {
  StripeProvider,
  CardField,
  CardForm,
  useStripe,
  useConfirmPayment,
  initStripe,
  default: {
    StripeProvider,
    CardField,
    CardForm,
    useStripe,
    useConfirmPayment,
    initStripe,
  }
};

// Support ES6 exports
if (typeof exports === 'object' && typeof module !== 'undefined') {
  module.exports.StripeProvider = StripeProvider;
  module.exports.CardField = CardField;
  module.exports.CardForm = CardForm;
  module.exports.useStripe = useStripe;
  module.exports.useConfirmPayment = useConfirmPayment;
  module.exports.initStripe = initStripe;
}</new_str>
