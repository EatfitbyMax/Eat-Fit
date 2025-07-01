
import { Stack } from 'expo-router';
import { RegistrationProvider } from '@/context/RegistrationContext';

export default function AuthLayout() {
  return (
    <RegistrationProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="forgot-password" />
        <Stack.Screen name="change-password" />
        <Stack.Screen name="register" />
        <Stack.Screen name="register-goals" />
        <Stack.Screen name="register-profile" />
        <Stack.Screen name="register-sport" />
        <Stack.Screen name="register-activity" />
        <Stack.Screen name="register-account" />
      </Stack>
    </RegistrationProvider>
  );
}
