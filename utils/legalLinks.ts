
import { Linking, Alert } from 'react-native';

export const openPrivacyPolicy = async () => {
  try {
    const url = 'https://planet-tea-fb8.notion.site/Politique-de-confidentialit-Eat-Fit-23f4c5464bf9805a9fa7db55c9535cad';
    const supported = await Linking.canOpenURL(url);
    
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert('Erreur', 'Impossible d\'ouvrir le lien');
    }
  } catch (error) {
    console.error('Erreur ouverture politique de confidentialité:', error);
    Alert.alert('Erreur', 'Impossible d\'ouvrir le lien');
  }
};

export const openTermsOfService = async () => {
  try {
    const url = 'https://planet-tea-fb8.notion.site/Conditions-G-n-rales-d-Utilisation-CGU-Eat-Fit-23f4c5464bf980baa80fc94542a0fb67';
    const supported = await Linking.canOpenURL(url);
    
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert('Erreur', 'Impossible d\'ouvrir le lien');
    }
  } catch (error) {
    console.error('Erreur ouverture conditions d\'utilisation:', error);
    Alert.alert('Erreur', 'Impossible d\'ouvrir le lien');
  }
};

export const openAppleSubscriptionSettings = async () => {
  try {
    // Sur iOS, ouvrir directement les réglages d'abonnements
    const url = 'itms-apps://apps.apple.com/account/subscriptions';
    const supported = await Linking.canOpenURL(url);
    
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert(
        'Gérer les abonnements',
        'Pour gérer vos abonnements, allez dans Réglages > Votre nom > Abonnements sur votre appareil iOS.'
      );
    }
  } catch (error) {
    console.error('Erreur ouverture réglages Apple:', error);
    Alert.alert(
      'Gérer les abonnements',
      'Pour gérer vos abonnements, allez dans Réglages > Votre nom > Abonnements sur votre appareil iOS.'
    );
  }
};
