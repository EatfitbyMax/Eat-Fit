
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

    console.log('🛡️ AuthGuard - État:', {
      user: user?.email || 'Aucun',
      userType: user?.userType,
      segments,
      inAuthGroup,
      inClientGroup,
      inCoachGroup
    });

    if (!user) {
      // Utilisateur non connecté - rediriger vers l'authentification
      if (!inAuthGroup) {
        console.log('🔄 Redirection vers login (non connecté)');
        router.replace('/auth/login');
      }
    } else {
      // Utilisateur connecté - rediriger vers la bonne section
      if (inAuthGroup) {
        if (user.userType === 'coach') {
          console.log('🔄 Redirection coach vers programmes');
          router.replace('/(coach)/programmes');
        } else {
          console.log('🔄 Redirection client vers accueil');
          router.replace('/(client)');
        }
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
