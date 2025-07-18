import React from 'react';
import { Alert, Platform } from 'react-native';

// Gestion globale des erreurs non capturées
const setupErrorHandling = () => {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Promesse non capturée:', event.reason);
      // En production, on peut envoyer l'erreur à un service de monitoring
      if (__DEV__) {
        Alert.alert('Erreur', 'Une erreur inattendue s\'est produite');
      }
      event.preventDefault();
    };
    
    const handleError = (event: ErrorEvent) => {
      console.error('Erreur globale:', event.error);
      if (__DEV__) {
        Alert.alert('Erreur', `Erreur: ${event.error?.message || 'Inconnue'}`);
      }
    };
    
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);
    
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }
  return () => {};
};

setupErrorHandling();

import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';

import { useColorScheme } from '@/hooks/useColorScheme';
import { initializeAdminAccount, getCurrentUser } from '@/utils/auth';
import { migrateExistingData } from '@/utils/migration';
import { PersistentStorage } from '../utils/storage';
import SplashScreenComponent from '@/components/SplashScreen';
import { ThemeProvider } from '@/context/ThemeContext';
import { LanguageProvider } from '@/context/LanguageContext';

// Import conditionnel de Stripe uniquement sur mobile
let StripeProvider: any = null;
if (Platform.OS !== 'web') {
  try {
    const stripe = require('@stripe/stripe-react-native');
    StripeProvider = stripe.StripeProvider;
  } catch (error) {
    console.warn('Stripe non disponible:', error);
  }
}

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

      // Initialisation avec timeout pour éviter les crashes
      try {
        // Test de connexion avec timeout
        const connectionPromise = PersistentStorage.testConnection().catch(() => {
          console.warn('Serveur VPS non disponible, mode hors ligne activé');
          return false;
        });

        // Timeout de 10 secondes pour éviter les blocages
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Timeout')), 10000);
        });

        await Promise.race([connectionPromise, timeoutPromise]).catch(() => {
          console.warn('Connexion VPS échouée, continuons en mode hors ligne');
        });

        // Initialisation admin avec gestion d'erreur
        await initializeAdminAccount().catch(error => {
          console.warn('Initialisation admin échouée:', error);
          return null;
        });

        // Migration avec gestion d'erreur
        await migrateExistingData().catch(error => {
          console.warn('Migration échouée:', error);
          return null;
        });

        console.log('Vérification de l\'utilisateur connecté...');
        const user = await getCurrentUser();

        console.log('=== FIN INITIALISATION ===');

        // Réduire le délai pour une meilleure UX (2 secondes)
        const minSplashTime = 2000;
        setTimeout(() => {
          setIsInitialized(true);
        }, minSplashTime);

      } catch (error) {
        console.error('Erreur lors de l\'initialisation:', error);
        // Continuer même en cas d'erreur pour éviter le crash
        setTimeout(() => {
          setIsInitialized(true);
        }, 1000);
      }alizing(false);

        // Navigation immédiate après le splash
        setTimeout(() => {
          try {
            if (user?.userType === 'coach') {
              console.log('Redirection coach:', user.userType);
              router.replace('/(coach)/programmes');
            } else if (user?.userType === 'client') {
              console.log('Redirection client:', user.userType);
              router.replace('/(client)');
            } else {
              console.log('Aucun utilisateur valide, redirection vers login');
              router.replace('/auth/login');
            }
          } catch (error) {
            console.error('Erreur navigation:', error);
            // Fallback robuste
            router.replace('/auth/login');
          }
        }, 50);
      }, minSplashTime);

    } catch (error) {
      console.error('Erreur critique lors de l\'initialisation:', error);
      // En cas d'erreur critique, aller directement vers login
      setTimeout(() => {
        setIsInitializing(false);
        setTimeout(() => router.replace('/auth/login'), 50);
      }, 2000);
    }
  };

  // Gestion des erreurs globales (supprimé car déjà géré plus haut)

  if (!loaded || isInitializing) {
    return <SplashScreenComponent onFinish={() => {}} />;
  }

  const StackContent = () => (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(client)" options={{ headerShown: false }} />
      <Stack.Screen name="(coach)" options={{ headerShown: false }} />
      <Stack.Screen name="auth" options={{ headerShown: false }} />
      <Stack.Screen name="+not-found" />
    </Stack>
  );

  return (
    <LanguageProvider>
      <ThemeProvider>
        <NavigationThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          {Platform.OS !== 'web' && StripeProvider && process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ? (
            <StripeProvider
              publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY}
              merchantIdentifier="merchant.com.eatfitbymax"
            >
              <StackContent />
            </StripeProvider>
          ) : (
            <StackContent />
          )}
        </NavigationThemeProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
}