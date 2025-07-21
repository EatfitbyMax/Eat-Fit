import React, { useEffect, useState } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import SplashScreenComponent from './SplashScreen';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const [hasRedirected, setHasRedirected] = useState(false);

  console.log('🛡️ AuthGuard - Route:', segments.join('/'), '| Utilisateur:', user ? 'Connecté' : 'Non connecté');

  useEffect(() => {
    if (isLoading || hasRedirected) return;

    const inAuthGroup = segments[0] === 'auth';
    const inClientGroup = segments[0] === '(client)';
    const inCoachGroup = segments[0] === '(coach)';
    const inTabsGroup = segments[0] === '(tabs)';
    const currentPath = segments.join('/');

    if (!user) {
      // Utilisateur non connecté
      if (!inAuthGroup && currentPath !== 'auth/login') {
        console.log('🔄 Redirection vers login');
        setHasRedirected(true);
        router.replace('/auth/login');
      }
    } else {
      // Utilisateur connecté
      if (inAuthGroup) {
        console.log('🔄 Redirection vers app principal');
        setHasRedirected(true);
        const targetRoute = user.userType === 'coach' ? '/(coach)/profil' : '/(client)';
        router.replace(targetRoute);
      }
    }
  }, [user, isLoading, segments, hasRedirected]);

  // Reset hasRedirected when user changes
  useEffect(() => {
    setHasRedirected(false);
  }, [user?.id]);

  if (isLoading) {
    return <SplashScreenComponent />;
  }

  return <>{children}</>;
}