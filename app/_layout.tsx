import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { router, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import SplashScreenComponent from '@/components/SplashScreen';
import { getCurrentUser, initializeAdminAccount } from '@/utils/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/config/firebase';

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
      console.log('Initialisation Firebase...');
      await initializeAdminAccount();

      // Observer les changements d'état d'authentification Firebase
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        try {
          if (firebaseUser) {
            const user = await getCurrentUser();
            if (user) {
              console.log('Redirection utilisateur connecté:', user.userType);
              if (user.userType === 'client') {
                router.replace('/(client)');
              } else {
                router.replace('/(coach)');
              }
            }
          } else {
            console.log('Aucun utilisateur Firebase, redirection vers login');
            router.replace('/auth/login');
          }
        } catch (error) {
          console.error('Erreur dans observer auth:', error);
          router.replace('/auth/login');
        } finally {
          setAuthChecked(true);
          setShowSplash(false);
        }
      });

      return unsubscribe;
    } catch (error) {
      console.error('Erreur initialisation Firebase:', error);
      setAuthChecked(true);
      setShowSplash(false);
      router.replace('/auth/login');
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