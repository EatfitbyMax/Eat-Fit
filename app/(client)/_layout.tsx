import React, { useState, useEffect } from 'react';
import { Tabs, usePathname } from 'expo-router';
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

  // Fonction pour déterminer si nous sommes sur une page liée à l'entraînement
  const isTrainingRelated = (currentPath: string) => {
    const trainingPaths = [
      '/(client)/entrainement',
      '/(client)/creer-entrainement',
      '/(client)/gerer-entrainements'
    ];
    return trainingPaths.some(path => currentPath.includes(path.replace('/(client)/', '')));
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0D1117',
          borderTopColor: '#21262D',
        },
        tabBarActiveTintColor: '#F5A623',
        tabBarInactiveTintColor: '#8B949E',
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ color, focused }) => {
            const isOnHomePage = pathname === '/(client)' || pathname === '/(client)/index' || pathname === '/';
            const isOnProgressPage = pathname.includes('/progres');
            const isOnFormePage = pathname.includes('/forme');
            const isActive = focused || isOnHomePage || isOnProgressPage || isOnFormePage;
            return (
              <IconSymbol 
                size={28} 
                name={isActive ? 'house.fill' : 'house'} 
                color={isActive ? '#F5A623' : color} 
              />
            );
          },
          tabBarLabelStyle: (() => {
            const isOnHomePage = pathname === '/(client)' || pathname === '/(client)/index' || pathname === '/';
            const isOnProgressPage = pathname.includes('/progres');
            const isOnFormePage = pathname.includes('/forme');
            const isActive = isOnHomePage || isOnProgressPage || isOnFormePage;
            return {
              color: isActive ? '#F5A623' : '#8B949E',
            };
          })(),
        }}
      />
      <Tabs.Screen
        name="nutrition"
        options={{
          title: 'Nutrition',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol size={28} name={focused ? 'fork.knife' : 'fork.knife'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="entrainement"
        options={{
          title: 'Entrainement',
          tabBarIcon: ({ color }) => {
            const isActive = pathname === '/(client)/entrainement' || isTrainingRelated(pathname);
            return (
              <IconSymbol 
                size={28} 
                name={isActive ? 'dumbbell.fill' : 'dumbbell'} 
                color={isActive ? '#F5A623' : color} 
              />
            );
          },
          tabBarLabelStyle: (() => {
            const isActive = pathname === '/(client)/entrainement' || isTrainingRelated(pathname);
            return {
              color: isActive ? '#F5A623' : '#8B949E',
            };
          })(),
        }}
      />
      <Tabs.Screen
        name="coach"
        options={{
          title: 'Coach',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol size={28} name={focused ? 'crown.fill' : 'crown'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profil"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, focused }) => {
            const isActive = focused || 
              pathname.includes('informations-personnelles') || 
              pathname.includes('parametres-application') ||
              pathname.includes('securite-confidentialite') ||
              pathname.includes('aide-feedback');
            return (
              <IconSymbol 
                size={28} 
                name={isActive ? 'person.fill' : 'person'} 
                color={isActive ? '#F5A623' : color} 
              />
            );
          },
          tabBarLabelStyle: (() => {
            const isActive = pathname.includes('informations-personnelles') || 
              pathname.includes('profil') || 
              pathname.includes('parametres-application') ||
              pathname.includes('securite-confidentialite') ||
              pathname.includes('aide-feedback');
            return {
              color: isActive ? '#F5A623' : '#8B949E',
            };
          })(),
        }}
      />
      <Tabs.Screen
        name="progres"
        options={{
          href: null, // Cache cette page de la navigation
        }}
      />
      <Tabs.Screen
        name="forme"
        options={{
          href: null, // Cache cette page de la navigation
        }}
      />
      <Tabs.Screen
        name="informations-personnelles"
        options={{
          href: null, // Cache cette page de la navigation
        }}
      />
      <Tabs.Screen
        name="mes-objectifs"
        options={{
          href: null, // Cache cette page de la navigation
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          href: null, // Cache cette page de la navigation
        }}
      />
      <Tabs.Screen
        name="parametres-application"
        options={{
          href: null, // Cache cette page de la navigation
        }}
      />
      <Tabs.Screen
        name="securite-confidentialite"
        options={{
          href: null, // Cache cette page de la navigation
        }}
      />
      <Tabs.Screen
        name="aide-feedback"
        options={{
          href: null, // Cache cette page de la navigation
        }}
      />
      <Tabs.Screen
        name="creer-entrainement"
        options={{
          href: null, // Cache cette page de la navigation
        }}
      />
      <Tabs.Screen
        name="gerer-entrainements"
        options={{
          href: null, // Cache cette page de la navigation
        }}
      />
    </Tabs>
  );
}