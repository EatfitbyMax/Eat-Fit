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
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    if (loaded && !isNavigating) {
      // Délai pour l'animation du splash screen
      const splashTimer = setTimeout(() => {
        handleNavigation();
      }, 3000); // 3 secondes d'animation

      return () => clearTimeout(splashTimer);
    }
  }, [loaded, isNavigating]);

  const handleNavigation = async () => {
    if (isNavigating) return; // Empêcher les appels multiples
    
    setIsNavigating(true);
    
    try {
      console.log('Initialisation du compte admin...');
      await initializeAdminAccount();
      
      console.log('Vérification de l\'utilisateur connecté...');
      const user = await getCurrentUser();
      
      console.log('Utilisateur trouvé:', user);

      // Masquer le splash screen
      setShowSplash(false);
      
      // Petit délai pour que le splash se ferme proprement
      setTimeout(() => {
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
      }, 200);
      
    } catch (error) {
      console.error('Erreur vérification auth:', error);
      setShowSplash(false);
      setTimeout(() => {
        router.replace('/auth/login');
      }, 200);
    }
  };

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