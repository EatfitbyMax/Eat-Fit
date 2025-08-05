
import { Platform } from 'react-native';
import * as ErrorRecovery from 'expo-error-recovery';

// Protection contre les boucles de redémarrage
let restartCount = 0;
const MAX_RESTARTS = 2;
const RESTART_WINDOW = 60000; // 1 minute
let lastRestartTime = 0;

// Compteurs d'erreurs
let errorCount = 0;
let lastErrorReset = Date.now();

// Gestionnaire d'erreurs critiques
const handleCriticalError = (error: Error) => {
  const now = Date.now();

  if (now - lastRestartTime < RESTART_WINDOW && restartCount >= MAX_RESTARTS) {
    console.error('🚨 Trop de redémarrages, arrêt des tentatives');
    return;
  }

  if (now - lastRestartTime >= RESTART_WINDOW) {
    restartCount = 0;
  }

  restartCount++;
  lastRestartTime = now;

  try {
    console.log('🔄 Tentative de récupération d\'erreur...');
    if (ErrorRecovery.recoveryProps) {
      ErrorRecovery.recoveryProps.restart();
    }
  } catch (recoveryError) {
    console.error('❌ Échec de la récupération:', recoveryError);
  }
};

// Fonction pour réinitialiser les compteurs d'erreurs
export const resetErrorCounters = () => {
  errorCount = 0;
  restartCount = 0;
  lastErrorReset = Date.now();
  lastRestartTime = 0;
  console.log('🔄 Compteurs d\'erreurs réinitialisés');
};

// Fonction pour obtenir les statistiques d'erreurs
export const getErrorStats = () => {
  return {
    errorCount,
    restartCount,
    lastErrorReset,
    lastRestartTime,
  };
};

// Fonction pour logger les erreurs natives spécifiquement
export const logNativeError = (error: Error, context: string) => {
  const isNativeError = error.message?.includes('Native module') ||
                       error.message?.includes('RCT') ||
                       error.message?.includes('NSException') ||
                       error.message?.includes('JavaException');

  if (isNativeError) {
    console.error(`🔴 Erreur native détectée (${context}):`, {
      message: error.message,
      stack: error.stack,
      platform: Platform.OS,
      isNative: true
    });
  } else {
    console.error(`⚠️ Erreur JavaScript (${context}):`, {
      message: error.message,
      stack: error.stack,
      platform: Platform.OS,
      isNative: false
    });
  }

  errorCount++;
};

// Gestionnaire d'erreur global pour les promesses
export const setupGlobalErrorHandlers = () => {
  if (typeof global !== 'undefined') {
    // Gestionnaire pour les promesses rejetées non gérées
    global.addEventListener?.('unhandledrejection', (event: any) => {
      console.error('🔴 Promesse rejetée non gérée:', event.reason);
      logNativeError(new Error(event.reason), 'unhandledrejection');
      event.preventDefault();
    });

    // Gestionnaire pour les erreurs JavaScript non gérées
    global.addEventListener?.('error', (event: any) => {
      console.error('🔴 Erreur JavaScript non gérée:', event.error);
      logNativeError(event.error, 'uncaught-exception');
      event.preventDefault();
    });
  }
};

// Wrapper sécurisé pour les appels à des APIs natives
export const safeNativeCall = async <T>(
  apiCall: () => Promise<T>,
  fallbackValue: T,
  context: string = 'unknown'
): Promise<T> => {
  try {
    return await apiCall();
  } catch (error) {
    logNativeError(error as Error, `safeNativeCall-${context}`);
    return fallbackValue;
  }
};

// Wrapper pour les composants React susceptibles d'erreurs natives
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallbackComponent?: React.ComponentType<any>
) => {
  return (props: P) => {
    try {
      return React.createElement(Component, props);
    } catch (error) {
      logNativeError(error as Error, 'component-render');
      return fallbackComponent ? React.createElement(fallbackComponent, props) : null;
    }
  };
};

export default {
  handleCriticalError,
  resetErrorCounters,
  getErrorStats,
  logNativeError,
  setupGlobalErrorHandler: setupGlobalErrorHandlers,
  safeNativeCall,
  withErrorBoundary
};
