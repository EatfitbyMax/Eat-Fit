import React from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading) {
      if (!user && !pathname.includes('/auth/')) {
        console.log('🔄 Redirection vers login depuis AuthGuard - pathname:', pathname);
        router.replace('/auth/login');
      } else if (user && pathname.includes('/auth/')) {
        console.log('🔄 Redirection vers accueil depuis AuthGuard - user:', user.email);
        router.replace('/(client)');
      }
    }
  }, [user, isLoading, pathname, router]);

  // Afficher un écran de chargement pendant la vérification
  if (isLoading) {
    return <SplashScreen />;
  }

  // Si pas d'utilisateur et on n'est pas sur une page d'auth, ne rien afficher
  // (la redirection va se faire)
  if (!user && !pathname.includes('/auth/')) {
    return <SplashScreen />;
  }

  return <>{children}</>;
}