
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Switch, Alert, ActionSheetIOS, Platform, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage, SupportedLanguage } from '@/context/LanguageContext';

export default function ParametresApplicationScreen() {
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const router = useRouter();
  const [settings, setSettings] = useState({
    darkMode: true,
    autoSync: true,
    offlineMode: false,
    analytics: true,
    crashReporting: true,
    language: 'Français',
    units: 'Métrique',
    notifications: true,
    dataUsage: 'WiFi uniquement',
    autoBackup: true,
    biometricLock: false,
    highQualityImages: true,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('appSettings');
      if (savedSettings) {
        setSettings({...settings, ...JSON.parse(savedSettings)});
      }
    } catch (error) {
      console.error('Erreur chargement paramètres:', error);
    }
  };

  const saveSettings = async (newSettings: typeof settings) => {
    try {
      await AsyncStorage.setItem('appSettings', JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Erreur sauvegarde paramètres:', error);
    }
  };

  const updateSetting = (key: keyof typeof settings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    saveSettings(newSettings);
  };

  const clearCache = () => {
    Alert.alert(
      'Vider le cache',
      'Cette action supprimera toutes les données en cache. Continuer ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Vider',
          style: 'destructive',
          onPress: async () => {
            try {
              // Simulate cache clearing
              await new Promise(resolve => setTimeout(resolve, 1000));
              Alert.alert('Succès', 'Cache vidé avec succès');
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de vider le cache');
            }
          }
        }
      ]
    );
  };

  const showLanguageOptions = () => {
    const languageOptions = [
      { label: 'Français', code: 'fr' as SupportedLanguage },
      { label: 'English', code: 'en' as SupportedLanguage },
      { label: 'Español', code: 'es' as SupportedLanguage },
      { label: 'Deutsch', code: 'de' as SupportedLanguage },
    ];

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title: 'Choisir la langue',
          options: [...languageOptions.map(lang => lang.label), 'Annuler'],
          cancelButtonIndex: languageOptions.length,
        },
        (buttonIndex) => {
          if (buttonIndex < languageOptions.length) {
            setLanguage(languageOptions[buttonIndex].code);
            updateSetting('language', languageOptions[buttonIndex].label);
          }
        }
      );
    } else {
      Alert.alert(
        'Choisir la langue',
        'Sélectionnez votre langue préférée',
        [
          ...languageOptions.map(lang => ({
            text: lang.label,
            onPress: () => {
              setLanguage(lang.code);
              updateSetting('language', lang.label);
            }
          })),
          { text: 'Annuler', style: 'cancel' }
        ]
      );
    }
  };

  const showUnitsOptions = () => {
    const units = ['Métrique (kg, cm)', 'Impérial (lbs, ft)'];

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title: 'Choisir les unités',
          options: [...units, 'Annuler'],
          cancelButtonIndex: units.length,
        },
        (buttonIndex) => {
          if (buttonIndex < units.length) {
            updateSetting('units', buttonIndex === 0 ? 'Métrique' : 'Impérial');
          }
        }
      );
    } else {
      Alert.alert(
        'Choisir les unités',
        'Sélectionnez votre système d\'unités',
        [
          {
            text: 'Métrique (kg, cm)',
            onPress: () => updateSetting('units', 'Métrique')
          },
          {
            text: 'Impérial (lbs, ft)',
            onPress: () => updateSetting('units', 'Impérial')
          },
          { text: 'Annuler', style: 'cancel' }
        ]
      );
    }
  };

  const showDataUsageOptions = () => {
    const options = ['WiFi uniquement', 'WiFi et données mobiles', 'Désactivé'];

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title: 'Utilisation des données',
          options: [...options, 'Annuler'],
          cancelButtonIndex: options.length,
        },
        (buttonIndex) => {
          if (buttonIndex < options.length) {
            updateSetting('dataUsage', options[buttonIndex]);
          }
        }
      );
    } else {
      Alert.alert(
        'Utilisation des données',
        'Choisir quand synchroniser',
        [
          ...options.map(option => ({
            text: option,
            onPress: () => updateSetting('dataUsage', option)
          })),
          { text: 'Annuler', style: 'cancel' }
        ]
      );
    }
  };

  const resetSettings = () => {
    Alert.alert(
      'Réinitialiser les paramètres',
      'Cette action restaurera tous les paramètres par défaut. Continuer ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Réinitialiser',
          style: 'destructive',
          onPress: () => {
            const defaultSettings = {
              darkMode: true,
              autoSync: true,
              offlineMode: false,
              analytics: true,
              crashReporting: true,
              language: 'Français',
              units: 'Métrique',
              notifications: true,
              dataUsage: 'WiFi uniquement',
              autoBackup: true,
              biometricLock: false,
              highQualityImages: true,
            };
            saveSettings(defaultSettings);
            Alert.alert('Succès', 'Paramètres réinitialisés');
          }
        }
      ]
    );
  };

  const exportData = () => {
    Alert.alert(
      'Exporter les données',
      'Vos données seront exportées et envoyées par email sous 24h.',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Exporter', onPress: () => Alert.alert('Export en cours', 'Vous recevrez un email de confirmation.') }
      ]
    );
  };

  const openSystemSettings = () => {
    Linking.openSettings();
  };

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: theme.background}]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.push('/(client)/profil')}
          >
            <Text style={[styles.backText, { color: theme.text }]}>←</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.text }]}>Paramètres de l'application</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Apparence */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>🎨 Apparence</Text>

          <View style={[styles.settingItem, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: theme.text }]}>Mode sombre</Text>
              <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>Interface sombre pour vos yeux</Text>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={toggleTheme}
              trackColor={{ false: '#21262D', true: '#F5A623' }}
              thumbColor={isDarkMode ? '#FFFFFF' : '#8B949E'}
            />
          </View>

          <TouchableOpacity 
            style={[styles.settingItem, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={showLanguageOptions}
          >
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: theme.text }]}>Langue</Text>
              <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>{settings.language}</Text>
            </View>
            <Text style={[styles.settingArrow, { color: theme.textSecondary }]}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.settingItem, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={showUnitsOptions}
          >
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: theme.text }]}>Unités de mesure</Text>
              <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
                {settings.units === 'Métrique' ? 'Kilogrammes, centimètres' : 'Livres, pieds'}
              </Text>
            </View>
            <Text style={[styles.settingArrow, { color: theme.textSecondary }]}>›</Text>
          </TouchableOpacity>

          <View style={[styles.settingItem, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: theme.text }]}>Images haute qualité</Text>
              <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>Télécharger les images en haute définition</Text>
            </View>
            <Switch
              value={settings.highQualityImages}
              onValueChange={(value) => updateSetting('highQualityImages', value)}
              trackColor={{ false: '#21262D', true: '#F5A623' }}
              thumbColor={settings.highQualityImages ? '#FFFFFF' : '#8B949E'}
            />
          </View>
        </View>

        {/* Synchronisation */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>🔄 Synchronisation</Text>

          <View style={[styles.settingItem, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: theme.text }]}>Synchronisation automatique</Text>
              <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>Synchroniser automatiquement vos données</Text>
            </View>
            <Switch
              value={settings.autoSync}
              onValueChange={(value) => updateSetting('autoSync', value)}
              trackColor={{ false: '#21262D', true: '#F5A623' }}
              thumbColor={settings.autoSync ? '#FFFFFF' : '#8B949E'}
            />
          </View>

          <TouchableOpacity 
            style={[styles.settingItem, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={showDataUsageOptions}
          >
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: theme.text }]}>Utilisation des données</Text>
              <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>{settings.dataUsage}</Text>
            </View>
            <Text style={[styles.settingArrow, { color: theme.textSecondary }]}>›</Text>
          </TouchableOpacity>

          <View style={[styles.settingItem, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: theme.text }]}>Mode hors ligne</Text>
              <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>Utiliser l'app sans connexion internet</Text>
            </View>
            <Switch
              value={settings.offlineMode}
              onValueChange={(value) => updateSetting('offlineMode', value)}
              trackColor={{ false: '#21262D', true: '#F5A623' }}
              thumbColor={settings.offlineMode ? '#FFFFFF' : '#8B949E'}
            />
          </View>

          <View style={[styles.settingItem, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: theme.text }]}>Sauvegarde automatique</Text>
              <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>Sauvegarder automatiquement vos données</Text>
            </View>
            <Switch
              value={settings.autoBackup}
              onValueChange={(value) => updateSetting('autoBackup', value)}
              trackColor={{ false: '#21262D', true: '#F5A623' }}
              thumbColor={settings.autoBackup ? '#FFFFFF' : '#8B949E'}
            />
          </View>
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>🔔 Notifications</Text>

          <TouchableOpacity 
            style={[styles.settingItem, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => router.push('/(client)/notifications')}
          >
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: theme.text }]}>Paramètres de notifications</Text>
              <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>Gérer vos préférences de notifications</Text>
            </View>
            <Text style={[styles.settingArrow, { color: theme.textSecondary }]}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.settingItem, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={openSystemSettings}
          >
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: theme.text }]}>Paramètres système</Text>
              <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>Ouvrir les paramètres iOS/Android</Text>
            </View>
            <Text style={[styles.settingArrow, { color: theme.textSecondary }]}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>⚙️ Actions</Text>

          <TouchableOpacity 
            style={[styles.settingItem, styles.dangerItem, { backgroundColor: theme.card, borderColor: '#F85149' }]} 
            onPress={resetSettings}
          >
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, styles.dangerText]}>Réinitialiser les paramètres</Text>
              <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>Restaurer les paramètres par défaut</Text>
            </View>
            <Text style={[styles.settingArrow, { color: theme.textSecondary }]}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Version */}
        <View style={[styles.versionContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.versionTitle, { color: theme.text }]}>Informations de l'application</Text>
          <Text style={[styles.versionText, { color: theme.textSecondary }]}>EatFitByMax v1.0.0</Text>
          <Text style={[styles.versionSubtext, { color: theme.textSecondary }]}>Build: 2024.27.07</Text>
          <Text style={[styles.versionSubtext, { color: theme.textSecondary }]}>
            Plateforme: {Platform.OS === 'ios' ? 'iOS' : 'Android'}
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
  versionContainer: {
    padding: 20,
    backgroundColor: '#161B22',
    margin: 20,
    marginTop: 0,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#21262D',
  },
  versionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  versionText: {
    fontSize: 14,
    color: '#8B949E',
    marginBottom: 4,
  },
  versionSubtext: {
    fontSize: 12,
    color: '#6A737D',
    marginBottom: 2,
  },
});
