import React, { useState, useEffect } from 'react';
import { Stack, usePathname } from 'expo-router';
import { Platform } from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { checkSubscriptionStatus } from '@/utils/subscription';
import { useAuth } from '@/context/AuthContext';

export default function ClientLayout() {
  const { user, isLoading } = useAuth();
  const colorScheme = useColorScheme();
  const [hasSubscription, setHasSubscription] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    checkUserSubscription();
  }, []);

  const checkUserSubscription = async () => {
    const subscriptionStatus = await checkSubscriptionStatus();
    setHasSubscription(subscriptionStatus);
  };

  // Afficher un loader pendant le chargement
  if (isLoading) {
    return null;
  }

  // Vérification stricte : rediriger si pas connecté ou pas client
  if (!user) {
    console.log('🚫 ClientLayout - Accès refusé: Aucun utilisateur connecté');
    return null;
  }

  if (user.userType !== 'client') {
    console.log('🚫 ClientLayout - Accès refusé: Type utilisateur incorrect', user.userType);
    return null;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Accueil' }} />
      <Stack.Screen name="coach" options={{ title: 'Coach' }}/>
      <Stack.Screen name="entrainement" options={{ title: 'Entrainement' }} />
      <Stack.Screen name="forme" options={{ title: 'Forme' }}/>
      <Stack.Screen name="nutrition" options={{ title: 'Nutrition' }}/>
      <Stack.Screen name="profil" options={{ title: 'Profil' }}/>
      <Stack.Screen name="progres" options={{ title: 'Progres' }}/>
      <Stack.Screen name="aide-feedback" options={{ title: 'Aide Feedback' }}/>
      <Stack.Screen name="creer-entrainement" options={{ title: 'Creer Entrainement' }}/>
      <Stack.Screen name="gerer-entrainements" options={{ title: 'Gerer Entrainements' }}/>
      <Stack.Screen name="informations-personnelles" options={{ title: 'Informations Personnelles' }}/>
      <Stack.Screen name="mes-objectifs" options={{ title: 'Mes Objectifs' }}/>
      <Stack.Screen name="notifications" options={{ title: 'Notifications' }}/>
      <Stack.Screen name="parametres-application" options={{ title: 'Parametres Application' }}/>
      <Stack.Screen name="securite-confidentialite" options={{ title: 'Securite Confidentialite' }}/>
    </Stack>
  );
}