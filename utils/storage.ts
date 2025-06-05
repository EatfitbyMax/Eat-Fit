import AsyncStorage from '@react-native-async-storage/async-storage';

export class PersistentStorage {
  // Programmes storage
  static async getProgrammes(): Promise<any[]> {
    try {
      const data = await AsyncStorage.getItem('programmes_coach');
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.log('Aucun fichier programmes trouvé, initialisation avec tableau vide');
      return [];
    }
  }

  static async saveProgrammes(programmes: any[]): Promise<void> {
    try {
      await AsyncStorage.setItem('programmes_coach', JSON.stringify(programmes));
      console.log('Programmes sauvegardés dans AsyncStorage');
    } catch (error) {
      console.error('Erreur sauvegarde programmes:', error);
      throw error;
    }
  }

  // Users storage
  static async getUsers(): Promise<any[]> {
    try {
      const data = await AsyncStorage.getItem('users');
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.log('Aucun fichier utilisateurs trouvé');
      return [];
    }
  }

  static async saveUsers(users: any[]): Promise<void> {
    try {
      await AsyncStorage.setItem('users', JSON.stringify(users));
      console.log('Utilisateurs sauvegardés dans AsyncStorage');
    } catch (error) {
      console.error('Erreur sauvegarde utilisateurs:', error);
      throw error;
    }
  }

  // Méthodes utilitaires pour la gestion des données
  static async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove(['programmes_coach', 'users', 'current_user']);
      console.log('Toutes les données ont été supprimées');
    } catch (error) {
      console.error('Erreur lors de la suppression des données:', error);
      throw error;
    }
  }

  static async exportData(): Promise<{programmes: any[], users: any[]}> {
    try {
      const programmes = await this.getProgrammes();
      const users = await this.getUsers();
      return { programmes, users };
    } catch (error) {
      console.error('Erreur lors de l\'export des données:', error);
      throw error;
    }
  }

  static async importData(data: {programmes: any[], users: any[]}): Promise<void> {
    try {
      await this.saveProgrammes(data.programmes || []);
      await this.saveUsers(data.users || []);
      console.log('Données importées avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'import des données:', error);
      throw error;
    }
  }
}

// Fonctions utilitaires pour l'export
export const getAllUsers = async () => {
  return await PersistentStorage.getUsers();
};

export const getAllProgrammes = async () => {
  return await PersistentStorage.getProgrammes();
};

export const saveUser = async (user: any) => {
  const users = await PersistentStorage.getUsers();
  const existingIndex = users.findIndex(u => u.id === user.id || u.email === user.email);
  
  if (existingIndex !== -1) {
    users[existingIndex] = user;
  } else {
    users.push(user);
  }
  
  await PersistentStorage.saveUsers(users);
};

export const saveProgramme = async (programme: any) => {
  const programmes = await PersistentStorage.getProgrammes();
  const existingIndex = programmes.findIndex(p => p.id === programme.id);
  
  if (existingIndex !== -1) {
    programmes[existingIndex] = programme;
  } else {
    programmes.push(programme);
  }
  
  await PersistentStorage.saveProgrammes(programmes);
};