
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  onAuthStateChanged,
  User as FirebaseUser 
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection 
} from 'firebase/firestore';
import { auth, db } from '@/config/firebase';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  name: string;
  userType: 'client' | 'coach';
  createdAt: string;
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) {
      console.log('Aucun utilisateur Firebase connecté');
      return null;
    }

    // Récupérer les données utilisateur depuis Firestore
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
    if (userDoc.exists()) {
      const userData = userDoc.data() as User;
      console.log('Utilisateur connecté trouvé:', userData.email);
      return userData;
    } else {
      console.log('Données utilisateur non trouvées dans Firestore');
      return null;
    }
  } catch (error) {
    console.error('Erreur récupération utilisateur:', error);
    return null;
  }
}

export async function login(email: string, password: string): Promise<User | null> {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;
    
    // Récupérer les données utilisateur depuis Firestore
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
    if (userDoc.exists()) {
      const userData = userDoc.data() as User;
      console.log('Connexion réussie pour:', userData.email);
      return userData;
    } else {
      console.log('Données utilisateur non trouvées');
      return null;
    }
  } catch (error) {
    console.error('Erreur connexion:', error);
    return null;
  }
}

export async function logout(): Promise<void> {
  try {
    await signOut(auth);
    console.log('Déconnexion réussie');
  } catch (error) {
    console.error('Erreur déconnexion:', error);
  }
}

export async function register(userData: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  userType: 'client' | 'coach';
}): Promise<User | null> {
  try {
    // Créer le compte Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
    const firebaseUser = userCredential.user;

    // Créer le document utilisateur dans Firestore
    const newUser: User = {
      id: firebaseUser.uid,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      name: `${userData.firstName} ${userData.lastName}`,
      userType: userData.userType,
      createdAt: new Date().toISOString(),
    };

    await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
    
    console.log('Inscription réussie pour:', userData.email);
    return newUser;
  } catch (error) {
    console.error('Erreur inscription:', error);
    return null;
  }
}

export async function initializeAdminAccount(): Promise<void> {
  try {
    // Créer un compte admin par défaut si nécessaire
    const adminEmail = 'admin@eatfitbymax.com';
    const adminPassword = 'admin123';
    
    try {
      await register({
        email: adminEmail,
        password: adminPassword,
        firstName: 'Admin',
        lastName: 'EatFitByMax',
        userType: 'coach'
      });
      console.log('Compte admin créé');
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        console.log('Compte admin déjà existant');
      } else {
        console.error('Erreur création compte admin:', error);
      }
    }
  } catch (error) {
    console.error('Erreur initialisation admin:', error);
  }
}

// Observer pour les changements d'état d'authentification
export function onAuthStateChange(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, callback);
}
