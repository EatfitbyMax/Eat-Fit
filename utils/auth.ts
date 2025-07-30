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
    
    // Récupérer les données utilisateur complètes depuis le serveur
    const users = await PersistentStorage.getUsers();
    const user = users.find((u: any) => u.email === session.userEmail && u.id === session.userId);
    
    if (!user) {
      console.log('❌ Utilisateur de session non trouvé sur le serveur');
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

export async function forceRegenerateUserHash(email: string, currentPassword: string): Promise<boolean> {
  try {
    console.log('🔄 Régénération forcée du hash pour:', email);
    
    // Récupérer les utilisateurs
    const users = await PersistentStorage.getUsers();
    
    // Trouver l'utilisateur
    const userIndex = users.findIndex((u: any) => u.email === email);
    if (userIndex === -1) {
      console.log('❌ Utilisateur non trouvé pour la régénération');
      return false;
    }
    
    // Générer le nouveau hash avec le système actuel (HEX)
    const passwordString = String(currentPassword).trim();
    const saltedPassword = passwordString + 'eatfitbymax_salt_2025';
    const hashedPassword = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      saltedPassword,
      { encoding: Crypto.CryptoEncoding.HEX }
    );
    
    // Mettre à jour l'utilisateur
    users[userIndex] = {
      ...users[userIndex],
      hashedPassword: hashedPassword,
      password: undefined // Supprimer l'ancien mot de passe en clair
    };
    
    // Sauvegarder
    await PersistentStorage.saveUsers(users);
    
    console.log('✅ Hash régénéré avec succès pour:', email);
    return true;
  } catch (error) {
    console.error('❌ Erreur régénération hash:', error);
    return false;
  }
}

