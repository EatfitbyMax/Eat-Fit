
import { useState, useEffect } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface BiometricSettings {
  biometricAuth: boolean;
  autoLock: boolean;
}

export const useBiometric = () => {
  const [isAvailable, setIsAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState<string>('');
  const [settings, setSettings] = useState<BiometricSettings>({
    biometricAuth: false,
    autoLock: true,
  });

  useEffect(() => {
    checkBiometricSupport();
    loadBiometricSettings();
  }, []);

  const checkBiometricSupport = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const authTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
      
      setIsAvailable(hasHardware && isEnrolled);
      
      if (authTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        setBiometricType('Face ID');
      } else if (authTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        setBiometricType('Touch ID');
      } else {
        setBiometricType('Biométrie');
      }
    } catch (error) {
      console.error('Erreur vérification biométrie:', error);
      setIsAvailable(false);
    }
  };

  const loadBiometricSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('security_settings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSettings({
          biometricAuth: parsed.biometricAuth || false,
          autoLock: parsed.autoLock !== undefined ? parsed.autoLock : true,
        });
      }
    } catch (error) {
      console.error('Erreur chargement paramètres biométriques:', error);
    }
  };

  const authenticate = async (
    promptMessage: string = 'Authentifiez-vous pour continuer'
  ): Promise<boolean> => {
    try {
      if (!isAvailable || !settings.biometricAuth) {
        return true; // Si la biométrie n'est pas activée, on autorise l'accès
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        fallbackLabel: 'Utiliser le code',
        cancelLabel: 'Annuler',
        disableDeviceFallback: false,
      });

      return result.success;
    } catch (error) {
      console.error('Erreur authentification biométrique:', error);
      return false;
    }
  };

  const requiresAuthentication = (): boolean => {
    return isAvailable && settings.biometricAuth;
  };

  return {
    isAvailable,
    biometricType,
    settings,
    authenticate,
    requiresAuthentication,
    checkBiometricSupport,
    loadBiometricSettings,
  };
};
