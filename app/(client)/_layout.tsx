import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function ClientLayout() {
  const colorScheme = useColorScheme();

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
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol size={28} name={focused ? 'house.fill' : 'house'} color={color} />
          ),
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
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol size={28} name={focused ? 'dumbbell.fill' : 'dumbbell'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="progres"
        options={{
          title: 'Progrès',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol size={28} name={focused ? 'chart.bar.fill' : 'chart.bar'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profil"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol size={28} name={focused ? 'person.fill' : 'person'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="coach"
        options={{
          href: null, // Cache cet onglet car c'est juste une page de redirection
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
    </Tabs>
  );
}