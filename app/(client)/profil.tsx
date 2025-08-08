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

      const status = await IntegrationsManager.getIntegrationStatus(currentUser.id);
      setIntegrationStatus(status);
    } catch (error) {
      console.error("Failed to load integration status:", error);
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
    setShowComingSoonModal(true);
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
   * Gestion de la connexion Strava avec feedback utilisateur amélioré
   */
  const handleStravaConnect = async (userId: string) => {
    setStravaConnecting(true);
    
    try {
      console.log('🔄 Début connexion Strava...');

      const success = await IntegrationsManager.connectStrava(userId);

      if (success) {
        console.log('✅ Connexion Strava réussie');
        
        // Recharger le statut d'intégration
        await loadIntegrationStatus();
        
        Alert.alert(
          '🎉 Connexion réussie!', 
          'Strava a été connecté avec succès. Vos activités peuvent maintenant être synchronisées automatiquement.',
          [{ 
            text: 'Parfait!', 
            style: 'default',
            onPress: () => {
              // Optionnel: déclencher une synchronisation immédiate
              console.log('Connexion Strava confirmée par l\'utilisateur');
            }
          }]
        );
      } else {
        console.log('❌ Connexion Strava échouée');
        
        Alert.alert(
          'Connexion échouée', 
          'La connexion à Strava n\'a pas pu être établie. Assurez-vous d\'avoir autorisé l\'accès dans l\'application Strava.',
          [
            { 
              text: 'Réessayer', 
              onPress: () => handleStravaConnect(userId), 
              style: 'default' 
            },
            { 
              text: 'Annuler', 
              style: 'cancel' 
            }
          ]
        );
      }
    } catch (error) {
      console.error('❌ Erreur connexion Strava:', error);
      
      let errorMessage = 'Une erreur inattendue s\'est produite.';
      
      if (error?.message?.includes('Configuration')) {
        errorMessage = 'Configuration manquante. Contactez le support technique.';
      } else if (error?.message?.includes('Serveur')) {
        errorMessage = 'Serveur temporairement indisponible. Réessayez dans quelques instants.';
      } else if (error?.message?.includes('connexion internet')) {
        errorMessage = 'Vérifiez votre connexion internet et réessayez.';
      }
      
      Alert.alert(
        'Erreur de connexion', 
        errorMessage,
        [
          { 
            text: 'Réessayer', 
            onPress: () => handleStravaConnect(userId), 
            style: 'default' 
          },
          { 
            text: 'Annuler', 
            style: 'cancel' 
          }
        ]
      );
    } finally {
      setStravaConnecting(false);
    }
  };

  /**
   * Gestion de la déconnexion Strava
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
                
                // Mettre à jour l'état local
                setIntegrationStatus(prev => ({
                  ...prev,
                  strava: { 
                    connected: false, 
                    lastSync: null, 
                    athleteId: null 
                  }
                }));
                
                Alert.alert(
                  '✅ Déconnecté', 
                  'Strava a été déconnecté avec succès.',
                  [{ text: 'OK', style: 'default' }]
                );
                
                console.log('✅ Déconnexion Strava réussie');
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

  const handleSyncAllData = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        Alert.alert("Information", "Veuillez vous reconnecter");
        return;
      }

      await IntegrationsManager.syncAllData(currentUser.id);
      Alert.alert("Succès", "Synchronisation terminée");
      await loadIntegrationStatus();
    } catch (error) {
      console.warn("Erreur sync:", error);
      Alert.alert("Information", "Synchronisation partielle effectuée");
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
                Synchronisez vos données de santé et fitness avec EatFitByMax
              </Text>
            </View>
            <TouchableOpacity 
              style={[styles.connectButton, integrationStatus.appleHealth.connected && styles.connectedButton]}
              onPress={() => handleAppleHealthToggle()}
              disabled={isLoading}
            >
              <Text style={[styles.connectButtonText]}>
                Bientôt disponible
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
              disabled={isLoading || stravaConnecting}
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
    backgroundColor: '#2ecc71',
  },
  connectedButtonText: {
    color: '#000000',
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