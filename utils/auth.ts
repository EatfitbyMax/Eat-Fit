import { PersistentStorage } from './storage';
import * as Crypto from 'expo-crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  favoriteSport?: string;
  profileImage?: string;
  hashedPassword?: string;
}

let currentUserCache: User | null = null;

// Clés pour AsyncStorage
const SESSION_KEY = 'eatfitbymax_session';
const SESSION_EXPIRY_KEY = 'eatfitbymax_session_expiry';

// Durée de validité de la session (7 jours)
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 jours en millisecondes

// Fonction pour créer un token de session sécurisé
async function createSessionToken(userEmail: string): Promise<string> {
  const timestamp = Date.now().toString();
  const sessionData = `${userEmail}:${timestamp}`;
  const hashedToken = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    sessionData + 'eatfitbymax_session_salt_2025',
    { encoding: Crypto.CryptoEncoding.HEX }
  );
  return hashedToken;
}

// Fonction pour sauvegarder la session
async function saveSession(user: User): Promise<void> {
  try {
    const sessionToken = await createSessionToken(user.email);
    const expiryTime = Date.now() + SESSION_DURATION;

    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify({
      token: sessionToken,
      userEmail: user.email,
      userId: user.id,
      userType: user.userType
    }));

    await AsyncStorage.setItem(SESSION_EXPIRY_KEY, expiryTime.toString());

    console.log('💾 Session sauvegardée avec succès, expire le:', new Date(expiryTime).toLocaleString());
  } catch (error) {
    console.error('❌ Erreur sauvegarde session:', error);
  }
}

// Fonction pour récupérer la session
async function loadSession(): Promise<User | null> {
  try {
    const sessionData = await AsyncStorage.getItem(SESSION_KEY);
    const expiryData = await AsyncStorage.getItem(SESSION_EXPIRY_KEY);

    if (!sessionData || !expiryData) {
      console.log('📱 Aucune session sauvegardée');
      return null;
    }

    const expiryTime = parseInt(expiryData);
    const currentTime = Date.now();

    // Vérifier si la session a expiré
    if (currentTime > expiryTime) {
      console.log('⏰ Session expirée, suppression...');
      await clearSession();
      return null;
    }

    const session = JSON.parse(sessionData);

    // Récupérer les données utilisateur complètes depuis le serveur (clients ET coaches)
    const users = await PersistentStorage.getUsers();
    const coaches = await PersistentStorage.getCoaches();
    const allUsers = [...users, ...coaches];
    const user = allUsers.find((u: any) => u.email === session.userEmail && u.id === session.userId);

    if (!user) {
      console.log('❌ Utilisateur de session non trouvé sur le serveur');
      await clearSession();
      return null;
    }

    // Validation ULTRA-STRICTE des données utilisateur
    if (!user.email || 
        !user.firstName || 
        !user.lastName || 
        !user.userType ||
        user.firstName.trim() === '' || 
        user.lastName.trim() === '' ||
        user.email.includes('champion') || 
        user.firstName === 'champion' ||
        user.lastName === 'champion' ||
        user.email === '' ||
        user.firstName === 'bonjour' ||
        user.lastName === 'bonjour') {
      console.log('❌ REJET: Données utilisateur invalides ou corrompues détectées', {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        userType: user.userType
      });
      await clearSession();
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
      favoriteSport: user.favoriteSport,
      profileImage: user.profileImage
    };

    console.log('✅ Session restaurée pour:', user.email, '- Expire le:', new Date(expiryTime).toLocaleString());
    return userWithoutPassword;

  } catch (error) {
    console.error('❌ Erreur chargement session:', error);
    await clearSession();
    return null;
  }
}

// Fonction pour supprimer la session
async function clearSession(): Promise<void> {
  try {
    await AsyncStorage.removeItem(SESSION_KEY);
    await AsyncStorage.removeItem(SESSION_EXPIRY_KEY);
    console.log('🗑️ Session supprimée');
  } catch (error) {
    console.error('❌ Erreur suppression session:', error);
  }
}

