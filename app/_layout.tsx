import React, { useEffect } from 'react';
import { useFonts } from 'expo-font';
import '../expo-go-config'; // Configuration Expo Go
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';

// Imports conditionnels pour éviter les erreurs Expo Go
let AuthProvider: any;
let ThemeProvider: any;
let LanguageProvider: any;
let RegistrationProvider: any;
let ErrorBoundary: any;

try {
  const AuthModule = require('@/context/AuthContext');
  AuthProvider = AuthModule.AuthProvider;
  
  const ThemeModule = require('@/context/ThemeContext');
  ThemeProvider = ThemeModule.ThemeProvider;
  
  const LanguageModule = require('@/context/LanguageContext');
  LanguageProvider = LanguageModule.LanguageProvider;
  
  const RegistrationModule = require('@/context/RegistrationContext');
  RegistrationProvider = RegistrationModule.RegistrationProvider;
  
  const ErrorBoundaryModule = require('@/components/ErrorBoundary');
  ErrorBoundary = ErrorBoundaryModule.default;
} catch (error) {
  console.warn('⚠️ Erreur lors du chargement des contexts:', error);
  // Fallback components
  AuthProvider = ({ children }: any) => children;
  ThemeProvider = ({ children }: any) => children;
  LanguageProvider = ({ children }: any) => children;
  RegistrationProvider = ({ children }: any) => children;
  ErrorBoundary = ({ children }: any) => children;
}

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <RegistrationProvider>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="auth" options={{ headerShown: false }} />
                <Stack.Screen name="(client)" options={{ headerShown: false }} />
                <Stack.Screen name="(coach)" options={{ headerShown: false }} />
                <Stack.Screen name="+not-found" />
              </Stack>
              <StatusBar style="auto" />
            </RegistrationProvider>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}