
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
        console.error('Erreur callback Strava:', error);
        router.replace('/(client)/profil');
        return;
      }

      if (code && typeof code === 'string') {
        const currentUser = await getCurrentUser();
        if (currentUser) {
          const success = await IntegrationsManager.exchangeStravaCode(code, currentUser.id);
          if (success) {
            console.log('✅ Connexion Strava réussie');
          } else {
            console.error('❌ Échec de la connexion Strava');
          }
        }
      }

      // Rediriger vers le profil
      router.replace('/(client)/profil');
    } catch (error) {
      console.error('Erreur traitement callback Strava:', error);
      router.replace('/(client)/profil');
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
