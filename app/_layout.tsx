import React from 'react';
import { Platform } from 'react-native';

// Configuration sécurisée pour iOS
const setupErrorHandling = () => {
  try {
    // Désactiver complètement les gestionnaires d'erreurs personnalisés sur iOS
    if (Platform.OS === 'ios') {
      console.log('🍎 Gestionnaires d\'erreurs désactivés sur iOS pour stabilité');
      return;
    }

    // Gestionnaire minimal pour les autres plateformes
    if (typeof ErrorUtils !== 'undefined' && ErrorUtils.setGlobalHandler) {
      ErrorUtils.setGlobalHandler((error, isFatal) => {
        console.warn('⚠️ Erreur silencieuse:', error?.message?.substring(0, 50) || 'Inconnue');
        // Ne jamais faire crash l'application
        return;
      });
    }

    // Gestion des promesses uniquement sur web
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.addEventListener('unhandledrejection', (event) => {
        console.warn('🔄 Promesse rejetée (web)');
        event.preventDefault();
      });
    }
  } catch (setupError) {
    console.warn('Erreur setup minimal:', setupError);
  }
};

// Exécuter le setup seulement si nécessaire
if (Platform.OS !== 'ios') {
  setupErrorHandling();
}

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

// Import conditionnel sécurisé de Stripe
let StripeProvider: any = null;
const STRIPE_ENABLED = Platform.OS !== 'web' && process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;

if (STRIPE_ENABLED) {
  try {
    const stripe = require('@stripe/stripe-react-native');
    StripeProvider = stripe.StripeProvider;
    console.log('✅ Stripe chargé');
  } catch (error) {
    console.warn('⚠️ Stripe non disponible:', error);
    StripeProvider = null;
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
    let initializationComplete = false;

    try {
      console.log('🚀 Initialisation sécurisée...');

      // Timeout plus court sur iOS pour éviter les blocages
      const timeoutDuration = Platform.OS === 'ios' ? 5000 : 8000;
      const initTimeout = setTimeout(() => {
        if (!initializationComplete) {
          console.warn('⏰ Timeout initialisation - redirection forcée');
          initializationComplete = true;
          setIsInitializing(false);
          setTimeout(() => {
            try {
              router.replace('/auth/login');
            } catch (e) {
              console.warn('Erreur navigation de secours');
            }
          }, 100);
        }
      }, timeoutDuration);

      // Initialisation ultra-sécurisée pour iOS
      let currentUser = null;
      try {
        if (Platform.OS === 'ios') {
          // Mode minimal pour iOS
          console.log('🍎 Initialisation iOS minimale');
          currentUser = await getCurrentUser().catch(() => null);
        } else {
          // Initialisation complète pour les autres plateformes
          const initPromises = [
            PersistentStorage.testConnection().catch(() => false),
            initializeAdminAccount().catch(() => null),
            migrateExistingData().catch(() => null),
            getCurrentUser().catch(() => null)
          ];

          const results = await Promise.allSettled(initPromises);
          currentUser = results[3].status === 'fulfilled' ? results[3].value : null;
        }
      } catch (initError) {
        console.warn('Erreur initialisation critique:', initError);
        currentUser = null;
      }

      initializationComplete = true;
      clearTimeout(initTimeout);

      console.log('✅ Initialisation terminée');

      // Navigation ultra-sécurisée
      setTimeout(() => {
        setIsInitializing(false);

        setTimeout(() => {
          try {
            if (currentUser?.userType === 'coach') {
              router.replace('/(coach)/programmes');
            } else if (currentUser?.userType === 'client') {
              router.replace('/(client)');
            } else {
              router.replace('/auth/login');
            }
          } catch (navError) {
            console.warn('Erreur navigation:', navError);
            try {
              router.replace('/auth/login');
            } catch (fallbackError) {
              console.warn('Erreur navigation de secours');
            }
          }
        }, Platform.OS === 'ios' ? 200 : 100);
      }, Platform.OS === 'ios' ? 1000 : 1500);

    } catch (error) {
      console.warn('🚨 Erreur initialisation:', error);
      initializationComplete = true;

      // Fallback ultra-sécurisé
      setTimeout(() => {
        setIsInitializing(false);
        setTimeout(() => {
          try {
            router.replace('/auth/login');
          } catch (e) {
            console.warn('Erreur fallback navigation');
          }
        }, 100);
      }, 500);
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

  const AppWrapper = () => {
    if (StripeProvider && STRIPE_ENABLED) {
      return (
        <StripeProvider
          publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY!}
          merchantIdentifier="merchant.com.eatfitbymax"
        >
          <StackContent />
        </StripeProvider>
      );
    }
    return <StackContent />;
  };

  return (
    <LanguageProvider>
      <ThemeProvider>
        <NavigationThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <AppWrapper />
        </NavigationThemeProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
}