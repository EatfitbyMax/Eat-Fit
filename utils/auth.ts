
import { PersistentStorage } from './storage';

interface User {
  id: string;
  email: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  userType: 'client' | 'coach';
  age?: number;
  weight?: number;
  height?: number;
  gender?: string;
  activityLevel?: string;
  goals?: string[];
  profileImage?: string;
  hashedPassword?: string;
}

let currentUserCache: User | null = null;

export async function initializeAdminAccount(): Promise<void> {
  try {
    console.log('💫 Utilisation du serveur Replit pour l\'authentification');
    // Pas d'initialisation locale nécessaire
  } catch (error) {
    console.error('Erreur initialisation base utilisateurs:', error);
    throw new Error('Impossible d\'initialiser le système d\'authentification. Vérifiez votre connexion internet.');
  }
}

export async function getCurrentUser(): Promise<User | null> {
  if (currentUserCache) {
    return currentUserCache;
  }
  return null;
}

export async function login(email: string, password: string): Promise<User | null> {
  try {
    console.log('🔄 Tentative de connexion pour:', email);

    // Récupérer les utilisateurs depuis le serveur uniquement
    const users = await PersistentStorage.getUsers();

    console.log('📊 Nombre d\'utilisateurs récupérés:', users.length);
    console.log('👥 Utilisateurs disponibles:', users.map((u: any) => ({ 
      email: u.email, 
      userType: u.userType,
      hashedPassword: u.hashedPassword ? 'OUI' : 'NON'
    })));

    // Trouver l'utilisateur
    const user = users.find((u: any) => u.email === email);
    if (!user) {
      console.log('❌ Utilisateur non trouvé pour:', email);
      return null;
    }

    console.log('👤 Utilisateur trouvé:', {
      email: user.email,
      userType: user.userType,
      hasPassword: user.password ? 'OUI' : 'NON',
      hasHashedPassword: user.hashedPassword ? 'OUI' : 'NON'
    });

    // Vérifier le mot de passe
    let isPasswordValid = false;

    if (user.hashedPassword) {
      // Nouveau système avec hash
      const bcrypt = await import('bcryptjs');
      isPasswordValid = await bcrypt.compare(password, user.hashedPassword);
      console.log('🔐 Vérification avec hash:', isPasswordValid ? 'VALIDE' : 'INVALIDE');
    } else if (user.password) {
      // Ancien système (temporaire)
      isPasswordValid = user.password === password;
      console.log('🔓 Vérification ancien système:', isPasswordValid ? 'VALIDE' : 'INVALIDE');
    } else {
      console.log('❌ Aucun mot de passe défini pour cet utilisateur');
      return null;
    }

    if (!isPasswordValid) {
      console.log('❌ Mot de passe incorrect pour:', email);
      return null;
    }

    // Créer l'objet utilisateur sans le mot de passe
    const userWithoutPassword: User = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      userType: user.userType,
      age: user.age,
      weight: user.weight,
      height: user.height,
      gender: user.gender,
      activityLevel: user.activityLevel,
      goals: user.goals,
      profileImage: user.profileImage
    };

    // Sauvegarder la session en cache mémoire uniquement
    currentUserCache = userWithoutPassword;
    console.log('💾 Session utilisateur mise en cache mémoire');

    console.log('✅ Connexion réussie pour:', email);
    return userWithoutPassword;
  } catch (error) {
    console.error('❌ Erreur connexion complète:', error);
    throw new Error('Impossible de se connecter. Vérifiez votre connexion internet.');
  }
}

export async function register(userData: Omit<User, 'id'> & { password: string }): Promise<User | null> {
  try {
    console.log('🔄 Tentative d\'inscription pour:', userData.email);

    // Récupérer les utilisateurs existants depuis le serveur uniquement
    const users = await PersistentStorage.getUsers();
    console.log('📊 Utilisateurs récupérés depuis le serveur:', users.length);

    // Vérifier si l'utilisateur existe déjà
    const existingUser = users.find((u: any) => u.email === userData.email);
    if (existingUser) {
      console.log('❌ Utilisateur déjà existant:', userData.email);
      return null;
    }

    // Hacher le mot de passe
    console.log('🔐 Hachage du mot de passe...');
    const bcrypt = await import('bcryptjs');
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

    // Créer le nouvel utilisateur
    const newUser = {
      ...userData,
      id: Date.now().toString(),
      hashedPassword: hashedPassword,
      // Ne pas stocker le mot de passe en clair
      password: undefined
    };

    // Ajouter à la liste des utilisateurs
    users.push(newUser);

    // Sauvegarder sur le serveur
    await PersistentStorage.saveUsers(users);
    console.log('✅ Utilisateurs sauvegardés sur le serveur');

    // Créer l'objet de retour sans les mots de passe
    const userWithoutPassword: User = {
      id: newUser.id,
      email: newUser.email,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      userType: newUser.userType,
      age: newUser.age,
      weight: newUser.weight,
      height: newUser.height,
      gender: newUser.gender,
      activityLevel: newUser.activityLevel,
      goals: newUser.goals,
      profileImage: newUser.profileImage
    };

    // Sauvegarder la session en cache mémoire uniquement
    currentUserCache = userWithoutPassword;
    console.log('💾 Session utilisateur mise en cache mémoire');

    console.log('✅ Inscription réussie pour:', userData.email);
    return userWithoutPassword;
  } catch (error) {
    console.error('❌ Erreur inscription complète:', error);
    throw new Error('Impossible de créer le compte. Vérifiez votre connexion internet.');
  }
}

export async function logout(): Promise<void> {
  try {
    currentUserCache = null;
    console.log('✅ Déconnexion réussie');
  } catch (error) {
    console.error('❌ Erreur déconnexion:', error);
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
    // Récupérer les utilisateurs depuis le serveur uniquement
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

    // Sauvegarder sur le serveur uniquement
    await PersistentStorage.saveUsers(users);

    // Mettre à jour la session en cache mémoire
    const { password: _, hashedPassword: __, ...userWithoutPassword } = updatedUser;
    currentUserCache = userWithoutPassword;

    console.log('Données utilisateur mises à jour avec succès');
    return true;
  } catch (error) {
    console.error('Erreur mise à jour utilisateur:', error);
    throw new Error('Impossible de mettre à jour les données utilisateur. Vérifiez votre connexion internet.');
  }
}
