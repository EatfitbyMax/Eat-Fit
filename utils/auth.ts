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
  favoriteSport?: string;
  targetWeight?: number;
  userType: 'client' | 'coach';
  hasNutritionProgram?: boolean;
  needsPasswordReset?: boolean;
  createdAt: string;
}

const CURRENT_USER_KEY = 'currentUser';
const USERS_KEY = 'users';

// Comptes par défaut
const DEFAULT_ACCOUNTS: any[] = [];

export async function initializeAdminAccount(): Promise<void> {
  try {
    const existingUsers = await AsyncStorage.getItem(USERS_KEY);
    if (!existingUsers) {
      await AsyncStorage.setItem(USERS_KEY, JSON.stringify([]));
      console.log('💫 Base de données utilisateurs initialisée (vide)');
    } else {
      console.log('📱 Base de données utilisateurs existante trouvée');
    }
  } catch (error) {
    console.error('Erreur initialisation base utilisateurs:', error);
  }
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const currentUserData = await AsyncStorage.getItem(CURRENT_USER_KEY);
    if (currentUserData) {
      const user = JSON.parse(currentUserData);
      return user;
    }
    return null;
  } catch (error) {
    console.error('❌ Erreur récupération utilisateur:', error);
    return null;
  }
}

export async function login(email: string, password: string): Promise<User | null> {
  try {
    console.log('🔄 Tentative de connexion pour:', email);
    
    // Récupérer les utilisateurs depuis le serveur ou fallback local
    let users = [];
    try {
      users = await PersistentStorage.getUsers();
    } catch (error) {
      console.warn('Erreur serveur, tentative récupération locale...');
      // Fallback vers AsyncStorage local
      const localUsers = await AsyncStorage.getItem(USERS_KEY);
      if (localUsers) {
        users = JSON.parse(localUsers);
        console.log('Utilisateurs récupérés depuis le stockage local');
      }
    }

    console.log('📊 Nombre d\'utilisateurs récupérés:', users.length);
    console.log('👥 Utilisateurs disponibles:', users.map((u: any) => ({ 
      email: u.email, 
      userType: u.userType,
      hasPassword: !!u.password 
    })));

    // Normaliser l'email (minuscules et trim)
    const normalizedEmail = email.toLowerCase().trim();
    
    console.log('🔍 Recherche utilisateur avec email normalisé:', normalizedEmail);
    
    // Chercher l'utilisateur par email d'abord
    const userByEmail = users.find((u: any) => 
      u.email.toLowerCase().trim() === normalizedEmail
    );
    
    if (userByEmail) {
      console.log('✅ Utilisateur trouvé par email');
      console.log('🔑 Comparaison des mots de passe:', {
        saisi: password,
        stocke: userByEmail.password,
        match: userByEmail.password === password
      });
    } else {
      console.log('❌ Aucun utilisateur trouvé avec cet email');
    }
    
    const user = users.find((u: any) => 
      u.email.toLowerCase().trim() === normalizedEmail && u.password === password
    );

    if (user) {
      // Enlever le mot de passe avant de sauvegarder dans la session locale
      const { password: _, ...userWithoutPassword } = user;
      await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userWithoutPassword));
      console.log('Connexion réussie pour:', user.email, 'Type:', user.userType);
      
      // Ajouter l'information si un changement de mot de passe est requis
      return {
        ...userWithoutPassword,
        needsPasswordReset: user.needsPasswordReset || false
      };
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
    // Supprimer toutes les données de session utilisateur
    await AsyncStorage.multiRemove([
      CURRENT_USER_KEY,
      'app_preferences',
      'subscription_status',
      'user_nutrition_data',
      'user_fitness_data'
    ]);
    console.log('✅ Déconnexion réussie - toutes les données de session supprimées');
  } catch (error) {
    console.error('❌ Erreur déconnexion:', error);
    throw error;
  }
}

export async function updateUserData(email: string, updateData: {
  firstName?: string;
  lastName?: string;
  gender?: 'Homme' | 'Femme';
  age?: number;
  height?: number;
  weight?: number;
  favoriteSport?: string;
  targetWeight?: number;
}): Promise<boolean> {
  try {
    // Récupérer les utilisateurs depuis le serveur VPS
    const users = await PersistentStorage.getUsers();
    
    // Trouver l'utilisateur à mettre à jour
    const userIndex = users.findIndex((u: any) => u.email === email);
    if (userIndex === -1) {
      console.log('Utilisateur non trouvé pour la mise à jour');
      return false;
    }

    // Mettre à jour les données de l'utilisateur
    const updatedUser = {
      ...users[userIndex],
      ...updateData,
      name: updateData.firstName && updateData.lastName 
        ? `${updateData.firstName} ${updateData.lastName}`
        : users[userIndex].name
    };

    users[userIndex] = updatedUser;

    // Sauvegarder sur le serveur VPS
    await PersistentStorage.saveUsers(users);

    // Mettre à jour la session locale
    const { password: _, ...userWithoutPassword } = updatedUser;
    await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userWithoutPassword));

    console.log('Données utilisateur mises à jour avec succès');
    return true;
  } catch (error) {
    console.error('Erreur mise à jour utilisateur:', error);
    return false;
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
    // Récupérer les utilisateurs existants avec fallback local
    let users = [];
    try {
      users = await PersistentStorage.getUsers();
    } catch (error) {
      console.warn('Erreur serveur, récupération locale...');
      const localUsers = await AsyncStorage.getItem(USERS_KEY);
      if (localUsers) {
        users = JSON.parse(localUsers);
      }
    }

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

    // Sauvegarder avec fallback local
    try {
      await PersistentStorage.saveUsers(users);
      console.log('Utilisateur sauvegardé sur le serveur');
    } catch (error) {
      console.warn('Erreur serveur, sauvegarde locale...');
      await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));
      console.log('Utilisateur sauvegardé localement');
    }

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