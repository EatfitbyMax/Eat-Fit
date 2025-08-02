import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as ErrorRecovery from 'expo-error-recovery';
import { LinearGradient } from 'expo-linear-gradient';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  recoveryAttempts: number;
}

export class ErrorBoundary extends Component<Props, State> {
  private maxRecoveryAttempts = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      recoveryAttempts: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.log('🛡️ ErrorBoundary a capturé une erreur:', error.message);
    console.log('📋 Infos erreur:', errorInfo.componentStack);

    this.setState({
      error,
      errorInfo,
    });

    // Tentative de récupération automatique si pas trop d'essais
    if (this.state.recoveryAttempts < this.maxRecoveryAttempts) {
      console.log('🔄 Tentative de récupération automatique...');

      this.setState(prevState => ({
        recoveryAttempts: prevState.recoveryAttempts + 1
      }));

      setTimeout(() => {
        if (this.state.hasError) {
          this.setState({ 
            hasError: false, 
            error: undefined, 
            errorInfo: undefined 
          });
        }
      }, 3000);
    } else {
      console.log('🚫 Erreurs trop fréquentes - arrêt des tentatives de récupération');
    }
        // Log l'erreur pour debug
    if (error.message.includes('subscription') || error.message.includes('payment')) {
      console.error('🚨 Erreur liée aux abonnements/paiements:', error);
    }
  }

  resetError = () => {
    this.setState({ 
      hasError: false, 
      error: undefined, 
      errorInfo: undefined, 
      recoveryAttempts: 0 
    });
  };

  render() {
    if (this.state.hasError) {
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
  },
  content: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#CCCCCC',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 24,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});