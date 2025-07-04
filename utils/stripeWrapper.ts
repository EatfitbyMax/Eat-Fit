
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Vérifier si on est dans Expo Go
const isExpoGo = Constants.appOwnership === 'expo';

// Importer Stripe seulement si ce n'est pas Expo Go
let StripeProvider: any = null;
let useStripe: any = null;
let CardField: any = null;

if (!isExpoGo && Platform.OS !== 'web') {
  try {
    const stripe = require('@stripe/stripe-react-native');
    StripeProvider = stripe.StripeProvider;
    useStripe = stripe.useStripe;
    CardField = stripe.CardField;
  } catch (error) {
    console.warn('Stripe non disponible dans Expo Go');
  }
}

// Composant de fallback pour Expo Go
const MockStripeProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

const mockUseStripe = () => ({
  confirmPayment: async () => ({ error: { message: 'Stripe non disponible dans Expo Go' } }),
  createPaymentMethod: async () => ({ error: { message: 'Stripe non disponible dans Expo Go' } }),
});

export {
  StripeProvider: StripeProvider || MockStripeProvider,
  useStripe: useStripe || mockUseStripe,
  CardField: CardField || (() => null),
  isExpoGo,
};
