
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface User {
  email: string;
  password: string;
  createdAt: string;
  userType: 'client' | 'coach';
  firstName?: string;
  lastName?: string;
  goals?: string[];
  gender?: 'Homme' | 'Femme';
  age?: string;
  height?: string;
  weight?: string;
  activityLevel?: string;
}

export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const userData = await AsyncStorage.getItem('currentUser');
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Erreur récupération utilisateur:', error);
    return null;
  }
};

export const logout = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem('currentUser');
  } catch (error) {
    console.error('Erreur déconnexion:', error);
  }
};

export const isLoggedIn = async (): Promise<boolean> => {
  const user = await getCurrentUser();
  return user !== null;
};
