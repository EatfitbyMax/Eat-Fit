import AsyncStorage from '@react-native-async-storage/async-storage';
import { PersistentStorage } from './storage';

export interface User {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  goals?: string[];
  gender?: 'Homme' | 'Femme';
  age?: number;
  height?: number;
  weight?: number;
  activityLevel?: string;
  userType: 'client' | 'coach';
  hasNutritionProgram?: boolean;
  createdAt: string;
}

const CURRENT_USER_KEY = 'currentUser';
const USERS_KEY = 'users';

// Comptes par défaut
const DEFAULT_ACCOUNTS = [
  {
    id: '1',
    email: 'eatfitbymax@gmail.com',
    password: 'MaxMax200303!',
    name: 'Admin EatFitByMax',
    userType: 'coach' as const,
    createdAt: new Date().toISOString(),
  }
];

export async function initializeAdminAccount(): Promise<void> {
  try {
    const existingUsers = await AsyncStorage.getItem(USERS_KEY);
    if (!existingUsers) {
      await AsyncStorage.setItem(USERS_KEY, JSON.stringify(DEFAULT_ACCOUNTS));
      console.log('Comptes par défaut initialisés:', DEFAULT_ACCOUNTS.map(u => u.email));
    } else {
      const users = JSON.parse(existingUsers);
      // Vérifier si le compte admin existe
      const adminExists = users.find((u: any) => u.email === 'eatfitbymax@gmail.com');
      if (!adminExists) {
        users.push(...DEFAULT_ACCOUNTS);
        await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));
        console.log('Compte admin ajouté aux utilisateurs existants');
      } else {
        console.log('Compte admin déjà existant');
      }
    }
  } catch (error) {
    console.error('Erreur initialisation comptes:', error);
  }
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const currentUserData = await AsyncStorage.getItem(CURRENT_USER_KEY);
    if (currentUserData) {
      const user = JSON.parse(currentUserData);
      console.log('Utilisateur connecté trouvé:', user.email);
      return user;
    }
    console.log('Aucun utilisateur connecté');
    return null;
  } catch (error) {
    console.error('Erreur récupération utilisateur:', error);
    return null;
  }
}

export async function login(email: string, password: string): Promise<User | null> {
  try {
    // Récupérer les utilisateurs depuis le serveur VPS uniquement
    const users = await PersistentStorage.getUsers();

    console.log('Utilisateurs disponibles:', users.map((u: any) => ({ email: u.email, userType: u.userType })));

    // Normaliser l'email (minuscules et trim)
    const normalizedEmail = email.toLowerCase().trim();
    const user = users.find((u: any) => 
      u.email.toLowerCase().trim() === normalizedEmail && u.password === password
    );

    console.log('Recherche utilisateur avec email:', normalizedEmail);

    if (user) {
      // Enlever le mot de passe avant de sauvegarder dans la session locale
      const { password: _, ...userWithoutPassword } = user;
      await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userWithoutPassword));
      console.log('Connexion réussie pour:', user.email, 'Type:', user.userType);
      return userWithoutPassword;
    } else {
      console.log('Identifiants incorrects pour:', normalizedEmail);
      return null;
    }
  } catch (error) {
    console.error('Erreur connexion:', error);
    throw error;
  }
}

export async function logout(): Promise<void> {
  try {
    await AsyncStorage.removeItem(CURRENT_USER_KEY);
    console.log('Déconnexion réussie');
  } catch (error) {
    console.error('Erreur déconnexion:', error);
  }
}

export async function register(userData: {
  email: string;
  password: string;
  name: string;
  firstName?: string;
  lastName?: string;
  goals?: string[];
  gender?: 'Homme' | 'Femme';
  age?: number;
  height?: number;
  weight?: number;
  activityLevel?: string;
  userType?: 'client' | 'coach';
}): Promise<User | null> {
  try {
    // Récupérer les utilisateurs depuis le serveur VPS uniquement
    const users = await PersistentStorage.getUsers();

    // Vérifier si l'email existe déjà
    const existingUser = users.find((u: any) => u.email === userData.email);
    if (existingUser) {
      console.log('Email déjà utilisé');
      return null;
    }

    // Créer le nouvel utilisateur avec toutes les informations
    const newUser = {
      id: Date.now().toString(),
      email: userData.email,
      password: userData.password,
      name: userData.name,
      firstName: userData.firstName,
      lastName: userData.lastName,
      goals: userData.goals,
      gender: userData.gender,
      age: userData.age,
      height: userData.height,
      weight: userData.weight,
      activityLevel: userData.activityLevel,
      userType: userData.userType || 'client' as const,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);

    // Sauvegarder uniquement sur le serveur VPS
    await PersistentStorage.saveUsers(users);

    // Connecter automatiquement l'utilisateur (session locale uniquement)
    const { password: _, ...userWithoutPassword } = newUser;
    await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userWithoutPassword));

    console.log('Inscription réussie pour:', userData.email);
    return userWithoutPassword;
  } catch (error) {
    console.error('Erreur inscription:', error);
    throw error;
  }
}