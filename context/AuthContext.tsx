import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await getCurrentUser();
      // Vérifier si l'utilisateur a vraiment une session valide
      if (currentUser && currentUser.email) {
        setUser(currentUser);
        console.log('✅ Utilisateur connecté:', currentUser.email);
      } else {
        console.log('📱 Aucun utilisateur connecté, redirection vers login');
        setUser(null);
      }
    } catch (error) {
      console.error('❌ Erreur chargement utilisateur:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = (userData: User) => {
    setUser(userData);
    console.log('✅ Utilisateur connecté via contexte:', userData.email);
  };

  const logout = async () => {
    try {
      // Appeler la fonction logout du utils/auth
      await import('@/utils/auth').then(({ logout: authLogout }) => authLogout());
      // Vider l'état du contexte
      setUser(null);
      console.log('✅ Utilisateur déconnecté via contexte');
    } catch (error) {
      console.error('❌ Erreur lors de la déconnexion:', error);
      // Même en cas d'erreur, vider l'état local
      setUser(null);
    }
  };

  const refreshUser = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      console.log('🔄 Utilisateur rafraîchi:', currentUser?.email || 'Aucun');
    } catch (error) {
      console.error('❌ Erreur rafraîchissement utilisateur:', error);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      login,
      logout,
      refreshUser,
    }}>
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