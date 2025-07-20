
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getCurrentUser, User } from '@/utils/auth';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (user: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadInitialUser();
  }, []);

  const loadInitialUser = async () => {
    try {
      console.log('🔄 Chargement utilisateur initial...');
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      console.log('✅ Utilisateur chargé:', currentUser?.email || 'Aucun');
    } catch (error) {
      console.error('❌ Erreur chargement utilisateur:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
      console.log('✅ Authentification initialisée');
    }
  };

  const login = (userData: User) => {
    setUser(userData);
    console.log('✅ Utilisateur connecté via contexte:', userData.email);
  };

  const logout = () => {
    setUser(null);
    console.log('✅ Utilisateur déconnecté via contexte');
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
