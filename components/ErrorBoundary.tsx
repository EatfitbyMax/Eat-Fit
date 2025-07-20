
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ErrorRecovery from 'expo-error-recovery';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; resetError: () => void }>;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    console.log('🛡️ ErrorBoundary a capturé une erreur:', error.message);
    
    // Log des erreurs natives spécifiques
    if (error.message?.includes('Native module') || 
        error.message?.includes('RCT') ||
        error.message?.includes('NSException') ||
        error.message?.includes('abort()')) {
      console.error('🚨 ERREUR NATIVE DÉTECTÉE:', {
        message: error.message,
        stack: error.stack?.substring(0, 500),
        name: error.name
      });
    }
    
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.warn('🚨 Erreur capturée par ErrorBoundary:', {
      error: error.message,
      componentStack: errorInfo.componentStack?.substring(0, 200),
      errorInfo: errorInfo
    });

    // Vérifier si c'est une boucle d'erreurs
    const errorKey = error.message + error.stack?.substring(0, 100);
    const now = Date.now();
    const lastErrorTime = (global as any).__lastErrorTime || 0;
    const lastErrorKey = (global as any).__lastErrorKey || '';
    
    if (errorKey === lastErrorKey && (now - lastErrorTime) < 5000) {
      console.error('🚫 BOUCLE D\'ERREURS DÉTECTÉE - Arrêt récupération automatique');
      return;
    }
    
    (global as any).__lastErrorTime = now;
    (global as any).__lastErrorKey = errorKey;

    // Tentative de récupération avec expo-error-recovery (avec protection)
    if (ErrorRecovery && (error.message?.includes('Native module') || 
                         error.message?.includes('RCT'))) {
      console.log('🔄 Tentative de récupération d\'erreur native');
      setTimeout(() => {
        try {
          ErrorRecovery.recover();
        } catch (recoveryError) {
          console.error('❌ Échec récupération:', recoveryError);
        }
      }, 2000); // Délai plus long
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error} resetError={this.resetError} />;
      }

      return (
        <LinearGradient colors={['#1a1a1a', '#000000']} style={styles.container}>
          <View style={styles.content}>
            <Text style={styles.title}>Oups ! Une erreur s'est produite</Text>
            <Text style={styles.message}>
              L'application a rencontré un problème inattendu.
            </Text>
            <TouchableOpacity style={styles.button} onPress={this.resetError}>
              <Text style={styles.buttonText}>Réessayer</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    alignItems: 'center',
    maxWidth: 300,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#cccccc',
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 24,
  },
  button: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 25,
  },
  buttonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
