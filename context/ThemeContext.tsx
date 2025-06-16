
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
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  useEffect(() => {
    loadThemePreference();
  }, []);

  useEffect(() => {
    if (isInitialized) return;
    setIsDarkMode(systemColorScheme === 'dark');
  }, [systemColorScheme, isInitialized]);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme_preference');
      if (savedTheme !== null) {
        setIsDarkMode(savedTheme === 'dark');
      } else {
        // Si pas de préférence sauvegardée, utiliser le thème système
        setIsDarkMode(systemColorScheme === 'dark');
      }
      setIsInitialized(true);
    } catch (error) {
      console.error('Erreur lors du chargement des préférences de thème:', error);
      setIsInitialized(true);
    }
  };

  const saveThemePreference = async (isDark: boolean) => {
    try {
      await AsyncStorage.setItem('theme_preference', isDark ? 'dark' : 'light');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des préférences de thème:', error);
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
