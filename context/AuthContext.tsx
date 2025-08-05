import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { useRouter } from 'expo-router';
import { getCurrentUser, User } from '@/utils/auth';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isLoggingOut: boolean;
  login: (user: User) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadUser = async () => {
      try {
        setIsLoading(true);
        console.log('🔄 Chargement utilisateur avec session persistante...');

        const currentUser = await getCurrentUser();

        if (isMounted) {
          // Validation ULTRA-STRICTE - ne jamais accepter d'utilisateur invalide
          if (currentUser && 
              currentUser.email && 
              currentUser.firstName && 
              currentUser.lastName && 
              currentUser.userType &&
              currentUser.firstName.trim() !== '' && 
              currentUser.lastName.trim() !== '' &&
              !currentUser.email.includes('champion') && 
              currentUser.firstName !== 'champion') {
            
            setUser(currentUser);
            console.log('✅ Utilisateur valide connecté (session restaurée):', currentUser.email);
          } else {
            // SI L'UTILISATEUR EST INVALIDE, NETTOYER IMMÉDIATEMENT
            if (currentUser) {
              console.log('🚫 Utilisateur avec données invalides/corrompues détecté - NETTOYAGE IMMÉDIAT');
              const { logout: authLogout } = await import('@/utils/auth');
              await authLogout();
            } else {
              console.log('📱 Aucune session trouvée');
            }
            setUser(null);
          }
        }
      } catch (error) {
        console.error('❌ Erreur chargement utilisateur:', error);
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadUser();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback((userData: User) => {
    // Validation ULTRA-STRICTE - rejeter tout utilisateur invalide
    if (!userData || 
        !userData.email || 
        !userData.firstName || 
        !userData.lastName || 
        !userData.userType ||
        userData.firstName.trim() === '' || 
        userData.lastName.trim() === '' ||
        userData.email.includes('champion') || 
        userData.firstName === 'champion' ||
        userData.lastName === 'champion') {
      console.error('❌ REJET: Tentative de connexion avec des données utilisateur invalides', {
        hasEmail: !!userData?.email,
        hasFirstName: !!userData?.firstName,
        hasLastName: !!userData?.lastName,
        hasUserType: !!userData?.userType,
        firstNameContent: userData?.firstName,
        lastNameContent: userData?.lastName
      });
      return;
    }

    setUser(userData);
    console.log('✅ Utilisateur VALIDE connecté via contexte:', userData.email);
  }, []);

  const logout = useCallback(async () => {
    try {
      console.log('🚪 Début de la déconnexion...');

      // 1. IMMÉDIATEMENT vider l'utilisateur et activer l'état de déconnexion
      setUser(null);
      setIsLoading(false);
      setIsLoggingOut(true);
      console.log('🔄 Utilisateur vidé et état de déconnexion activé');

      // 2. Vider le cache auth en parallèle
      try {
        const { logout: authLogout } = await import('@/utils/auth');
        await authLogout();
        console.log('✅ Cache auth vidé');
      } catch (authError) {
        console.error('⚠️ Erreur vidage cache auth:', authError);
      }

      // 3. Redirection immédiate et forcée vers login
      console.log('🔄 Redirection forcée vers /auth/login');
      router.replace('/auth/login');
      
      // 4. Attendre très brièvement puis forcer une seconde redirection si nécessaire
      setTimeout(() => {
        console.log('🔄 Redirection de sécurité vers /auth/login');
        router.replace('/auth/login');
        setIsLoggingOut(false);
      }, 50);

      console.log('✅ Déconnexion initiée avec succès');

    } catch (error) {
      console.error('❌ Erreur lors de la déconnexion:', error);

      // Forcer la réinitialisation complète même en cas d'erreur
      setUser(null);
      setIsLoading(false);
      setIsLoggingOut(false);
      
      // Redirection de secours
      console.log('🔄 Redirection de secours vers /auth/login');
      router.replace('/auth/login');
    }
  }, [router]);

  const refreshUser = useCallback(async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      console.log('🔄 Utilisateur rafraîchi:', currentUser?.email || 'Aucun');
    } catch (error) {
      console.error('❌ Erreur rafraîchissement utilisateur:', error);
      setUser(null);
    }
  }, []);

  const contextValue = useMemo(() => ({
    user,
    isLoading,
    isLoggingOut,
    login,
    logout,
    refreshUser,
  }), [user, isLoading, isLoggingOut, login, logout, refreshUser]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}