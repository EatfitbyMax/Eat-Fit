import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useRouter } from 'expo-router';
import { getCurrentSubscription } from '../../utils/subscription';
import SubscriptionModal from '../../components/SubscriptionModal';

export default function ProfilScreen() {
  const { currentUser, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const colors = theme.colors;
  const router = useRouter();

  const [isPremium, setIsPremium] = useState(false);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  useEffect(() => {
    checkPremiumStatus();
  }, [currentUser]);

  const checkPremiumStatus = async () => {
    try {
      if (!currentUser) {
        console.log('❌ Pas d\'utilisateur connecté');
        return;
      }

      console.log('🔍 Vérification statut premium pour:', currentUser.id);
      const subscription = await getCurrentSubscription(currentUser.id);
      console.log('📋 Abonnement récupéré:', subscription);

      const premium = subscription.planId !== 'free' && subscription.status === 'active';
      console.log('💎 Statut premium calculé:', premium, 'Plan:', subscription.planId, 'Status:', subscription.status);

      setIsPremium(premium);
      setCurrentSubscription(subscription);

      // Log détaillé pour debug
      if (premium) {
        console.log('✅ Utilisateur Premium confirmé');
      } else {
        console.log('⚠️ Utilisateur Free - Plan:', subscription.planId, 'Status:', subscription.status);
      }
    } catch (error) {
      console.error('❌ Erreur vérification premium:', error);
      setIsPremium(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        {/* Section Profil */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            <Ionicons name="person-circle-outline" size={20} color={colors.text} /> Profil
          </Text>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.text }]}>
              {currentUser ? currentUser.email : 'Chargement...'}
            </Text>
            <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>
              ID: {currentUser ? currentUser.id : 'N/A'}
            </Text>
          </View>
        </View>

        {/* Section Abonnement */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            <Ionicons name="star-outline" size={20} color={colors.text} /> Abonnement
          </Text>
          <View style={styles.subscriptionInfo}>
            <View style={styles.userTypeSection}>
              <Text style={[styles.subscriptionStatus, { color: colors.text }]}>
                Type d'utilisateur: {isPremium ? 'Premium' : 'Gratuit'}
              </Text>
              {isPremium && (
                <Text style={[styles.subscriptionPlan, { color: colors.textSecondary }]}>
                  Plan actuel: {currentSubscription?.planId || 'N/A'}
                </Text>
              )}
            </View>

            {!isPremium && (
                <TouchableOpacity
                  style={[styles.premiumCard, { backgroundColor: colors.card }]}
                  onPress={() => {
                    console.log('🔍 Bouton Premium pressé, isPremium:', isPremium);
                    console.log('🔍 Ouverture modal subscription...');
                    setShowSubscriptionModal(true);
                  }}
                >
                  <View style={styles.premiumContent}>
                    <View style={styles.premiumIcon}>
                      <Ionicons name="diamond" size={32} color="#FFD700" />
                    </View>
                    <View style={styles.premiumText}>
                      <Text style={[styles.premiumTitle, { color: colors.text }]}>
                        Découvrir Premium
                      </Text>
                      <Text style={[styles.premiumSubtitle, { color: colors.textSecondary }]}>
                        Accédez à toutes les fonctionnalités
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
                  </View>
                </TouchableOpacity>
              )}
          </View>
        </View>

        {/* Section Thème */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            <Ionicons name="color-palette-outline" size={20} color={colors.text} /> Thème
          </Text>
          <View style={styles.themeSwitch}>
            <Text style={[styles.themeLabel, { color: colors.text }]}>
              Thème sombre:
            </Text>
            <Switch
              trackColor={{ false: colors.inactive, true: colors.primary }}
              thumbColor={theme.mode === 'dark' ? colors.background : colors.card}
              ios_backgroundColor={colors.inactive}
              onValueChange={toggleTheme}
              value={theme.mode === 'dark'}
            />
          </View>
        </View>

        {/* Section Actions */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            <Ionicons name="settings-outline" size={20} color={colors.text} /> Actions
          </Text>
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
              onPress={handleLogout}
            >
              <Text style={styles.actionButtonText}>Déconnexion</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.secondary }]}
              onPress={() => router.push('/')}
            >
              <Text style={styles.actionButtonText}>Retour à l'accueil</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Modal d'abonnement */}
        <SubscriptionModal
          visible={showSubscriptionModal}
          onClose={() => {
            console.log('🚪 Fermeture modal abonnement');
            setShowSubscriptionModal(false);
          }}
          onSubscribe={() => {
            console.log('✅ Abonnement réussi, rechargement du statut premium...');
            // Force le rechargement du statut premium
            checkPremiumStatus();
            // Rafraîchir immédiatement l'interface
            setIsPremium(true);
            setShowSubscriptionModal(false);
          }}
        />

            
          </View>
        </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  content: {
    gap: 16,
  },
  section: {
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  profileInfo: {
    gap: 4,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
  },
  profileEmail: {
    fontSize: 16,
    color: '#666',
  },
  subscriptionInfo: {
    gap: 8,
  },
  subscriptionStatus: {
    fontSize: 16,
    fontWeight: '500',
  },
  subscriptionPlan: {
    fontSize: 14,
    color: '#666',
  },
  themeSwitch: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  themeLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  actions: {
    gap: 12,
  },
  actionButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  premiumCard: {
    borderRadius: 12,
    padding: 16,
  },
  premiumContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  premiumIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,215,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  premiumText: {
    flex: 1,
  },
  premiumTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  premiumSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  userTypeSection: {
    alignItems: 'center',
    gap: 8,
  },
  
});