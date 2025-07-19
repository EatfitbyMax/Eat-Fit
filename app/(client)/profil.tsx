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
import { IntegrationsManager, IntegrationStatus } from '@/utils/integrations';
import { checkSubscriptionStatus } from '@/utils/subscription';
import { PaymentService } from '@/utils/payments';
import SubscriptionModal from '@/components/SubscriptionModal';
import { allSports } from '@/utils/sportPrograms';

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
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [currentSubscription, setCurrentSubscription] = useState<any>(null);
  const [subscriptionModalVisible, setSubscriptionModalVisible] = useState(false);

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

      const status = await IntegrationsManager.getIntegrationStatus(currentUser.id);
      setIntegrationStatus(status);
    } catch (error) {
      console.error("Failed to load integration status:", error);
    }
  };

  const loadSubscriptionStatus = async () => {
    try {
      const subscriptionData = await checkSubscriptionStatus();
      console.log('🔍 Données d\'abonnement récupérées:', subscriptionData);

      // Mettre à jour les données d'abonnement pour l'affichage
      if (subscriptionData.isPremium) {
        const planName = subscriptionData.planId === 'diamond' ? 'DIAMANT' :
                         subscriptionData.planId === 'gold' ? 'OR' : 
                         subscriptionData.planId === 'silver' ? 'ARGENT' : 'BRONZE';

        const subscription = { 
          planId: subscriptionData.planId,
          status: 'active',
          planName: planName
        };

        console.log('💎 Configuration abonnement premium:', subscription);
        setIsPremium(true);
        setCurrentSubscription(subscription);
      } else {
        console.log('📝 Aucun abonnement premium détecté');
        setIsPremium(false);
        setCurrentSubscription(null);
      }
    } catch (error) {
      console.error("Failed to load subscription status:", error);
      setIsPremium(false);
      setCurrentSubscription(null);
    }
  };

  const loadSubscriptionData = async (userId: string) => {
    try {
      const subscription = await PaymentService.getCurrentSubscription(userId);
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
    if (!user) {
      Alert.alert("Erreur", "Utilisateur non connecté");
      return;
    }

    try {
      setIsLoading(true);

      if (integrationStatus.appleHealth.connected) {
        Alert.alert(
          "Déconnecter Apple Health",
          "Êtes-vous sûr de vouloir déconnecter Apple Health ? Vos données ne seront plus synchronisées.",
          [
            { text: "Annuler", style: "cancel", onPress: () => setIsLoading(false) },
            { 
              text: "Déconnecter", 
              style: "destructive",
              onPress: async () => {
                try {
                  await IntegrationsManager.disconnectAppleHealth(user.id);
                  setIntegrationStatus(prev => ({
                    ...prev,
                    appleHealth: { connected: false, lastSync: null, permissions: [] }
                  }));
                  Alert.alert("Succès", "Apple Health déconnecté");
                } catch (error) {
                  console.error("Erreur déconnexion Apple Health:", error);
                  Alert.alert("Erreur", "Impossible de déconnecter Apple Health");
                } finally {
                  setIsLoading(false);
                }
              }
            }
          ]
        );
      } else {
        Alert.alert(
          "Connecter Apple Health",
          "EatFitByMax va demander l'autorisation d'accéder à vos données de santé (pas, calories, rythme cardiaque, poids, sommeil). Ces données resteront privées et sécurisées.",
          [
            { text: "Annuler", style: "cancel", onPress: () => setIsLoading(false) },
            { 
              text: "Autoriser", 
              onPress: async () => {
                try {
                  const success = await IntegrationsManager.connectAppleHealth(user.id);
                  if (success) {
                    await loadIntegrationStatus();
                    Alert.alert(
                      "Succès", 
                      "Apple Health connecté avec succès ! Vos données de santé seront maintenant synchronisées automatiquement."
                    );
                  } else {
                    Alert.alert(
                      "Erreur", 
                      "Impossible de connecter Apple Health. Assurez-vous d'avoir autorisé l'accès aux données de santé dans les réglages."
                    );
                  }
                } catch (error) {
                  console.error("Erreur connexion Apple Health:", error);
                  Alert.alert("Erreur", "Une erreur est survenue lors de la connexion à Apple Health");
                } finally {
                  setIsLoading(false);
                }
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error("Erreur dans handleAppleHealthToggle:", error);
      Alert.alert("Erreur", "Une erreur est survenue lors de la connexion à Apple Health");
      setIsLoading(false);
    }
  };

  const handleStravaToggle = async () => {
    setIsLoading(true);
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        Alert.alert("Erreur", "Utilisateur non connecté");
        return;
      }

      if (integrationStatus.strava.connected) {
        await IntegrationsManager.disconnectStrava(currentUser.id);
        setIntegrationStatus(prev => ({
          ...prev,
          strava: { connected: false, lastSync: null, athleteId: null }
        }));
        Alert.alert("Succès", "Strava déconnecté");
      } else {
        const success = await IntegrationsManager.connectStrava(currentUser.id);
        if (success) {
          await loadIntegrationStatus();
          Alert.alert("Succès", "Strava connecté avec succès");
        } else {
          Alert.alert("Erreur", "Impossible de connecter Strava");
        }
      }
    } catch (error) {
      console.error("Failed to toggle Strava:", error);
      Alert.alert("Erreur", "Impossible de connecter/déconnecter Strava.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncAllData = async () => {
    setIsLoading(true);
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        Alert.alert("Erreur", "Utilisateur non connecté");
        return;
      }

      await IntegrationsManager.syncAllData(currentUser.id);
      Alert.alert("Succès", "Toutes les données ont été synchronisées.");
      await loadIntegrationStatus(); // Refresh statuses after sync
    } catch (error) {
      console.error("Failed to sync all data:", error);
      Alert.alert("Erreur", "Impossible de synchroniser toutes les données.");
    } finally {
      setIsLoading(false);
    }
  };

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

      // Importer PersistentStorage
      const { PersistentStorage } = require('@/utils/storage');

      // Récupérer les utilisateurs et mettre à jour
      const users = await PersistentStorage.getUsers();
      const userIndex = users.findIndex((u: any) => u.email === currentUser.email);

      if (userIndex !== -1) {
        users[userIndex] = { ...users[userIndex], goals: selectedGoals };
        await PersistentStorage.saveUsers(users);
        await PersistentStorage.setCurrentUser(users[userIndex]);
        setUser(users[userIndex]);
        Alert.alert('Succès', 'Objectifs mis à jour avec succès');
      }
    } catch (error) {
      console.error('Erreur sauvegarde objectifs:', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder les modifications');
    } finally {
      setEditingObjectifs(false);
    }
  };

  const handleSubscribe = (plan: string) => {
    setShowSubscriptionModal(false);
    Alert.alert(
      'Abonnement Premium',
      `Vous avez sélectionné le plan ${plan}. Fonctionnalité d'abonnement en cours de développement.`,
      [{ text: 'OK' }]
    );
  };

  const handleLogout = async () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        { 
          text: 'Déconnexion', 
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/auth/login');
          }
        },
      ]
    );
  };

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
                  onPress={() => setSubscriptionModalVisible(true)}
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
                Synchronisez vos données de santé avec EatFitByMax
              </Text>
            </View>
            <TouchableOpacity 
              style={[styles.connectButton, integrationStatus.appleHealth.connected && styles.connectedButton]}
              onPress={() => handleAppleHealthToggle()}
              disabled={isLoading}
            >
              <Text style={[styles.connectButtonText, integrationStatus.appleHealth.connected && styles.connectedButtonText]}>
                {integrationStatus.appleHealth.connected ? 'Connecté' : 'Connecter'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.integrationItem}>
            <View style={styles.integrationInfo}>
              <Text style={styles.integrationName}>🏃‍♂️ Strava</Text>
              <Text style={styles.integrationDescription}>
                Synchronisez vos activités sportives avec EatFitByMax
              </Text>
            </View>
            <TouchableOpacity 
              style={[styles.connectButton, integrationStatus.strava.connected && styles.connectedButton]}
              onPress={() => handleStravaToggle()}
              disabled={isLoading}
            >
              <Text style={[styles.connectButtonText, integrationStatus.strava.connected && styles.connectedButtonText]}>
                {integrationStatus.strava.connected ? 'Connecté' : 'Connecter'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Synchronisation globale */}
          {(integrationStatus.appleHealth.connected || integrationStatus.strava.connected) && (
            <TouchableOpacity 
              style={styles.syncAllButton}
              onPress={handleSyncAllData}
              disabled={isLoading}
            >
              <Text style={styles.syncAllButtonText}>
                🔄 Synchroniser toutes les données
              </Text>
            </TouchableOpacity>
          )}

          {/* Informations de statut */}
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

          {integrationStatus.strava.connected && (
            <View style={styles.statusCard}>
              <Text style={styles.statusTitle}>🏃‍♂️ Strava</Text>
              <Text style={styles.statusDescription}>
                Athlete #{integrationStatus.strava.athleteId || '24854648'} connecté à EatFitByMax.
              </Text>
              <Text style={styles.statusDescription}>
                Dernière synchronisation : {integrationStatus.strava.lastSync ? 
                  new Date(integrationStatus.strava.lastSync).toLocaleDateString('fr-FR') : 
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
            <Text style={styles.menuItemText}>⚙️ Paramètres de l'application</Text>
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

      <SubscriptionModal
        visible={subscriptionModalVisible}
        onClose={() => setSubscriptionModalVisible(false)}
        userId={user?.id || ''}
        currentPlanId={currentSubscription?.planId}
        onSubscriptionUpdate={loadSubscriptionData}
      />
       {/* Modal d'abonnement */}
       <Modal
        visible={showSubscriptionModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSubscriptionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.subscriptionModal}>
            <Text style={styles.modalTitle}>Choisissez votre abonnement</Text>
            <Text style={styles.modalSubtitle}>
              Accédez à tous les services de coaching personnalisé
            </Text>

            {/* Plan Bronze */}
            <TouchableOpacity 
              style={[styles.subscriptionPlan, styles.bronzePlan]}
              onPress={() => handleSubscribe('Bronze')}
            >
              <View style={styles.planHeader}>
                <Text style={styles.planName}>🥉 BRONZE</Text>
                <Text style={styles.planPrice}>19,99€/mois</Text>
              </View>
              <View style={styles.planFeatures}>
                <Text style={styles.planFeature}>✓ Messagerie avec le coach</Text>
                <Text style={styles.planFeature}>✓ 1 programme nutrition de base</Text>
                <Text style={styles.planFeature}>✓ Suivi hebdomadaire</Text>
              </View>
            </TouchableOpacity>

            {/* Plan Argent */}
            <TouchableOpacity 
              style={[styles.subscriptionPlan, styles.silverPlan]}
              onPress={() => handleSubscribe('Argent')}
            >
              <View style={styles.planHeader}>
                <Text style={styles.planName}>🥈 ARGENT</Text>
                <Text style={styles.planPrice}>39,99€/mois</Text>
              </View>
              <View style={styles.planFeatures}>
                <Text style={styles.planFeature}>✓ Tout du plan Bronze</Text>
                <Text style={styles.planFeature}>✓ Programmes nutrition personnalisés</Text>
                <Text style={styles.planFeature}>✓ Programmes d'entraînement</Text>
                <Text style={styles.planFeature}>✓ Rendez-vous vidéo (2/mois)</Text>
              </View>
            </TouchableOpacity>

            {/* Plan Or */}
            <TouchableOpacity 
              style={[styles.subscriptionPlan, styles.goldPlan]}
              onPress={() => handleSubscribe('Or')}
            >
              <View style={styles.planHeader}>
                <Text style={styles.planName}>🥇 OR</Text>
                <Text style={styles.planPrice}>69,99€/mois</Text>
              </View>
              <View style={styles.planFeatures}>
                <Text style={styles.planFeature}>✓ Tout du plan Argent</Text>
                <Text style={styles.planFeature}>✓ Coaching 24h/24 7j/7</Text>
                <Text style={styles.planFeature}>✓ Programmes ultra-personnalisés</Text>
                <Text style={styles.planFeature}>✓ Rendez-vous vidéo illimités</Text>
                <Text style={styles.planFeature}>✓ Suivi en temps réel</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.closeModalButton}
              onPress={() => setShowSubscriptionModal(false)}
            >
              <Text style={styles.closeModalButtonText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  connectedButton: {
    backgroundColor: '#6C757D',
  },
  connectedButtonText: {
    color: '#FFFFFF',
  },
  stravaConnection: {
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#21262D',
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
  },  testButton: {
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
  connectedButton: {
    backgroundColor: '#2ecc71',
  },
  connectedButtonText: {
    color: '#000000',
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
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
  goalText: {
    fontSize: 15,
    color: '#FFFFFF',
    flex: 1,
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
  // Styles pour le modal d'abonnement
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  subscriptionModal: {
    backgroundColor: '#161B22',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#21262D',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#8B949E',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  subscriptionPlan: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
  },
  bronzePlan: {
    backgroundColor: '#2D1810',
    borderColor: '#CD7F32',
  },
  silverPlan: {
    backgroundColor: '#1A1A1A',
    borderColor: '#C0C0C0',
  },
  goldPlan: {
    backgroundColor: '#2D2416',
    borderColor: '#FFD700',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  planName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  planPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F5A623',
  },
  planFeatures: {
    gap: 6,
  },
  planFeature: {
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 20,
  },
   planDescription: {
    fontSize: 14,
    color: '#CCCCCC',
    marginBottom: 16,
  },
  expiredText: {
    fontSize: 12,
    color: '#FF6B6B',
    fontWeight: '600',
    marginTop: 4,
  },
  closeModalButton: {
    backgroundColor: '#21262D',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 16,
    alignItems: 'center',
  },
  closeModalButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
});