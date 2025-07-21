// Mock Stripe pour le web
const StripeProvider = ({ children }) => children;

const useStripe = () => ({
  createPaymentMethod: () => Promise.resolve({ error: null }),
  confirmPayment: () => Promise.resolve({ error: null }),
});

const useConfirmPayment = () => [
  () => Promise.resolve({ error: null }),
  { loading: false }
];

module.exports = {
  StripeProvider,
  useStripe,
  useConfirmPayment,
};