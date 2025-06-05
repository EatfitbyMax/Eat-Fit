
import React from 'react';
import { Alert } from 'react-native';

// Gestion globale des erreurs non capturées
const handleUnhandledRejection = (event: any) => {
  console.error('Promesse non capturée:', event.reason);
  if (event.preventDefault) {
    event.preventDefault();
  }
};

// Ajouter le gestionnaire d'erreur si on est dans un environnement web
if (typeof window !== 'undefined' && window.addEventListener) {
  window.addEventListener('unhandledrejection', handleUnhandledRejection);
}

import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';

import { useColorScheme } from '@/hooks/useColorScheme';
import { initializeAdminAccount, getCurrentUser } from '@/utils/auth';
import { migrateExistingData } from '@/utils/migration';
import SplashScreenComponent from '@/components/SplashScreen';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  const [showSplash, setShowSplash] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  useEffect(() => {
    if (loaded && !authChecked && !isInitializing) {
      handleAuthCheck();
    }
  }, [loaded, authChecked, isInitializing]);

  const handleAuthCheck = async () => {
    if (isInitializing) return;
    
    setIsInitializing(true);
    try {
      console.log('=== DÉBUT INITIALISATION ===');
      
      // Initialisation rapide sans délai inutile
      console.log('Initialisation du compte admin...');
      await initializeAdminAccount();

      console.log('Migration des données existantes...');
      await migrateExistingData();

      console.log('Vérification de l\'utilisateur connecté...');
      const user = await getCurrentUser();

      console.log('=== FIN INITIALISATION ===');
      
      setAuthChecked(true);
      
      // Attendre un court délai pour l'animation du splash
      setTimeout(() => {
        setShowSplash(false);
        
        // Navigation après avoir caché le splash
        setTimeout(() => {
          if (user) {
            console.log('Redirection utilisateur connecté:', user.userType);
            if (user.userType === 'coach') {
              router.replace('/(coach)/programmes');
            } else {
              router.replace('/(client)');
            }
          } else {
            console.log('Aucun utilisateur, redirection vers login');
            router.replace('/auth/login');
          }
        }, 100);
      }, 2000); // Réduire le délai du splash à 2 secondes

    } catch (error) {
      console.error('Erreur vérification auth:', error);
      setAuthChecked(true);
      setShowSplash(false);
      setTimeout(() => {
        router.replace('/auth/login');
      }, 100);
    } finally {
      setIsInitializing(false);
    }
  };

  if (!loaded) {
    return null;
  }

  if (showSplash) {
    return <SplashScreenComponent onFinish={() => {}} />;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(client)" options={{ headerShown: false }} />
        <Stack.Screen name="(coach)" options={{ headerShown: false }} />
        <Stack.Screen name="auth" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
    </ThemeProvider>
  );
}
