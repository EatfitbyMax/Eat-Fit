import React from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { user, isLoading, isLoggingOut, setCurrentUser } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  React.useEffect(() => {
    // Ne pas rediriger pendant le chargement
    if (isLoading) {
      console.log('🛡️ AuthGuard - En cours de chargement...');
      return;
    }

    // Si déconnexion en cours, forcer immédiatement vers login
    if (isLoggingOut) {
      console.log('🛡️ AuthGuard - Déconnexion en cours, redirection immédiate...');
      router.replace('/auth/login');
      return;
    }

    const currentRoute = segments.join('/') || 'index';
    const userStatus = user ? `Connecté (${user.email})` : 'Non connecté';
    console.log('🛡️ AuthGuard - Route:', currentRoute, '| Utilisateur:', userStatus);

    const isAuthRoute = currentRoute.startsWith('auth');
    const isTabsRoute = currentRoute.startsWith('(tabs)') || currentRoute === 'index';
    const isClientRoute = currentRoute.startsWith('(client)');
    const isCoachRoute = currentRoute.startsWith('(coach)');

    // PRIORITÉ ABSOLUE : Si pas d'utilisateur connecté OU en cours de déconnexion, rediriger vers login
    if (!user || isLoggingOut) {
      if (!isAuthRoute) {
        const reason = isLoggingOut ? 'Déconnexion en cours' : 'Utilisateur NON connecté';
        console.log(`🔄 PRIORITÉ ABSOLUE - Redirection vers /auth/login - ${reason}`);
        router.replace('/auth/login');
        return;
      } else {
        const reason = isLoggingOut ? 'déconnexion en cours' : 'utilisateur non connecté';
        console.log(`🛡️ AuthGuard - Déjà sur route auth, ${reason} - OK`);
        return;
      }
    }

    // Si utilisateur connecté, gérer les redirections normales
    if (user && user.email) {
      if (isAuthRoute) {
        // Rediriger depuis les pages auth vers l'interface appropriée
        const redirectPath = user.userType === 'coach' ? '/(coach)' : '/(client)';
        console.log('🔄 Redirection depuis auth vers', redirectPath, '- Utilisateur connecté');
        router.replace(redirectPath);
      } else if (isTabsRoute) {
        // Rediriger depuis les tabs vers l'interface utilisateur appropriée
        const redirectPath = user.userType === 'coach' ? '/(coach)' : '/(client)';
        console.log('🔄 Redirection depuis tabs vers', redirectPath, '- Utilisateur connecté');
        router.replace(redirectPath);
      } else if (isClientRoute && user.userType !== 'client') {
        // Empêcher l'accès client si pas client
        console.log('🚫 Accès client refusé - Type utilisateur:', user.userType);
        router.replace('/(coach)');
      } else if (isCoachRoute && user.userType !== 'coach') {
        // Empêcher l'accès coach si pas coach
        console.log('🚫 Accès coach refusé - Type utilisateur:', user.userType);
        router.replace('/(client)');
      } else {
        console.log('🛡️ AuthGuard - Accès autorisé pour utilisateur connecté');
      }
    }
  }, [user, segments, isLoading, isLoggingOut, router]);

  React.useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        console.log('🔍 AuthGuard: Vérification du statut d\'authentification...');

        const userData = await AsyncStorage.getItem('currentUser');
        if (userData) {
          try {
            const user = JSON.parse(userData);
            console.log('✅ AuthGuard: Utilisateur trouvé dans le stockage:', user.email);
            setCurrentUser(user);
          } catch (parseError) {
            console.error('❌ AuthGuard: Erreur parsing des données utilisateur:', parseError);
            await AsyncStorage.removeItem('currentUser');
          }
        } else {
          console.log('❌ AuthGuard: Aucun utilisateur trouvé dans le stockage');
        }
      } catch (error) {
        console.error('❌ AuthGuard: Erreur vérification auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  return <>{children}</>;
}