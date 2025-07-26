
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Switch, Alert, ActionSheetIOS, Platform, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage, SupportedLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';

interface AppSettings {
  darkMode: boolean;
  autoSync: boolean;
  offlineMode: boolean;
  analytics: boolean;
  crashReporting: boolean;
  language: string;
  units: 'Métrique' | 'Impérial';
  notifications: boolean;
  dataUsage: 'WiFi uniquement' | 'WiFi et données mobiles' | 'Données mobiles uniquement';
  autoLock: boolean;
  hapticFeedback: boolean;
  soundEffects: boolean;
  backgroundRefresh: boolean;
  locationServices: boolean;
  cacheSize: 'Faible' | 'Moyen' | 'Élevé';
  autoDownloadUpdates: boolean;
  developerMode: boolean;
}

export default function ParametresApplicationScreen() {
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const { user } = useAuth();
  const router = useRouter();
  const [settings, setSettings] = useState<AppSettings>({
    darkMode: true,
    autoSync: true,
    offlineMode: false,
    analytics: true,
    crashReporting: true,
    language: 'Français',
    units: 'Métrique',
    notifications: true,
    dataUsage: 'WiFi uniquement',
    autoLock: true,
    hapticFeedback: true,
    soundEffects: true,
    backgroundRefresh: true,
    locationServices: false,
    cacheSize: 'Moyen',
    autoDownloadUpdates: true,
    developerMode: false,
  });

  const [storageInfo, setStorageInfo] = useState({
    cacheSize: '0 MB',
    totalSize: '0 MB',
    availableSpace: '0 MB'
  });

  useEffect(() => {
    loadSettings();
    calculateStorageInfo();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('appSettings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...settings, ...parsed });
        console.log('✅ Paramètres chargés:', parsed);
      }
    } catch (error) {
      console.error('❌ Erreur chargement paramètres:', error);
    }
  };

  const saveSettings = async (newSettings: AppSettings) => {
    try {
      await AsyncStorage.setItem('appSettings', JSON.stringify(newSettings));
      setSettings(newSettings);
      console.log('✅ Paramètres sauvegardés:', newSettings);
    } catch (error) {
      console.error('❌ Erreur sauvegarde paramètres:', error);
    }
  };

  const updateSetting = (key: keyof AppSettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    saveSettings(newSettings);
  };

  const calculateStorageInfo = async () => {
    try {
      // Simulation du calcul de l'espace de stockage
      setStorageInfo({
        cacheSize: '15.2 MB',
        totalSize: '127.8 MB',
        availableSpace: '2.4 GB'
      });
    } catch (error) {
      console.error('❌ Erreur calcul stockage:', error);
    }
  };

  const clearCache = () => {
    Alert.alert(
      'Vider le cache',
      `Cela supprimera ${storageInfo.cacheSize} de données temporaires. L'application pourrait être plus lente au prochain démarrage. Continuer ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Vider',
          style: 'destructive',
          onPress: async () => {
            try {
              // Vider seulement les données de cache, pas les données utilisateur
              await AsyncStorage.removeItem('nutritionCache');
              await AsyncStorage.removeItem('imageCache');
              await AsyncStorage.removeItem('temporaryData');
              
              setStorageInfo({ ...storageInfo, cacheSize: '0 MB' });
              Alert.alert('✅ Succès', 'Cache vidé avec succès');
              console.log('✅ Cache vidé');
            } catch (error) {
              Alert.alert('❌ Erreur', 'Impossible de vider le cache');
              console.error('❌ Erreur vidage cache:', error);
            }
          }
        }
      ]
    );
  };

  const exportUserData = () => {
    Alert.alert(
      'Exporter mes données',
      'Un fichier contenant toutes vos données personnelles sera généré et partagé. Cette opération peut prendre quelques minutes.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Exporter',
          onPress: () => {
            // Simulation de l'export
            Alert.alert('✅ Export en cours', 'Vos données seront disponibles dans votre email sous 24h');
            console.log('📊 Export des données demandé pour:', user?.email);
          }
        }
      ]
    );
  };

  const resetAllSettings = () => {
    Alert.alert(
      '⚠️ Réinitialiser tous les paramètres',
      'Cette action restaurera TOUS les paramètres par défaut. Vos données personnelles (nutrition, entraînements) ne seront PAS supprimées. Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Réinitialiser',
          style: 'destructive',
          onPress: async () => {
            const defaultSettings: AppSettings = {
              darkMode: true,
              autoSync: true,
              offlineMode: false,
              analytics: true,
              crashReporting: true,
              language: 'Français',
              units: 'Métrique',
              notifications: true,
              dataUsage: 'WiFi uniquement',
              autoLock: true,
              hapticFeedback: true,
              soundEffects: true,
              backgroundRefresh: true,
              locationServices: false,
              cacheSize: 'Moyen',
              autoDownloadUpdates: true,
              developerMode: false,
            };
            await saveSettings(defaultSettings);
            Alert.alert('✅ Succès', 'Paramètres réinitialisés avec succès');
            console.log('🔄 Paramètres réinitialisés');
          }
        }
      ]
    );
  };

  const showLanguageOptions = () => {
    const languageOptions = [
      { label: t('french'), code: 'fr' as SupportedLanguage },
      { label: t('english'), code: 'en' as SupportedLanguage },
      { label: t('spanish'), code: 'es' as SupportedLanguage },
      { label: t('german'), code: 'de' as SupportedLanguage },
    ];

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title: t('choose_language'),
          options: [...languageOptions.map(lang => lang.label), t('cancel')],
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
        t('choose_language'),
        'Sélectionnez votre langue préférée',
        [
          ...languageOptions.map(lang => ({
            text: lang.label,
            onPress: () => {
              setLanguage(lang.code);
              updateSetting('language', lang.label);
            }
          })),
          { text: t('cancel'), style: 'cancel' }
        ]
      );
    }
  };

  const showUnitsOptions = () => {
    const units = [
      { label: 'Métrique (kg, cm, km)', value: 'Métrique' },
      { label: 'Impérial (lbs, ft, miles)', value: 'Impérial' }
    ];

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title: 'Système d\'unités',
          options: [...units.map(unit => unit.label), 'Annuler'],
          cancelButtonIndex: units.length,
        },
        (buttonIndex) => {
          if (buttonIndex < units.length) {
            updateSetting('units', units[buttonIndex].value);
          }
        }
      );
    } else {
      Alert.alert(
        'Système d\'unités',
        'Choisir le système d\'unités pour les mesures',
        [
          ...units.map(unit => ({
            text: unit.label,
            onPress: () => updateSetting('units', unit.value)
          })),
          { text: 'Annuler', style: 'cancel' }
        ]
      );
    }
  };

  const showDataUsageOptions = () => {
    const options = [
      'WiFi uniquement',
      'WiFi et données mobiles', 
      'Données mobiles uniquement'
    ];

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
        'Contrôler quand l\'app peut utiliser internet',
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

  const openAppSettings = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  };

  const contactSupport = () => {
    const email = 'support@eatfitbymax.com';
    const subject = 'Support EatFitByMax - Paramètres Application';
    const body = `Bonjour,\n\nJ'ai besoin d'aide concernant les paramètres de l'application.\n\nVersion: 1.0.0\nPlateforme: ${Platform.OS}\nUtilisateur: ${user?.email || 'Non connecté'}\n\nDescription du problème:\n`;
    
    Linking.openURL(`mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  const SettingItem = ({ 
    icon, 
    title, 
    description, 
    children, 
    onPress, 
    showArrow = false,
    isDangerous = false 
  }: {
    icon: string;
    title: string;
    description: string;
    children?: React.ReactNode;
    onPress?: () => void;
    showArrow?: boolean;
    isDangerous?: boolean;
  }) => (
    <TouchableOpacity 
      style={[styles.settingItem, { backgroundColor: theme.card, borderColor: theme.border }]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.settingContent}>
        <Text style={styles.settingIcon}>{icon}</Text>
        <View style={styles.settingInfo}>
          <Text style={[
            styles.settingTitle, 
            { color: isDangerous ? '#F85149' : theme.text }
          ]}>
            {title}
          </Text>
          <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
            {description}
          </Text>
        </View>
        <View style={styles.settingControl}>
          {children}
          {showArrow && (
            <Text style={[styles.settingArrow, { color: theme.textSecondary }]}>›</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={[styles.backText, { color: theme.text }]}>←</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.text }]}>Paramètres de l'app</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Apparence et Interface */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>🎨 Apparence et Interface</Text>

          <SettingItem
            icon="🌙"
            title="Mode sombre"
            description={isDarkMode ? "Interface sombre activée" : "Interface claire activée"}
          >
            <Switch
              value={isDarkMode}
              onValueChange={toggleTheme}
              trackColor={{ false: '#39404A', true: '#1F6FEB' }}
              thumbColor={isDarkMode ? '#FFFFFF' : '#F0F3F6'}
            />
          </SettingItem>

          <SettingItem
            icon="🌍"
            title="Langue"
            description={`Langue actuelle: ${settings.language}`}
            onPress={showLanguageOptions}
            showArrow
          />

          <SettingItem
            icon="📏"
            title="Unités de mesure"
            description={settings.units === 'Métrique' ? 'Kilogrammes, centimètres' : 'Livres, pieds'}
            onPress={showUnitsOptions}
            showArrow
          />

          <SettingItem
            icon="📳"
            title="Retour haptique"
            description="Vibrations lors des interactions"
          >
            <Switch
              value={settings.hapticFeedback}
              onValueChange={(value) => updateSetting('hapticFeedback', value)}
              trackColor={{ false: '#39404A', true: '#1F6FEB' }}
              thumbColor={settings.hapticFeedback ? '#FFFFFF' : '#F0F3F6'}
            />
          </SettingItem>

          <SettingItem
            icon="🔊"
            title="Effets sonores"
            description="Sons d'interface et notifications"
          >
            <Switch
              value={settings.soundEffects}
              onValueChange={(value) => updateSetting('soundEffects', value)}
              trackColor={{ false: '#39404A', true: '#1F6FEB' }}
              thumbColor={settings.soundEffects ? '#FFFFFF' : '#F0F3F6'}
            />
          </SettingItem>
        </View>

        {/* Synchronisation et Données */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>🔄 Synchronisation et Données</Text>

          <SettingItem
            icon="⚡"
            title="Synchronisation automatique"
            description="Synchroniser vos données automatiquement"
          >
            <Switch
              value={settings.autoSync}
              onValueChange={(value) => updateSetting('autoSync', value)}
              trackColor={{ false: '#39404A', true: '#1F6FEB' }}
              thumbColor={settings.autoSync ? '#FFFFFF' : '#F0F3F6'}
            />
          </SettingItem>

          <SettingItem
            icon="🔄"
            title="Actualisation en arrière-plan"
            description="Mettre à jour les données quand l'app est fermée"
          >
            <Switch
              value={settings.backgroundRefresh}
              onValueChange={(value) => updateSetting('backgroundRefresh', value)}
              trackColor={{ false: '#39404A', true: '#1F6FEB' }}
              thumbColor={settings.backgroundRefresh ? '#FFFFFF' : '#F0F3F6'}
            />
          </SettingItem>

          <SettingItem
            icon="📡"
            title="Utilisation des données"
            description={settings.dataUsage}
            onPress={showDataUsageOptions}
            showArrow
          />

          <SettingItem
            icon="✈️"
            title="Mode hors ligne"
            description="Utiliser l'app sans connexion internet"
          >
            <Switch
              value={settings.offlineMode}
              onValueChange={(value) => updateSetting('offlineMode', value)}
              trackColor={{ false: '#39404A', true: '#1F6FEB' }}
              thumbColor={settings.offlineMode ? '#FFFFFF' : '#F0F3F6'}
            />
          </SettingItem>

          <SettingItem
            icon="📲"
            title="Mises à jour automatiques"
            description="Télécharger automatiquement les mises à jour"
          >
            <Switch
              value={settings.autoDownloadUpdates}
              onValueChange={(value) => updateSetting('autoDownloadUpdates', value)}
              trackColor={{ false: '#39404A', true: '#1F6FEB' }}
              thumbColor={settings.autoDownloadUpdates ? '#FFFFFF' : '#F0F3F6'}
            />
          </SettingItem>
        </View>

        {/* Sécurité et Confidentialité */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>🔒 Sécurité et Confidentialité</Text>

          <SettingItem
            icon="🔐"
            title="Verrouillage automatique"
            description="Verrouiller l'app après inactivité"
          >
            <Switch
              value={settings.autoLock}
              onValueChange={(value) => updateSetting('autoLock', value)}
              trackColor={{ false: '#39404A', true: '#1F6FEB' }}
              thumbColor={settings.autoLock ? '#FFFFFF' : '#F0F3F6'}
            />
          </SettingItem>

          <SettingItem
            icon="📍"
            title="Services de localisation"
            description="Utiliser votre position pour les fonctionnalités"
          >
            <Switch
              value={settings.locationServices}
              onValueChange={(value) => updateSetting('locationServices', value)}
              trackColor={{ false: '#39404A', true: '#1F6FEB' }}
              thumbColor={settings.locationServices ? '#FFFFFF' : '#F0F3F6'}
            />
          </SettingItem>

          <SettingItem
            icon="📊"
            title="Analyses d'utilisation"
            description="Partager des données anonymes pour améliorer l'app"
          >
            <Switch
              value={settings.analytics}
              onValueChange={(value) => updateSetting('analytics', value)}
              trackColor={{ false: '#39404A', true: '#1F6FEB' }}
              thumbColor={settings.analytics ? '#FFFFFF' : '#F0F3F6'}
            />
          </SettingItem>

          <SettingItem
            icon="🚨"
            title="Rapports de crash"
            description="Envoyer automatiquement les rapports d'erreur"
          >
            <Switch
              value={settings.crashReporting}
              onValueChange={(value) => updateSetting('crashReporting', value)}
              trackColor={{ false: '#39404A', true: '#1F6FEB' }}
              thumbColor={settings.crashReporting ? '#FFFFFF' : '#F0F3F6'}
            />
          </SettingItem>

          <SettingItem
            icon="🛡️"
            title="Paramètres de sécurité avancés"
            description="Authentification, sessions, chiffrement"
            onPress={() => router.push('/(client)/securite-confidentialite')}
            showArrow
          />
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>🔔 Notifications</Text>

          <SettingItem
            icon="📱"
            title="Notifications"
            description="Gérer toutes vos notifications"
            onPress={() => router.push('/(client)/notifications')}
            showArrow
          />

          <SettingItem
            icon="⚙️"
            title="Paramètres système"
            description="Ouvrir les paramètres iOS/Android"
            onPress={openAppSettings}
            showArrow
          />
        </View>

        {/* Stockage et Performance */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>💾 Stockage et Performance</Text>

          <View style={[styles.storageInfo, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.storageTitle, { color: theme.text }]}>📊 Utilisation du stockage</Text>
            <View style={styles.storageDetails}>
              <View style={styles.storageRow}>
                <Text style={[styles.storageLabel, { color: theme.textSecondary }]}>Cache:</Text>
                <Text style={[styles.storageValue, { color: theme.text }]}>{storageInfo.cacheSize}</Text>
              </View>
              <View style={styles.storageRow}>
                <Text style={[styles.storageLabel, { color: theme.textSecondary }]}>Total app:</Text>
                <Text style={[styles.storageValue, { color: theme.text }]}>{storageInfo.totalSize}</Text>
              </View>
              <View style={styles.storageRow}>
                <Text style={[styles.storageLabel, { color: theme.textSecondary }]}>Espace libre:</Text>
                <Text style={[styles.storageValue, { color: '#32D74B' }]}>{storageInfo.availableSpace}</Text>
              </View>
            </View>
          </View>

          <SettingItem
            icon="🗑️"
            title="Vider le cache"
            description={`Libérer ${storageInfo.cacheSize} d'espace de stockage`}
            onPress={clearCache}
            showArrow
          />

          <SettingItem
            icon="📤"
            title="Exporter mes données"
            description="Télécharger toutes vos données personnelles"
            onPress={exportUserData}
            showArrow
          />
        </View>

        {/* Support et Aide */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>💬 Support et Aide</Text>

          <SettingItem
            icon="❓"
            title="Aide et Feedback"
            description="Questions fréquentes et support"
            onPress={() => router.push('/(client)/aide-feedback')}
            showArrow
          />

          <SettingItem
            icon="📧"
            title="Contacter le support"
            description="Envoyer un email à notre équipe"
            onPress={contactSupport}
            showArrow
          />

          <SettingItem
            icon="📄"
            title="Conditions d'utilisation"
            description="Consulter nos conditions"
            onPress={() => Linking.openURL('https://eatfitbymax.com/terms')}
            showArrow
          />

          <SettingItem
            icon="🔐"
            title="Politique de confidentialité"
            description="Comment nous protégeons vos données"
            onPress={() => Linking.openURL('https://eatfitbymax.com/privacy')}
            showArrow
          />
        </View>

        {/* Actions Avancées */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>⚠️ Actions Avancées</Text>

          <SettingItem
            icon="🔄"
            title="Réinitialiser les paramètres"
            description="Restaurer tous les paramètres par défaut"
            onPress={resetAllSettings}
            showArrow
            isDangerous
          />

          {__DEV__ && (
            <SettingItem
              icon="🛠️"
              title="Mode développeur"
              description="Fonctionnalités de débogage (dev seulement)"
            >
              <Switch
                value={settings.developerMode}
                onValueChange={(value) => updateSetting('developerMode', value)}
                trackColor={{ false: '#39404A', true: '#F85149' }}
                thumbColor={settings.developerMode ? '#FFFFFF' : '#F0F3F6'}
              />
            </SettingItem>
          )}
        </View>

        {/* Version et Informations */}
        <View style={styles.versionContainer}>
          <Text style={[styles.appName, { color: theme.text }]}>EatFitByMax</Text>
          <Text style={[styles.versionText, { color: theme.textSecondary }]}>Version 1.0.0 (Build 2025.07.26)</Text>
          <Text style={[styles.versionSubtext, { color: theme.textSecondary }]}>
            Dernière mise à jour: 26 juillet 2025
          </Text>
          <Text style={[styles.deviceInfo, { color: theme.textSecondary }]}>
            {Platform.OS === 'ios' ? '📱 iOS' : '🤖 Android'} • {Platform.Version}
          </Text>
          {user && (
            <Text style={[styles.userInfo, { color: theme.textSecondary }]}>
              Connecté: {user.email}
            </Text>
          )}
        </View>

        {/* Espace supplémentaire en bas */}
        <View style={{ height: 50 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  backText: {
    fontSize: 24,
    fontWeight: '600',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40,
  },
  section: {
    padding: 20,
    paddingBottom: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  settingItem: {
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  settingIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    lineHeight: 18,
  },
  settingControl: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingArrow: {
    fontSize: 18,
    marginLeft: 8,
  },
  storageInfo: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
  },
  storageTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  storageDetails: {
    gap: 8,
  },
  storageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  storageLabel: {
    fontSize: 14,
  },
  storageValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  versionContainer: {
    padding: 20,
    alignItems: 'center',
    gap: 4,
  },
  appName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  versionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  versionSubtext: {
    fontSize: 12,
  },
  deviceInfo: {
    fontSize: 12,
    marginTop: 4,
  },
  userInfo: {
    fontSize: 11,
    marginTop: 8,
    fontStyle: 'italic',
  },
});
