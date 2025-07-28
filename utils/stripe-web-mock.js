
// Mock complet pour Stripe sur web - Compatible Metro/Expo
const React = require('react');

// Composants React mock
const StripeProvider = ({ children }) => {
  if (React && React.createElement) {
    return React.createElement('div', {}, children);
  }
  return children;
};

const CardField = () => {
  if (React && React.createElement) {
    return React.createElement('div', { style: { display: 'none' } });
  }
  return null;
};

const CardForm = () => {
  if (React && React.createElement) {
    return React.createElement('div', { style: { display: 'none' } });
  }
  return null;
};

// Hooks mock
const useStripe = () => {
  return {
    confirmPayment: async () => {
      return { error: null };
    },
    createPaymentMethod: async () => {
      return { error: null };
    },
    initPaymentSheet: async () => {
      return { error: null };
    },
    presentPaymentSheet: async () => {
      return { error: null };
    }
  };
};

const useConfirmPayment = () => {
  return {
    confirmPayment: async () => {
      return { error: null };
    }
  };
};

const initStripe = async () => {
  console.log('Stripe mock initialized for web');
  return Promise.resolve();
};

// Export principal
const StripeMock = {
  StripeProvider,
  CardField,
  CardForm,
  useStripe,
  useConfirmPayment,
  initStripe
};

// Support CommonJS
module.exports = StripeMock;
module.exports.StripeProvider = StripeProvider;
module.exports.CardField = CardField;
module.exports.CardForm = CardForm;
module.exports.useStripe = useStripe;
module.exports.useConfirmPayment = useConfirmPayment;
module.exports.initStripe = initStripe;
module.exports.default = StripeMock;
