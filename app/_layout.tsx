import React from 'react';
import { Platform } from 'react-native';

// AUCUN gestionnaire d'erreurs personnalisé pour éviter les crashes
console.log('🍎 App démarré sans gestionnaires d\'erreurs personnalisés');

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
import { ErrorBoundary } from '@/components/ErrorBoundary';

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
      console.log('🚀 Initialisation ultra-sécurisée...');

      // Timeout très court pour éviter les blocages
      const timeoutDuration = 3000; // 3 secondes seulement
      const initTimeout = setTimeout(() => {
        if (!initializationComplete) {
          console.warn('⏰ Timeout - redirection forcée');
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

      // Initialisation minimale
      let currentUser = null;
      try {
        console.log('🔄 Mode minimal absolu');
        currentUser = await getCurrentUser().catch(() => null);
      } catch (initError) {
        console.warn('Erreur initialisation:', initError);
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
        }, 300);
      }, 500);

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
    <ErrorBoundary>
      <LanguageProvider>
        <ThemeProvider>
          <NavigationThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <AppWrapper />
          </NavigationThemeProvider>
        </ThemeProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}