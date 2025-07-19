import React from 'react';
import { Alert, Platform } from 'react-native';

// Gestion globale des erreurs non capturées
const setupErrorHandling = () => {
  // Gestion des erreurs React Native
  const defaultHandler = ErrorUtils.getGlobalHandler && ErrorUtils.getGlobalHandler();
  
  ErrorUtils.setGlobalHandler((error, isFatal) => {
    const errorMessage = error?.message || error?.toString() || '';
    
    console.warn('🚨 Erreur interceptée:', {
      message: errorMessage,
      fatal: isFatal,
      stack: error?.stack?.substring(0, 200)
    });
    
    // Filtrer les erreurs connues qui ne doivent pas faire crash
    const ignoredErrors = [
      'react-native-health',
      'Apple Health',
      'HealthKit',
      'RNHealth',
      'expo.controller.errorRecoveryQueue',
      'Network request failed',
      'Load failed',
      'Request timeout'
    ];
    
    if (ignoredErrors.some(ignored => errorMessage.includes(ignored))) {
      console.warn('🍎 Erreur ignorée pour éviter le crash:', errorMessage);
      return;
    }
    
    // Ne pas faire crash pour les erreurs non fatales
    if (!isFatal) {
      console.warn('⚠️ Erreur non fatale ignorée:', errorMessage);
      return;
    }
    
    // Fallback seulement pour les erreurs vraiment critiques
    console.error('💥 Erreur fatale:', error);
    if (defaultHandler && __DEV__) {
      defaultHandler(error, isFatal);
    }
  });

  // Gestion améliorée des promesses rejetées
  const handleUnhandledRejection = (event: any) => {
    const reason = event?.reason || event;
    const reasonStr = reason?.message || reason?.toString() || 'Unknown';
    
    console.warn('🔄 Promesse rejetée interceptée:', reasonStr);
    
    // Ne jamais faire crash en production
    if (!__DEV__) {
      event?.preventDefault?.();
      return false;
    }
  };

  // Configuration cross-platform
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', (event) => {
      console.warn('🌐 Erreur web interceptée:', event.error?.message);
      if (!__DEV__) event.preventDefault();
    });
  } else if (typeof global !== 'undefined') {
    global.addEventListener?.('unhandledrejection', handleUnhandledRejection);
  }
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

      // Timeout global pour éviter les blocages
      const initTimeout = setTimeout(() => {
        if (!initializationComplete) {
          console.warn('⏰ Timeout initialisation - redirection forcée');
          setIsInitializing(false);
          setTimeout(() => router.replace('/auth/login'), 100);
        }
      }, 8000);

      // Initialisation en mode sécurisé
      const initPromises = [
        PersistentStorage.testConnection().catch(() => false),
        initializeAdminAccount().catch(() => null),
        migrateExistingData().catch(() => null),
        getCurrentUser().catch(() => null)
      ];

      const [, , , user] = await Promise.allSettled(initPromises);
      const currentUser = user.status === 'fulfilled' ? user.value : null;

      initializationComplete = true;
      clearTimeout(initTimeout);

      console.log('✅ Initialisation terminée');

      // Navigation sécurisée
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
            router.replace('/auth/login');
          }
        }, 100);
      }, 1500);

    } catch (error) {
      console.warn('🚨 Erreur initialisation:', error);
      initializationComplete = true;
      
      // Fallback sécurisé
      setTimeout(() => {
        setIsInitializing(false);
        setTimeout(() => router.replace('/auth/login'), 100);
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