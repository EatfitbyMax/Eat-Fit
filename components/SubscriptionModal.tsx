import React, { useState, useRef, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Animated,
  Dimensions,
  SafeAreaView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { InAppPurchaseService, IAP_SUBSCRIPTION_PLANS } from '../utils/inAppPurchases';
import { getCurrentUser } from '../utils/auth';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface SubscriptionModalProps {
  visible: boolean;
  onClose: () => void;
  onSubscribe?: () => void;
}

export default function SubscriptionModal({ visible, onClose, onSubscribe }: SubscriptionModalProps) {
  const { theme: colors } = useTheme(); // Utiliser directement l'objet theme du contexte
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  // Utiliser les vrais plans IAP (exclure le plan gratuit)
  const plans = IAP_SUBSCRIPTION_PLANS.filter(plan => plan.id !== 'free').map(plan => ({
    ...plan,
    description: plan.id === 'bronze' ? 'Idéal pour débuter' :
                 plan.id === 'silver' ? 'Le plus populaire' :
                 plan.id === 'gold' ? 'Pour les sportifs sérieux' :
                 plan.id === 'diamond' ? 'L\'expérience complète' : '',
    popular: plan.id === 'silver', // Silver est populaire
    icon: plan.id === 'bronze' ? 'medal' :
          plan.id === 'silver' ? 'star' :
          plan.id === 'gold' ? 'trophy' :
          plan.id === 'diamond' ? 'diamond' : 'checkmark-circle'
  }));

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, backdropAnim, slideAnim]);

  const handleSubscribe = async (planId: string) => {
    // Éviter les appels multiples
    if (loading) {
      console.log('⏳ Achat déjà en cours, ignoré');
      return;
    }

    try {
      setLoading(true);
      console.log('🛒 Début handleSubscribe pour:', planId);

      // Récupérer l'utilisateur connecté
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        Alert.alert('Erreur', 'Vous devez être connecté pour vous abonner.');
        return;
      }

      // Trouver le plan dans les plans IAP
      const plan = IAP_SUBSCRIPTION_PLANS.find(p => p.id === planId);
      if (!plan) {
        console.error('❌ Plan introuvable:', planId);
        Alert.alert('Erreur', 'Plan d\'abonnement introuvable.');
        return;
      }

      if (!plan.productId) {
        console.error('❌ ProductId manquant pour le plan:', plan.id);
        Alert.alert('Erreur', 'Configuration du produit manquante.');
        return;
      }

      console.log('🛒 Achat IAP natif pour:', plan.name, plan.productId);

      // Achat direct sans timeout complexe pour éviter les problèmes de stack
      const success = await InAppPurchaseService.purchaseSubscription(plan.productId, currentUser.id);

      if (success) {
        Alert.alert(
          'Abonnement activé !',
          `Merci pour votre abonnement ${plan.name}. Vous avez maintenant accès à toutes les fonctionnalités premium.`,
          [
            {
              text: 'Super !',
              onPress: () => {
                onSubscribe?.();
                onClose();
              },
            },
          ]
        );
      } else {
        console.log('ℹ️ Achat annulé par l\'utilisateur');
      }
    } catch (error) {
      console.error('❌ Erreur abonnement:', error);
      
      // Gestion spécifique des erreurs de stack
      if (error.message?.includes('stack') || error.message?.includes('depth') || error.message?.includes('Maximum call stack')) {
        Alert.alert(
          'Erreur technique',
          'Un problème technique est survenu. Veuillez fermer et redémarrer complètement l\'application.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Erreur',
          error.message || 'Une erreur est survenue lors de l\'abonnement. Veuillez réessayer.',
          [{ text: 'OK' }]
        );
      }
    } finally {
      // Délai plus court pour éviter les blocages
      setTimeout(() => {
        setLoading(false);
      }, 500);
    }
  };

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  if (!visible) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      presentationStyle="overFullScreen"
    >
      <View style={styles.container}>
        <Animated.View
          style={[
            styles.backdrop,
            {
              opacity: backdropAnim,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.backdropTouchable}
            activeOpacity={1}
            onPress={handleClose}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.modal,
            {
              backgroundColor: colors.background,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <SafeAreaView style={styles.safeArea}>
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Header */}
              <View style={styles.header}>
                <TouchableOpacity
                  style={[styles.closeButton, { backgroundColor: colors.card }]}
                  onPress={handleClose}
                >
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              {/* Premium Badge */}
              <View style={styles.premiumBadge}>
                <Ionicons name="diamond" size={32} color="#FFD700" />
                <Text style={[styles.premiumTitle, { color: colors.text }]}>
                  EatFit Premium
                </Text>
                <Text style={[styles.premiumSubtitle, { color: colors.textSecondary }]}>
                  Déverrouillez votre potentiel
                </Text>
              </View>

              {/* Plans */}
              <View style={styles.plansContainer}>
                {plans.map((plan) => (
                  <View
                    key={plan.id}
                    style={[
                      styles.planCard,
                      {
                        backgroundColor: colors.card,
                        borderColor: plan.popular ? '#FFD700' : colors.border,
                        borderWidth: plan.popular ? 2 : 1,
                      },
                    ]}
                  >
                    {plan.popular && (
                      <View style={styles.popularBadge}>
                        <Text style={styles.popularText}>POPULAIRE</Text>
                      </View>
                    )}

                    <View style={styles.planHeader}>
                      <View style={styles.planInfo}>
                        <View style={styles.planTitleRow}>
                          <Ionicons 
                            name={plan.icon as any} 
                            size={24} 
                            color={plan.id === 'bronze' ? '#CD7F32' :
                                   plan.id === 'silver' ? '#C0C0C0' :
                                   plan.id === 'gold' ? '#FFD700' :
                                   plan.id === 'diamond' ? '#B9F2FF' : '#4CAF50'} 
                          />
                          <Text style={[styles.planName, { color: colors.text }]}>
                            {plan.name}
                          </Text>
                        </View>
                        <Text style={[styles.planDescription, { color: colors.textSecondary }]}>
                          {plan.description}
                        </Text>
                        {plan.appointmentLimits.monthly > 0 && (
                          <Text style={[styles.appointmentLimit, { color: colors.textSecondary }]}>
                            {plan.appointmentLimits.monthly} rendez-vous/mois
                          </Text>
                        )}
                      </View>
                      <View style={styles.planPrice}>
                        <Text style={[styles.price, { color: colors.text }]}>
                          {plan.price}
                        </Text>
                        <Text style={[styles.period, { color: colors.textSecondary }]}>
                          /{plan.duration}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.featuresContainer}>
                      {plan.features.map((feature, index) => (
                        <View key={index} style={styles.featureRow}>
                          <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                          <Text style={[styles.featureText, { color: colors.text }]}>
                            {feature}
                          </Text>
                        </View>
                      ))}
                    </View>

                    {/* Bouton d'achat individuel pour chaque plan */}
                    <TouchableOpacity
                      style={[
                        styles.planSubscribeButton,
                        {
                          backgroundColor: plan.popular ? '#FFD700' : colors.primary,
                        },
                        loading && styles.subscribeButtonDisabled,
                      ]}
                      onPress={() => handleSubscribe(plan.id)}
                      disabled={loading}
                    >
                      {loading ? (
                        <ActivityIndicator color="white" size="small" />
                      ) : (
                        <>
                          <Ionicons name="card" size={18} color={plan.popular ? '#000' : 'white'} />
                          <Text style={[
                            styles.planSubscribeButtonText,
                            { color: plan.popular ? '#000' : 'white' }
                          ]}>
                            S'abonner
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                ))}
              </View>

              {/* Terms */}
              <Text style={[styles.termsText, { color: colors.textSecondary }]}>
                En continuant, vous acceptez nos conditions d'utilisation et notre politique de confidentialité.
                L'abonnement se renouvelle automatiquement et peut être annulé à tout moment.
              </Text>
            </ScrollView>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdropTouchable: {
    flex: 1,
  },
  modal: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.9,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -5 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 20,
    paddingBottom: 0,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  premiumBadge: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  premiumTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginTop: 12,
  },
  premiumSubtitle: {
    fontSize: 16,
    marginTop: 4,
  },
  plansContainer: {
    paddingHorizontal: 20,
    gap: 16,
  },
  planCard: {
    borderRadius: 16,
    padding: 20,
    position: 'relative',
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    left: 20,
    backgroundColor: '#FFD700',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '700',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  planInfo: {
    flex: 1,
  },
  planTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  planName: {
    fontSize: 20,
    fontWeight: '600',
  },
  planDescription: {
    fontSize: 14,
    marginTop: 4,
  },
  appointmentLimit: {
    fontSize: 12,
    marginTop: 2,
    fontStyle: 'italic',
  },
  planPrice: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 24,
    fontWeight: '700',
  },
  period: {
    fontSize: 14,
  },
  featuresContainer: {
    gap: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    flex: 1,
    fontSize: 16,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 20,
    right: 20,
  },
  planSubscribeButton: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  planSubscribeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  subscribeButton: {
    backgroundColor: '#FFD700',
    marginHorizontal: 20,
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  subscribeButtonDisabled: {
    opacity: 0.6,
  },
  subscribeButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: '600',
  },
  termsText: {
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 32,
    paddingTop: 16,
    lineHeight: 16,
  },
});