import React from 'react';
import { Redirect } from 'expo-router';

export default function TabsIndex() {
  // Redirection immédiate vers l'authentification
  return <Redirect href="/auth/login" />;
}