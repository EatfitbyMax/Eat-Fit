
import { StyleSheet } from 'react-native';
import { ThemeColors } from '@/context/ThemeContext';

export const createThemedStyles = (theme: ThemeColors) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    card: {
      backgroundColor: theme.card,
      borderColor: theme.border,
      borderWidth: 1,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
    },
    text: {
      color: theme.text,
    },
    textSecondary: {
      color: theme.textSecondary,
    },
    surface: {
      backgroundColor: theme.surface,
    },
    button: {
      backgroundColor: theme.primary,
      borderRadius: 8,
      padding: 12,
      alignItems: 'center',
    },
    buttonText: {
      color: '#000000',
      fontWeight: 'bold',
    },
  });
};

export const getThemedStyles = (theme: ThemeColors) => ({
  colors: theme,
  styles: createThemedStyles(theme),
});
