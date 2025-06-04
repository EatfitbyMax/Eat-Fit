
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
    if (!auth) {
      console.error('Auth non initialisé');
      setIsLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('État auth changé:', firebaseUser ? 'connecté' : 'déconnecté');
      setUser(firebaseUser);
      
      if (firebaseUser && db) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const type = userData.userType || userData.role || 'client';
            console.log('Type utilisateur trouvé:', type);
            setUserType(type);
          } else {
            console.log('Document utilisateur non trouvé, type par défaut: client');
            setUserType('client');
          }
        } catch (error) {
          console.error('Erreur récupération données utilisateur:', error);
          setUserType('client');
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

    console.log('Navigation - User:', !!user, 'Type:', userType, 'Segments:', segments);

    if (!user && !inAuthGroup) {
      console.log('Redirection vers login');
      router.replace('/auth/login');
    } else if (user && userType && inAuthGroup) {
      console.log('Redirection après connexion vers:', userType);
      if (userType === 'coach') {
        router.replace('/(coach)/admin');
      } else {
        router.replace('/(client)/index');
      }
    } else if (user && userType === 'coach' && inClientGroup) {
      console.log('Coach redirigé vers zone coach');
      router.replace('/(coach)/admin');
    } else if (user && userType === 'client' && inCoachGroup) {
      console.log('Client redirigé vers zone client');
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
