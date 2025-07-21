import { useEffect, useState, useRef } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { View, ActivityIndicator } from 'react-native';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const [isNavigating, setIsNavigating] = useState(false);
  const lastNavigationRef = useRef<string>('');
  const navigationTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (loading || isNavigating) return;

    const currentRoute = segments.join('/') || 'index';

    // Éviter les navigations répétées vers la même route
    if (lastNavigationRef.current === currentRoute) {
      return;
    }

    console.log('🛡️ AuthGuard - Route:', currentRoute, '| Utilisateur:', user ? 'Connecté' : 'Non connecté');

    // Routes d'authentification
    const authRoutes = ['auth/login', 'auth/register', 'auth/forgot-password', 'auth/change-password', 'auth/register-profile', 'auth/register-goals', 'auth/register-activity', 'auth/register-sport'];
    const isAuthRoute = authRoutes.some(route => currentRoute.includes(route));

    const navigate = (route: string, reason: string) => {
      if (lastNavigationRef.current === route) return;

      console.log('🔄 Redirection vers', route, '-', reason);
      setIsNavigating(true);
      lastNavigationRef.current = route;

      // Clear any existing timeout
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }

      router.replace(route as any);

      navigationTimeoutRef.current = setTimeout(() => {
        setIsNavigating(false);
        lastNavigationRef.current = '';
      }, 2000);
    };

    if (!user && !isAuthRoute) {
      navigate('/auth/login', 'Aucun utilisateur connecté');
    } else if (user && isAuthRoute) {
      navigate('/(client)', 'Utilisateur connecté');
    } else {
      // Reset navigation state si on est sur la bonne route
      lastNavigationRef.current = '';
    }
  }, [user, loading, segments.join('/')]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }
    };
  }, []);

  if (loading || isNavigating) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0D1117' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return <>{children}</>;
}