import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as ErrorRecovery from 'expo-error-recovery';

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
  private readonly maxRecoveryAttempts = 2;
  private lastErrorTime = 0;
  private readonly errorCooldown = 5000; // 5 secondes

  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false,
      recoveryAttempts: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const now = Date.now();

    // Vérifier si on est dans une boucle d'erreurs
    if (now - this.lastErrorTime < this.errorCooldown) {
      console.log('🚫 Erreurs trop fréquentes - arrêt des tentatives de récupération');
      this.setState({
        error,
        errorInfo,
        recoveryAttempts: this.maxRecoveryAttempts
      });
      return;
    }

    this.lastErrorTime = now;
    console.log('🛡️ ErrorBoundary a capturé une erreur:', error.message);

    this.setState({
      error,
      errorInfo
    });

    // Tentative de récupération automatique limitée
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
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined, recoveryAttempts: 0 });
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