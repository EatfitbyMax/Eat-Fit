
import { useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { IntegrationsManager } from '../../utils/integrations';
import { getCurrentUser } from '../../utils/auth';

export default function StravaCallbackScreen() {
  const router = useRouter();
  const { code, error } = useLocalSearchParams();

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    try {
      if (error) {
        console.error('❌ Erreur callback Strava:', error);
        // Attendre un peu avant de rediriger pour que l'utilisateur voie le message
        setTimeout(() => {
          router.replace('/(client)/profil');
        }, 1000);
        return;
      }

      if (code && typeof code === 'string') {
        console.log('✅ Code d\'autorisation Strava reçu - traitement côté serveur');
        // Le traitement du code se fait maintenant entièrement côté serveur
        // via la route /strava-callback du serveur VPS
      }

      // Attendre un peu puis rediriger vers le profil
      setTimeout(() => {
        router.replace('/(client)/profil');
      }, 500);
    } catch (error) {
      console.error('❌ Erreur traitement callback Strava:', error);
      setTimeout(() => {
        router.replace('/(client)/profil');
      }, 1000);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0A0A0A' }}>
      <ActivityIndicator size="large" color="#28A745" />
      <Text style={{ color: '#FFFFFF', marginTop: 16 }}>
        Connexion à Strava en cours...
      </Text>
    </View>
  );
}
