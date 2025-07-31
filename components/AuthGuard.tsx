import React from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { user, isLoading, isLoggingOut } = useAuth();
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

    // VÉRIFICATION DOUBLE: S'assurer que l'utilisateur n'est pas null/undefined
    if (!user || !user.email || !user.userType) {
      console.log('🚫 Utilisateur invalide détecté, redirection vers login');
      router.replace('/auth/login');
      return;
    }

    // Si utilisateur connecté ET VALIDE, gérer les redirections normales
    if (user && user.email && user.userType) {
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
      } else if (!isClientRoute && !isCoachRoute && user.userType) {
        // Si l'utilisateur est sur une route non protégée, rediriger vers sa section
        const redirectPath = user.userType === 'coach' ? '/(coach)' : '/(client)';
        console.log('🔄 Redirection utilisateur connecté vers', redirectPath, '- Route actuelle:', currentRoute);
        router.replace(redirectPath);
      } else {
        console.log('🛡️ AuthGuard - Accès autorisé pour utilisateur connecté');
      }
    }

    
  }, [user, segments, isLoading, isLoggingOut, router]);

  // AuthGuard ne fait que gérer la navigation - AuthContext gère déjà l'authentification

  return <>{children}</>;
}