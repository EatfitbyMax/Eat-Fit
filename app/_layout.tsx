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

import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { StripeProvider } from '../utils/stripeWrapper';

import { useColorScheme } from '@/hooks/useColorScheme';
import { initializeAdminAccount, getCurrentUser } from '@/utils/auth';
import { migrateExistingData } from '@/utils/migration';
import { PersistentStorage } from '../utils/storage';
import SplashScreenComponent from '@/components/SplashScreen';
import { ThemeProvider } from '@/context/ThemeContext';
import { LanguageProvider } from '@/context/LanguageContext';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
      handleAuthCheck();
    }
  }, [loaded]);

  const handleAuthCheck = async () => {
    try {
      console.log('=== DÉBUT INITIALISATION ===');

      // Toute l'initialisation se fait pendant que le splash screen s'affiche
      console.log('Synchronisation avec le serveur VPS...');
      await PersistentStorage.syncData();

      console.log('Initialisation du compte admin...');
      await initializeAdminAccount();

      console.log('Migration des données existantes...');
      await migrateExistingData();

      console.log('Vérification de l\'utilisateur connecté...');
      const user = await getCurrentUser();

      console.log('=== FIN INITIALISATION ===');

      // Attendre que le splash screen termine son animation (6 secondes)
      setTimeout(() => {
        setIsInitializing(false);
        
        // Navigation directe après le splash
        setTimeout(() => {
          try {
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
          } catch (error) {
            console.error('Erreur navigation:', error);
            // Fallback
            setTimeout(() => {
              if (user) {
                router.push('/(client)');
              } else {
                router.push('/auth/login');
              }
            }, 500);
          }
        }, 100);
      }, 6000);

    } catch (error) {
      console.error('Erreur vérification auth:', error);
      // En cas d'erreur, terminer le splash et aller vers login
      setTimeout(() => {
        setIsInitializing(false);
        setTimeout(() => router.replace('/auth/login'), 100);
      }, 6000);
    }
  };

  if (!loaded || isInitializing) {
    return <SplashScreenComponent onFinish={() => {}} />;
  }

  return (
    <LanguageProvider>
      <ThemeProvider>
        <NavigationThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <StripeProvider
            publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_default'}
            merchantIdentifier="merchant.com.eatfitbymax" // Identifiant Apple Pay
          >
            <Stack>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="(client)" options={{ headerShown: false }} />
              <Stack.Screen name="(coach)" options={{ headerShown: false }} />
              <Stack.Screen name="auth" options={{ headerShown: false }} />
              <Stack.Screen name="+not-found" />
            </Stack>
          </StripeProvider>
        </NavigationThemeProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
}