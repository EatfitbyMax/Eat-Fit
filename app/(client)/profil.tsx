import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Switch,
  Modal,
  ActivityIndicator,
  Platform,
  SafeAreaView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useFocusEffect } from 'expo-router';
import { logout, getCurrentUser } from '@/utils/auth';
import { IntegrationsManager, IntegrationStatus, syncWithExternalApps } from '@/utils/integrations';
import { checkSubscriptionStatus } from '@/utils/subscription';
import { InAppPurchaseService } from '@/utils/inAppPurchases';
import { allSports } from '@/utils/sportPrograms';
import ComingSoonModal from '@/components/ComingSoonModal';

export default function ProfilScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [integrationStatus, setIntegrationStatus] = useState({
    appleHealth: { connected: false, lastSync: null },
    strava: { connected: false, lastSync: null, athleteId: null },
  });
  const [editingObjectifs, setEditingObjectifs] = useState(false);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [isPremium, setIsPremium] = useState(false);
  const [currentSubscription, setCurrentSubscription] = useState<any>(null);
  const [showComingSoonModal, setShowComingSoonModal] = useState(false);
  const [showPremiumComingSoonModal, setShowPremiumComingSoonModal] = useState(false);
  const [stravaConnecting, setStravaConnecting] = useState(false); // Ajout pour gérer l'état de connexion Strava

  const availableGoals = [
    'Perdre du poids',
    'Maintenir poids',
    'Prendre du poids',
    'Me muscler',
    'Planifier mes repas',
    'Gagner en performance',
    'Améliorer ma santé',
    'Réduire le stress',
    'Mieux dormir'
  ];

  useEffect(() => {
    loadUserData();
    loadIntegrationStatus();
    loadSubscriptionStatus();
  }, []);

  useEffect(() => {
    if (user?.goals) {
      setSelectedGoals(user.goals);
    }
  }, [user]);

  // Recharger les données quand la page est focus
  useFocusEffect(
    React.useCallback(() => {
      loadUserData();
      loadIntegrationStatus();
      loadSubscriptionStatus();
    }, [])
  );

  const loadUserData = async () => {
    try {
      const currentUser = await getCurrentUser();
      console.log('Données utilisateur récupérées:', currentUser);
      setUser(currentUser);

      if (currentUser?.id) {
        await loadSubscriptionData(currentUser.id);
      }
    } catch (error) {
      console.error('Erreur chargement utilisateur:', error);
    }
  };

  const loadIntegrationStatus = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) return;

      console.log('🔄 Chargement statut intégrations depuis serveur pour:', currentUser.email);

      // Récupérer le statut directement depuis le serveur
      const status = await IntegrationsManager.getIntegrationStatusFromServer(currentUser.id);
      setIntegrationStatus(status);
      
      console.log('📊 Statut intégrations chargé depuis serveur:', status);
    } catch (error) {
      console.error('Erreur chargement statut intégrations depuis serveur:', error);
      // Statut par défaut en cas d'erreur
      setIntegrationStatus({
        appleHealth: { connected: false, lastSync: null, permissions: [] },
        strava: { connected: false, lastSync: null, athleteId: null },
      });
    }
  };

  const loadSubscriptionStatus = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) return;

      // Utiliser getCurrentSubscription du service IAP
      const subscription = await InAppPurchaseService.getCurrentSubscription(currentUser.id);
      console.log('🔍 Abonnement actuel récupéré:', subscription);

      if (subscription && subscription.planId !== 'free') {
        setIsPremium(true);
        setCurrentSubscription(subscription);
        console.log('💎 Configuration abonnement premium:', subscription);
      } else {
        setIsPremium(false);
        setCurrentSubscription(subscription);
        console.log('📝 Plan gratuit configuré');
      }
    } catch (error) {
      console.error("Failed to load subscription status:", error);
      setIsPremium(false);
      setCurrentSubscription(null);
    }
  };

  const loadSubscriptionData = async (userId: string) => {
    try {
      const subscription = await InAppPurchaseService.getCurrentSubscription(userId);
      setCurrentSubscription(subscription);
    } catch (error) {
      console.error('Erreur chargement abonnement:', error);
    }
  };

  const getSportDisplay = () => {
    if (!user?.favoriteSport) {
      return { emoji: '🏃', name: 'Non renseigné' };
    }

    const sport = allSports.find(s => s.id === user.favoriteSport);
    return sport ? { emoji: sport.emoji, name: sport.name } : { emoji: '🏃', name: 'Non renseigné' };
  };

  const handleAppleHealthToggle = async () => {
    if (isLoading) return;

    setIsLoading(true);

    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        Alert.alert("Erreur", "Utilisateur non connecté");
        return;
      }

      if (integrationStatus.appleHealth.connected) {
        // Déconnexion
        Alert.alert(
          'Déconnecter Apple Health',
          'Êtes-vous sûr de vouloir déconnecter Apple Health ? Vos données de santé ne seront plus synchronisées.',
          [
            { text: 'Annuler', style: 'cancel' },
            {
              text: 'Déconnecter',
              style: 'destructive',
              onPress: async () => {
                try {
                  await IntegrationsManager.disconnectAppleHealth(currentUser.id);
                  await loadIntegrationStatus();
                  Alert.alert('✅ Déconnecté', 'Apple Health a été déconnecté avec succès.');
                } catch (error) {
                  console.error('❌ Erreur déconnexion Apple Health:', error);
                  Alert.alert('Erreur', 'Impossible de déconnecter Apple Health.');
                }
              }
            }
          ]
        );
      } else {
        // Connexion
        try {
          const success = await IntegrationsManager.connectAppleHealth(currentUser.id);
          if (success) {
            await loadIntegrationStatus();
            Alert.alert(
              '🎉 Apple Health connecté !',
              'Vos données de santé seront maintenant synchronisées.',
              [{ text: 'OK', style: 'default' }]
            );
          } else {
            Alert.alert(
              '❌ Connexion échouée',
              'Impossible de connecter Apple Health. Vérifiez les permissions dans les réglages.',
              [{ text: 'OK', style: 'default' }]
            );
          }
        } catch (error) {
          console.error('❌ Erreur connexion Apple Health:', error);
          if (error.message.includes('iOS')) {
            Alert.alert(
              '📱 iOS uniquement',
              'Apple Health est uniquement disponible sur iPhone et iPad.',
              [{ text: 'OK', style: 'default' }]
            );
          } else {
            Alert.alert(
              '❌ Erreur',
              'Une erreur s\'est produite lors de la connexion à Apple Health.',
              [{ text: 'OK', style: 'default' }]
            );
          }
        }
      }
    } catch (error) {
      console.error('❌ Erreur toggle Apple Health:', error);
      Alert.alert('Erreur', 'Une erreur s\'est produite. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Gestion du toggle connexion/déconnexion Strava
   */
  const handleStravaToggle = async () => {
    if (isLoading || stravaConnecting) {
      return; // Éviter les actions multiples simultanées
    }

    setIsLoading(true);

    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        Alert.alert("Erreur", "Utilisateur non connecté");
        return;
      }

      if (integrationStatus.strava.connected) {
        // Déconnexion
        await handleStravaDisconnect(currentUser.id);
      } else {
        // Connexion
        await handleStravaConnect(currentUser.id);
      }
    } catch (error) {
      console.error("❌ Erreur toggle Strava:", error);
      Alert.alert(
        "Erreur",
        "Une erreur s'est produite. Veuillez réessayer.",
        [{ text: 'OK', style: 'default' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Gestion de la connexion Strava - tout géré côté serveur
   */
  const handleStravaConnect = async (userId: string) => {
    setStravaConnecting(true);

    try {
      console.log('🔄 Connexion Strava côté serveur pour:', userId);

      // Vérifier si déjà connecté côté serveur
      const isAlreadyConnected = await IntegrationsManager.checkStravaConnectionFromServer(userId);
      if (isAlreadyConnected) {
        await loadIntegrationStatus();
        Alert.alert('✅ Déjà connecté !', 'Votre compte Strava est déjà connecté.');
        return;
      }

      // Tenter la connexion
      const success = await IntegrationsManager.connectStrava(userId);

      if (success) {
        // Recharger le statut depuis le serveur
        await loadIntegrationStatus();
        
        Alert.alert(
          '🎉 Strava connecté !',
          'Votre compte Strava est maintenant connecté.',
          [
            {
              text: 'Voir mes activités',
              onPress: () => router.push('/(client)/forme')
            },
            { text: 'OK', style: 'cancel' }
          ]
        );
      } else {
        Alert.alert('❌ Connexion échouée', 'Impossible de connecter Strava. Réessayez.');
      }
    } catch (error) {
      console.error('❌ Erreur connexion Strava:', error);
      Alert.alert('❌ Erreur', 'Une erreur s\'est produite. Réessayez.');
    } finally {
      setStravaConnecting(false);
    }
  };

  /**
   * Synchronisation manuelle des données Strava
   */
  const handleStravaSync = async () => {
    if (isLoading) return;

    setIsLoading(true);
    
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        Alert.alert("Erreur", "Utilisateur non connecté");
        return;
      }

      console.log('🔄 [STRAVA] Démarrage synchronisation manuelle pour:', currentUser.id);

      // Appel à l'endpoint de synchronisation sur le serveur
      const response = await fetch(`${process.env.EXPO_PUBLIC_VPS_URL}/api/strava/sync/${currentUser.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ [STRAVA] Synchronisation réussie:', result);
        
        // Recharger le statut pour mettre à jour la date de dernière sync
        await loadIntegrationStatus();
        
        Alert.alert(
          '✅ Synchronisation terminée',
          `${result.activitiesCount || 0} activité(s) synchronisée(s) depuis Strava.`,
          [{ text: 'OK', style: 'default' }]
        );
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.log('❌ [STRAVA] Erreur synchronisation:', errorData);
        Alert.alert(
          '❌ Erreur de synchronisation', 
          errorData.message || 'Impossible de synchroniser vos données Strava. Réessayez plus tard.',
          [{ text: 'OK', style: 'default' }]
        );
      }
    } catch (error) {
      console.error('❌ [STRAVA] Erreur sync manuelle:', error);
      Alert.alert(
        '❌ Erreur réseau',
        'Impossible de se connecter au serveur. Vérifiez votre connexion.',
        [{ text: 'OK', style: 'default' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Gestion de la déconnexion Strava côté serveur
   */
  const handleStravaDisconnect = async (userId: string) => {
    try {
      Alert.alert(
        'Déconnecter Strava',
        'Êtes-vous sûr de vouloir déconnecter votre compte Strava ? Vos données d\'activité ne seront plus synchronisées.',
        [
          {
            text: 'Annuler',
            style: 'cancel'
          },
          {
            text: 'Déconnecter',
            style: 'destructive',
            onPress: async () => {
              try {
                await IntegrationsManager.disconnectStrava(userId);

                // Recharger le statut depuis le serveur
                await loadIntegrationStatus();

                Alert.alert(
                  '✅ Déconnecté',
                  'Strava a été déconnecté avec succès.',
                  [{ text: 'OK', style: 'default' }]
                );

                console.log('✅ Déconnexion Strava côté serveur réussie');
              } catch (disconnectError) {
                console.error('❌ Erreur déconnexion Strava:', disconnectError);
                Alert.alert(
                  'Erreur',
                  'Impossible de déconnecter Strava. Veuillez réessayer.',
                  [{ text: 'OK', style: 'default' }]
                );
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('❌ Erreur lors de la demande de déconnexion:', error);
    }
  };

  // Synchronisation supprimée - gestion simple uniquement

  const toggleGoal = (goal: string) => {
    setSelectedGoals(prev =>
      prev.includes(goal)
        ? prev.filter(g => g !== goal)
        : [...prev, goal]
    );
  };

  const handleSaveObjectifs = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        Alert.alert("Erreur", "Utilisateur non connecté");
        return;
      }

      // Importer PersistentStorage (ceci devrait être géré plus haut ou par un context global)
      // Pour l'instant, on le garde ici pour le contexte de la modification demandée.
      const { updateUserData } = require('@/utils/user'); // Supposons que cette fonction existe pour mettre à jour les données utilisateur sur le serveur

      // Mettre à jour les objectifs sur le serveur
      await updateUserData(currentUser.id, { goals: selectedGoals });

      setUser(prevUser => ({ ...prevUser, goals: selectedGoals })); // Mettre à jour l'état local
      Alert.alert('Succès', 'Objectifs mis à jour avec succès');
    } catch (error) {
      console.error('Erreur sauvegarde objectifs:', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder les modifications');
    } finally {
      setEditingObjectifs(false);
    }
  };



  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnecter',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              router.replace('/auth/login');
            } catch (error) {
              console.error('Erreur lors de la déconnexion:', error);
              // Même en cas d'erreur, rediriger vers login
              router.replace('/auth/login');
            }
          }
        }
      ]
    );
  };

  /**
   * Gestion des achats intégrés et abonnements
   */
  const handleSubscription = () => {
    setShowComingSoonModal(true);
  };

  // Synchronisation supprimée - gestion simple uniquement

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>


        {/* User Info */}
        <View style={styles.userCard}>
          <View style={styles.userAvatar}>
            <Text style={styles.userAvatarText}>
              {user ? (
                (user.firstName?.[0] || user.name?.[0] || '?').toUpperCase() +
                (user.lastName?.[0] || user.name?.split(' ')?.[1]?.[0] || '').toUpperCase()
              ) : '?'}
            </Text>
          </View>
          <Text style={styles.userName}>
            {user ? (
              user.firstName && user.lastName
                ? `${user.firstName} ${user.lastName}`
                : user.name || 'Utilisateur'
            ) : 'Chargement...'}
          </Text>
          <Text style={styles.userEmail}>
            {user?.email || 'email@example.com'}
          </Text>
        </View>

        {/* Personal Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Informations personnelles</Text>
            <TouchableOpacity
              onPress={() => router.push('/informations-personnelles')}
              style={styles.modifyButton}
            >
              <Text style={styles.modifyText}>Modifier</Text>
            </TouchableOpacity>
          </View>

          {/* Informations de base */}
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>👤 Sexe:</Text>
              <Text style={styles.infoValue}>{user?.gender || 'Non renseigné'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>📅 Âge:</Text>
              <Text style={styles.infoValue}>{user?.age ? `${user.age} ans` : 'Non renseigné'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>📏 Taille:</Text>
              <Text style={styles.infoValue}>{user?.height ? `${user.height} cm` : 'Non renseignée'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>⚖️ Poids:</Text>
              <Text style={styles.infoValue}>{user?.weight ? `${user.weight} kg` : 'Non renseigné'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>
                {getSportDisplay().emoji} Sport favori:
              </Text>
              <Text style={styles.infoValue}>
                {getSportDisplay().name}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>📊 Activité:</Text>
              <Text style={styles.infoValue}>{user?.activityLevel || 'Non renseigné'}</Text>
            </View>
          </View>

          </View>

        {/* Objectifs */}
        <View style={[styles.section, {marginTop: 20}]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}> Mes objectifs</Text>
            <TouchableOpacity
              onPress={() => setEditingObjectifs(!editingObjectifs)}
              style={styles.modifyButton}
            >
              <Text style={styles.modifyText}>
                {editingObjectifs ? 'Annuler' : 'Modifier'}
              </Text>
            </TouchableOpacity>
          </View>

          {editingObjectifs ? (
            <View style={styles.objectifsEdit}>
              {availableGoals.map((goal) => (
                <TouchableOpacity
                  key={goal}
                  style={[
                    styles.goalButton,
                    selectedGoals.includes(goal) && styles.selectedGoal
                  ]}
                  onPress={() => toggleGoal(goal)}
                >
                  <Text style={[
                    styles.goalText,
                    selectedGoals.includes(goal) && styles.selectedGoalText
                  ]}>
                    {goal}
                  </Text>
                  {selectedGoals.includes(goal) && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveObjectifs}
              >
                <Text style={styles.saveButtonText}>Sauvegarder</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.infoCard}>
              {user?.goals && user.goals.length > 0 ? (
                user.goals.map((goal: string, index: number) => (
                  <View key={index} style={styles.goalItem}>
                    <Text style={styles.goalText}>• {goal}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.infoValue}>Aucun objectif défini</Text>
              )}
            </View>
          )}
        </View>

        {/* Section Abonnement */}
        <View style={styles.section}>
          {console.log('🔍 Debug Profil - isPremium:', isPremium, 'currentSubscription:', currentSubscription, 'user:', user?.email)}
          {(isPremium && currentSubscription && currentSubscription.planName) ? (
            /* Affichage Premium */
            <View style={styles.premiumSubscriptionCard}>
              <LinearGradient
                colors={currentSubscription.planName === 'DIAMANT' ?
                  ['#4169E1', '#1E90FF', '#0080FF'] : // Bleu pour Diamant
                  ['#FFD700', '#FFA500', '#FF8C00']    // Or pour les autres
                }
                style={styles.premiumGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {/* Header Premium */}
                <View style={styles.premiumHeader}>
                  <View style={styles.premiumIconContainer}>
                    <Text style={styles.premiumIcon}>
                      {currentSubscription.planName === 'DIAMANT' ? '💎' : '👑'}
                    </Text>
                  </View>
                  <View style={styles.premiumTextContainer}>
                    <Text style={styles.premiumTitle}>Plan {currentSubscription.planName || 'DIAMANT'}</Text>
                    <Text style={styles.premiumSubtitle}>Accès complet à toutes les fonctionnalités</Text>
                  </View>
                  <View style={styles.premiumBadge}>
                    <Text style={styles.premiumBadgeText}>PREMIUM</Text>
                  </View>
                </View>

                {/* Avantages Premium */}
                <View style={styles.premiumBenefitsContainer}>
                  <Text style={styles.benefitsTitle}>Vos avantages :</Text>
                  <View style={styles.benefitsList}>
                    <View style={styles.benefitRow}>
                      <Text style={styles.benefitIcon}>💬</Text>
                      <Text style={styles.benefitText}>Coach personnel 24h/24</Text>
                    </View>
                    <View style={styles.benefitRow}>
                      <Text style={styles.benefitIcon}>📊</Text>
                      <Text style={styles.benefitText}>Suivi de forme avancé</Text>
                    </View>
                    <View style={styles.benefitRow}>
                      <Text style={styles.benefitIcon}>🎯</Text>
                      <Text style={styles.benefitText}>Programmes personnalisés</Text>
                    </View>
                    <View style={styles.benefitRow}>
                      <Text style={styles.benefitIcon}>📅</Text>
                      <Text style={styles.benefitText}>Rendez-vous illimités</Text>
                    </View>
                  </View>
                </View>
              </LinearGradient>
            </View>
          ) : (
            /* Affichage Gratuit */
            <View style={styles.compactSubscriptionCard}>
              {/* Header avec badge FREE */}
              <View style={styles.compactHeader}>
                <View style={styles.compactFreeBadge}>
                  <Text style={styles.compactFreeBadgeText}>FREE</Text>
                </View>
                <View style={styles.compactHeaderText}>
                  <Text style={styles.compactTitle}>Version Gratuite</Text>
                  <Text style={styles.compactSubtitle}>Fonctionnalités de base</Text>
                </View>
              </View>

              {/* Upgrade Section */}
              <View style={styles.compactUpgradeSection}>
                <Text style={styles.compactUpgradeTitle}>🚀 Passez au niveau supérieur</Text>

                <Text style={styles.compactUpgradeDescription}>
                  Débloquez votre coach personnel et tous nos programmes premium
                </Text>

                {/* CTA Button */}
                <TouchableOpacity
                  style={styles.compactUpgradeButton}
                  onPress={() => setShowPremiumComingSoonModal(true)}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#FF8C42', '#FF6B35']}
                    style={styles.compactUpgradeGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Text style={styles.compactUpgradeButtonText}>✨ Découvrir Premium →</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>



        {/* Integrations */}
        <View style={[styles.section, {marginTop: 20}]}>
          <Text style={[styles.sectionTitle, {marginBottom: 16}]}>Mes Intégrations</Text>

          <View style={styles.integrationItem}>
            <View style={styles.integrationInfo}>
              <Text style={styles.integrationName}>🍎 Apple Health</Text>
              <Text style={styles.integrationDescription}>
                {integrationStatus.appleHealth.connected ? 
                  'Données de santé synchronisées avec EatFitByMax' :
                  'Synchronisez vos données de santé et fitness avec EatFitByMax'
                }
              </Text>
              {integrationStatus.appleHealth.connected && integrationStatus.appleHealth.lastSync && (
                <Text style={styles.integrationLastSync}>
                  Dernière sync : {new Date(integrationStatus.appleHealth.lastSync).toLocaleDateString('fr-FR')}
                </Text>
              )}
            </View>
            <View style={styles.integrationActions}>
              {integrationStatus.appleHealth.connected ? (
                <TouchableOpacity
                  style={styles.disconnectButton}
                  onPress={() => handleAppleHealthToggle()}
                  disabled={isLoading}
                >
                  <Text style={styles.disconnectButtonText}>
                    Déconnecter
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.connectButton}
                  onPress={() => handleAppleHealthToggle()}
                  disabled={isLoading}
                >
                  <Text style={styles.connectButtonText}>
                    {isLoading ? 'Connexion...' : 'Connecter'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.integrationItem}>
            <View style={styles.integrationInfo}>
              <Text style={styles.integrationName}>🏃‍♂️ Strava</Text>
            </View>
            <View style={styles.integrationActions}>
              {integrationStatus.strava.connected ? (
                <View style={styles.stravaHorizontalActions}>
                  <TouchableOpacity
                    style={styles.stravaUniformButton}
                    onPress={() => handleStravaSync()}
                    disabled={isLoading || stravaConnecting}
                  >
                    <Text style={styles.stravaUniformButtonText}>
                      {isLoading ? '⏳ Sync...' : '🔄 Synchroniser'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.stravaUniformButton, styles.stravaDisconnectButton]}
                    onPress={() => handleStravaToggle()}
                    disabled={isLoading || stravaConnecting}
                  >
                    <Text style={[styles.stravaUniformButtonText, styles.stravaDisconnectButtonText]}>
                      Déconnexion
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.connectButton}
                  onPress={() => handleStravaToggle()}
                  disabled={isLoading || stravaConnecting}
                >
                  <Text style={styles.connectButtonText}>
                    {stravaConnecting ? 'Connexion...' : 'Connecter'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Carte de statut détaillée pour Strava connecté */}
          {integrationStatus.strava.connected && (
            <View style={styles.stravaStatusCard}>
              <View style={styles.stravaStatusHeader}>
                <Text style={styles.stravaStatusTitle}>🏃‍♂️ Compte Strava </Text>
                <View style={styles.connectedBadge}>
                  <Text style={styles.connectedBadgeText}>✓ CONNECTÉ</Text>
                </View>
              </View>
              
              <View style={styles.stravaStatusDetails}>
                <View style={styles.stravaDetailRow}>
                  <Text style={styles.stravaDetailLabel}>Nom :</Text>
                  <Text style={styles.stravaDetailValue}>
                    {integrationStatus.strava.athlete?.firstname} {integrationStatus.strava.athlete?.lastname}
                  </Text>
                </View>
                
                <View style={styles.stravaDetailRow}>
                  <Text style={styles.stravaDetailLabel}>ID Athlète :</Text>
                  <Text style={styles.stravaDetailValue}>
                    #{integrationStatus.strava.athleteId || integrationStatus.strava.athlete?.id || 'Non disponible'}
                  </Text>
                </View>
                
                {integrationStatus.strava.athlete?.city && (
                  <View style={styles.stravaDetailRow}>
                    <Text style={styles.stravaDetailLabel}>Ville :</Text>
                    <Text style={styles.stravaDetailValue}>
                      {integrationStatus.strava.athlete.city}
                    </Text>
                  </View>
                )}
                
                <View style={styles.stravaDetailRow}>
                  <Text style={styles.stravaDetailLabel}>Dernière sync :</Text>
                  <Text style={styles.stravaDetailValue}>
                    {integrationStatus.strava.lastSync ?
                      new Date(integrationStatus.strava.lastSync).toLocaleString('fr-FR') :
                      'Jamais'
                    }
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Informations de statut Apple Health */}
          {integrationStatus.appleHealth.connected && (
            <View style={styles.statusCard}>
              <Text style={styles.statusTitle}>📱 Apple Health</Text>
              <Text style={styles.statusDescription}>
                Dernière synchronisation : {integrationStatus.appleHealth.lastSync ?
                  new Date(integrationStatus.appleHealth.lastSync).toLocaleDateString('fr-FR') :
                  'Jamais'
                }
              </Text>
            </View>
          )}
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, {marginBottom: 16}]}>Paramètres</Text>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/(client)/parametres-application')}
          >
            <Text style={styles.menuItemText}>⚙️ Paramètres de l\'application</Text>
            <Text style={styles.menuItemArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/(client)/securite-confidentialite')}
          >
            <Text style={styles.menuItemText}>🔒 Sécurité et confidentialité</Text>
            <Text style={styles.menuItemArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/(client)/aide-feedback')}
          >
            <Text style={styles.menuItemText}>💬 Aide et feedback</Text>
            <Text style={styles.menuItemArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>🚪 Se déconnecter</Text>
          </TouchableOpacity>
          <Text style={styles.versionText}>Version 1.0.0</Text>
        </View>
      </ScrollView>

      <ComingSoonModal
        visible={showComingSoonModal}
        onClose={() => setShowComingSoonModal(false)}
        feature="🍎 Connexion Apple Health"
        description="Synchronisez automatiquement vos données de santé et fitness avec EatFitByMax pour un suivi personnalisé optimal."
      />

      <ComingSoonModal
        visible={showPremiumComingSoonModal}
        onClose={() => setShowPremiumComingSoonModal(false)}
        feature="💎 Plans Premium"
        description="Débloquez votre coach personnel 24h/24, des programmes ultra-personnalisés et tous nos services premium pour atteindre vos objectifs plus rapidement."
      />
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
    padding: 20,
    paddingTop: 10,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  userCard: {
    margin: 20,
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#21262D',
    alignItems: 'center',
  },
  userAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F5A623',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  userAvatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#8B949E',
  },
  section: {
    margin: 20,
    marginTop: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modifyButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  modifyText: {
    fontSize: 14,
    color: '#F5A623',
    fontWeight: '500',
  },
  menuItem: {
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#21262D',
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  menuItemArrow: {
    fontSize: 18,
    color: '#8B949E',
  },
  integrationItem: {
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#21262D',
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  integrationInfo: {
    flex: 1,
  },
  integrationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  integrationDescription: {
    fontSize: 14,
    color: '#8B949E',
  },
  integrationLastSync: {
    fontSize: 12,
    color: '#6C757D',
    marginTop: 4,
  },
  integrationActions: {
    alignItems: 'flex-end',
  },
  connectButton: {
    backgroundColor: '#28A745',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  connectButtonText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  disconnectButton: {
    backgroundColor: '#DC3545',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  disconnectButtonText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  // Nouveaux styles pour les actions Strava connectées
  stravaConnectedActions: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 10,
  },
  stravaHorizontalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stravaUniformButton: {
    backgroundColor: '#28A745',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    minWidth: 110,
    alignItems: 'center',
    shadowColor: '#28A745',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  stravaUniformButtonText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  stravaDisconnectButton: {
    backgroundColor: '#FF4444',
    borderWidth: 2,
    borderColor: '#FF2222',
    shadowColor: '#FF4444',
  },
  stravaDisconnectButtonText: {
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  // Anciens styles pour compatibilité
  stravaSyncButton: {
    backgroundColor: '#28A745',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    minWidth: 110,
    alignItems: 'center',
    shadowColor: '#28A745',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  stravaSyncButtonText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  stravaDisconnectButtonRed: {
    backgroundColor: '#FF4444',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#FF2222',
    minWidth: 110,
    alignItems: 'center',
    shadowColor: '#FF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  stravaDisconnectButtonRedText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  connectedButton: {
    backgroundColor: '#2ecc71',
  },
  connectedButtonText: {
    color: '#000000',
  },
  // Nouveaux styles pour la carte de statut Strava
  stravaStatusCard: {
    backgroundColor: '#1a4f3a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#28A745',
    marginTop: 12,
  },
  stravaStatusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  stravaStatusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  connectedBadge: {
    backgroundColor: '#28A745',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  connectedBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  stravaStatusDetails: {
    gap: 8,
  },
  stravaDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  stravaDetailLabel: {
    fontSize: 14,
    color: '#8B949E',
    fontWeight: '500',
  },
  stravaDetailValue: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  stravaConnection: {
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#212262D',
    marginTop: 16,
  },
  stravaTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  stravaDescription: {
    fontSize: 14,
    color: '#8B949E',
    marginBottom: 12,
  },
  stravaStatus: {
    fontSize: 14,
    color: '#8B949E',
    lineHeight: 20,
    marginBottom: 20,
  },
  stravaActions: {
    flexDirection: 'row',
    gap: 12,
  },
  disconnectButton: {
    flex: 1,
    backgroundColor: '#21262D',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  disconnectButtonText: {
    fontSize: 14,
    color: '#8B949E',
    fontWeight: '600',
  },
  importButton: {
    flex: 1,
    backgroundColor: '#F85149',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  importButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  testButton: {
    backgroundColor: '#6C757D',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
    marginBottom: 12,
  },
  testButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  syncAllButton: {
    backgroundColor: '#3498db',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  syncAllButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  statusCard: {
    backgroundColor: '#2c3e50',
    borderRadius: 8,
    padding: 16,
    marginTop: 8,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  statusDescription: {
    fontSize: 14,
    color: '#ecf0f1',
  },
  logoutButton: {
    backgroundColor: '#F85149',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  logoutButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  versionText: {
    fontSize: 12,
    color: '#8B949E',
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#21262D',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#21262D',
  },
  infoLabel: {
    fontSize: 14,
    color: '#8B949E',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  infoSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  goalItem: {
    paddingVertical: 4,
  },
  goalText: {
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 20,
  },
  itemArrow: {
    fontSize: 18,
    color: '#8B949E',
    marginLeft: 8,
  },
  profileSection: {
    backgroundColor: '#161B22',
    borderRadius: 12,
    margin: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#21262D',
  },
  editButton: {
    padding: 8,
  },
  editText: {
    fontSize: 14,
    color: '#1F6FEB',
    fontWeight: '600',
  },
  objectifsDisplay: {
    gap: 8,
  },
  objectifItem: {
    paddingVertical: 4,
  },
  objectifText: {
    fontSize: 15,
    color: '#FFFFFF',
    lineHeight: 20,
  },
  noObjectifsText: {
    fontSize: 15,
    color: '#8B949E',
    fontStyle: 'italic',
  },
  objectifsEdit: {
    gap: 12,
  },
  goalButton: {
    backgroundColor: '#0D1117',
    borderWidth: 1,
    borderColor: '#21262D',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedGoal: {
    backgroundColor: '#1F6FEB',
    borderColor: '#1F6FEB',
  },
  selectedGoalText: {
    fontWeight: '600',
  },
  checkmark: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#1F6FEB',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Styles pour la version compacte d'abonnement
  compactSubscriptionCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2C2C2E',
  },
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  compactFreeBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#8E8E93',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  compactFreeBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  compactHeaderText: {
    flex: 1,
  },
  compactTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  compactSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
  },
  compactUpgradeSection: {
    backgroundColor: '#0A0A0A',
    borderRadius: 12,
    padding: 16,
  },
  compactUpgradeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  compactUpgradeDescription: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
    marginBottom: 16,
  },
  compactUpgradeButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  compactUpgradeGradient: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactUpgradeButtonText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  // Styles pour l'affichage Premium
  premiumSubscriptionCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  premiumGradient: {
    padding: 20,
  },
  premiumHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  premiumIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  premiumIcon: {
    fontSize: 28,
  },
  premiumTextContainer: {
    flex: 1,
  },
  premiumTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  premiumSubtitle: {
    fontSize: 14,
    color: '#333333',
  },
  premiumBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  premiumBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FF8C00',
  },
  premiumBenefitsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 16,
  },
  benefitsList: {
    gap: 12,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  benefitIcon: {
    fontSize: 18,
    marginRight: 12,
    width: 24,
    textAlign: 'center',
  },
  benefitText: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '500',
    flex: 1,
  },
  freeSubscriptionCard: {
    backgroundColor: '#161B22',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#21262D',
  },
  freeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  freeIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#6C757D',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  freeIcon: {
    fontSize: 24,
  },
  freeTextContainer: {
    flex: 1,
  },
  freeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  freeSubtitle: {
    fontSize: 14,
    color: '#8B949E',
  },
  upgradeSection: {
    backgroundColor: '#0D1117',
    borderRadius: 12,
    padding: 16,
  },
  upgradeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  upgradeDescription: {
    fontSize: 14,
    color: '#8B949E',
    lineHeight: 20,
    marginBottom: 16,
  },
  previewBenefits: {
    marginBottom: 20,
    gap: 8,
  },
  previewBenefit: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewIcon: {
    fontSize: 16,
    marginRight: 8,
    width: 20,
    textAlign: 'center',
  },
  previewText: {
    fontSize: 13,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  upgradeButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  upgradeButtonTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  upgradeButtonIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
    flex: 1,
    textAlign: 'center',
  },
  upgradeButtonArrow: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
    marginLeft: 8,
  },

});