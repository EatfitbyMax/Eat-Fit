import React from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { user } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  React.useEffect(() => {
    const currentRoute = segments.join('/') || 'index';
    console.log('🛡️ AuthGuard - Route:', currentRoute, '| Utilisateur:', user ? 'Connecté' : 'Non connecté');

    const isAuthRoute = currentRoute.startsWith('auth');
    const isTabsRoute = currentRoute.startsWith('(tabs)') || currentRoute === 'index';

    if (!user && !isAuthRoute) {
      console.log('🔄 Redirection vers', '/auth/login', '-', 'Aucun utilisateur connecté');
      router.replace('/auth/login');
    } else if (user && (isAuthRoute || isTabsRoute)) {
      console.log('🔄 Redirection vers', '/(client)', '-', 'Utilisateur connecté');
      router.replace('/(client)');
    }
  }, [user, segments]);

  return <>{children}</>;
}