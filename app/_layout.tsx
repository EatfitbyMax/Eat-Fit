
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
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { useColorScheme } from '@/hooks/useColorScheme';
import { initializeAdminAccount } from '@/utils/auth';
import { migrateExistingData } from '@/utils/migration';
import { PersistentStorage } from '../utils/storage';
import { SplashScreenComponent } from '@/components/SplashScreen';
import { ThemeProvider } from '@/context/ThemeContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import AuthGuard from '@/components/AuthGuard';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { setupGlobalErrorHandlers } from '@/utils/errorHandlers';

// Import conditionnel sécurisé de Stripe
let StripeProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>;

try {
  if (Platform.OS === 'web') {
    // Sur le web, utiliser le mock Stripe pour éviter les erreurs
    const StripeMock = require('@/utils/stripe-web-mock');
    StripeProvider = StripeMock.StripeProvider;
  } else {
    // Sur mobile, utiliser le vrai Stripe si disponible
    const { StripeProvider: RealStripeProvider } = require('@stripe/stripe-react-native');
    StripeProvider = RealStripeProvider;
  }
} catch (error) {
  console.log('⚠️ Stripe non disponible, utilisation du fallback');
}

// Configuration du splash screen
SplashScreen.preventAutoHideAsync();

function AppNavigator() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return <SplashScreenComponent onFinish={() => {}} />;
  }

  return (
    <AuthGuard>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(client)" />
        <Stack.Screen name="(coach)" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="+not-found" options={{ headerShown: true, title: 'Page non trouvée' }} />
      </Stack>
    </AuthGuard>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

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
    }
  }, [loaded]);

  if (!loaded) {
    return <SplashScreenComponent onFinish={() => {}} />;
  }

  const navigationTheme = colorScheme === 'dark' ? DarkTheme : DefaultTheme;

  return (
    <ErrorBoundary>
      <LanguageProvider>
        <ThemeProvider>
          <AuthProvider>
            <StripeProvider 
              publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_mock_key'}
              merchantIdentifier="merchant.com.eatfitbymax.app"
            >
              <NavigationThemeProvider value={navigationTheme}>
                <AppNavigator />
              </NavigationThemeProvider>
            </StripeProvider>
          </AuthProvider>
        </ThemeProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}