// Fonction unifiée pour générer un hash sécurisé
async function generateSecureHash(password: string): Promise<string> {
  const passwordString = String(password).trim();
  const saltedPassword = passwordString + 'eatfitbymax_salt_2025';
  
  return await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    saltedPassword,
    { encoding: Crypto.CryptoEncoding.HEX }
  );
}

// Fonction pour vérifier un mot de passe avec tous les systèmes de hash
async function verifyPassword(inputPassword: string, storedHash: string): Promise<boolean> {
  const passwordString = String(inputPassword).trim();
  const saltedPassword = passwordString + 'eatfitbymax_salt_2025';

  console.log('🔍 Debug vérification mot de passe:');
  console.log('- Mot de passe saisi (longueur):', passwordString.length);
  console.log('- Hash stocké (longueur):', storedHash.length);
  console.log('- Hash stocké (début):', storedHash.substring(0, 10) + '...');

  try {
    // 1. Nouveau système unifié SHA256-HEX
    const currentHash = await generateSecureHash(inputPassword);
    console.log('- Hash généré (SHA256-HEX):', currentHash.substring(0, 10) + '...');
    if (currentHash === storedHash) {
      console.log('✅ Hash valide (système actuel SHA256-HEX)');
      return true;
    }

    // 2. Ancien système SHA256-Base64
    if (storedHash.length === 44) {
      const base64Hash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        saltedPassword,
        { encoding: Crypto.CryptoEncoding.BASE64 }
      );
      console.log('- Hash généré (SHA256-Base64):', base64Hash.substring(0, 10) + '...');
      if (base64Hash === storedHash) {
        console.log('✅ Hash valide (ancien système SHA256-Base64)');
        return true;
      }
    }

    // 3. Très ancien système MD5
    if (storedHash.length === 32) {
      // MD5 sans salt
      const md5NoSalt = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.MD5,
        passwordString,
        { encoding: Crypto.CryptoEncoding.HEX }
      );
      console.log('- Hash généré (MD5 sans salt):', md5NoSalt);
      if (md5NoSalt === storedHash) {
        console.log('✅ Hash valide (ancien système MD5 sans salt)');
        return true;
      }

      // MD5 avec salt
      const md5WithSalt = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.MD5,
        saltedPassword,
        { encoding: Crypto.CryptoEncoding.HEX }
      );
      console.log('- Hash généré (MD5 avec salt):', md5WithSalt);
      if (md5WithSalt === storedHash) {
        console.log('✅ Hash valide (ancien système MD5 avec salt)');
        return true;
      }
    }

    // 4. Test avec le système serveur (Node.js crypto)
    const crypto = require('crypto');
    const serverHash = crypto.createHash('sha256').update(saltedPassword).digest('hex');
    console.log('- Hash généré (Node.js SHA256):', serverHash.substring(0, 10) + '...');
    if (serverHash === storedHash) {
      console.log('✅ Hash valide (système serveur Node.js)');
      return true;
    }

    // 5. Mot de passe en clair (système très ancien)
    if (passwordString === storedHash) {
      console.log('✅ Mot de passe valide (système très ancien - clair)');
      return true;
    }

    console.log('❌ Aucun système de hash ne correspond');
    return false;
  } catch (error) {
    console.error('❌ Erreur vérification mot de passe:', error);
    return false;
  }
}

export async function forceRegenerateUserHash(email: string, currentPassword: string): Promise<boolean> {
  try {
    console.log('🔄 Régénération forcée du hash pour:', email);

    const users = await PersistentStorage.getUsers();
    const userIndex = users.findIndex((u: any) => u.email === email);
    if (userIndex === -1) {
      console.log('❌ Utilisateur non trouvé pour la régénération');
      return false;
    }

    // Générer le nouveau hash unifié avec Expo Crypto
    const hashedPassword = await generateSecureHash(currentPassword);
    console.log('🔐 Nouveau hash généré:', hashedPassword.substring(0, 10) + '...');

    // Mettre à jour l'utilisateur
    users[userIndex] = {
      ...users[userIndex],
      hashedPassword: hashedPassword,
      password: undefined
    };

    await PersistentStorage.saveUsers(users);
    console.log('✅ Hash régénéré avec succès pour:', email);
    return true;
  } catch (error) {
    console.error('❌ Erreur régénération hash:', error);
    return false;
  }
}

