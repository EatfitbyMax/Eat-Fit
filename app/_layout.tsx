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
    const checkAuth = async () => {
      try {
        // Petite pause pour s'assurer que tout est chargé
        await new Promise(resolve => setTimeout(resolve, 100));

        await initializeAdminAccount();
        const user = await getCurrentUser();

        console.log('Utilisateur trouvé:', user);

        if (user) {
          // Utilisateur connecté, rediriger selon le type
          if (user.userType === 'coach') {
            console.log('Redirection vers coach');
            router.replace('/(coach)/programmes');
          } else {
            console.log('Redirection vers client');
            router.replace('/(client)/index');
          }
        } else {
          // Aucun utilisateur connecté, aller à l'écran de connexion
          console.log('Aucun utilisateur, redirection vers login');
          router.replace('/auth/login');
        }
      } catch (error) {
        console.error('Erreur vérification auth:', error);
        // En cas d'erreur, aller directement à l'écran de connexion
        router.replace('/auth/login');
      } finally {
        // S'assurer que le splash se ferme dans tous les cas
        setTimeout(() => {
          setShowSplash(false);
        }, 500);
      }
    };

    if (loaded) {
      const timer = setTimeout(() => {
        checkAuth();
      }, 2000); // 2 secondes d'animation

      return () => clearTimeout(timer);
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  if (showSplash) {
    return <SplashScreenComponent onFinish={() => setShowSplash(false)} />;
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