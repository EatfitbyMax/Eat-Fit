
import { Platform } from 'react-native';
import * as ErrorRecovery from 'expo-error-recovery';

// Protection contre les boucles de redémarrage
let restartCount = 0;
const MAX_RESTARTS = 2; // Réduire à 2 tentatives
const RESTART_WINDOW = 60000; // Augmenter à 60 secondes
let lastRestartTime = 0;
let errorCount = 0;
const ERROR_THRESHOLD = 5; // Seuil d'erreurs par minute
let lastErrorReset = Date.now();

// Gestionnaire d'erreurs JavaScript non gérées
export const setupGlobalErrorHandlers = () => {
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
      originalHandler(error, isFatal);
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
      }, 2000); // Délai plus long pour éviter les boucles rapides
    }
  });

  // Gestionnaire pour les promesses rejetées
  if (global.HermesInternal?.setExceptionHandler) {
    global.HermesInternal.setExceptionHandler((error) => {
      console.error('🚨 EXCEPTION HERMES:', {
        error: error?.message || error,
        stack: error?.stack?.substring(0, 500)
      });
    });
  }

  // Gestionnaire pour les rejets de promesses non gérés
  const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    console.error('🚨 PROMESSE REJETÉE NON GÉRÉE:', {
      reason: event.reason,
      promise: event.promise
    });
    
    // Empêcher le crash de l'app
    event.preventDefault();
  };

  if (global.addEventListener) {
    global.addEventListener('unhandledrejection', handleUnhandledRejection);
  }

  console.log('✅ Gestionnaires d\'erreurs globaux configurés');
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
