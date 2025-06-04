import { Stack } from 'expo-router';
import React from 'react';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0D1117' } }}>
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="register" options={{ headerShown: false }} />
      <Stack.Screen name="register-profile" options={{ headerShown: false }} />
      <Stack.Screen name="register-goals" options={{ headerShown: false }} />
      <Stack.Screen name="register-activity" options={{ headerShown: false }} />
      <Stack.Screen name="register-account" options={{ headerShown: false }} />
    </Stack>
  );
}