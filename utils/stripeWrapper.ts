
import React from 'react';
import Constants from 'expo-constants';

// Vérifier si on est dans Expo Go
const isExpoGo = Constants.appOwnership === 'expo';

// Importer Stripe seulement si ce n'est pas Expo Go
let StripeProvider: any = null;
let useStripe: any = null;
let CardField: any = null;

if (!isExpoGo) {
  try {
    const stripe = require('@stripe/stripe-react-native');
    StripeProvider = stripe.StripeProvider;
    useStripe = stripe.useStripe;
    CardField = stripe.CardField;
  } catch (error) {
    console.warn('Stripe non disponible dans cet environnement');
  }
}

// Composant de fallback pour Expo Go
const MockStripeProvider = ({ children }: { children: React.ReactNode }) => {
  return React.createElement(React.Fragment, null, children);
};

const mockUseStripe = () => ({
  confirmPayment: async () => ({ error: { message: 'Stripe non disponible en mode développement' } }),
  createPaymentMethod: async () => ({ error: { message: 'Stripe non disponible en mode développement' } }),
});

const MockCardField = () => {
  return React.createElement('div', { 
    style: { 
      padding: 20, 
      border: '1px solid #ccc', 
      borderRadius: 8,
      backgroundColor: '#f9f9f9',
      textAlign: 'center' as const
    } 
  }, 'Champ de carte non disponible en mode développement');
};

const ExportedStripeProvider = StripeProvider || MockStripeProvider;
const ExportedUseStripe = useStripe || mockUseStripe;
const ExportedCardField = CardField || MockCardField;

export {
  ExportedStripeProvider as StripeProvider,
  ExportedUseStripe as useStripe,
  ExportedCardField as CardField,
  isExpoGo,
};
