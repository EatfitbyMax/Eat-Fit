
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { getCurrentUser, deleteUserAccount } from '../../utils/auth';

export default function SupprimerCompte() {
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Avertissement, 2: Confirmation

  const handleDeleteAccount = async () => {
    if (confirmText.toLowerCase() !== 'supprimer') {
      Alert.alert('Erreur', 'Veuillez taper "SUPPRIMER" pour confirmer');
      return;
    }

    setLoading(true);

    try {
      const user = await getCurrentUser();
      if (!user) {
        Alert.alert('Erreur', 'Utilisateur non connecté');
        return;
      }

      // Confirmation finale
      Alert.alert(
        'Suppression définitive',
        'Cette action est irréversible. Toutes vos données seront définitivement supprimées.',
        [
          { text: 'Annuler', style: 'cancel', onPress: () => setLoading(false) },
          {
            text: 'Supprimer définitivement',
            style: 'destructive',
            onPress: async () => {
              try {
                await deleteUserAccount(user.id);
                Alert.alert(
                  'Compte supprimé',
                  'Votre compte a été supprimé avec succès. Nous sommes désolés de vous voir partir.',
                  [{ text: 'OK', onPress: () => router.replace('/auth/login') }]
                );
              } catch (error) {
                console.error('Erreur suppression compte:', error);
                Alert.alert('Erreur', 'Impossible de supprimer le compte. Contactez le support.');
              } finally {
                setLoading(false);
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Erreur:', error);
      Alert.alert('Erreur', 'Une erreur est survenue');
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.warningTitle}>⚠️ Attention</Text>
      <Text style={styles.warningText}>
        La suppression de votre compte est une action définitive et irréversible.
      </Text>

      <View style={styles.dataList}>
        <Text style={styles.dataTitle}>Les données suivantes seront supprimées :</Text>
        <Text style={styles.dataItem}>• Votre profil utilisateur</Text>
        <Text style={styles.dataItem}>• Vos objectifs et programmes</Text>
        <Text style={styles.dataItem}>• Votre historique d'entraînements</Text>
        <Text style={styles.dataItem}>• Vos données nutritionnelles</Text>
        <Text style={styles.dataItem}>• Vos préférences et paramètres</Text>
        <Text style={styles.dataItem}>• Votre historique de messages avec le coach</Text>
      </View>

      <View style={styles.alternativeSection}>
        <Text style={styles.alternativeTitle}>Alternatives à considérer :</Text>
        <Text style={styles.alternativeItem}>• Désactiver temporairement votre compte</Text>
        <Text style={styles.alternativeItem}>• Contacter notre support pour une pause</Text>
        <Text style={styles.alternativeItem}>• Exporter vos données avant suppression</Text>
      </View>

      <TouchableOpacity
        style={styles.continueButton}
        onPress={() => setStep(2)}
      >
        <Text style={styles.continueButtonText}>Continuer la suppression</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.cancelButton}
        onPress={() => router.back()}
      >
        <Text style={styles.cancelButtonText}>Annuler</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.confirmTitle}>Confirmation finale</Text>
      <Text style={styles.confirmText}>
        Pour confirmer la suppression définitive de votre compte, tapez le mot "SUPPRIMER" ci-dessous :
      </Text>

      <TextInput
        style={styles.confirmInput}
        value={confirmText}
        onChangeText={setConfirmText}
        placeholder="Tapez SUPPRIMER"
        placeholderTextColor="#666"
        autoCapitalize="characters"
      />

      <TouchableOpacity
        style={[
          styles.deleteButton,
          confirmText.toLowerCase() !== 'supprimer' && styles.deleteButtonDisabled,
        ]}
        onPress={handleDeleteAccount}
        disabled={loading || confirmText.toLowerCase() !== 'supprimer'}
      >
        {loading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.deleteButtonText}>Supprimer définitivement mon compte</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => setStep(1)}
        disabled={loading}
      >
        <Text style={styles.backButtonText}>Retour</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <Text style={styles.headerButtonText}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Supprimer mon compte</Text>
      </View>

      {step === 1 ? renderStep1() : renderStep2()}

      <View style={styles.supportSection}>
        <Text style={styles.supportText}>
          Besoin d'aide ? Contactez notre support à support@eatfitbymax.com
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    paddingTop: 20,
  },
  headerButton: {
    padding: 10,
  },
  headerButtonText: {
    color: '#4A9EFF',
    fontSize: 16,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
    marginRight: 60, // Pour centrer en compensant le bouton retour
  },
  stepContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  warningTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B6B',
    textAlign: 'center',
    marginBottom: 15,
  },
  warningText: {
    fontSize: 16,
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 22,
  },
  dataList: {
    marginBottom: 25,
  },
  dataTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 10,
  },
  dataItem: {
    fontSize: 14,
    color: '#CCC',
    marginBottom: 5,
    paddingLeft: 10,
  },
  alternativeSection: {
    backgroundColor: '#2a2a2a',
    padding: 15,
    borderRadius: 10,
    marginBottom: 25,
  },
  alternativeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4A9EFF',
    marginBottom: 10,
  },
  alternativeItem: {
    fontSize: 14,
    color: '#CCC',
    marginBottom: 5,
    paddingLeft: 10,
  },
  continueButton: {
    backgroundColor: '#FF6B6B',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  continueButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  cancelButton: {
    backgroundColor: '#333',
    padding: 15,
    borderRadius: 10,
  },
  cancelButtonText: {
    color: '#FFF',
    fontSize: 16,
    textAlign: 'center',
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF6B6B',
    textAlign: 'center',
    marginBottom: 15,
  },
  confirmText: {
    fontSize: 16,
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 22,
  },
  confirmInput: {
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 25,
  },
  deleteButton: {
    backgroundColor: '#FF6B6B',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  deleteButtonDisabled: {
    backgroundColor: '#444',
  },
  deleteButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: '#333',
    padding: 15,
    borderRadius: 10,
  },
  backButtonText: {
    color: '#FFF',
    fontSize: 16,
    textAlign: 'center',
  },
  supportSection: {
    backgroundColor: '#2a2a2a',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
  },
  supportText: {
    fontSize: 14,
    color: '#CCC',
    textAlign: 'center',
    lineHeight: 20,
  },
});
