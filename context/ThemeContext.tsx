
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';

export interface ThemeColors {
  background: string;
  surface: string;
  primary: string;
  secondary: string;
  text: string;
  textSecondary: string;
  border: string;
  success: string;
  warning: string;
  error: string;
  card: string;
  accent: string;
}

export const lightTheme: ThemeColors = {
  background: '#FFFFFF',
  surface: '#F8F9FA',
  primary: '#F5A623',
  secondary: '#6C757D',
  text: '#212529',
  textSecondary: '#6C757D',
  border: '#DEE2E6',
  success: '#28A745',
  warning: '#FFC107',
  error: '#DC3545',
  card: '#FFFFFF',
  accent: '#007BFF',
};

export const darkTheme: ThemeColors = {
  background: '#0D1117',
  surface: '#161B22',
  primary: '#F5A623',
  secondary: '#8B949E',
  text: '#FFFFFF',
  textSecondary: '#8B949E',
  border: '#21262D',
  success: '#238636',
  warning: '#D29922',
  error: '#F85149',
  card: '#161B22',
  accent: '#1F6FEB',
};

interface ThemeContextType {
  theme: ThemeColors;
  isDarkMode: boolean;
  toggleTheme: () => void;
  setTheme: (isDark: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState<boolean>(systemColorScheme === 'dark');

  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      // Charger les préférences depuis le serveur uniquement
      const { PersistentStorage } = await import('../utils/storage');
      const currentUser = await PersistentStorage.getCurrentUser();
      
      if (currentUser?.id) {
        try {
          const preferences = await PersistentStorage.getAppPreferences(currentUser.id);
          setIsDarkMode(preferences.theme === 'dark');
          console.log('✅ Thème chargé depuis le serveur VPS:', preferences.theme);
        } catch (prefsError) {
          console.warn('⚠️ Erreur chargement préférences, utilisation du thème système');
          setIsDarkMode(systemColorScheme === 'dark');
        }
      } else {
        // Si pas d'utilisateur connecté, utiliser le thème système
        setIsDarkMode(systemColorScheme === 'dark');
        console.log('📱 Utilisation du thème système:', systemColorScheme);
      }
    } catch (error) {
      console.warn('⚠️ Erreur initialisation thème, utilisation du thème système');
      setIsDarkMode(systemColorScheme === 'dark');
    }
  };

  const saveThemePreference = async (isDark: boolean) => {
    try {
      // Synchroniser uniquement avec le serveur VPS
      const { PersistentStorage } = await import('../utils/storage');
      const currentUser = await PersistentStorage.getCurrentUser();
      if (currentUser?.id) {
        try {
          // Récupérer les préférences actuelles depuis le serveur
          const preferences = await PersistentStorage.getAppPreferences(currentUser.id);
          preferences.theme = isDark ? 'dark' : 'light';
          // Sauvegarder sur le serveur uniquement
          await PersistentStorage.saveAppPreferences(currentUser.id, preferences);
          console.log('✅ Thème synchronisé avec le serveur VPS');
        } catch (saveError) {
          console.warn('⚠️ Impossible de sauvegarder le thème sur le serveur, changement appliqué localement');
          // Ne pas lancer d'erreur, juste appliquer le changement localement
        }
      }
    } catch (error) {
      console.warn('⚠️ Erreur synchronisation thème serveur, changement appliqué localement');
      // Ne pas lancer d'erreur pour ne pas bloquer l'interface utilisateur
    }
  };

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    saveThemePreference(newTheme);
  };

  const setTheme = (isDark: boolean) => {
    setIsDarkMode(isDark);
    saveThemePreference(isDark);
  };

  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, isDarkMode, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
