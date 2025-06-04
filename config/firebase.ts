
import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configuration Firebase - remplacez par vos propres clés
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "eatfitbymax.firebaseapp.com",
  projectId: "eatfitbymax-project-id",
  storageBucket: "eatfitbymax.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};

// Initialiser Firebase
const app = initializeApp(firebaseConfig);

// Initialiser Auth avec persistance AsyncStorage
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Initialiser Firestore
const db = getFirestore(app);

export { auth, db };
export default app;
