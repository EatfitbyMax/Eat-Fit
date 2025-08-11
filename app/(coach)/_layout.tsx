import React from 'react';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { useAuth } from '@/context/AuthContext';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function CoachLayout() {
  // Vérifier si le contexte Auth est disponible
  let user, isLoading;
  try {
    const authContext = useAuth();
    user = authContext.user;
    isLoading = authContext.isLoading;
  } catch (error) {
    console.log('⚠️ AuthProvider non disponible dans CoachLayout');
    return null;
  }
  const colorScheme = useColorScheme();

  // Afficher un loader pendant le chargement
  if (isLoading) {
    return null;
  }

  // Vérification stricte : rediriger si pas connecté ou pas coach
  if (!user) {
    console.log('🚫 CoachLayout - Accès refusé: Aucun utilisateur connecté');
    return null;
  }

  if (user.userType !== 'coach') {
    console.log('🚫 CoachLayout - Accès refusé: Type utilisateur incorrect', user.userType);
    return null;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#FF6B6B',
        headerShown: false,
        tabBarStyle: Platform.select({
          ios: {
            position: 'absolute',
          },
          default: {},
        }),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="programmes"
        options={{
          title: 'Programmes',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="doc.text.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="clients"
        options={{
          title: 'Clients',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.2.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="message.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="rdv"
        options={{
          title: 'RDV',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="calendar" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profil"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.circle.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="creer-programme-nutrition"
        options={{
          href: null, // Cache cette page de la navigation
        }}
      />
      <Tabs.Screen
        name="creer-programme-sport"
        options={{
          href: null, // Cache cette page de la navigation
        }}
      />
    </Tabs>
  );
}