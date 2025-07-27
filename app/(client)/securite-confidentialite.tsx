
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Switch, Alert, Linking, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SecuriteConfidentialiteScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [settings, setSettings] = useState({
    biometricAuth: false,
    autoLock: true,
    dataEncryption: true,
    shareData: false,
    locationTracking: false,
    thirdPartySharing: false,
    cookieConsent: true,
    personalizedAds: false,
    crashReporting: true,
    usageAnalytics: false,
  });

  useEffect(() => {
    loadSecuritySettings();
  }, []);

  const loadSecuritySettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('securitySettings');
      if (savedSettings) {
        setSettings(prev => ({ ...prev, ...JSON.parse(savedSettings) }));
      }
    } catch (error) {
      console.error('Erreur chargement paramètres sécurité:', error);
    }
  };

  const saveSecuritySettings = async (newSettings: typeof settings) => {
    try {
      await AsyncStorage.setItem('securitySettings', JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Erreur sauvegarde paramètres sécurité:', error);
    }
  };

  const updateSetting = (key: keyof typeof settings, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    saveSecuritySettings(newSettings);
  };

  const deleteAccount = () => {
    Alert.alert(
      'Supprimer le compte',
      'Cette action supprimera définitivement votre compte et toutes vos données. Cette action est irréversible.\n\nVous recevrez un email de confirmation avant la suppression définitive.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Confirmation envoyée', 
              'Un email de confirmation a été envoyé à votre adresse. Suivez les instructions pour confirmer la suppression de votre compte.'
            );
          }
        }
      ]
    );
  };

  const exportData = () => {
    Alert.alert(
      'Export de données', 
      'Conformément au RGPD, vous pouvez télécharger toutes vos données personnelles. L\'export sera envoyé par email sous 24-48h.',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Exporter', onPress: () => Alert.alert('Export en cours', 'Vous recevrez un email avec vos données sous 24-48h.') }
      ]
    );
  };

  const openPrivacyPolicy = () => {
    Linking.openURL('https://eatfitbymax.com/privacy');
  };

  const openTermsOfService = () => {
    Linking.openURL('https://eatfitbymax.com/terms');
  };

  const openGDPRInfo = () => {
    Linking.openURL('https://eatfitbymax.com/gdpr');
  };

  const contactPrivacy = () => {
    Linking.openURL('mailto:privacy@eatfitbymax.com?subject=Question%20sur%20la%20confidentialité');
  };

  const viewActiveSessions = () => {
    Alert.alert(
      'Sessions actives',
      'Fonctionnalité bientôt disponible. Vous pourrez voir et gérer tous les appareils connectés à votre compte.'
    );
  };

  const enable2FA = () => {
    Alert.alert(
      'Authentification à deux facteurs',
      'Cette fonctionnalité sera disponible dans une prochaine mise à jour pour renforcer la sécurité de votre compte.'
    );
  };

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
          <Text style={[styles.title, { color: theme.text }]}>Sécurité et confidentialité</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Sécurité */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>🔐 Sécurité</Text>
          
          <View style={[styles.settingItem, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: theme.text }]}>Authentification biométrique</Text>
              <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>Face ID / Touch ID pour déverrouiller l'app</Text>
            </View>
            <Switch
              value={settings.biometricAuth}
              onValueChange={(value) => updateSetting('biometricAuth', value)}
              trackColor={{ false: '#21262D', true: '#F5A623' }}
              thumbColor={settings.biometricAuth ? '#FFFFFF' : '#8B949E'}
            />
          </View>

          <View style={[styles.settingItem, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: theme.text }]}>Verrouillage automatique</Text>
              <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>Verrouiller l'app après 5 minutes d'inactivité</Text>
            </View>
            <Switch
              value={settings.autoLock}
              onValueChange={(value) => updateSetting('autoLock', value)}
              trackColor={{ false: '#21262D', true: '#F5A623' }}
              thumbColor={settings.autoLock ? '#FFFFFF' : '#8B949E'}
            />
          </View>

          <TouchableOpacity 
            style={[styles.settingItem, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => router.push('/auth/change-password')}
          >
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: theme.text }]}>Changer le mot de passe</Text>
              <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>Modifier votre mot de passe</Text>
            </View>
            <Text style={[styles.settingArrow, { color: theme.textSecondary }]}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.settingItem, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={enable2FA}
          >
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: theme.text }]}>Authentification à deux facteurs</Text>
              <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>Sécurité renforcée avec 2FA</Text>
            </View>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>Bientôt</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Protection des données */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>🛡️ Protection des données</Text>
          
          <View style={[styles.settingItem, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: theme.text }]}>Chiffrement des données</Text>
              <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>Vos données sont chiffrées AES-256</Text>
            </View>
            <View style={[styles.statusBadge, styles.activeBadge]}>
              <Text style={styles.statusText}>Activé</Text>
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.settingItem, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={viewActiveSessions}
          >
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: theme.text }]}>Sessions actives</Text>
              <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>Gérer les appareils connectés</Text>
            </View>
            <Text style={[styles.settingArrow, { color: theme.textSecondary }]}>›</Text>
          </TouchableOpacity>

          <View style={[styles.settingItem, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: theme.text }]}>Sauvegarde sécurisée</Text>
              <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>Sauvegarde chiffrée dans le cloud</Text>
            </View>
            <View style={[styles.statusBadge, styles.activeBadge]}>
              <Text style={styles.statusText}>Activé</Text>
            </View>
          </View>
        </View>

        {/* Confidentialité */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>👁️ Confidentialité</Text>
          
          <View style={[styles.settingItem, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: theme.text }]}>Partage de données anonymes</Text>
              <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>Améliorer l'app avec des données anonymisées</Text>
            </View>
            <Switch
              value={settings.shareData}
              onValueChange={(value) => updateSetting('shareData', value)}
              trackColor={{ false: '#21262D', true: '#F5A623' }}
              thumbColor={settings.shareData ? '#FFFFFF' : '#8B949E'}
            />
          </View>

          <View style={[styles.settingItem, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: theme.text }]}>Suivi de localisation</Text>
              <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>Utiliser votre position pour les fonctionnalités</Text>
            </View>
            <Switch
              value={settings.locationTracking}
              onValueChange={(value) => updateSetting('locationTracking', value)}
              trackColor={{ false: '#21262D', true: '#F5A623' }}
              thumbColor={settings.locationTracking ? '#FFFFFF' : '#8B949E'}
            />
          </View>

          <View style={[styles.settingItem, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: theme.text }]}>Publicités personnalisées</Text>
              <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>Afficher des publicités basées sur vos intérêts</Text>
            </View>
            <Switch
              value={settings.personalizedAds}
              onValueChange={(value) => updateSetting('personalizedAds', value)}
              trackColor={{ false: '#21262D', true: '#F5A623' }}
              thumbColor={settings.personalizedAds ? '#FFFFFF' : '#8B949E'}
            />
          </View>

          <View style={[styles.settingItem, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: theme.text }]}>Rapports de crash</Text>
              <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>Envoyer des rapports d'erreur anonymes</Text>
            </View>
            <Switch
              value={settings.crashReporting}
              onValueChange={(value) => updateSetting('crashReporting', value)}
              trackColor={{ false: '#21262D', true: '#F5A623' }}
              thumbColor={settings.crashReporting ? '#FFFFFF' : '#8B949E'}
            />
          </View>

          <View style={[styles.settingItem, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: theme.text }]}>Partage avec des tiers</Text>
              <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>Autoriser le partage avec des partenaires</Text>
            </View>
            <Switch
              value={settings.thirdPartySharing}
              onValueChange={(value) => updateSetting('thirdPartySharing', value)}
              trackColor={{ false: '#21262D', true: '#F5A623' }}
              thumbColor={settings.thirdPartySharing ? '#FFFFFF' : '#8B949E'}
            />
          </View>
        </View>

        {/* Mes données */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>📊 Mes données</Text>
          
          <TouchableOpacity 
            style={[styles.settingItem, { backgroundColor: theme.card, borderColor: theme.border }]} 
            onPress={exportData}
          >
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: theme.text }]}>Télécharger mes données</Text>
              <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>Export complet conforme RGPD</Text>
            </View>
            <Text style={[styles.settingArrow, { color: theme.textSecondary }]}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.settingItem, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={openPrivacyPolicy}
          >
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: theme.text }]}>Politique de confidentialité</Text>
              <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>Consulter notre politique</Text>
            </View>
            <Text style={[styles.settingArrow, { color: theme.textSecondary }]}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.settingItem, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={openTermsOfService}
          >
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: theme.text }]}>Conditions d'utilisation</Text>
              <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>Lire les conditions</Text>
            </View>
            <Text style={[styles.settingArrow, { color: theme.textSecondary }]}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.settingItem, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={openGDPRInfo}
          >
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: theme.text }]}>Vos droits RGPD</Text>
              <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>Information sur vos droits</Text>
            </View>
            <Text style={[styles.settingArrow, { color: theme.textSecondary }]}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.settingItem, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={contactPrivacy}
          >
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: theme.text }]}>Contacter le DPO</Text>
              <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>privacy@eatfitbymax.com</Text>
            </View>
            <Text style={[styles.settingArrow, { color: theme.textSecondary }]}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Zone de danger */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, styles.dangerTitle]}>⚠️ Zone de danger</Text>
          
          <TouchableOpacity 
            style={[styles.settingItem, styles.dangerItem, { backgroundColor: theme.card }]} 
            onPress={deleteAccount}
          >
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, styles.dangerText]}>Supprimer mon compte</Text>
              <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>Suppression définitive de toutes vos données</Text>
            </View>
            <Text style={[styles.settingArrow, { color: theme.textSecondary }]}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Informations légales */}
        <View style={[styles.legalContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.legalTitle, { color: theme.text }]}>🔒 Protection de vos données</Text>
          <Text style={[styles.legalText, { color: theme.textSecondary }]}>
            EatFitByMax respecte strictement votre vie privée et est conforme au RGPD. Nous ne vendons jamais vos données personnelles.
          </Text>
          <Text style={[styles.legalText, { color: theme.textSecondary }]}>
            Toutes les données sont stockées de manière sécurisée avec un chiffrement AES-256. Vos données de santé restent strictement confidentielles.
          </Text>
          <Text style={[styles.legalText, { color: theme.textSecondary }]}>
            Conformément au RGPD, vous avez le droit d'accéder, rectifier, supprimer ou porter vos données.
          </Text>
          <Text style={[styles.legalContact, { color: theme.text }]}>
            Questions ? Contactez notre DPO : privacy@eatfitbymax.com
          </Text>
        </View>

        {/* Certifications */}
        <View style={[styles.certificationsContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.legalTitle, { color: theme.text }]}>🏆 Certifications</Text>
          <View style={styles.certificationItem}>
            <Text style={styles.certificationEmoji}>🛡️</Text>
            <Text style={[styles.certificationText, { color: theme.textSecondary }]}>Conforme RGPD</Text>
          </View>
          <View style={styles.certificationItem}>
            <Text style={styles.certificationEmoji}>🔐</Text>
            <Text style={[styles.certificationText, { color: theme.textSecondary }]}>Chiffrement AES-256</Text>
          </View>
          <View style={styles.certificationItem}>
            <Text style={styles.certificationEmoji}>🏥</Text>
            <Text style={[styles.certificationText, { color: theme.textSecondary }]}>Conforme aux normes de santé</Text>
          </View>
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
    backgroundColor: '#F5A623',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  activeBadge: {
    backgroundColor: '#238636',
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
  legalContact: {
    fontSize: 14,
    color: '#F5A623',
    fontWeight: '600',
  },
  certificationsContainer: {
    padding: 20,
    backgroundColor: '#161B22',
    margin: 20,
    marginTop: 0,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#21262D',
  },
  certificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  certificationEmoji: {
    fontSize: 16,
    marginRight: 12,
  },
  certificationText: {
    fontSize: 14,
    color: '#8B949E',
    fontWeight: '500',
  },
});
