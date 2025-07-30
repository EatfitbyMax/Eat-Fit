import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { IAPItemDetails, IAPResponseCode, InAppPurchase } from 'expo-in-app-purchases';

export interface IAPSubscriptionPlan {
  id: string;
  name: string;
  price: string;
  currency: string;
  duration: string;
  appointmentLimits: {
    monthly: number;
    weekly: number;
  };
  features: string[];
  productId: string; // ID du produit dans App Store Connect
}

// IDs des produits configurés dans App Store Connect
export const IAP_PRODUCT_IDS = {
  bronze: 'com.eatfitbymax.app.bronze_monthly',
  silver: 'com.eatfitbymax.app.silver_monthly',
  gold: 'com.eatfitbymax.app.gold_monthly',
  diamond: 'com.eatfitbymax.app.diamond_monthly'
};

export const IAP_SUBSCRIPTION_PLANS: IAPSubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Version Gratuite',
    price: '0,00 €',
    currency: 'EUR',
    duration: 'gratuit',
    appointmentLimits: { monthly: 0, weekly: 0 },
    features: ['Fonctionnalités de base disponibles'],
    productId: ''
  },
  {
    id: 'bronze',
    name: 'BRONZE',
    price: '9,99 €',
    currency: 'EUR',
    duration: 'mois',
    appointmentLimits: { monthly: 0, weekly: 0 },
    features: [
      'Messagerie avec le coach',
      '1 programme nutritionnel/semaine',
      '1 programme sportif/semaine'
    ],
    productId: IAP_PRODUCT_IDS.bronze
  },
  {
    id: 'silver',
    name: 'ARGENT',
    price: '19,99 €',
    currency: 'EUR',
    duration: 'mois',
    appointmentLimits: { monthly: 1, weekly: 0 },
    features: [
      'Messagerie avec le coach',
      '3 programmes nutritionnels/semaine',
      '3 programmes sportifs/semaine',
      '1 rendez-vous/mois'
    ],
    productId: IAP_PRODUCT_IDS.silver
  },
  {
    id: 'gold',
    name: 'OR',
    price: '49,99 €',
    currency: 'EUR',
    duration: 'mois',
    appointmentLimits: { monthly: 4, weekly: 0 },
    features: [
      'Messagerie avec le coach',
      '5 programmes nutritionnels/semaine',
      '5 programmes sportifs/semaine',
      '4 rendez-vous/mois',
      '2 analyses vidéo/mois'
    ],
    productId: IAP_PRODUCT_IDS.gold
  },
  {
    id: 'diamond',
    name: 'DIAMANT',
    price: '99,99 €',
    currency: 'EUR',
    duration: 'mois',
    appointmentLimits: { monthly: 8, weekly: 0 },
    features: [
      'Messagerie avec le coach',
      '7 programmes nutritionnels/semaine',
      '7 programmes sportifs/semaine',
      '8 rendez-vous/mois',
      '4 analyses vidéo/mois'
    ],
    productId: IAP_PRODUCT_IDS.diamond
  }
];

// Mock pour Expo Go - les achats in-app ne fonctionnent que dans des builds standalone
const mockInAppPurchases = {
  connectAsync: () => Promise.resolve(),
  disconnectAsync: () => Promise.resolve(),
  getProductsAsync: () => Promise.resolve([]),
  purchaseItemAsync: () => Promise.resolve({ responseCode: 0 }),
  finishTransactionAsync: () => Promise.resolve(),
  getPurchaseHistoryAsync: () => Promise.resolve([]),
};

// Utiliser le vrai module en production, mock en développement
let InAppPurchases: any;
try {
  InAppPurchases = require('expo-in-app-purchases');
} catch (error) {
  console.warn('⚠️ expo-in-app-purchases non disponible dans Expo Go, utilisation du mock');
  InAppPurchases = mockInAppPurchases;
}

// Mock pour Expo Go - les achats in-app ne fonctionnent pas dans Expo Go
const mockPurchaseResult = {
  responseCode: 0,
  results: [],
  errorCode: null
};

const mockProduct = {
  productId: 'premium_monthly',
  price: '9.99',
  title: 'Premium Monthly',
  description: 'Premium features for one month',
  type: 'subscription'
};

export const initializeInAppPurchases = async () => {
  console.log('🔄 [MOCK] Initialisation des achats in-app (Expo Go)');
  return true;
};

export const getProductsAsync = async (productIds: string[]) => {
  console.log('🔄 [MOCK] Récupération des produits:', productIds);
  return {
    responseCode: 0,
    results: productIds.map(id => ({ ...mockProduct, productId: id })),
    errorCode: null
  };
};

export const purchaseItemAsync = async (productId: string) => {
  console.log('🔄 [MOCK] Achat simulé:', productId);
  return {
    responseCode: 0,
    results: [{
      productId,
      purchaseTime: Date.now(),
      transactionId: `mock_${Date.now()}`,
      acknowledged: true
    }],
    errorCode: null
  };
};

export const getPurchaseHistoryAsync = async () => {
  console.log('🔄 [MOCK] Historique des achats (vide en mode Expo Go)');
  return mockPurchaseResult;
};

export const finishTransactionAsync = async (purchase: any) => {
  console.log('🔄 [MOCK] Finalisation de transaction:', purchase);
  return true;
};

export const connectAsync = async () => {
  console.log('🔄 [MOCK] Connexion au service d\'achat');
  return true;
};

export const disconnectAsync = async () => {
  console.log('🔄 [MOCK] Déconnexion du service d\'achat');
  return true;
};

// Export par défaut pour la compatibilité
export default {
  initializeInAppPurchases,
  getProductsAsync,
  purchaseItemAsync,
  getPurchaseHistoryAsync,
  finishTransactionAsync,
  connectAsync,
  disconnectAsync
};