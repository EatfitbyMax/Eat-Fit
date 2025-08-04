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

      // 1. IMMÉDIATEMENT activer l'état de déconnexion (AVANT de vider l'utilisateur)
      setIsLoggingOut(true);
      console.log('🔄 État de déconnexion activé');

      // 2. Attendre un tick pour que l'état se propage dans l'AuthGuard
      await new Promise(resolve => setTimeout(resolve, 50));

      // 3. Vider l'utilisateur et le cache auth
      setUser(null);
      setIsLoading(false);
      console.log('🔄 Utilisateur vidé du contexte');

      const { logout: authLogout } = await import('@/utils/auth');
      await authLogout();
      console.log('✅ Cache auth vidé');

      // 4. Navigation vers login (mais l'AuthGuard devrait déjà s'en occuper)
      console.log('🔄 Redirection vers /auth/login');
      router.replace('/auth/login');

      // 5. Attendre que tout se stabilise
      await new Promise(resolve => setTimeout(resolve, 800));

      // 6. Vérification finale
      const { getCurrentUser } = await import('@/utils/auth');
      const checkUser = await getCurrentUser();
      if (checkUser !== null) {
        console.error('⚠️ ATTENTION: Utilisateur encore en cache après logout!');
        await authLogout();
        console.log('🔄 Cache forcé à null une seconde fois');
      } else {
        console.log('✅ Vérification: Aucun utilisateur en cache');
      }

      // 7. Désactiver l'état de déconnexion
      setIsLoggingOut(false);
      console.log('✅ Déconnexion complète terminée');

    } catch (error) {
      console.error('❌ Erreur lors de la déconnexion:', error);

      // Forcer la réinitialisation même en cas d'erreur
      setUser(null);
      setIsLoading(false);
      router.replace('/auth/login');

      // Désactiver l'état de déconnexion après un délai
      setTimeout(() => {
        setIsLoggingOut(false);
      }, 1000);

      console.log('🔄 Redirection de secours vers /auth/login');
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