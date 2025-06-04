
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { router, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import SplashScreenComponent from '@/components/SplashScreen';
import { getCurrentUser, initializeAdminAccount } from '@/utils/auth';

// Prevent the native splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
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
      // Délai pour l'animation du splash screen
      const timer = setTimeout(() => {
        handleAuthCheck();
      }, 3000); // 3 secondes d'animation

      return () => clearTimeout(timer);
    }
  }, [loaded, authChecked]);

  const handleAuthCheck = async () => {
    try {
      console.log('Initialisation du compte admin...');
      await initializeAdminAccount();
      
      console.log('Vérification de l\'utilisateur connecté...');
      const user = await getCurrentUser();
      
      console.log('Utilisateur trouvé:', user);

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
      }, 500);
      
    } catch (error) {
      console.error('Erreur vérification auth:', error);
      setAuthChecked(true);
      setShowSplash(false);
      setTimeout(() => {
        router.replace('/auth/login');
      }, 500);
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
