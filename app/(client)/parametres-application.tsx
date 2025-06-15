import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Switch, Alert, ActionSheetIOS, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@/context/ThemeContext';

export default function ParametresApplicationScreen() {
  const { theme, isDarkMode, toggleTheme } = useTheme();
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
          onPress: () => {
            Alert.alert('Succès', 'Cache vidé avec succès');
          }
        }
      ]
    );
  };

  const showLanguageOptions = () => {
    const languages = ['Français', 'English', 'Español', 'Deutsch'];

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title: 'Choisir la langue',
          options: [...languages, 'Annuler'],
          cancelButtonIndex: languages.length,
        },
        (buttonIndex) => {
          if (buttonIndex < languages.length) {
            updateSetting('language', languages[buttonIndex]);
          }
        }
      );
    } else {
      Alert.alert(
        'Choisir la langue',
        'Sélectionnez votre langue préférée',
        [
          ...languages.map(lang => ({
            text: lang,
            onPress: () => updateSetting('language', lang)
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
            };
            saveSettings(defaultSettings);
            Alert.alert('Succès', 'Paramètres réinitialisés');
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: theme.background}]}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={[styles.backText, { color: theme.text }]}>←</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.text }]}>Paramètres de l'application</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Apparence */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>🎨 Apparence</Text>

          {/* Mode sombre */}
          <View style={[styles.settingItem, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: theme.text }]}>Mode sombre</Text>
              <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>Interface sombre pour vos yeux</Text>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={toggleTheme}
              trackColor={{ false: '#21262D', true: '#1F6FEB' }}
              thumbColor={isDarkMode ? '#FFFFFF' : '#8B949E'}
            />
          </View>

          <TouchableOpacity 
            style={[styles.settingItem, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => showLanguageOptions()}
          >
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: theme.text }]}>Langue</Text>
              <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>{settings.language}</Text>
            </View>
            <Text style={[styles.settingArrow, { color: theme.textSecondary }]}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.settingItem, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => showUnitsOptions()}
          >
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: theme.text }]}>Unités</Text>
              <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
                {settings.units === 'Métrique' ? 'Métrique (kg, cm)' : 'Impérial (lbs, ft)'}
              </Text>
            </View>
            <Text style={[styles.settingArrow, { color: theme.textSecondary }]}>›</Text>
          </TouchableOpacity>
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
              trackColor={{ false: '#21262D', true: '#1F6FEB' }}
              thumbColor={settings.autoSync ? '#FFFFFF' : '#8B949E'}
            />
          </View>

          <View style={[styles.settingItem, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: theme.text }]}>Mode hors ligne</Text>
              <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>Utiliser l'app sans connexion internet</Text>
            </View>
            <Switch
              value={settings.offlineMode}
              onValueChange={(value) => updateSetting('offlineMode', value)}
              trackColor={{ false: '#21262D', true: '#1F6FEB' }}
              thumbColor={settings.offlineMode ? '#FFFFFF' : '#8B949E'}
            />
          </View>

          <TouchableOpacity style={[styles.settingItem, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: theme.text }]}>Utilisation des données</Text>
              <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>{settings.dataUsage}</Text>
            </View>
            <Text style={[styles.settingArrow, { color: theme.textSecondary }]}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Données et stockage */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>💾 Données et stockage</Text>

          <TouchableOpacity style={[styles.settingItem, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={clearCache}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: theme.text }]}>Vider le cache</Text>
              <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>Libérer de l'espace de stockage</Text>
            </View>
            <Text style={[styles.settingArrow, { color: theme.textSecondary }]}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.settingItem, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: theme.text }]}>Sauvegarde</Text>
              <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>Sauvegarder vos données</Text>
            </View>
            <Text style={[styles.settingArrow, { color: theme.textSecondary }]}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.settingItem, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: theme.text }]}>Exporter les données</Text>
              <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>Télécharger vos données</Text>
            </View>
            <Text style={[styles.settingArrow, { color: theme.textSecondary }]}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Confidentialité */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>🔒 Confidentialité</Text>

          <View style={[styles.settingItem, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: theme.text }]}>Analytics</Text>
              <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>Partager des données d'utilisation anonymes</Text>
            </View>
            <Switch
              value={settings.analytics}
              onValueChange={(value) => updateSetting('analytics', value)}
              trackColor={{ false: '#21262D', true: '#1F6FEB' }}
              thumbColor={settings.analytics ? '#FFFFFF' : '#8B949E'}
            />
          </View>

          <View style={[styles.settingItem, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: theme.text }]}>Rapports de crash</Text>
              <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>Envoyer automatiquement les rapports d'erreur</Text>
            </View>
            <Switch
              value={settings.crashReporting}
              onValueChange={(value) => updateSetting('crashReporting', value)}
              trackColor={{ false: '#21262D', true: '#1F6FEB' }}
              thumbColor={settings.crashReporting ? '#FFFFFF' : '#8B949E'}
            />
          </View>
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>⚙️ Actions</Text>

          <TouchableOpacity style={[styles.settingItem, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={resetSettings}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, styles.dangerText, { color: theme.text }]}>Réinitialiser les paramètres</Text>
              <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>Restaurer les paramètres par défaut</Text>
            </View>
            <Text style={[styles.settingArrow, { color: theme.textSecondary }]}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Version */}
        <View style={styles.versionContainer}>
          <Text style={[styles.versionText, { color: theme.textSecondary }]}>EatFitByMax v1.0.0</Text>
          <Text style={[styles.versionSubtext, { color: theme.textSecondary }]}>Dernière mise à jour: 11 juin 2024</Text>
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
    alignItems: 'center',
  },
  versionText: {
    fontSize: 14,
    color: '#8B949E',
    marginBottom: 4,
  },
  versionSubtext: {
    fontSize: 12,
    color: '#6A737D',
  },
});