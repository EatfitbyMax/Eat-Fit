
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated/lib/reanimated2/NativeReanimated';
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

  // Initialize default accounts
  const initializeDefaultAccounts = async () => {
    console.log('Initialisation du compte admin...');
    
    try {
      // Vérifier si le compte admin existe
      const adminDocRef = doc(db, 'users', 'admin@eatfitbymax.com');
      const adminDoc = await getDoc(adminDocRef);
      
      if (!adminDoc.exists()) {
        await setDoc(adminDocRef, {
          email: 'admin@eatfitbymax.com',
          firstName: 'Max',
          lastName: 'Coach',
          userType: 'coach',
          speciality: 'Nutrition et Fitness',
          experience: '5 ans',
          certifications: ['Nutrition sportive', 'Personal trainer'],
          createdAt: new Date().toISOString()
        });
      }

      // Vérifier si le compte client existe
      const clientDocRef = doc(db, 'users', 'm.pacullmarquie@gmail.com');
      const clientDoc = await getDoc(clientDocRef);
      
      if (!clientDoc.exists()) {
        await setDoc(clientDocRef, {
          email: 'm.pacullmarquie@gmail.com',
          firstName: 'Martin',
          lastName: 'Pacull-Marquie',
          userType: 'client',
          age: 25,
          height: 180,
          weight: 75,
          activityLevel: 'Modérément actif',
          goals: ['Prise de masse musculaire', 'Amélioration des performances'],
          createdAt: new Date().toISOString()
        });
      }
      
      console.log('Comptes par défaut initialisés');
    } catch (error) {
      console.error('Erreur lors de l\'initialisation des comptes:', error);
    }
  };

  useEffect(() => {
    initializeDefaultAccounts();
  }, []);

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
