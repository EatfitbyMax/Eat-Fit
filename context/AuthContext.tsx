import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
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
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadUser = async () => {
      try {
        setIsLoading(true);
        const currentUser = await getCurrentUser();

        if (isMounted) {
          if (currentUser && currentUser.email) {
            setUser(currentUser);
            console.log('✅ Utilisateur connecté:', currentUser.email);
          } else {
            console.log('📱 Aucun utilisateur connecté, redirection vers login');
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
    setUser(userData);
    console.log('✅ Utilisateur connecté via contexte:', userData.email);
  }, []);

  const logout = useCallback(async () => {
    try {
      console.log('🚪 Début de la déconnexion...');

      // 1. IMMÉDIATEMENT marquer comme en cours de déconnexion et vider l'utilisateur
      setIsLoggingOut(true);
      setUser(null);
      setIsLoading(false);
      console.log('🔄 État de déconnexion activé et utilisateur vidé');

      // 2. Vider le cache auth IMMÉDIATEMENT
      const { logout: authLogout } = await import('@/utils/auth');
      await authLogout();
      console.log('✅ Cache auth vidé');

      // 3. Forcer un re-render en attendant un tick
      await new Promise(resolve => setTimeout(resolve, 100));

      // 4. Vérification double du cache
      const { getCurrentUser } = await import('@/utils/auth');
      const checkUser = await getCurrentUser();
      if (checkUser !== null) {
        console.error('⚠️ ATTENTION: Utilisateur encore en cache après logout!');
        // Forcer le nettoyage une seconde fois
        await authLogout();
        console.log('🔄 Cache forcé à null une seconde fois');
      } else {
        console.log('✅ Vérification: Aucun utilisateur en cache');
      }

      // 5. La navigation sera gérée par AuthGuard automatiquement
      // grâce aux états isLoggingOut et user = null
      console.log('🔄 AuthGuard va automatiquement rediriger vers /auth/login');

      // 6. Attendre un tick pour que le contexte se propage
      await new Promise(resolve => setTimeout(resolve, 100));

      // 7. Désactiver l'état de déconnexion
      setIsLoggingOut(false);
      console.log('✅ Déconnexion complète terminée');

    } catch (error) {
      console.error('❌ Erreur lors de la déconnexion:', error);

      // Forcer la réinitialisation même en cas d'erreur
      setUser(null);
      setIsLoading(false);
      setIsLoggingOut(false);

      // AuthGuard gérera automatiquement la redirection
      console.log('🔄 AuthGuard va gérer la redirection de secours');
    }
  }, []);

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