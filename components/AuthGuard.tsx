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
    if (isLoading) return;

    const currentRoute = segments.join('/') || 'index';
    console.log('🛡️ AuthGuard - Route:', currentRoute, '| Utilisateur:', user ? 'Connecté' : 'Non connecté');

    const isAuthRoute = currentRoute.startsWith('auth');
    const isTabsRoute = currentRoute.startsWith('(tabs)') || currentRoute === 'index';
    const isClientRoute = currentRoute.startsWith('(client)');
    const isCoachRoute = currentRoute.startsWith('(coach)');

    if (!user && !isAuthRoute) {
      console.log('🔄 Redirection vers /auth/login - Aucun utilisateur connecté');
      router.replace('/auth/login');
    } else if (user && isAuthRoute) {
      // Rediriger selon le type d'utilisateur
      const redirectPath = user.userType === 'coach' ? '/(coach)' : '/(client)';
      console.log('🔄 Redirection vers', redirectPath, '- Utilisateur connecté');
      router.replace(redirectPath);
    } else if (user && isTabsRoute) {
      // Rediriger depuis les tabs vers l'interface utilisateur appropriée
      const redirectPath = user.userType === 'coach' ? '/(coach)' : '/(client)';
      console.log('🔄 Redirection vers', redirectPath, '- Depuis tabs');
      router.replace(redirectPath);
    }
  }, [user, segments, isLoading]);

  return <>{children}</>;
}