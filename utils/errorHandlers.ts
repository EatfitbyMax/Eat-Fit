
import { Platform } from 'react-native';
import * as ErrorRecovery from 'expo-error-recovery';

// Protection contre les boucles de redémarrage
let restartCount = 0;
const MAX_RESTARTS = 3;
const RESTART_WINDOW = 30000; // 30 secondes
let lastRestartTime = 0;

// Gestionnaire d'erreurs JavaScript simplifié
export const setupGlobalErrorHandlers = () => {
  // Version simplifiée pour build standalone
  const originalHandler = global.ErrorUtils?.getGlobalHandler?.();
  
  global.ErrorUtils?.setGlobalHandler?.((error, isFatal) => {
    console.error('🚨 ERREUR GLOBALE:', {
      error: error?.message || error,
      isFatal: !!isFatal,
      platform: Platform.OS
    });

    // Appeler le gestionnaire original s'il existe
    if (originalHandler) {
      originalHandler(error, isFatal);
    }
  });es b// Gestionnaire pour les rejets de promesses non gérés (simplifié)
  const handleUnhandledRejection = (event: any) => {
    console.error('🚨 PROMESSE REJETÉE:', event.reason);
    if (event.preventDefault) {
      event.preventDefault();
    }
  };

  if (global.addEventListener) {
    global.addEventListener('unhandledrejection', handleUnhandledRejection);
  }

  console.log('✅ Gestionnaires d\'erreurs configurés pour', Platform.OS);
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