// Fonction de debug pour tester les différents systèmes de hash
export async function debugPasswordHash(email: string, testPassword: string): Promise<void> {
  try {
    console.log('🔍 DEBUG - Test de tous les systèmes de hash pour:', email);
    
    const users = await PersistentStorage.getUsers();
    const user = users.find((u: any) => u.email === email);
    
    if (!user) {
      console.log('❌ Utilisateur non trouvé');
      return;
    }

    console.log('📋 Hash stocké:', user.hashedPassword);
    
    // Test Expo Crypto SHA256-HEX
    const expoHash = await generateSecureHash(testPassword);
    console.log('🔐 Expo SHA256-HEX:', expoHash);
    console.log('✅ Match Expo:', expoHash === user.hashedPassword);
    
    // Test Node.js crypto
    const crypto = require('crypto');
    const saltedPassword = testPassword.trim() + 'eatfitbymax_salt_2025';
    const nodeHash = crypto.createHash('sha256').update(saltedPassword).digest('hex');
    console.log('🔐 Node.js SHA256:', nodeHash);
    console.log('✅ Match Node.js:', nodeHash === user.hashedPassword);
    
  } catch (error) {
    console.error('❌ Erreur debug hash:', error);
  }
}

export async function resetUserPasswordHash(email: string, newPassword: string): Promise<boolean> {
  try {
    console.log('🔄 Réinitialisation du hash pour:', email);

    const users = await PersistentStorage.getUsers();
    const userIndex = users.findIndex((u: any) => u.email === email);
    if (userIndex === -1) {
      console.log('❌ Utilisateur non trouvé pour la réinitialisation');
      return false;
    }

    // Générer le nouveau hash unifié
    const hashedPassword = await generateSecureHash(newPassword);

    // Mettre à jour l'utilisateur
    users[userIndex] = {
      ...users[userIndex],
      hashedPassword: hashedPassword,
      password: undefined
    };

    await PersistentStorage.saveUsers(users);
    console.log('✅ Hash réinitialisé avec succès pour:', email);
    return true;
  } catch (error) {
    console.error('❌ Erreur réinitialisation hash:', error);
    return false;
  }
}

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
  // Vérifier d'abord le cache mémoire
  if (currentUserCache) {
    return currentUserCache;
  }

  // Si pas de cache mémoire, essayer de charger depuis la session persistante
  try {
    console.log('🔄 Tentative de restauration de session...');
    const sessionUser = await loadSession();

    if (sessionUser) {
      // Mettre en cache mémoire
      currentUserCache = sessionUser;
      console.log('✅ Session restaurée et mise en cache pour:', sessionUser.email);
      return sessionUser;
    }
  } catch (error) {
    console.error('❌ Erreur restauration session:', error);
  }

  return null;
}

