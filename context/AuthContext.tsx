import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { getCurrentUser, User } from '@/utils/auth';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (user: User) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
      
      // Appeler la fonction logout du utils/auth d'abord
      await import('@/utils/auth').then(({ logout: authLogout }) => authLogout());
      console.log('✅ Cache mémoire vidé');
      
      // Vider immédiatement l'état du contexte
      setUser(null);
      console.log('✅ État contexte vidé');
      
      // Attendre que le contexte soit complètement synchronisé
      await new Promise(resolve => setTimeout(resolve, 200));
      console.log('✅ Synchronisation contexte terminée');
      
      // Redirection vers login après synchronisation complète
      const { router } = await import('expo-router');
      router.replace('/auth/login');
      console.log('🔄 Redirection forcée vers /auth/login');
      
    } catch (error) {
      console.error('❌ Erreur lors de la déconnexion:', error);
      // S'assurer que l'état est vidé même en cas d'erreur
      setUser(null);
      // Redirection même en cas d'erreur
      try {
        await new Promise(resolve => setTimeout(resolve, 200));
        const { router } = await import('expo-router');
        router.replace('/auth/login');
      } catch (routerError) {
        console.error('❌ Erreur redirection:', routerError);
      }
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
    login,
    logout,
    refreshUser,
  }), [user, isLoading, login, logout, refreshUser]);

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