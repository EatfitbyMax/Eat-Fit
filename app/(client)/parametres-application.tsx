
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Switch, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ParametresApplicationScreen() {
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
          <Text style={styles.title}>Paramètres de l'application</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Apparence */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎨 Apparence</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Mode sombre</Text>
              <Text style={styles.settingDescription}>Interface sombre pour vos yeux</Text>
            </View>
            <Switch
              value={settings.darkMode}
              onValueChange={(value) => updateSetting('darkMode', value)}
              trackColor={{ false: '#21262D', true: '#1F6FEB' }}
              thumbColor={settings.darkMode ? '#FFFFFF' : '#8B949E'}
            />
          </View>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Langue</Text>
              <Text style={styles.settingDescription}>{settings.language}</Text>
            </View>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Unités</Text>
              <Text style={styles.settingDescription}>{settings.units} (kg, cm)</Text>
            </View>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Synchronisation */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔄 Synchronisation</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Synchronisation automatique</Text>
              <Text style={styles.settingDescription}>Synchroniser automatiquement vos données</Text>
            </View>
            <Switch
              value={settings.autoSync}
              onValueChange={(value) => updateSetting('autoSync', value)}
              trackColor={{ false: '#21262D', true: '#1F6FEB' }}
              thumbColor={settings.autoSync ? '#FFFFFF' : '#8B949E'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Mode hors ligne</Text>
              <Text style={styles.settingDescription}>Utiliser l'app sans connexion internet</Text>
            </View>
            <Switch
              value={settings.offlineMode}
              onValueChange={(value) => updateSetting('offlineMode', value)}
              trackColor={{ false: '#21262D', true: '#1F6FEB' }}
              thumbColor={settings.offlineMode ? '#FFFFFF' : '#8B949E'}
            />
          </View>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Utilisation des données</Text>
              <Text style={styles.settingDescription}>{settings.dataUsage}</Text>
            </View>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Données et stockage */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💾 Données et stockage</Text>
          
          <TouchableOpacity style={styles.settingItem} onPress={clearCache}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Vider le cache</Text>
              <Text style={styles.settingDescription}>Libérer de l'espace de stockage</Text>
            </View>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Sauvegarde</Text>
              <Text style={styles.settingDescription}>Sauvegarder vos données</Text>
            </View>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Exporter les données</Text>
              <Text style={styles.settingDescription}>Télécharger vos données</Text>
            </View>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Confidentialité */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔒 Confidentialité</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Analytics</Text>
              <Text style={styles.settingDescription}>Partager des données d'utilisation anonymes</Text>
            </View>
            <Switch
              value={settings.analytics}
              onValueChange={(value) => updateSetting('analytics', value)}
              trackColor={{ false: '#21262D', true: '#1F6FEB' }}
              thumbColor={settings.analytics ? '#FFFFFF' : '#8B949E'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Rapports de crash</Text>
              <Text style={styles.settingDescription}>Envoyer automatiquement les rapports d'erreur</Text>
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
          <Text style={styles.sectionTitle}>⚙️ Actions</Text>
          
          <TouchableOpacity style={styles.settingItem} onPress={resetSettings}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, styles.dangerText]}>Réinitialiser les paramètres</Text>
              <Text style={styles.settingDescription}>Restaurer les paramètres par défaut</Text>
            </View>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Version */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>EatFitByMax v1.0.0</Text>
          <Text style={styles.versionSubtext}>Dernière mise à jour: 11 juin 2024</Text>
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
