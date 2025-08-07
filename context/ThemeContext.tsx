
import React, { createContext, useContext, useState, useEffect } from 'react';
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
    loadThemeFromVPS();
  }, []);

  const loadThemeFromVPS = async () => {
    try {
      const { PersistentStorage } = await import('../utils/storage');
      const { getCurrentUser } = await import('../utils/auth');
      const currentUser = await getCurrentUser();
      
      if (currentUser?.id) {
        const preferences = await PersistentStorage.getAppPreferences(currentUser.id);
        if (preferences.theme === 'dark' || preferences.theme === 'light') {
          setIsDarkMode(preferences.theme === 'dark');
          console.log('✅ Thème chargé depuis VPS:', preferences.theme);
        } else {
          // Utiliser le thème système si pas de préférence sur VPS
          setIsDarkMode(systemColorScheme === 'dark');
          console.log('📱 Thème système utilisé:', systemColorScheme === 'dark' ? 'dark' : 'light');
        }
      } else {
        // Utiliser le thème système si pas d'utilisateur connecté
        setIsDarkMode(systemColorScheme === 'dark');
        console.log('📱 Thème système utilisé (pas connecté):', systemColorScheme === 'dark' ? 'dark' : 'light');
      }
    } catch (error) {
      console.error('❌ Erreur chargement thème depuis VPS:', error);
      // Utiliser le thème système en cas d'erreur
      setIsDarkMode(systemColorScheme === 'dark');
    }
  };

  const saveThemeToVPS = async (isDark: boolean) => {
    try {
      const { PersistentStorage } = await import('../utils/storage');
      const { getCurrentUser } = await import('../utils/auth');
      const currentUser = await getCurrentUser();
      
      if (currentUser?.id) {
        const preferences = await PersistentStorage.getAppPreferences(currentUser.id);
        preferences.theme = isDark ? 'dark' : 'light';
        await PersistentStorage.saveAppPreferences(currentUser.id, preferences);
        console.log('✅ Thème synchronisé avec VPS:', preferences.theme);
      } else {
        console.warn('⚠️ Utilisateur non connecté - thème non sauvegardé sur VPS');
      }
    } catch (error) {
      console.error('❌ Erreur sauvegarde thème sur VPS:', error);
      // Le thème reste changé localement même si la sync VPS échoue
    }
  };

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    saveThemeToVPS(newTheme);
  };

  const setTheme = (isDark: boolean) => {
    setIsDarkMode(isDark);
    saveThemeToVPS(isDark);
  };

  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, isDarkMode, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
