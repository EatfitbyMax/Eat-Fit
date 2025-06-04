
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configuration Firebase avec vos vraies données
const firebaseConfig = {
  apiKey: "AIzaSyD9UJ7sgNU4dueFOzgsStMlrmvTbuB1XUA",
  authDomain: "eatfitbymax-8f747.firebaseapp.com",
  projectId: "eatfitbymax-8f747",
  storageBucket: "eatfitbymax-8f747.firebasestorage.app",
  messagingSenderId: "758585273981",
  appId: "1:758585273981:ios:4608933c31aeb915f14b14"
};

// Initialiser Firebase seulement s'il n'a pas déjà été initialisé
let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Initialiser Auth avec persistance
let auth;
try {
  // Essayer d'initialiser avec persistance
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
} catch (error) {
  // Si l'initialisation échoue (déjà initialisé), utiliser l'instance existante
  console.log('Auth déjà initialisé, récupération de l\'instance existante');
  auth = getAuth(app);
}

// Initialiser Firestore
const db = getFirestore(app);

export { auth, db };
export default app;