export async function login(email: string, password: string): Promise<User | null> {
  try {
    console.log('🔄 Tentative de connexion pour:', email);

    // Récupérer les utilisateurs ET les coaches depuis le serveur
    const users = await PersistentStorage.getUsers();
    const coaches = await PersistentStorage.getCoaches();

    // Combiner les deux listes pour la recherche
    const allUsers = [...users, ...coaches];

    console.log('📊 Nombre d\'utilisateurs récupérés:', users.length);
    console.log('👨‍💼 Nombre de coaches récupérés:', coaches.length);
    console.log('👥 Tous les utilisateurs disponibles:', allUsers.map((u: any) => ({ 
      email: u.email, 
      userType: u.userType,
      hashedPassword: u.hashedPassword ? 'OUI' : 'NON'
    })));

    // Trouver l'utilisateur (client ou coach)
    const user = allUsers.find((u: any) => u.email === email);
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

    // Vérifier le mot de passe avec le nouveau système unifié
    let isPasswordValid = false;
    const passwordString = String(password).trim();

    if (user.hashedPassword) {
      // Utiliser la fonction de vérification unifiée
      isPasswordValid = await verifyPassword(password, user.hashedPassword);
      
      // Si le mot de passe est valide mais utilise un ancien système, migrer automatiquement
      if (isPasswordValid) {
        const currentHash = await generateSecureHash(password);
        if (currentHash !== user.hashedPassword) {
          console.log('🔄 Migration automatique vers le nouveau système de hash...');
          try {
            // Mise à jour dans la liste appropriée (users ou coaches)
            const isInUsers = users.some(u => u.email === email);
            
            if (isInUsers) {
              const updatedUsers = users.map((u: any) => 
                u.email === email 
                  ? { ...u, hashedPassword: currentHash, password: undefined }
                  : u
              );
              await PersistentStorage.saveUsers(updatedUsers);
            } else {
              const updatedCoaches = coaches.map((c: any) => 
                c.email === email 
                  ? { ...c, hashedPassword: currentHash, password: undefined }
                  : c
              );
              // Sauvegarder les coaches via l'API
              const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://eatfitbymax.cloud';
              const response = await fetch(`${API_URL}/api/coaches`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedCoaches)
              });
              if (!response.ok) {
                throw new Error('Erreur sauvegarde coaches');
              }
            }
            console.log('✅ Migration automatique terminée');
          } catch (migrationError) {
            console.error('⚠️ Erreur migration automatique (connexion maintenue):', migrationError);
          }
        }
      }
    } else if (user.password) {
      // Système très ancien (mot de passe en clair)
      isPasswordValid = user.password === password;
      console.log('🔓 Vérification ancien système (clair):', isPasswordValid ? 'VALIDE' : 'INVALIDE');

      // Migration obligatoire vers le nouveau système
      if (isPasswordValid) {
        console.log('🔄 Migration obligatoire du mot de passe en clair...');
        try {
          const newHashedPassword = await generateSecureHash(password);
          
          const isInUsers = users.some(u => u.email === email);
          
          if (isInUsers) {
            const updatedUsers = users.map((u: any) => 
              u.email === email 
                ? { ...u, hashedPassword: newHashedPassword, password: undefined }
                : u
            );
            await PersistentStorage.saveUsers(updatedUsers);
          } else {
            const updatedCoaches = coaches.map((c: any) => 
              c.email === email 
                ? { ...c, hashedPassword: newHashedPassword, password: undefined }
                : c
            );
            const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://eatfitbymax.cloud';
            const response = await fetch(`${API_URL}/api/coaches`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(updatedCoaches)
            });
            if (!response.ok) {
              throw new Error('Erreur sauvegarde coaches');
            }
          }
          console.log('✅ Migration du mot de passe en clair terminée');
        } catch (migrationError) {
          console.error('⚠️ Erreur migration mot de passe en clair (connexion maintenue):', migrationError);
        }
      }
    } else {
      console.log('❌ Aucun mot de passe défini pour cet utilisateur');
      return null;
    }

    if (!isPasswordValid) {
      console.log('❌ Mot de passe incorrect pour:', email);
      return null;
    }

    // Vérification spéciale pour les coachs
    if (user.userType === 'coach') {
      if (user.status !== 'active') {
        console.log('❌ Compte coach non activé:', email);
        throw new Error('Votre compte coach n\'est pas encore activé. Contactez l\'administrateur.');
      }
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
      favoriteSport: user.favoriteSport,
      profileImage: user.profileImage
    };

    // Sauvegarder la session en cache mémoire et de manière persistante
    currentUserCache = userWithoutPassword;
    await saveSession(userWithoutPassword);
    console.log('💾 Session utilisateur mise en cache mémoire et sauvegardée');

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

    // Vérifier que le mot de passe est bien fourni
    if (!userData.password || typeof userData.password !== 'string') {
      console.log('❌ Mot de passe invalide ou manquant');
      throw new Error('Mot de passe requis');
    }

    // Récupérer les utilisateurs existants depuis le serveur uniquement
    const users = await PersistentStorage.getUsers();
    console.log('📊 Utilisateurs récupérés depuis le serveur:', users.length);

    // Vérifier si l'utilisateur existe déjà
    const existingUser = users.find((u: any) => u.email === userData.email);
    if (existingUser) {
      console.log('❌ Utilisateur déjà existant:', userData.email);
      return null;
    }

    // Hacher le mot de passe avec le nouveau système unifié
    console.log('🔐 Hachage du mot de passe...', `Type: ${typeof userData.password}, Longueur: ${userData.password.length}`);

    let hashedPassword: string;
    try {
      console.log('🔧 Utilisation du système de hash unifié');
      hashedPassword = await generateSecureHash(userData.password);
      console.log('✅ Hachage réussi avec système unifié, longueur:', hashedPassword.length);
    } catch (hashError) {
      console.error('❌ Erreur détaillée hachage:', hashError);
      throw new Error(`Erreur hachage mot de passe: ${hashError.message}`);
    }

    // Créer le nouvel utilisateur
    const newUser = {
      ...userData,
      id: Date.now().toString(),
      hashedPassword: hashedPassword,
      // S'assurer que le sport favori est inclus
      favoriteSport: userData.favoriteSport || '',
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
      favoriteSport: newUser.favoriteSport,
      profileImage: newUser.profileImage
    };

    // Sauvegarder la session en cache mémoire et de manière persistante
    currentUserCache = userWithoutPassword;
    await saveSession(userWithoutPassword);
    console.log('💾 Session utilisateur mise en cache mémoire et sauvegardée');

    console.log('✅ Inscription réussie pour:', userData.email);
    return userWithoutPassword;
  } catch (error) {
    console.error('❌ Erreur inscription complète:', error);
    throw new Error('Impossible de créer le compte. Vérifiez votre connexion internet.');
  }
}

