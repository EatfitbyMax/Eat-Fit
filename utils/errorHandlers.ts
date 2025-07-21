import { Platform } from 'react-native';
import * as ErrorRecovery from 'expo-error-recovery';

// Protection contre les boucles de redémarrage
let restartCount = 0;
const MAX_RESTARTS = 2;
const RESTART_WINDOW = 60000;
const ERROR_THRESHOLD = 5;
let errorCount = 0;
const lastErrorReset = Date.now();

// Gestionnaire d'erreurs JavaScript non gérées
export const setupGlobalErrorHandlers = () => {
  try {
    // Erreurs JavaScript non gérées
    const originalHandler = global.ErrorUtils?.getGlobalHandler?.();

    global.ErrorUtils?.setGlobalHandler?.((error, isFatal) => {
      const now = Date.now();

      // Compteur d'erreurs pour détecter les boucles
      if (now - lastErrorReset > 60000) {
        errorCount = 0;
        lastErrorReset = now;
      }

      errorCount++;

      if (errorCount > ERROR_THRESHOLD) {
        console.error('🚫 TROP D\'ERREURS - Arrêt des gestionnaires pour éviter les boucles');
        return;
      }

      console.error('🚨 ERREUR GLOBALE JS:', {
        error: error?.message || error,
        isFatal,
        count: errorCount,
        stack: error?.stack?.substring(0, 300)
      });

      // Protection contre les boucles de redémarrage
      if (now - lastRestartTime > RESTART_WINDOW) {
        restartCount = 0;
      }

      if (restartCount >= MAX_RESTARTS) {
        console.error('🚫 TROP DE REDÉMARRAGES - Arrêt des tentatives de récupération');
        return;
      }

      // Appeler le gestionnaire original s'il existe
      if (originalHandler) {
        try {
          originalHandler(error, isFatal);
        } catch (handlerError) {
          console.error('❌ Erreur dans le gestionnaire original:', handlerError);
        }
      }

      // Tentative de récupération pour les erreurs non fatales seulement
      if (!isFatal && ErrorRecovery && restartCount < MAX_RESTARTS && errorCount < 3) {
        restartCount++;
        lastRestartTime = now;

        setTimeout(() => {
          try {
            console.log(`🔄 Tentative récupération ${restartCount}/${MAX_RESTARTS}`);
            ErrorRecovery.recover();
          } catch (recoveryError) {
            console.error('❌ Échec récupération JS:', recoveryError);
          }
        }, 2000);
      }
    });

    // Gestionnaire pour les promesses rejetées
    if (typeof global !== 'undefined' && global.HermesInternal?.setExceptionHandler) {
      global.HermesInternal.setExceptionHandler((error) => {
        console.error('🚨 EXCEPTION HERMES:', {
          error: error?.message || error,
          stack: error?.stack?.substring(0, 500)
        });
      });
    }

    // Gestionnaire pour les rejets de promesses non gérés
    const handleUnhandledRejection = (event: any) => {
      console.error('🚨 PROMESSE REJETÉE NON GÉRÉE:', {
        reason: event.reason,
        promise: event.promise
      });

      // Empêcher le crash de l'app
      if (event.preventDefault) {
        event.preventDefault();
      }
    };

    if (typeof global !== 'undefined' && global.addEventListener) {
      global.addEventListener('unhandledrejection', handleUnhandledRejection);
    }

    console.log('✅ Gestionnaires d\'erreurs globaux configurés');

  } catch (setupError) {
    console.error('❌ Erreur lors de la configuration des gestionnaires:', setupError);
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
        reject(new Error('AsyncStorage timeout'));
      }, 5000);

      operation()
        .then(result => {
          clearTimeout(timeout);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timeout);
          logNativeError(error, context);
          reject(error);
        });
    });
  } catch (error) {
    console.warn(`⚠️ Erreur AsyncStorage [${context}]:`, error);
    return defaultValue;
  }
};