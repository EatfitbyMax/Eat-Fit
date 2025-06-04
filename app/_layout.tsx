
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
            router.push('/(tabs)'); // Redirection vers la page de lancement qui contient les boutons
          }
        }, 300);
      }, 2000); // Réduire à 2 secondes
      
    } catch (error) {
      console.error('Erreur vérification auth:', error);
      setAuthChecked(true);
      setShowSplash(false);
      setTimeout(() => {
        router.push('/(tabs)'); // Redirection vers la page de lancement
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
