
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';

import { useColorScheme } from '@/hooks/useColorScheme';
import { initializeAdminAccount, getCurrentUser } from '@/utils/auth';
import SplashScreenComponent from '@/components/SplashScreen';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  const [showSplash, setShowSplash] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  useEffect(() => {
    if (loaded && !authChecked) {
      handleAuthCheck();
    }
  }, [loaded, authChecked]);

  const handleAuthCheck = async () => {
    try {
      // Délai pour l'animation du splash screen
      setTimeout(async () => {
        console.log('Initialisation du compte admin...');
        await initializeAdminAccount();

        console.log('Vérification de l\'utilisateur connecté...');
        const user = await getCurrentUser();

        setAuthChecked(true);
        setShowSplash(false);

        // Petit délai pour que l'animation se termine
        setTimeout(() => {
          if (user) {
            console.log('Redirection utilisateur connecté:', user.userType);
            if (user.userType === 'coach') {
              router.replace('/(coach)/programmes');
            } else {
              router.replace('/(client)');
            }
          } else {
            console.log('Aucun utilisateur, redirection vers login');
            router.replace('/auth/login');
          }
        }, 300);
      }, 3000); // 3 secondes d'animation du splash

    } catch (error) {
      console.error('Erreur vérification auth:', error);
      setAuthChecked(true);
      setShowSplash(false);
      setTimeout(() => {
        router.replace('/auth/login');
      }, 300);
    }
  };

  if (!loaded) {
    return null;
  }

  if (showSplash) {
    return <SplashScreenComponent onFinish={() => {}} />;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(client)" options={{ headerShown: false }} />
        <Stack.Screen name="(coach)" options={{ headerShown: false }} />
        <Stack.Screen name="auth" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
    </ThemeProvider>
  );
}
