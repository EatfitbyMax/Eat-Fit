
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

export const initializeAdminAccount = async (): Promise<void> => {
  try {
    // Vérifier si le compte admin existe déjà
    const adminExists = await AsyncStorage.getItem('user_eatfitbymax@gmail.com');
    
    if (!adminExists) {
      // Créer le compte admin/coach
      const adminUser: User = {
        email: 'eatfitbymax@gmail.com',
        password: 'admin123',
        userType: 'coach',
        firstName: 'Max',
        lastName: 'Admin',
        createdAt: new Date().toISOString()
      };
      
      await AsyncStorage.setItem('user_eatfitbymax@gmail.com', JSON.stringify(adminUser));
      
      // Créer quelques clients de démonstration
      const demoClients = [
        {
          email: 'm.pacullmarquie@gmail.com',
          password: 'client123',
          userType: 'client',
          firstName: 'Maxandre',
          lastName: 'Pacull-Marquié',
          age: '23',
          weight: '75',
          height: '175',
          createdAt: new Date().toISOString()
        }
      ];
      
      for (const client of demoClients) {
        await AsyncStorage.setItem(`user_${client.email}`, JSON.stringify(client));
      }
    }
  } catch (error) {
    console.error('Erreur initialisation compte admin:', error);
  }
};
