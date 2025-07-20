import React from 'react';
import { Platform } from 'react-native';

console.log('🍎 App démarré en mode standalone');

import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { useColorScheme } from '@/hooks/useColorScheme';
import { initializeAdminAccount } from '@/utils/auth';
import { migrateExistingData } from '@/utils/migration';
import { PersistentStorage } from '../utils/storage';
import SplashScreenComponent from '@/components/SplashScreen';
import { ThemeProvider } from '@/context/ThemeContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { AuthGuard } from '@/components/AuthGuard';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { setupGlobalErrorHandlers } from '@/utils/errorHandlers';

// Import conditionnel de Stripe pour iOS/Android uniquement
let StripeProvider: any = null;
const STRIPE_ENABLED = Platform.OS !== 'web' && Platform.OS !== 'macos';

if (STRIPE_ENABLED) {
  try {
    const stripe = require('@stripe/stripe-react-native');
    StripeProvider = stripe.StripeProvider;
    console.log('✅ Stripe chargé pour', Platform.OS);
  } catch (error) {
    console.warn('⚠️ Stripe non disponible pour', Platform.OS, ':', error?.message);
    StripeProvider = null;
  }
}

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function AppNavigator() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return <SplashScreenComponent onFinish={() => {}} />;
  }

  return (
    <AuthGuard>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(client)" options={{ headerShown: false }} />
        <Stack.Screen name="(coach)" options={{ headerShown: false }} />
        <Stack.Screen name="auth" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
    </AuthGuard>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  // Configurer les gestionnaires d'erreurs au démarrage (mode simplifié)
  useEffect(() => {
    try {
      // Configuration minimale pour éviter les conflits
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        setupGlobalErrorHandlers();
        console.log('✅ Gestionnaires d\'erreurs initialisés');
      }
    } catch (error) {
      console.warn('⚠️ Erreur initialisation gestionnaires:', error?.message);
    }
  }, []);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return <SplashScreenComponent onFinish={() => {}} />;
  }

  const AppWrapper = () => {
    if (StripeProvider && STRIPE_ENABLED && process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
      return (
        <StripeProvider
          publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY}
          merchantIdentifier="merchant.com.eatfitbymax"
        >
          <AppNavigator />
        </StripeProvider>
      );
    }
    return <AppNavigator />;
  };

  return (
    <ErrorBoundary>
      <LanguageProvider>
        <ThemeProvider>
          <AuthProvider>
            <NavigationThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
              <AppWrapper />
            </NavigationThemeProvider>
          </AuthProvider>
        </ThemeProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}