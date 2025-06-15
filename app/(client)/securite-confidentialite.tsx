
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Switch, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SecuriteConfidentialiteScreen() {
  const router = useRouter();
  const [settings, setSettings] = useState({
    biometricAuth: false,
    autoLock: true,
    dataEncryption: true,
    shareData: false,
    locationTracking: false,
    thirdPartySharing: false,
  });
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState<string>('');

  useEffect(() => {
    checkBiometricAvailability();
    loadSettings();
  }, []);

  const checkBiometricAvailability = async () => {
    try {
      const isAvailable = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const authTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
      
      setBiometricAvailable(isAvailable && isEnrolled);
      
      if (authTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        setBiometricType('Face ID');
      } else if (authTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        setBiometricType('Touch ID');
      } else {
        setBiometricType('Biométrie');
      }
    } catch (error) {
      console.error('Erreur vérification biométrie:', error);
      setBiometricAvailable(false);
    }
  };

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('security_settings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('Erreur chargement paramètres:', error);
    }
  };

  const saveSettings = async (newSettings: typeof settings) => {
    try {
      await AsyncStorage.setItem('security_settings', JSON.stringify(newSettings));
    } catch (error) {
      console.error('Erreur sauvegarde paramètres:', error);
    }
  };

  const handleBiometricToggle = async (value: boolean) => {
    if (!biometricAvailable) {
      Alert.alert(
        'Biométrie non disponible',
        'L\'authentification biométrique n\'est pas configurée sur cet appareil. Veuillez configurer Face ID ou Touch ID dans les paramètres de votre appareil.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (value) {
      try {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Authentifiez-vous pour activer la sécurité biométrique',
          fallbackLabel: 'Utiliser le code',
          cancelLabel: 'Annuler',
        });

        if (result.success) {
          const newSettings = { ...settings, biometricAuth: true };
          setSettings(newSettings);
          await saveSettings(newSettings);
          Alert.alert(
            'Succès',
            `L\'authentification ${biometricType} a été activée avec succès.`
          );
        } else {
          Alert.alert(
            'Échec de l\'authentification',
            'Impossible d\'activer l\'authentification biométrique.'
          );
        }
      } catch (error) {
        console.error('Erreur authentification biométrique:', error);
        Alert.alert(
          'Erreur',
          'Une erreur est survenue lors de l\'activation de l\'authentification biométrique.'
        );
      }
    } else {
      try {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Authentifiez-vous pour désactiver la sécurité biométrique',
          fallbackLabel: 'Utiliser le code',
          cancelLabel: 'Annuler',
        });

        if (result.success) {
          const newSettings = { ...settings, biometricAuth: false };
          setSettings(newSettings);
          await saveSettings(newSettings);
          Alert.alert(
            'Désactivé',
            `L\'authentification ${biometricType} a été désactivée.`
          );
        }
      } catch (error) {
        console.error('Erreur désactivation biométrique:', error);
      }
    }
  };

  const updateSetting = async (key: keyof typeof settings, value: boolean) => {
    if (key === 'biometricAuth') {
      await handleBiometricToggle(value);
    } else {
      const newSettings = { ...settings, [key]: value };
      setSettings(newSettings);
      await saveSettings(newSettings);
    }
  };

  const deleteAccount = () => {
    Alert.alert(
      'Supprimer le compte',
      'Cette action supprimera définitivement votre compte et toutes vos données. Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Confirmation', 'Votre demande de suppression a été enregistrée. Vous recevrez un email de confirmation.');
          }
        }
      ]
    );
  };

  const exportData = () => {
    Alert.alert('Export de données', 'Vos données seront exportées et envoyées par email sous 24h.');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Sécurité et confidentialité</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Sécurité */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔐 Sécurité</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Authentification biométrique</Text>
              <Text style={styles.settingDescription}>
                {biometricAvailable 
                  ? `${biometricType} pour déverrouiller l'app`
                  : 'Non disponible sur cet appareil'
                }
              </Text>
            </View>
            <Switch
              value={settings.biometricAuth}
              onValueChange={(value) => updateSetting('biometricAuth', value)}
              trackColor={{ false: '#21262D', true: '#1F6FEB' }}
              thumbColor={settings.biometricAuth ? '#FFFFFF' : '#8B949E'}
              disabled={!biometricAvailable}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Verrouillage automatique</Text>
              <Text style={styles.settingDescription}>Verrouiller l'app après inactivité</Text>
            </View>
            <Switch
              value={settings.autoLock}
              onValueChange={(value) => updateSetting('autoLock', value)}
              trackColor={{ false: '#21262D', true: '#1F6FEB' }}
              thumbColor={settings.autoLock ? '#FFFFFF' : '#8B949E'}
            />
          </View>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Changer le mot de passe</Text>
              <Text style={styles.settingDescription}>Modifier votre mot de passe</Text>
            </View>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Authentification à deux facteurs</Text>
              <Text style={styles.settingDescription}>Sécurité renforcée avec 2FA</Text>
            </View>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Chiffrement */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🛡️ Protection des données</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Chiffrement des données</Text>
              <Text style={styles.settingDescription}>Vos données sont chiffrées localement</Text>
            </View>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>Activé</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Sessions actives</Text>
              <Text style={styles.settingDescription}>Gérer les appareils connectés</Text>
            </View>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Confidentialité */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👁️ Confidentialité</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Partage de données anonymes</Text>
              <Text style={styles.settingDescription}>Améliorer l'app avec des données anonymisées</Text>
            </View>
            <Switch
              value={settings.shareData}
              onValueChange={(value) => updateSetting('shareData', value)}
              trackColor={{ false: '#21262D', true: '#1F6FEB' }}
              thumbColor={settings.shareData ? '#FFFFFF' : '#8B949E'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Suivi de localisation</Text>
              <Text style={styles.settingDescription}>Utiliser votre position pour les fonctionnalités</Text>
            </View>
            <Switch
              value={settings.locationTracking}
              onValueChange={(value) => updateSetting('locationTracking', value)}
              trackColor={{ false: '#21262D', true: '#1F6FEB' }}
              thumbColor={settings.locationTracking ? '#FFFFFF' : '#8B949E'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Partage avec des tiers</Text>
              <Text style={styles.settingDescription}>Autoriser le partage avec des partenaires</Text>
            </View>
            <Switch
              value={settings.thirdPartySharing}
              onValueChange={(value) => updateSetting('thirdPartySharing', value)}
              trackColor={{ false: '#21262D', true: '#1F6FEB' }}
              thumbColor={settings.thirdPartySharing ? '#FFFFFF' : '#8B949E'}
            />
          </View>
        </View>

        {/* Mes données */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Mes données</Text>
          
          <TouchableOpacity style={styles.settingItem} onPress={exportData}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Télécharger mes données</Text>
              <Text style={styles.settingDescription}>Exporter toutes vos données personnelles</Text>
            </View>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Politique de confidentialité</Text>
              <Text style={styles.settingDescription}>Consulter notre politique</Text>
            </View>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Conditions d'utilisation</Text>
              <Text style={styles.settingDescription}>Lire les conditions</Text>
            </View>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Zone de danger */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, styles.dangerTitle]}>⚠️ Zone de danger</Text>
          
          <TouchableOpacity style={[styles.settingItem, styles.dangerItem]} onPress={deleteAccount}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, styles.dangerText]}>Supprimer mon compte</Text>
              <Text style={styles.settingDescription}>Supprimer définitivement votre compte</Text>
            </View>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Informations légales */}
        <View style={styles.legalContainer}>
          <Text style={styles.legalTitle}>Informations légales</Text>
          <Text style={styles.legalText}>
            EatFitByMax respecte votre vie privée. Nous ne vendons jamais vos données personnelles. 
            Toutes les données sont stockées de manière sécurisée et chiffrée.
          </Text>
          <Text style={styles.legalText}>
            Pour toute question concernant vos données, contactez-nous à privacy@eatfitbymax.com
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1117',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#21262D',
  },
  backButton: {
    padding: 8,
  },
  backText: {
    fontSize: 24,
    color: '#FFFFFF',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  placeholder: {
    width: 40,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  dangerTitle: {
    color: '#F85149',
  },
  settingItem: {
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#21262D',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dangerItem: {
    borderColor: '#F85149',
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    color: '#8B949E',
  },
  settingArrow: {
    fontSize: 18,
    color: '#8B949E',
  },
  dangerText: {
    color: '#F85149',
  },
  statusBadge: {
    backgroundColor: '#238636',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  legalContainer: {
    padding: 20,
    backgroundColor: '#161B22',
    margin: 20,
    marginTop: 0,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#21262D',
  },
  legalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  legalText: {
    fontSize: 14,
    color: '#8B949E',
    lineHeight: 20,
    marginBottom: 12,
  },
});
