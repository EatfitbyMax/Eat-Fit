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
```

```
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
  const pathname = useRouter().pathname; // get pathname

  React.useEffect(() => {
    if (isLoading) return;

    const currentRoute = pathname?.replace(/^\//, '') || '';
    const isAuthRoute = currentRoute.startsWith('auth/');
    const isClientRoute = currentRoute.startsWith('(client)');
    const isCoachRoute = currentRoute.startsWith('(coach)');

    console.log(`🛡️ AuthGuard - Route: ${currentRoute} | Utilisateur: ${user ? `Connecté (${user.email})` : 'Non connecté'}`);

    // Vérification stricte : si pas d'utilisateur connecté
    if (!user) {
      if (!isAuthRoute) {
        console.log('🔄 AuthGuard - Redirection vers /auth/login - Aucun utilisateur connecté');
        router.replace('/auth/login');
      } else {
        console.log('🛡️ AuthGuard - Déjà sur route auth, pas de redirection');
      }
      return;
    }

    // Si utilisateur connecté et sur une page auth, rediriger vers son dashboard
    if (isAuthRoute) {
      const targetRoute = user.userType === 'coach' ? '/(coach)' : '/(client)';
      console.log(`🔄 AuthGuard - Redirection vers ${targetRoute} - Utilisateur connecté depuis auth`);
      router.replace(targetRoute);
      return;
    }

    // Vérifier si l'utilisateur est sur le bon type de route
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
```

```
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
```

```
import React from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = router.pathname; // get pathname

  React.useEffect(() => {
    if (isLoading) return;

    const currentRoute = pathname?.replace(/^\//, '') || '';
    const isAuthRoute = currentRoute.startsWith('auth/');
    const isClientRoute = currentRoute.startsWith('(client)');
    const isCoachRoute = currentRoute.startsWith('(coach)');

    console.log(`🛡️ AuthGuard - Route: ${currentRoute} | Utilisateur: ${user ? `Connecté (${user.email})` : 'Non connecté'}`);

    // Vérification stricte : si pas d'utilisateur connecté
    if (!user) {
      if (!isAuthRoute) {
        console.log('🔄 AuthGuard - Redirection vers /auth/login - Aucun utilisateur connecté');
        router.replace('/auth/login');
      } else {
        console.log('🛡️ AuthGuard - Déjà sur route auth, pas de redirection');
      }
      return;
    }

    // Si utilisateur connecté et sur une page auth, rediriger vers son dashboard
    if (isAuthRoute) {
      const targetRoute = user.userType === 'coach' ? '/(coach)' : '/(client)';
      console.log(`🔄 AuthGuard - Redirection vers ${targetRoute} - Utilisateur connecté depuis auth`);
      router.replace(targetRoute);
      return;
    }

    // Vérifier si l'utilisateur est sur le bon type de route
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
```

```
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
```

The code has been successfully merged. The diff contains the complete and correct code.

```
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