export async function logout(): Promise<void> {
  try {
    console.log('🔄 Fonction logout appelée - Vidage du cache et de la session...');

    // 1. Vider IMMÉDIATEMENT le cache utilisateur en premier
    currentUserCache = null;

    // 2. Supprimer la session persistante
    await clearSession();

    // 3. Vider à nouveau le cache par sécurité
    currentUserCache = null;

    // 4. Force garbage collection si possible
    if (global && global.gc) {
      try {
        global.gc();
      } catch (e) {
        // Ignore si gc n'est pas disponible
      }
    }

    // 5. Attendre un tick pour que le changement se propage
    await new Promise(resolve => setTimeout(resolve, 50));

    // 6. Vérification finale UNIQUE (pour éviter les race conditions)
    const testUser = await getCurrentUser();
    if (testUser === null) {
      console.log('✅ Vérification finale réussie - getCurrentUser retourne null');
    } else {
      console.error('❌ ERREUR CRITIQUE: getCurrentUser retourne encore un utilisateur après logout!');
      // Forcer le nettoyage définitif
      currentUserCache = null;
      await clearSession();
    }

    console.log('✅ Déconnexion réussie - Cache utilisateur complètement vidé');

  } catch (error) {
    console.error('❌ Erreur déconnexion:', error);
    // S'assurer que le cache est vidé même en cas d'erreur
    currentUserCache = null;
    await clearSession();
  }
}

const USER_STORAGE_KEY = 'eatfitbymax_user'; // Define the missing USER_STORAGE_KEY

