
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
      borderWidth: StyleSheet.hairlineWidth,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      shadowColor: theme.text,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3, // Pour Android
    },
    text: {
      color: theme.text,
      fontSize: 16,
      lineHeight: 24,
    },
    textSecondary: {
      color: theme.textSecondary,
      fontSize: 14,
      lineHeight: 20,
    },
    surface: {
      backgroundColor: theme.surface,
    },
    button: {
      backgroundColor: theme.primary,
      borderRadius: 8,
      padding: 16,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 48, // Taille minimum pour une bonne accessibilité
    },
    buttonText: {
      color: '#000000',
      fontWeight: '600',
      fontSize: 16,
      textAlign: 'center',
    },
    // Nouveaux styles pour mobile
    safeArea: {
      flex: 1,
      backgroundColor: theme.background,
    },
    scrollContainer: {
      flexGrow: 1,
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    touchableCard: {
      backgroundColor: theme.card,
      borderColor: theme.border,
      borderWidth: StyleSheet.hairlineWidth,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      shadowColor: theme.text,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
  });
};

export const getThemedStyles = (theme: ThemeColors) => ({
  colors: theme,
  styles: createThemedStyles(theme),
});
