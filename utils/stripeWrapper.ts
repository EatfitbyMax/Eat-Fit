
import React from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Vérifier si on est dans Expo Go
const isExpoGo = Constants.appOwnership === 'expo';

// Importer Stripe seulement si ce n'est pas Expo Go et sur mobile
let StripeProvider: any = null;
let useStripe: any = null;
let CardField: any = null;
let initStripe: any = null;

if (!isExpoGo && Platform.OS !== 'web') {
  try {
    const stripe = require('@stripe/stripe-react-native');
    StripeProvider = stripe.StripeProvider;
    useStripe = stripe.useStripe;
    CardField = stripe.CardField;
    initStripe = stripe.initStripe;
  } catch (error) {
    console.log('Stripe non disponible:', error);
  }
}

// Composants de fallback pour Expo Go et Web
const MockStripeProvider = ({ children }: { children: React.ReactNode }) => {
  return React.createElement(React.Fragment, null, children);
};

const mockUseStripe = () => ({
  confirmPayment: async () => ({ 
    error: { message: 'Stripe non disponible en mode développement' } 
  }),
  createPaymentMethod: async () => ({ 
    error: { message: 'Stripe non disponible en mode développement' } 
  }),
});

const MockCardField = (props: any) => {
  const { View, Text } = require('react-native');
  return React.createElement(View, {
    style: {
      padding: 20,
      borderWidth: 1,
      borderColor: '#ccc',
      borderRadius: 8,
      backgroundColor: '#f9f9f9',
      alignItems: 'center',
      justifyContent: 'center',
    }
  }, React.createElement(Text, {
    style: { textAlign: 'center', color: '#666' }
  }, 'Champ de carte non disponible en mode développement'));
};

const mockInitStripe = async () => {
  console.log('Init Stripe mock - non disponible en mode développement');
};

// Exports
export const ExportedStripeProvider = StripeProvider || MockStripeProvider;
export const ExportedUseStripe = useStripe || mockUseStripe;
export const ExportedCardField = CardField || MockCardField;
export const ExportedInitStripe = initStripe || mockInitStripe;

// Export par défaut pour compatibilité
export default {
  StripeProvider: ExportedStripeProvider,
  useStripe: ExportedUseStripe,
  CardField: ExportedCardField,
  initStripe: ExportedInitStripe,
};
