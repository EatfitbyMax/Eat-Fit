
/**
 * Configuration spécifique pour Expo Go
 * Ce fichier permet de gérer les limitations d'Expo Go
 */

// Fonction pour détecter si on est dans Expo Go
export const isExpoGo = () => {
  try {
    const Constants = require('expo-constants');
    return Constants.default?.appOwnership === 'expo';
  } catch {
    return true; // Par défaut, on assume Expo Go
  }
};

// Mock des modules natifs non disponibles dans Expo Go
export const createExpoGoMocks = () => {
  if (isExpoGo()) {
    console.log('🔧 Mode Expo Go détecté - Activation des mocks');
    
    // Mock global pour les modules problématiques
    global.__expo_go_mocks = {
      inAppPurchases: true,
      notifications: true,
      healthKit: true,
    };
  }
};

// Initialisation automatique
createExpoGoMocks();
