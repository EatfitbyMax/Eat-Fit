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
      console.log('Démarrage unique de l\'initialisation');
      handleAuthCheck();
    }
  }, [loaded]);

  const handleAuthCheck = async () => {
    if (isInitializing) {
      console.log('Initialisation déjà en cours, arrêt');
      return;
    }

    console.log('=== DÉBUT INITIALISATION UNIQUE ===');
    setIsInitializing(true);

    try {
      // Synchronisation avec timeout
      console.log('Synchronisation avec le serveur VPS...');
      try {
        await PersistentStorage.syncData();
      } catch (syncError) {
        console.warn('Serveur VPS non accessible, mode local');
      }

      // Initialisation des données
      await initializeAdminAccount();
      await migrateExistingData();

      // Vérification utilisateur
      const user = await getCurrentUser();
      
      if (user) {
        console.log('Utilisateur trouvé:', user.email);
        // Vérifier l'authentification biométrique
        try {
          await loadBiometricSettings();
          if (requiresAuthentication()) {
            setNeedsBiometricAuth(true);
            setShowSplash(false);
            setAuthChecked(true);
            setIsInitializing(false);
            return;
          }
        } catch (biometricError) {
          console.warn('Erreur biométrie:', biometricError);
        }
      }

      // Attendre le splash minimum
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setShowSplash(false);
      setAuthChecked(true);

      // Navigation après un délai
      setTimeout(() => {
        if (user && !needsBiometricAuth) {
          console.log('Redirection:', user.userType);
          if (user.userType === 'coach') {
            router.replace('/(coach)/programmes');
          } else {
            router.replace('/(client)');
          }
        } else if (!needsBiometricAuth) {
          console.log('Redirection vers login');
          router.replace('/auth/login');
        }
      }, 100);

    } catch (error) {
      console.error('Erreur initialisation:', error);
      setShowSplash(false);
      setAuthChecked(true);
      router.replace('/auth/login');
    } finally {
      setIsInitializing(false);
      console.log('=== FIN INITIALISATION ===');
    }
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