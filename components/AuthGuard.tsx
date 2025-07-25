import React from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  React.useEffect(() => {
    // Ne pas rediriger pendant le chargement
    if (isLoading) {
      console.log('🛡️ AuthGuard - En cours de chargement...');
      return;
    }

    const currentRoute = segments.join('/') || 'index';
    const userStatus = user ? `Connecté (${user.email})` : 'Non connecté';
    console.log('🛡️ AuthGuard - Route:', currentRoute, '| Utilisateur:', userStatus);

    const isAuthRoute = currentRoute.startsWith('auth');
    const isTabsRoute = currentRoute.startsWith('(tabs)') || currentRoute === 'index';
    const isClientRoute = currentRoute.startsWith('(client)');
    const isCoachRoute = currentRoute.startsWith('(coach)');

    // Vérification stricte : si pas d'utilisateur connecté
    if (!user) {
      if (!isAuthRoute) {
        console.log('🔄 Redirection vers /auth/login - Aucun utilisateur connecté');
        router.replace('/auth/login');
      }
      return;
    }

    // Si utilisateur connecté et sur une route auth, rediriger vers l'interface appropriée
    if (user && isAuthRoute) {
      const redirectPath = user.userType === 'coach' ? '/(coach)' : '/(client)';
      console.log('🔄 Redirection vers', redirectPath, '- Utilisateur connecté depuis auth');
      router.replace(redirectPath);
    } else if (user && isTabsRoute) {
      // Rediriger depuis les tabs vers l'interface utilisateur appropriée
      const redirectPath = user.userType === 'coach' ? '/(coach)' : '/(client)';
      console.log('🔄 Redirection vers', redirectPath, '- Utilisateur connecté depuis tabs');
      router.replace(redirectPath);
    } else {
      console.log('🛡️ AuthGuard - Aucune redirection nécessaire');
    }
  }, [user, segments, isLoading]);

  return <>{children}</>;
}