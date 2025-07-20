import React from 'react';
import { Platform } from 'react-native';
import * as ErrorRecovery from 'expo-error-recovery';

// Gestionnaire d'erreurs natives avec expo-error-recovery
console.log('🍎 App démarré avec gestionnaires d\'erreurs sécurisés');

// Gestion des erreurs natives non gérées
if (ErrorRecovery) {
  ErrorRecovery.setRecoveryProps({
    recoveryText: 'Redémarrer l\'application',
    onRecover: () => {
      console.log('🔄 Récupération d\'erreur native');
      ErrorRecovery.recover();
    }
  });
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
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { setupGlobalErrorHandlers } from '@/utils/errorHandlers';

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

  // Configurer les gestionnaires d'erreurs au démarrage
  useEffect(() => {
    try {
      setupGlobalErrorHandlers();
      console.log('✅ Gestionnaires d\'erreurs initialisés');
    } catch (error) {
      console.warn('⚠️ Erreur initialisation gestionnaires:', error);
    }
  }, []);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
      
      // Délai pour éviter les conflits au démarrage
      const initTimer = setTimeout(() => {
        handleAuthCheck();
      }, 200);
      
      return () => clearTimeout(initTimer);
    }
  }, [loaded]);

  const handleAuthCheck = async () => {
    try {
      console.log('🚀 Initialisation stabilisée...');

      // Délai initial pour éviter les conflicts de navigation
      await new Promise(resolve => setTimeout(resolve, 500));

      // Protection contre les boucles infinies
      const MAX_RETRIES = 1;
      let retryCount = 0;

      const performInit = async () => {
        try {
          // Vérification utilisateur avec timeout court
          const userPromise = getCurrentUser();
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('User check timeout')), 2000)
          );

          const currentUser = await Promise.race([userPromise, timeoutPromise]).catch(() => null);
          
          console.log('✅ Vérification utilisateur terminée');
          
          // Terminer l'initialisation AVANT la navigation
          setIsInitializing(false);
          
          // Navigation différée pour éviter les conflits
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Navigation unique et sécurisée
          if (currentUser?.userType === 'coach') {
            router.replace('/(coach)/programmes');
          } else if (currentUser?.userType === 'client') {
            router.replace('/(client)');
          } else {
            router.replace('/auth/login');
          }
          
        } catch (initError) {
          console.warn('Erreur initialisation:', initError);
          
          if (retryCount < MAX_RETRIES) {
            retryCount++;
            console.log(`🔄 Tentative ${retryCount}/${MAX_RETRIES}`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            return performInit();
          } else {
            // Dernière chance - navigation de secours
            setIsInitializing(false);
            await new Promise(resolve => setTimeout(resolve, 100));
            router.replace('/auth/login');
          }
        }
      };

      await performInit();

    } catch (error) {
      console.error('🚨 Erreur critique initialisation:', error);
      
      // Dernière ligne de défense
      setIsInitializing(false);
      setTimeout(() => {
        router.replace('/auth/login');
      }, 200);
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