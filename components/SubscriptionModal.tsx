import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { IAP_SUBSCRIPTION_PLANS, IAPSubscriptionPlan, InAppPurchaseService } from '../utils/inAppPurchases';
import { openPrivacyPolicy, openTermsOfService, openAppleSubscriptionSettings } from '../utils/legalLinks';
import { getCurrentUser } from '../utils/auth';

interface SubscriptionModalProps {
  visible: boolean;
  onClose: () => void;
  onSubscribe?: (plan: IAPSubscriptionPlan) => void;
}

export default function SubscriptionModal({ visible, onClose, onSubscribe }: SubscriptionModalProps) {
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);

  useEffect(() => {
    if (visible) {
      loadAvailableProducts();
    }
  }, [visible]);

  const loadAvailableProducts = async () => {
    try {
      setLoading(true);
      await InAppPurchaseService.initialize();
      const products = await InAppPurchaseService.getAvailableProducts();
      setAvailableProducts(products);
    } catch (error) {
      console.error('Erreur chargement produits IAP:', error);
      Alert.alert('Erreur', 'Impossible de charger les abonnements');
    } finally {
      setLoading(false);
    }
  };

  const handlePlanSelect = async (plan: IAPSubscriptionPlan) => {
    if (loading) return;
    
    setLoading(true);
    setSelectedPlan(plan.id);

    try {
      // Vérifier si nous sommes en mode mock
      if (InAppPurchaseService.isInMockMode()) {
        Alert.alert(
          'Mode Démo',
          'Les achats intégrés ne sont pas disponibles en mode développement. Cette fonctionnalité sera activée dans la version App Store.',
          [
            { text: 'Annuler', style: 'cancel' },
            { 
              text: 'Continuer', 
              onPress: () => {
                onSubscribe?.(plan);
                onClose();
              }
            }
          ]
        );
        return;
      }

      // Achat réel
      const success = await InAppPurchaseService.purchaseSubscription(plan.productId);
      
      if (success) {
        Alert.alert('Succès', 'Abonnement activé avec succès !');
        onSubscribe?.(plan);
        onClose();
      } else {
        Alert.alert('Erreur', 'Impossible de traiter l\'abonnement');
      }
    } catch (error: any) {
      console.error('Erreur achat abonnement:', error);
      
      if (error.message?.includes('USER_CANCELED')) {
        // L'utilisateur a annulé, ne pas afficher d'erreur
        return;
      }
      
      Alert.alert('Erreur', 'Une erreur est survenue lors de l\'achat');
    } finally {
      setLoading(false);
      setSelectedPlan(null);
    }
  };

  const renderPlanCard = (plan: IAPSubscriptionPlan) => {
    const isSelected = selectedPlan === plan.id;
    const isLoading = loading && isSelected;

    const getGradientColors = (planId: string) => {
      switch (planId) {
        case 'bronze': return ['#CD7F32', '#B8860B'];
        case 'silver': return ['#C0C0C0', '#A9A9A9'];
        case 'gold': return ['#FFD700', '#FFA500'];
        case 'diamond': return ['#B9F2FF', '#87CEEB'];
        default: return ['#CD7F32', '#B8860B'];
      }
    };

    return (
      <TouchableOpacity
        key={plan.id}
        onPress={() => handlePlanSelect(plan)}
        disabled={loading}
        style={[styles.planCard, isSelected && styles.selectedPlan]}
      >
        <LinearGradient
          colors={getGradientColors(plan.id)}
          style={styles.planGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.planHeader}>
            <Text style={styles.planName}>{plan.name}</Text>
            <Text style={styles.planPrice}>{plan.price}</Text>
            <Text style={styles.planDuration}>{plan.duration}</Text>
          </View>

          <View style={styles.featuresContainer}>
            {plan.features.map((feature, index) => (
              <View key={index} style={styles.featureRow}>
                <Text style={styles.checkmark}>✓</Text>
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>

          {isLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator color="#FFF" size="large" />
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Choisissez votre abonnement</Text>
            <Text style={styles.modalSubtitle}>
              Accédez à tous les services de coaching personnalisé
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.plansContainer} showsVerticalScrollIndicator={false}>
            {IAP_SUBSCRIPTION_PLANS.map(renderPlanCard)}
            
            <View style={styles.legalSection}>
              <Text style={styles.legalText}>
                L'abonnement se renouvelle automatiquement. Vous pouvez l'annuler à tout moment dans les réglages de votre compte Apple.
              </Text>
              
              <View style={styles.legalLinks}>
                <TouchableOpacity onPress={openTermsOfService}>
                  <Text style={styles.linkText}>Conditions d'utilisation</Text>
                </TouchableOpacity>
                <Text style={styles.separator}> • </Text>
                <TouchableOpacity onPress={openPrivacyPolicy}>
                  <Text style={styles.linkText}>Politique de confidentialité</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity 
                onPress={openAppleSubscriptionSettings}
                style={styles.manageButton}
              >
                <Text style={styles.manageButtonText}>Gérer les abonnements</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '85%',
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    overflow: 'hidden',
  },
  modalHeader: {
    padding: 20,
    alignItems: 'center',
    position: 'relative',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#CCC',
    textAlign: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: '#FFF',
    fontWeight: 'bold',
  },
  plansContainer: {
    paddingHorizontal: 20,
  },
  planCard: {
    marginBottom: 15,
    borderRadius: 15,
    overflow: 'hidden',
  },
  selectedPlan: {
    transform: [{ scale: 0.98 }],
  },
  planGradient: {
    padding: 20,
    position: 'relative',
  },
  planHeader: {
    alignItems: 'center',
    marginBottom: 15,
  },
  planName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    textTransform: 'uppercase',
  },
  planPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 5,
  },
  planDuration: {
    fontSize: 14,
    color: '#FFF',
    opacity: 0.8,
  },
  featuresContainer: {
    marginTop: 10,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  checkmark: {
    fontSize: 16,
    color: '#FFF',
    marginRight: 10,
    fontWeight: 'bold',
  },
  featureText: {
    fontSize: 14,
    color: '#FFF',
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  legalSection: {
    padding: 20,
    alignItems: 'center',
  },
  legalText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginBottom: 15,
    lineHeight: 16,
  },
  legalLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  linkText: {
    fontSize: 12,
    color: '#4A9EFF',
    textDecorationLine: 'underline',
  },
  separator: {
    fontSize: 12,
    color: '#999',
  },
  manageButton: {
    backgroundColor: '#333',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  manageButtonText: {
    fontSize: 14,
    color: '#4A9EFF',
    fontWeight: '500',
  },
});

// Interface déjà définie plus haut, suppression de la duplication
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  // Filtrer pour exclure le plan gratuit
  const premiumPlans = IAP_SUBSCRIPTION_PLANS.filter(plan => plan.id !== 'free');

  const handleSubscribe = async (plan: IAPSubscriptionPlan) => {
    if (loading) return;

    console.log('🔄 Début de l\'achat pour le plan:', plan.name);
    setLoading(true);
    setSelectedPlan(plan.id);

    try {
      // Récupérer l'utilisateur actuel
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        Alert.alert('Erreur', 'Vous devez être connecté pour effectuer un achat.');
        return;
      }

      console.log('👤 Utilisateur connecté:', currentUser.email);

      // Initialiser le service IAP
      const initialized = await InAppPurchaseService.initialize();
      if (!initialized) {
        console.warn('⚠️ Service IAP non initialisé, tentative d\'achat quand même...');
      }

      let success = false;

      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        console.log('📱 Lancement achat IAP pour:', plan.productId);
        success = await InAppPurchaseService.purchaseSubscription(plan.productId, currentUser.id);
        console.log('✅ Résultat achat IAP:', success);
      } else {
        Alert.alert('Erreur', 'Paiement non disponible sur cette plateforme');
        return;
      }

      if (success) {
        console.log('🎉 Achat réussi pour:', plan.name);
        Alert.alert(
          'Félicitations !',
          `Votre abonnement ${plan.name} a été activé avec succès.`,
          [
            {
              text: 'OK',
              onPress: () => {
                onSubscribe?.(plan.id);
                onClose();
              }
            }
          ]
        );
      } else {
        console.log('❌ Achat échoué ou annulé pour:', plan.name);
        // Ne pas afficher d'erreur si l'utilisateur a annulé
      }
    } catch (error) {
      console.error('❌ Erreur abonnement:', error);
      Alert.alert(
        'Erreur', 
        'Une erreur est survenue lors du traitement de votre paiement. Veuillez réessayer.',
        [
          {
            text: 'OK',
            style: 'default'
          }
        ]
      );
    } finally {
      setLoading(false);
      setSelectedPlan(null);
    }
  };

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'bronze': return '🥉';
      case 'silver': return '🥈';
      case 'gold': return '🥇';
      case 'diamond': return '💎';
      default: return '⭐';
    }
  };

  const getPlanColors = (planId: string) => {
    switch (planId) {
      case 'bronze':
        return {
          gradient: ['#CD7F32', '#B8860B', '#A0522D'],
          border: '#CD7F32',
          background: '#2D1810'
        };
      case 'silver':
        return {
          gradient: ['#C0C0C0', '#A8A8A8', '#808080'],
          border: '#C0C0C0',
          background: '#1A1A1A'
        };
      case 'gold':
        return {
          gradient: ['#FFD700', '#FFA500', '#FF8C00'],
          border: '#FFD700',
          background: '#2D2416'
        };
      case 'diamond':
        return {
          gradient: ['#B0E0E6', '#4682B4', '#1E90FF'],
          border: '#B0E0E6',
          background: '#2D1A2D'
        };
      default:
        return {
          gradient: ['#666666', '#555555', '#444444'],
          border: '#666666',
          background: '#1A1A1A'
        };
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Choisissez votre abonnement</Text>
              <Text style={styles.subtitle}>
                Accédez à tous les services de coaching personnalisé
              </Text>
            </View>

            {/* Plans */}
            <View style={styles.plansContainer}>
              {premiumPlans.map((plan) => {
                const colors = getPlanColors(plan.id);
                const isLoading = loading && selectedPlan === plan.id;

                return (
                  <TouchableOpacity
                    key={plan.id}
                    style={[
                      styles.planCard,
                      { 
                        backgroundColor: colors.background,
                        borderColor: colors.border
                      }
                    ]}
                    onPress={() => handleSubscribe(plan)}
                    disabled={loading}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={colors.gradient}
                      style={styles.planGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <View style={styles.planHeader}>
                        <View style={styles.planIconContainer}>
                          <Text style={styles.planIcon}>
                            {getPlanIcon(plan.id)}
                          </Text>
                        </View>
                        <View style={styles.planTitleContainer}>
                          <Text style={styles.planName}>{plan.name}</Text>
                        </View>
                        <View style={styles.planPriceContainer}>
                          <Text style={styles.planPrice}>
                            {plan.price}/{plan.duration}
                          </Text>
                          <Text style={styles.renewalText}>
                            Renouvellement auto
                          </Text>
                        </View>
                      </View>

                      <View style={styles.featuresContainer}>
                        {plan.features.map((feature, index) => (
                          <View key={index} style={styles.featureRow}>
                            <Text style={styles.featureCheck}>✓</Text>
                            <Text style={styles.featureText}>{feature}</Text>
                          </View>
                        ))}
                      </View>

                      {isLoading && (
                        <View style={styles.loadingOverlay}>
                          <ActivityIndicator size="large" color="#FFFFFF" />
                          <Text style={styles.loadingText}>Traitement...</Text>
                        </View>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Mentions légales Apple */}
            <View style={styles.legalSection}>
              <Text style={styles.legalTitle}>Informations sur l'abonnement</Text>
              <Text style={styles.legalText}>
                En vous abonnant à EatFitByMax Premium, vous accédez à tous les programmes personnalisés, 
                au coaching et aux outils avancés. Abonnement mensuel à renouvellement automatique 
                (sauf résiliation dans les réglages Apple au moins 24h avant la fin de la période en cours).
              </Text>
              
              <Text style={styles.legalText}>
                Le paiement sera prélevé sur votre compte iTunes lors de la confirmation d'achat. 
                L'abonnement se renouvelle automatiquement sauf si le renouvellement automatique 
                est désactivé au moins 24 heures avant la fin de la période en cours.
              </Text>

              <Text style={styles.legalText}>
                Votre compte sera facturé pour le renouvellement dans les 24 heures précédant 
                la fin de la période en cours.
              </Text>

              <View style={styles.legalLinks}>
                <TouchableOpacity 
                  style={styles.linkButton}
                  onPress={openPrivacyPolicy}
                >
                  <Text style={styles.linkText}>Politique de confidentialité</Text>
                </TouchableOpacity>
                
                <Text style={styles.linkSeparator}> • </Text>
                
                <TouchableOpacity 
                  style={styles.linkButton}
                  onPress={openTermsOfService}
                >
                  <Text style={styles.linkText}>Conditions d'utilisation</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.cancelText}>
                Pour annuler votre abonnement, rendez-vous dans Réglages {">"} Votre nom {">"} 
                Abonnements sur votre appareil iOS.
              </Text>
            </View>

            {/* Footer */}
            <TouchableOpacity
              style={styles.laterButton}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.laterButtonText}>Peut-être plus tard</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    padding: 24,
    margin: 20,
    maxHeight: '85%',
    width: '90%',
    maxWidth: 400,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#CCCCCC',
    textAlign: 'center',
    lineHeight: 22,
  },
  plansContainer: {
    gap: 16,
  },
  planCard: {
    borderRadius: 16,
    borderWidth: 2,
    overflow: 'hidden',
  },
  planGradient: {
    padding: 20,
    position: 'relative',
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  planIconContainer: {
    marginRight: 12,
  },
  planIcon: {
    fontSize: 24,
  },
  planTitleContainer: {
    flex: 1,
  },
  planName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  planPriceContainer: {
    alignItems: 'flex-end',
  },
  planPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  renewalText: {
    fontSize: 10,
    color: '#FFFFFF',
    opacity: 0.8,
    textAlign: 'right',
  },
  featuresContainer: {
    gap: 8,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureCheck: {
    fontSize: 16,
    color: '#FFFFFF',
    marginRight: 8,
    fontWeight: 'bold',
  },
  featureText: {
    fontSize: 14,
    color: '#FFFFFF',
    flex: 1,
    lineHeight: 20,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 8,
    fontSize: 16,
  },
  laterButton: {
    marginTop: 24,
    padding: 16,
    alignItems: 'center',
  },
  laterButtonText: {
    fontSize: 16,
    color: '#888888',
    textDecorationLine: 'underline',
  },
  legalSection: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#444444',
  },
  legalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  legalText: {
    fontSize: 12,
    color: '#CCCCCC',
    lineHeight: 18,
    marginBottom: 8,
    textAlign: 'justify',
  },
  legalLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 8,
  },
  linkButton: {
    paddingVertical: 4,
  },
  linkText: {
    fontSize: 12,
    color: '#4A9EFF',
    textDecorationLine: 'underline',
  },
  linkSeparator: {
    fontSize: 12,
    color: '#CCCCCC',
  },
  cancelText: {
    fontSize: 11,
    color: '#999999',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 8,
  },
});