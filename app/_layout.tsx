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

      // Initialisation simplifiée et plus robuste
      try {
        await PersistentStorage.testConnection();
        console.log('Connexion serveur OK');
      } catch (error) {
        console.warn('Mode hors ligne activé');
      }

      try {
        await initializeAdminAccount();
        console.log('Admin initialisé');
      } catch (error) {
        console.warn('Admin non initialisé:', error.message);
      }

      try {
        await migrateExistingData();
        console.log('Migration terminée');
      } catch (error) {
        console.warn('Migration échouée:', error.message);
      }

      let user = null;
      try {
        user = await getCurrentUser();
        console.log('Utilisateur trouvé:', user?.userType);
      } catch (error) {
        console.warn('Aucun utilisateur connecté');
      }

      console.log('=== FIN INITIALISATION ===');

      // Délai réduit et navigation sécurisée
      setTimeout(() => {
        setIsInitializing(false);
        
        setTimeout(() => {
          try {
            if (user?.userType === 'coach') {
              router.replace('/(coach)/programmes');
            } else if (user?.userType === 'client') {
              router.replace('/(client)');
            } else {
              router.replace('/auth/login');
            }
          } catch (navError) {
            console.error('Erreur navigation, fallback vers login');
            router.replace('/auth/login');
          }
        }, 100);
      }, 2000);

    } catch (criticalError) {
      console.error('Erreur critique:', criticalError);
      setIsInitializing(false);
      setTimeout(() => {
        router.replace('/auth/login');
      }, 1000);
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