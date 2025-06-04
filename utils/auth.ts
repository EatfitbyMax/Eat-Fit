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
    if (!auth) {
      console.log('Auth non disponible');
      return null;
    }

    const firebaseUser = auth.currentUser;
    if (!firebaseUser) {
      console.log('Aucun utilisateur Firebase connecté');
      return null;
    }

    if (!db) {
      console.log('Firestore non disponible');
      return null;
    }

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
    if (!auth) {
      throw new Error('Service d\'authentification non disponible');
    }

    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    if (!db) {
      throw new Error('Base de données non disponible');
    }

    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
    if (userDoc.exists()) {
      const userData = userDoc.data() as User;
      console.log('Connexion réussie pour:', userData.email);
      return userData;
    } else {
      console.log('Données utilisateur non trouvées');
      return null;
    }
  } catch (error: any) {
    console.error('Erreur connexion:', error);
    if (error.code === 'auth/user-not-found') {
      throw new Error('Aucun compte trouvé avec cette adresse email');
    } else if (error.code === 'auth/wrong-password') {
      throw new Error('Mot de passe incorrect');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('Adresse email invalide');
    }
    throw new Error(error.message || 'Erreur lors de la connexion');
  }
}

export async function logout(): Promise<void> {
  try {
    if (!auth) {
      console.log('Auth non disponible pour la déconnexion');
      return;
    }
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
    if (!auth) {
      throw new Error('Service d\'authentification non disponible');
    }

    if (!db) {
      throw new Error('Base de données non disponible');
    }

    console.log('Début inscription pour:', userData.email);

    const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
    const firebaseUser = userCredential.user;

    console.log('Compte Firebase Auth créé:', firebaseUser.uid);

    const newUser: User = {
      id: firebaseUser.uid,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      name: `${userData.firstName} ${userData.lastName}`,
      userType: userData.userType,
      createdAt: new Date().toISOString(),
    };

    console.log('Création du document Firestore:', newUser);
    await setDoc(doc(db, 'users', firebaseUser.uid), newUser);

    console.log('Inscription réussie pour:', userData.email, 'Type:', userData.userType);
    return newUser;
  } catch (error: any) {
    console.error('Erreur inscription:', error);

    if (error.code === 'auth/email-already-in-use') {
      throw new Error('Cette adresse email est déjà utilisée');
    } else if (error.code === 'auth/weak-password') {
      throw new Error('Le mot de passe est trop faible');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('Adresse email invalide');
    } else if (error.code === 'permission-denied') {
      throw new Error('Erreur de permissions Firebase. Vérifiez les règles Firestore.');
    }

    throw new Error(error.message || 'Erreur lors de l\'inscription');
  }
}

export function onAuthStateChange(callback: (user: FirebaseUser | null) => void) {
  if (!auth) {
    console.log('Auth non disponible pour onAuthStateChange');
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}

export const loginUser = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    throw error;
  }
};

export const createUserWithRole = async (
  email: string, 
  password: string, 
  userData: any, 
  role: 'client' | 'coach' | 'admin' = 'client'
) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Ajouter les données utilisateur dans Firestore avec le rôle
    await setDoc(doc(db, 'users', user.uid), {
      ...userData,
      role,
      email,
      createdAt: new Date(),
    });

    return user;
  } catch (error) {
    throw error;
  }
};