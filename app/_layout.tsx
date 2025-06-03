import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { getCurrentUser } from '@/utils/auth';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();

      // Vérifier si l'utilisateur est connecté au démarrage
      checkAuthStatus();
    }
  }, [loaded]);

  const checkAuthStatus = async () => {
    try {
      const user = await getCurrentUser();
      if (user) {
        // Rediriger selon le type d'utilisateur
        if (user.userType === 'coach') {
          router.replace('/(coach)/programmes');
        } else {
          router.replace('/client');
        }
      }
    } catch (error) {
      console.error('Erreur vérification auth:', error);
    }
  };

  if (!loaded) {
    return null;
  }

  return (
    <ThemeProvider value={DarkTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="client" />
        <Stack.Screen name="coach" />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="light" />
    </ThemeProvider>
  );
}