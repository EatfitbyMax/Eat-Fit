import React from 'react';
import { Platform } from 'react-native';
import * as ErrorRecovery from 'expo-error-recovery';

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

import { DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { useColorScheme } from '@/hooks/useColorScheme';
import { initializeAdminAccount } from '@/utils/auth';
import { migrateExistingData } from '@/utils/migration';
import { PersistentStorage } from '../utils/storage';
import SplashScreenComponent from '@/components/ SplashScreen';
import { ThemeProvider } from '@/context/ThemeContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import AuthGuard from '@/components/AuthGuard';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { setupGlobalErrorHandlers } from '@/utils/errorHandlers';
import { purchaseManager } from '../utils/inAppPurchases';

// Stripe supprimé - utilisation des achats intégrés Apple uniquement

// Configuration du splash screen
SplashScreen.preventAutoHideAsync();

function AppNavigator() {
  const { isLoading, user } = useAuth();
  const [showSplash, setShowSplash] = React.useState(true);

  // Gérer la fin du splash screen
  const handleSplashFinish = () => {
    setShowSplash(false);
  };

  // Afficher le splash screen au démarrage
  if (showSplash) {
    return <SplashScreenComponent onFinish={handleSplashFinish} />;
  }

  // Afficher le loading si l'auth est en cours
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

   // Initialiser les achats intégrés
   useEffect(() => {
    const initializeIAP = async () => {
      if (Platform.OS === 'ios') {
        try {
          await purchaseManager.initialize();
          const mockMode = purchaseManager.isInMockMode() ? ' (MODE MOCK - Expo Go)' : ' (MODE NATIF - EAS Build)';
          console.log('✅ In-App Purchases initialisés' + mockMode);
        } catch (error: any) {
          console.warn('⚠️ Erreur lors de l\'initialisation des achats intégrés:', error.message);
        }
      } else {
        console.log('ℹ️ In-App Purchases non pris en charge sur cette plateforme.');
      }
    };

    initializeIAP();

    return () => {
      if (Platform.OS === 'ios') {
        purchaseManager.disconnect();
      }
    };
  }, []);

  if (!loaded) {
    return <SplashScreenComponent onFinish={() => {}} />;
  }

  return (
    <ErrorBoundary>
      <LanguageProvider>
        <ThemeProvider>
          <AuthProvider>
            <AppNavigator />
          </AuthProvider>
        </ThemeProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}