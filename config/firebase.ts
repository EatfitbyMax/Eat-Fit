import { initializeApp, getApps } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyD9UJ7sgNU4dueFOzgsStMlrmvTbuB1XUA",
  authDomain: "eatfitbymax-8f747.firebaseapp.com",
  projectId: "eatfitbymax-8f747",
  storageBucket: "eatfitbymax-8f747.firebasestorage.app",
  messagingSenderId: "758585273981",
  appId: "1:758585273981:ios:4608933c31aeb915f14b14"
};

// Initialiser Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialiser Auth avec AsyncStorage
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Initialiser Firestore
const db = getFirestore(app);

export { auth, db };
export default app;