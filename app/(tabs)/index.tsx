
import React from 'react';
import { Redirect } from 'expo-router';

export default function TabsIndex() {
  // Redirection vers l'application client principale
  return <Redirect href="/(client)" />;
}
