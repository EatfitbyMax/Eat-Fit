
import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="register-goals" />
      <Stack.Screen name="register-profile" />
      <Stack.Screen name="register-activity" />
      <Stack.Screen name="register-account" />
    </Stack>
  );
}
