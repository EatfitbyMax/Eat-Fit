import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { getCurrentUser, initializeAdminAccount } from '@/utils/auth';
import SplashScreenComponent from '@/components/SplashScreen';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
      // Initialiser le compte admin dès le chargement
      initializeAdminAccount();
    }
  }, [loaded]);

  const handleSplashFinish = async () => {
    try {
      const user = await getCurrentUser();
      if (user) {
        // Rediriger selon le type d'utilisateur connecté
        if (user.userType === 'coach') {
          router.replace('/(coach)/programmes');
        } else {
          router.replace('/(client)');
        }
      } else {
        // Aucun utilisateur connecté, aller à l'écran d'accueil
        router.replace('/(tabs)');
      }
    } catch (error) {
      console.error('Erreur vérification auth:', error);
      router.replace('/(tabs)');
    } finally {
      setShowSplash(false);
    }
  };

  if (!loaded) {
    return null;
  }

  if (showSplash) {
    return <SplashScreenComponent onFinish={handleSplashFinish} />;
  }

  return (
    <ThemeProvider value={DarkTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="(client)" />
        <Stack.Screen name="(coach)" />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="light" />
    </ThemeProvider>
  );
}