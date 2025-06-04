
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface User {
  id: string;
  email: string;
  name: string;
  userType: 'client' | 'coach';
  createdAt: string;
}

const CURRENT_USER_KEY = 'currentUser';
const USERS_KEY = 'users';

// Comptes par défaut
const DEFAULT_ACCOUNTS = [
  {
    id: '1',
    email: 'admin@eatfitbymax.com',
    password: 'admin123',
    name: 'Admin',
    userType: 'coach' as const,
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    email: 'm.pacullmarquie@gmail.com',
    password: 'client123',
    name: 'Maxandre Pacull-Marquié',
    userType: 'client' as const,
    createdAt: new Date().toISOString(),
  }
];

export async function initializeAdminAccount(): Promise<void> {
  try {
    const existingUsers = await AsyncStorage.getItem(USERS_KEY);
    if (!existingUsers) {
      await AsyncStorage.setItem(USERS_KEY, JSON.stringify(DEFAULT_ACCOUNTS));
      console.log('Comptes par défaut initialisés');
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
    const usersData = await AsyncStorage.getItem(USERS_KEY);
    if (!usersData) {
      console.log('Aucun utilisateur enregistré');
      return null;
    }

    const users = JSON.parse(usersData);
    const user = users.find((u: any) => u.email === email && u.password === password);
    
    if (user) {
      // Enlever le mot de passe avant de sauvegarder
      const { password: _, ...userWithoutPassword } = user;
      await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userWithoutPassword));
      console.log('Connexion réussie pour:', user.email);
      return userWithoutPassword;
    } else {
      console.log('Identifiants incorrects');
      return null;
    }
  } catch (error) {
    console.error('Erreur connexion:', error);
    return null;
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
  userType: 'client' | 'coach';
}): Promise<User | null> {
  try {
    const usersData = await AsyncStorage.getItem(USERS_KEY);
    const users = usersData ? JSON.parse(usersData) : [];
    
    // Vérifier si l'email existe déjà
    const existingUser = users.find((u: any) => u.email === userData.email);
    if (existingUser) {
      console.log('Email déjà utilisé');
      return null;
    }

    // Créer le nouvel utilisateur
    const newUser = {
      id: Date.now().toString(),
      email: userData.email,
      password: userData.password,
      name: userData.name,
      userType: userData.userType,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));

    // Connecter automatiquement l'utilisateur
    const { password: _, ...userWithoutPassword } = newUser;
    await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userWithoutPassword));
    
    console.log('Inscription réussie pour:', userData.email);
    return userWithoutPassword;
  } catch (error) {
    console.error('Erreur inscription:', error);
    return null;
  }
}
