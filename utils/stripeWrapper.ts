
import React from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Vérifier si on est dans Expo Go
const isExpoGo = Constants.appOwnership === 'expo';

// Importer Stripe seulement si ce n'est pas Expo Go et pas sur le web
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
    console.warn('Stripe non disponible dans cet environnement');
  }
}

// Composant de fallback pour Expo Go et Web
const MockStripeProvider = ({ children }: { children: React.ReactNode }) => {
  return React.createElement('div', null, children);
};

const MockCardField = () => {
  return React.createElement('div', { 
    style: { 
      padding: '10px', 
      border: '1px solid #ccc', 
      borderRadius: '4px',
      backgroundColor: '#f0f0f0',
      textAlign: 'center' as const
    } 
  }, 'Stripe non disponible dans cet environnement');
};

const mockUseStripe = () => ({
  confirmPayment: async () => ({ error: { message: 'Stripe non disponible dans cet environnement' } }),
  createPaymentMethod: async () => ({ error: { message: 'Stripe non disponible dans cet environnement' } }),
});

// Export correct avec des noms d'alias
const ExportedStripeProvider = StripeProvider || MockStripeProvider;
const ExportedUseStripe = useStripe || mockUseStripe;
const ExportedCardField = CardField || MockCardField;

export {
  ExportedStripeProvider as StripeProvider,
  ExportedUseStripe as useStripe,
  ExportedCardField as CardField,
  isExpoGo,
};
