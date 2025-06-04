import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { useColorScheme } from '@/hooks/useColorScheme';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '@/config/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

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

  // Les comptes seront créés manuellement via l'interface de connexion

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Vérification de l\'utilisateur connecté...');

      if (user) {
        console.log('Utilisateur trouvé:', user.email);
        setUser(user);

        // Récupérer le profil utilisateur depuis Firestore
        try {
          const userDocRef = doc(db, 'users', user.email!);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            setUserProfile(userDoc.data());
          }
        } catch (error) {
          console.error('Erreur lors de la récupération du profil:', error);
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
      } else if (user && inAuthGroup) {
        // Rediriger vers la bonne section selon le type d'utilisateur
        if (userProfile?.userType === 'coach') {
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
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="auth" options={{ headerShown: false }} />
        <Stack.Screen name="(client)" options={{ headerShown: false }} />
        <Stack.Screen name="(coach)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}