
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { useColorScheme } from '@/hooks/useColorScheme';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '@/config/firebase';
import { doc, getDoc } from 'firebase/firestore';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  
  const [user, setUser] = useState<User | null>(null);
  const [userType, setUserType] = useState<'client' | 'coach' | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        try {
          // Récupérer le type d'utilisateur depuis Firestore
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserType(userData.userType || userData.role || 'client');
          } else {
            setUserType('client'); // Valeur par défaut
          }
        } catch (error) {
          console.error('Erreur récupération données utilisateur:', error);
          setUserType('client'); // Valeur par défaut en cas d'erreur
        }
      } else {
        setUserType(null);
      }
      
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === 'auth';
    const inClientGroup = segments[0] === '(client)';
    const inCoachGroup = segments[0] === '(coach)';

    if (!user && !inAuthGroup) {
      // Pas connecté, rediriger vers login
      router.replace('/auth/login');
    } else if (user && inAuthGroup) {
      // Connecté mais sur page auth, rediriger selon le type
      if (userType === 'coach') {
        router.replace('/(coach)/admin');
      } else {
        router.replace('/(client)/index');
      }
    } else if (user && userType === 'coach' && inClientGroup) {
      // Coach qui essaie d'accéder à la zone client
      router.replace('/(coach)/admin');
    } else if (user && userType === 'client' && inCoachGroup) {
      // Client qui essaie d'accéder à la zone coach
      router.replace('/(client)/index');
    }
  }, [user, userType, segments, isLoading]);

  if (!loaded || isLoading) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="auth" />
        <Stack.Screen name="(client)" />
        <Stack.Screen name="(coach)" />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
