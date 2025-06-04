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
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Vérification de l\'utilisateur connecté...');

      if (user) {
        console.log('Utilisateur trouvé:', user.email);
        setUser(user);

        // Récupérer le profil utilisateur depuis Firestore avec l'UID
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            console.log('Profil utilisateur trouvé:', userDoc.data());
            setUserProfile(userDoc.data());
          } else {
            console.log('Aucun profil trouvé pour cet utilisateur');
            setUserProfile(null);
          }
        } catch (error) {
          console.error('Erreur lors de la récupération du profil:', error);
          setUserProfile(null);
        }
      } else {
        console.log('Aucun utilisateur connecté');
        setUser(null);
        setUserProfile(null);
      }

      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!isLoading) {
      const inAuthGroup = segments[0] === 'auth';

      if (!user && !inAuthGroup) {
        console.log('Aucun utilisateur, redirection vers login');
        router.replace('/auth/login');
      } else if (user && inAuthGroup && userProfile) {
        // Rediriger vers la bonne section selon le type d'utilisateur
        console.log('Utilisateur connecté, type:', userProfile.userType || userProfile.role);
        if (userProfile.userType === 'coach' || userProfile.role === 'coach') {
          router.replace('/(coach)/programmes');
        } else {
          router.replace('/(client)');
        }
      }
    }
  }, [user, segments, isLoading, userProfile]);

  useEffect(() => {
    if (loaded && !isLoading) {
      SplashScreen.hideAsync();
    }
  }, [loaded, isLoading]);

  if (!loaded || isLoading) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="(client)" />
        <Stack.Screen name="(coach)" />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}