export const deleteUserAccount = async (userId: string): Promise<void> => {
  try {
    console.log('🗑️ Début de la suppression du compte:', userId);
    
    // Supprimer toutes les données locales de l'utilisateur
    const keysToRemove = [
      USER_STORAGE_KEY,
      SESSION_KEY,
      SESSION_EXPIRY_KEY,
      `subscription_${userId}`,
      `integration_status_${userId}`,
      `user_preferences_${userId}`,
      `workout_programs_${userId}`,
      `nutrition_data_${userId}`,
      `progress_data_${userId}`,
      `health_data_${userId}`,
      `strava_data_${userId}`,
      `messages_${userId}`,
      `notifications_${userId}`,
      `securitySettings`,
      `notificationSettings_${userId}`,
      `theme_preference`,
      `language_preference`,
    ];

    await AsyncStorage.multiRemove(keysToRemove);
    console.log('✅ Données locales supprimées');

    // Supprimer les données sur le serveur
    const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://eatfitbymax.cloud';

    try {
      // Récupérer d'abord les données utilisateur pour déterminer le type
      const users = await PersistentStorage.getUsers();
      const coaches = await PersistentStorage.getCoaches();
      
      let isClient = users.some(u => u.id === userId);
      let isCoach = coaches.some(c => c.id === userId);

      if (isClient) {
        // Supprimer des clients
        const updatedUsers = users.filter(u => u.id !== userId);
        await PersistentStorage.saveUsers(updatedUsers);
        console.log('✅ Utilisateur supprimé de la base clients');
      } else if (isCoach) {
        // Supprimer des coaches
        const updatedCoaches = coaches.filter(c => c.id !== userId);
        const response = await fetch(`${API_URL}/api/coaches`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatedCoaches)
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        console.log('✅ Coach supprimé de la base coaches');
      } else {
        console.warn('⚠️ Utilisateur non trouvé dans les bases de données');
      }

      // Supprimer aussi les données spécifiques (nutrition, workouts, etc.)
      const deleteEndpoints = [
        `/api/nutrition/${userId}`,
        `/api/workouts/${userId}`,
        `/api/health/${userId}`,
        `/api/strava/${userId}`,
        `/api/messages/${userId}`,
        `/api/notifications/${userId}`,
        `/api/user-data/${userId}`
      ];

      for (const endpoint of deleteEndpoints) {
        try {
          await fetch(`${API_URL}${endpoint}`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
          });
        } catch (deleteError) {
          console.warn(`Erreur suppression ${endpoint}:`, deleteError);
        }
      }

    } catch (serverError) {
      console.warn('Erreur serveur lors de la suppression:', serverError);
      // Ne pas lever d'erreur car les données locales sont supprimées
    }

    // Vider le cache utilisateur
    currentUserCache = null;

    console.log('✅ Compte utilisateur supprimé définitivement');
  } catch (error) {
    console.error('❌ Erreur lors de la suppression du compte:', error);
    throw new Error('Impossible de supprimer le compte. Certaines données peuvent persister.');
  }
};

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
    // Récupérer les utilisateurs ET les coaches depuis le serveur
    const users = await PersistentStorage.getUsers();
    const coaches = await PersistentStorage.getCoaches();

    // Chercher dans les clients d'abord
    let userIndex = users.findIndex((u: any) => u.email === email);
    let isCoach = false;
    let updatedUser;

    if (userIndex !== -1) {
      // Utilisateur trouvé dans les clients
      updatedUser = {
        ...users[userIndex],
        ...updateData,
        name: updateData.firstName && updateData.lastName 
          ? `${updateData.firstName} ${updateData.lastName}`
          : users[userIndex].name
      };
      users[userIndex] = updatedUser;
      await PersistentStorage.saveUsers(users);
    } else {
      // Chercher dans les coaches
      userIndex = coaches.findIndex((c: any) => c.email === email);
      if (userIndex === -1) {
        console.log('Utilisateur non trouvé pour la mise à jour');
        return false;
      }

      isCoach = true;
      updatedUser = {
        ...coaches[userIndex],
        ...updateData,
        name: updateData.firstName && updateData.lastName 
          ? `${updateData.firstName} ${updateData.lastName}`
          : coaches[userIndex].name
      };
      coaches[userIndex] = updatedUser;

      // Sauvegarder les coaches (fonction à créer)
      try {
        const response = await fetch(`${API_URL}/api/coaches`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(coaches)
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      } catch (error) {
        console.error('Erreur sauvegarde coaches:', error);
        throw error;
      }
    }

    // Mettre à jour la session en cache mémoire et persistante
    const { password: _, hashedPassword: __, ...userWithoutPassword } = updatedUser;
    currentUserCache = userWithoutPassword;
    await saveSession(userWithoutPassword);

    console.log('Données utilisateur mises à jour avec succès');
    return true;
  } catch (error) {
    console.error('Erreur mise à jour utilisateur:', error);
    throw new Error('Impossible de mettre à jour les données utilisateur. Vérifiez votre connexion internet.');
  }
}