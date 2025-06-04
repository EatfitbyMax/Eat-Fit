import { initializeApp, getApps } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyBvjB1vBp9gDgUE6I6o_1j2kGNjCOE8xHs",
  authDomain: "eatfitbymax-39981.firebaseapp.com",
  projectId: "eatfitbymax-39981",
  storageBucket: "eatfitbymax-39981.firebasestorage.app",
  messagingSenderId: "758585273981",
  appId: "1:758585273981:ios:4608933c31aeb915f14b14"
};

// Initialize Firebase only if it hasn't been initialized yet
let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Initialize Auth with persistence
let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
} catch (error) {
  // If auth is already initialized, get the existing instance
  auth = getAuth(app);
}

export { auth };
export const db = getFirestore(app);