export async function resetUserPasswordHash(email: string, newPassword: string): Promise<boolean> {
  try {
    console.log('🔄 Réinitialisation du hash pour:', email);
    
    // Récupérer les utilisateurs
    const users = await PersistentStorage.getUsers();
    
    // Trouver l'utilisateur
    const userIndex = users.findIndex((u: any) => u.email === email);
    if (userIndex === -1) {
      console.log('❌ Utilisateur non trouvé pour la réinitialisation');
      return false;
    }
    
    // Générer le nouveau hash
    const passwordString = String(newPassword).trim();
    const saltedPassword = passwordString + 'eatfitbymax_salt_2025';
    const hashedPassword = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      saltedPassword,
      { encoding: Crypto.CryptoEncoding.HEX }
    );
    
    // Mettre à jour l'utilisateur
    users[userIndex] = {
      ...users[userIndex],
      hashedPassword: hashedPassword,
      password: undefined // Supprimer l'ancien mot de passe en clair
    };
    
    // Sauvegarder
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
      try {
        const passwordString = String(password).trim();
        const saltedPassword = passwordString + 'eatfitbymax_salt_2025';
        
        console.log('🔍 Debug hash comparison:', {
          inputLength: passwordString.length,
          saltedLength: saltedPassword.length,
          storedHashLength: user.hashedPassword.length,
          storedHashPreview: user.hashedPassword.substring(0, 10) + '...'
        });

        // Vérifier d'abord avec le nouveau système HEX
        const hashedInputHex = await Crypto.digestStringAsync(
          Crypto.CryptoDigestAlgorithm.SHA256,
          saltedPassword,
          { encoding: Crypto.CryptoEncoding.HEX }
        );
        
        isPasswordValid = hashedInputHex === user.hashedPassword;
        console.log('🔐 Vérification HEX:', isPasswordValid ? 'VALIDE' : 'INVALIDE');
        
        // Si échec avec HEX, essayer avec Base64 (ancien système)
        if (!isPasswordValid && user.hashedPassword.length === 44) {
          console.log('🔄 Tentative avec ancien encodage Base64...');
          const hashedInputBase64 = await Crypto.digestStringAsync(
            Crypto.CryptoDigestAlgorithm.SHA256,
            saltedPassword,
            { encoding: Crypto.CryptoEncoding.BASE64 }
          );
          
          isPasswordValid = hashedInputBase64 === user.hashedPassword;
          console.log('🔐 Vérification Base64:', isPasswordValid ? 'VALIDE' : 'INVALIDE');
          
          // Si connexion réussie avec Base64, migrer vers HEX
          if (isPasswordValid) {
            console.log('🔄 Migration du hash Base64 vers HEX...');
            try {
              // Mettre à jour l'utilisateur avec le nouveau hash HEX
              const updatedUsers = users.map((u: any) => 
                u.email === email 
                  ? { ...u, hashedPassword: hashedInputHex }
                  : u
              );
              
              await PersistentStorage.saveUsers(updatedUsers);
              console.log('✅ Migration Base64->HEX terminée');
            } catch (migrationError) {
              console.error('⚠️ Erreur migration Base64->HEX (connexion maintenue):', migrationError);
            }
          }
        }
        
        if (!isPasswordValid) {
          console.log('❌ Hash mismatch détecté - tentative avec ancien système mot de passe');
        }
      } catch (compareError) {
        console.error('❌ Erreur comparaison hash:', compareError);
        isPasswordValid = false;
      }
    } else if (user.password) {
      // Ancien système (temporaire)
      isPasswordValid = user.password === password;
      console.log('🔓 Vérification ancien système:', isPasswordValid ? 'VALIDE' : 'INVALIDE');
      
      // Si la connexion réussit avec l'ancien système, migrer vers le nouveau hash
      if (isPasswordValid) {
        console.log('🔄 Migration du mot de passe vers le nouveau système de hash...');
        try {
          const passwordString = String(password).trim();
          const saltedPassword = passwordString + 'eatfitbymax_salt_2025';
          const newHashedPassword = await Crypto.digestStringAsync(
            Crypto.CryptoDigestAlgorithm.SHA256,
            saltedPassword,
            { encoding: Crypto.CryptoEncoding.HEX }
          );
          
          // Mettre à jour l'utilisateur dans la base
          const updatedUsers = users.map((u: any) => 
            u.email === email 
              ? { ...u, hashedPassword: newHashedPassword, password: undefined }
              : u
          );
          
          await PersistentStorage.saveUsers(updatedUsers);
          console.log('✅ Migration du hash terminée');
        } catch (migrationError) {
          console.error('⚠️ Erreur migration hash (connexion maintenue):', migrationError);
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
      if (!user.emailVerified) {
        console.log('❌ Email non vérifié pour le coach:', email);
        throw new Error('Votre email n\'a pas encore été vérifié. Vérifiez votre boîte mail et cliquez sur le lien de vérification.');
      }
      
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

    // Hacher le mot de passe avec validation
    console.log('🔐 Hachage du mot de passe...', `Type: ${typeof userData.password}, Longueur: ${userData.password.length}`);

    let hashedPassword: string;
    try {
      const passwordString = String(userData.password).trim();

      console.log('🔧 Préparation hachage:', {
        passwordString: passwordString.substring(0, 3) + '***',
        method: 'expo-crypto-sha256'
      });

      // Hachage sécurisé avec expo-crypto
      const saltedPassword = passwordString + 'eatfitbymax_salt_2025';
      hashedPassword = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        saltedPassword,
        { encoding: Crypto.CryptoEncoding.HEX }
      );

      console.log('✅ Hachage réussi avec expo-crypto, longueur:', hashedPassword.length);
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
    
    // Supprimer la session persistante AVANT de vider le cache
    await clearSession();
    
    // Vider immédiatement et définitivement le cache utilisateur - TRIPLE CHECK
    currentUserCache = null;
    
    // Force garbage collection si possible
    if (global && global.gc) {
      try {
        global.gc();
      } catch (e) {
        // Ignore si gc n'est pas disponible
      }
    }
    
    // Vérification immédiate
    if (currentUserCache !== null) {
      console.error('⚠️ CRITIQUE: Cache utilisateur non vidé à la première tentative!');
      currentUserCache = null;
    }
    
    // Attendre un tick et re-vérifier
    await new Promise(resolve => setTimeout(resolve, 10));
    
    if (currentUserCache !== null) {
      console.error('⚠️ CRITIQUE: Cache utilisateur non vidé après timeout!');
      currentUserCache = null;
    }
    
    console.log('✅ Déconnexion réussie - Cache utilisateur complètement vidé');
    
    // Vérification finale multiple
    let finalCheck = 0;
    while (finalCheck < 3) {
      const testUser = await getCurrentUser();
      if (testUser === null) {
        console.log(`✅ Vérification finale ${finalCheck + 1}/3 réussie - getCurrentUser retourne null`);
        break;
      } else {
        console.error(`❌ ERREUR CRITIQUE ${finalCheck + 1}/3: getCurrentUser retourne encore un utilisateur!`);
        currentUserCache = null;
        finalCheck++;
        
        if (finalCheck < 3) {
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      }
    }
    
    if (finalCheck === 3) {
      console.error('❌ ERREUR PERSISTANTE: Impossible de vider le cache après 3 tentatives');
      // Dernier effort - réassigner la variable
      currentUserCache = undefined as any;
      currentUserCache = null;
    }
    
  } catch (error) {
    console.error('❌ Erreur déconnexion:', error);
    // S'assurer que le cache est vidé même en cas d'erreur
    currentUserCache = null;
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
