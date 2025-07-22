import { Platform } from 'react-native';
import * as ErrorRecovery from 'expo-error-recovery';

// Protection contre les boucles de redémarrage
let restartCount = 0;
const MAX_RESTARTS = 2;
const RESTART_WINDOW = 60000;
const ERROR_THRESHOLD = 5;
let errorCount = 0;
let lastErrorReset = Date.now();
let lastRestartTime = 0;

// Gestionnaire d'erreurs global
export const setupGlobalErrorHandlers = () => {
  try {
    // Gestionnaire d'erreurs JavaScript non capturées
    const originalErrorHandler = ErrorUtils.getGlobalHandler();

    ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
      console.error('🔴 Erreur globale capturée:', {
        message: error.message,
        stack: error.stack?.substring(0, 500),
        isFatal,
        platform: Platform.OS
      });

      errorCount++;

      // Appeler le gestionnaire original
      if (originalErrorHandler) {
        originalErrorHandler(error, isFatal);
      }

      // Gestion spéciale pour iOS
      if (Platform.OS === 'ios' && isFatal && errorCount >= ERROR_THRESHOLD) {
        handleCriticalError(error);
      }
    });

    // Gestionnaire pour les promesses rejetées
    const unhandledRejectionHandler = (event: any) => {
      console.error('🔴 Promise rejetée non gérée:', event.reason);
      errorCount++;
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('unhandledrejection', unhandledRejectionHandler);
    }

    console.log('✅ Gestionnaires d\'erreurs globaux configurés');

  } catch (setupError) {
    console.error('❌ Erreur lors de la configuration des gestionnaires:', setupError);
  }
};

// Fonction pour gérer les erreurs critiques
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
    ErrorRecovery.recoveryProps && ErrorRecovery.recoveryProps.restart();
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
                       error.stack?.includes('0x');

  if (isNativeError) {
    console.error(`🔴 ERREUR NATIVE [${context}]:`, {
      message: error.message,
      stack: error.stack?.substring(0, 300),
      name: error.name,
      platform: Platform.OS
    });
  }
};

// Wrapper sécurisé pour les appels AsyncStorage
export const safeAsyncStorageCall = async <T>(
  operation: () => Promise<T>,
  defaultValue: T,
  context: string
): Promise<T> => {
  try {
    return await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Timeout AsyncStorage: ${context}`));
      }, 5000);

      operation()
        .then(result => {
          clearTimeout(timeout);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timeout);
          reject(error);
        });
    });
  } catch (error) {
    console.error(`❌ Erreur AsyncStorage [${context}]:`, error);
    logNativeError(error as Error, context);
    return defaultValue;
  }
};