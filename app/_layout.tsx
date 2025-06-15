import React from 'react';

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

import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';

import { useColorScheme } from '@/hooks/useColorScheme';
import { initializeAdminAccount, getCurrentUser } from '@/utils/auth';
import { migrateExistingData } from '@/utils/migration';
import { PersistentStorage } from '../utils/storage';
import SplashScreenComponent from '@/components/SplashScreen';
import { ThemeProvider as CustomThemeProvider } from '@/context/ThemeContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { useBiometric } from '@/hooks/useBiometric';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const [isInitialized, setIsInitialized] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [needsBiometricAuth, setNeedsBiometricAuth] = useState(false);
  const { authenticate, requiresAuthentication, loadBiometricSettings } = useBiometric();

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  useEffect(() => {
    if (loaded && !authChecked && !isInitializing) {
      handleAuthCheck();
    }
  }, [loaded, authChecked, isInitializing]);

  const handleAuthCheck = async () => {
    if (isInitializing) return;

    setIsInitializing(true);

    // D'abord lancer l'initialisation en arrière-plan
    const initPromise = (async () => {
      try {
        console.log('=== DÉBUT INITIALISATION ===');

        // Initialisation en arrière-plan pendant que le splash s'affiche
        console.log('Synchronisation avec le serveur VPS...');
        try {
          await PersistentStorage.syncData();
        } catch (syncError) {
          console.warn('Impossible de synchroniser avec le serveur VPS, utilisation des données locales:', syncError);
        }

        console.log('Initialisation du compte admin...');
        await initializeAdminAccount();

        console.log('Migration des données existantes...');
        await migrateExistingData();

        console.log('Vérification de l\'utilisateur connecté...');
        const user = await getCurrentUser();

        if (user) {
          console.log('Utilisateur connecté trouvé:', user.email);

          // Charger les paramètres biométriques et vérifier si l'auth est requise
          try {
            await loadBiometricSettings();
            if (requiresAuthentication()) {
              setNeedsBiometricAuth(true);
              setIsInitializing(false);
              return user;
            }
          } catch (biometricError) {
            console.warn('Erreur chargement paramètres biométriques:', biometricError);
          }
        } else {
          console.log('Aucun utilisateur connecté');
        }

        console.log('=== FIN INITIALISATION ===');
        return user;
      } catch (error) {
        console.error('Erreur vérification auth:', error);
        // En cas d'erreur, on continue quand même pour ne pas bloquer l'app
        return null;
      }
    })();

    // Attendre minimum 3 secondes pour le splash screen (réduction pour meilleure UX)
    const [user] = await Promise.all([
      initPromise,
      new Promise(resolve => setTimeout(resolve, 3000))
    ]);

    setAuthChecked(true);
    setShowSplash(false);

    // Navigation après avoir caché le splash
    setTimeout(() => {
      try {
        if (user && !needsBiometricAuth) {
          console.log('Redirection utilisateur connecté:', user.userType);
          if (user.userType === 'coach') {
            router.replace('/(coach)/programmes');
          } else {
            router.replace('/(client)');
          }
        } else if (!needsBiometricAuth) {
          console.log('Aucun utilisateur, redirection vers login');
          router.replace('/auth/login');
        }
      } catch (error) {
        console.error('Erreur navigation:', error);
        // Fallback robuste
        setTimeout(() => {
          try {
            if (user && !needsBiometricAuth) {
              router.push('/(client)');
            } else if (!needsBiometricAuth) {
              router.push('/auth/login');
            }
          } catch (fallbackError) {
            console.error('Erreur navigation fallback:', fallbackError);
            // Dernier fallback : forcer la navigation
            if (typeof window !== 'undefined') {
              window.location.href = user ? '/(client)' : '/auth/login';
            }
          }
        }, 1000);
      }
    }, 300);

    setIsInitializing(false);
  };

  const handleBiometricAuth = async () => {
    try {
      const success = await authenticate('Authentifiez-vous pour accéder à l\'application');
      if (success) {
        setNeedsBiometricAuth(false);
        setIsInitializing(true);
      } else {
        Alert.alert(
          'Authentification requise',
          'Vous devez vous authentifier pour accéder à l\'application.',
          [
            { text: 'Réessayer', onPress: handleBiometricAuth },
            { text: 'Fermer l\'app', onPress: () => {} }
          ]
        );
      }
    } catch (error) {
      console.error('Erreur authentification biométrique:', error);
      setIsInitializing(true);
    }
  };

  if (!loaded || (!isInitialized && !needsBiometricAuth)) {
    return null;
  }

  if (needsBiometricAuth) {
    return (
      <View style={styles.biometricContainer}>
        <Text style={styles.biometricTitle}>EatFitByMax</Text>
        <Text style={styles.biometricSubtitle}>Authentification requise</Text>
        <TouchableOpacity style={styles.biometricButton} onPress={handleBiometricAuth}>
          <Text style={styles.biometricButtonText}>🔐 S'authentifier</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (showSplash) {
    return <SplashScreenComponent onFinish={() => {}} />;
  }

  return (
    <LanguageProvider>
      <CustomThemeProvider>
        <NavigationThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="(client)" options={{ headerShown: false }} />
            <Stack.Screen name="(coach)" options={{ headerShown: false }} />
            <Stack.Screen name="auth" options={{ headerShown: false }} />
            <Stack.Screen name="+not-found" />
          </Stack>
        </NavigationThemeProvider>
      </CustomThemeProvider>
    </LanguageProvider>
  );
}

const styles = StyleSheet.create({
  biometricContainer: {
    flex: 1,
    backgroundColor: '#0D1117',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  biometricTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  biometricSubtitle: {
    fontSize: 16,
    color: '#8B949E',
    marginBottom: 40,
    textAlign: 'center',
  },
  biometricButton: {
    backgroundColor: '#F5A623',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 20,
  },
  biometricButtonText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '600',
  },
});