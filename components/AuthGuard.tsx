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

    // Si pas d'utilisateur connecté
    if (!user) {
      // Rediriger vers login sauf si déjà sur une route auth
      if (!isAuthRoute) {
        console.log('🔄 Redirection vers /auth/login - Aucun utilisateur connecté');
        router.replace('/auth/login');
      } else {
        console.log('🛡️ AuthGuard - Déjà sur une route auth, pas de redirection');
      }
      return;
    }

    // Si utilisateur connecté
    if (user) {
      if (isAuthRoute) {
        // Rediriger depuis les pages auth vers l'interface appropriée
        const redirectPath = user.userType === 'coach' ? '/(coach)' : '/(client)';
        console.log('🔄 Redirection vers', redirectPath, '- Utilisateur connecté depuis auth');
        router.replace(redirectPath);
      } else if (isTabsRoute) {
        // Rediriger depuis les tabs vers l'interface utilisateur appropriée
        const redirectPath = user.userType === 'coach' ? '/(coach)' : '/(client)';
        console.log('🔄 Redirection vers', redirectPath, '- Utilisateur connecté depuis tabs');
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
        console.log('🛡️ AuthGuard - Accès autorisé');
      }
    }
  }, [user, segments, isLoading, router]);

  return <>{children}</>;
}