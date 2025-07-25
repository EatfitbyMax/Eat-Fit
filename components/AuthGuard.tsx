import React from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = router.pathname;

  React.useEffect(() => {
    if (isLoading) return;

    const currentRoute = pathname?.replace(/^\//, '') || '';
    const isAuthRoute = currentRoute.startsWith('auth/');
    const isClientRoute = currentRoute.startsWith('(client)');
    const isCoachRoute = currentRoute.startsWith('(coach)');

    console.log(`🛡️ AuthGuard - Route: ${currentRoute} | Utilisateur: ${user ? `Connecté (${user.email})` : 'Non connecté'}`);

    if (!user) {
      if (!isAuthRoute) {
        console.log('🔄 AuthGuard - Redirection vers /auth/login - Aucun utilisateur connecté');
        router.replace('/auth/login');
      } else {
        console.log('🛡️ AuthGuard - Déjà sur route auth, pas de redirection');
      }
      return;
    }

    if (isAuthRoute) {
      const targetRoute = user.userType === 'coach' ? '/(coach)' : '/(client)';
      console.log(`🔄 AuthGuard - Redirection vers ${targetRoute} - Utilisateur connecté depuis auth`);
      router.replace(targetRoute);
      return;
    }

    if (user.userType === 'client' && isCoachRoute) {
      console.log('🔄 AuthGuard - Redirection vers /(client) - Client sur route coach');
      router.replace('/(client)');
      return;
    }

    if (user.userType === 'coach' && isClientRoute) {
      console.log('🔄 AuthGuard - Redirection vers /(coach) - Coach sur route client');
      router.replace('/(coach)');
      return;
    }

    console.log('🛡️ AuthGuard - Aucune redirection nécessaire');
  }, [user, isLoading, pathname, router]);

  return <>{children}</>;
}