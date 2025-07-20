
import React, { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return; // Attendre que l'authentification soit initialisée

    const inAuthGroup = segments[0] === 'auth';
    const inClientGroup = segments[0] === '(client)';
    const inCoachGroup = segments[0] === '(coach)';
    const currentRoute = segments.join('/');

    // Log uniquement lors des changements d'état significatifs
    console.log('🛡️ AuthGuard - Route:', currentRoute, '| Utilisateur:', user?.email || 'Non connecté');

    if (!user) {
      // Utilisateur non connecté - rediriger vers l'authentification
      if (!inAuthGroup) {
        console.log('🔄 Redirection vers login');
        router.replace('/auth/login');
      }
    } else {
      // Utilisateur connecté - rediriger vers la bonne section
      if (inAuthGroup) {
        const targetRoute = user.userType === 'coach' ? '/(coach)/programmes' : '/(client)';
        console.log('🔄 Redirection utilisateur connecté vers:', targetRoute);
        router.replace(targetRoute);
      } else if (user.userType === 'coach' && !inCoachGroup) {
        console.log('🔄 Redirection coach vers sa section');
        router.replace('/(coach)/programmes');
      } else if (user.userType === 'client' && !inClientGroup) {
        console.log('🔄 Redirection client vers sa section');
        router.replace('/(client)');
      }
    }
  }, [user, isLoading, segments]);

  return <>{children}</>;
}
