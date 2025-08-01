` tags.

```xml
<replit_final_file>
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
import { Colors } from '../constants/Colors';
import { inAppPurchaseService } from '../utils/inAppPurchases';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface SubscriptionModalProps {
  visible: boolean;
  onClose: () => void;
  onSubscribe?: () => void;
}

export default function SubscriptionModal({ visible, onClose, onSubscribe }: SubscriptionModalProps) {
  const { theme } = useTheme();
  const colors = Colors[theme];
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  const plans = [
    {
      id: 'monthly',
      name: 'Mensuel',
      price: '9,99 €',
      period: '/mois',
      description: 'Parfait pour essayer',
      features: [
        'Programmes personnalisés illimités',
        'Suivi nutritionnel avancé',
        'Reconnaissance d\'images IA',
        'Support premium 24/7',
        'Synchronisation Apple Health'
      ],
      popular: false,
    },
    {
      id: 'yearly',
      name: 'Annuel',
      price: '79,99 €',
      period: '/an',
      description: 'Économisez 33%',
      features: [
        'Tous les avantages du plan mensuel',
        '4 mois gratuits',
        'Accès prioritaire aux nouvelles fonctionnalités',
        'Consultation coach mensuelle offerte',
        'Rapports de progression détaillés'
      ],
      popular: true,
    },
  ];

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
  }, [visible]);

  const handleSubscribe = async () => {
    try {
      setLoading(true);

      // Simuler l'achat
      const success = await inAppPurchaseService.purchaseSubscription(
        selectedPlan === 'monthly' ? 'monthly_premium' : 'yearly_premium'
      );

      if (success) {
        Alert.alert(
          'Abonnement activé !',
          'Merci pour votre abonnement. Vous avez maintenant accès à toutes les fonctionnalités premium.',
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
      }
    } catch (error) {
      console.error('Erreur abonnement:', error);
      Alert.alert(
        'Erreur',
        'Une erreur est survenue lors de l\'abonnement. Veuillez réessayer.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
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
                  <TouchableOpacity
                    key={plan.id}
                    style={[
                      styles.planCard,
                      {
                        backgroundColor: colors.card,
                        borderColor: selectedPlan === plan.id ? '#FFD700' : colors.border,
                        borderWidth: selectedPlan === plan.id ? 2 : 1,
                      },
                    ]}
                    onPress={() => setSelectedPlan(plan.id as 'monthly' | 'yearly')}
                  >
                    {plan.popular && (
                      <View style={styles.popularBadge}>
                        <Text style={styles.popularText}>POPULAIRE</Text>
                      </View>
                    )}

                    <View style={styles.planHeader}>
                      <View style={styles.planInfo}>
                        <Text style={[styles.planName, { color: colors.text }]}>
                          {plan.name}
                        </Text>
                        <Text style={[styles.planDescription, { color: colors.textSecondary }]}>
                          {plan.description}
                        </Text>
                      </View>
                      <View style={styles.planPrice}>
                        <Text style={[styles.price, { color: colors.text }]}>
                          {plan.price}
                        </Text>
                        <Text style={[styles.period, { color: colors.textSecondary }]}>
                          {plan.period}
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

                    {selectedPlan === plan.id && (
                      <View style={styles.selectedIndicator}>
                        <Ionicons name="radio-button-on" size={24} color="#FFD700" />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              {/* Subscribe Button */}
              <TouchableOpacity
                style={[
                  styles.subscribeButton,
                  loading && styles.subscribeButtonDisabled,
                ]}
                onPress={handleSubscribe}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <>
                    <Ionicons name="diamond" size={20} color="white" />
                    <Text style={styles.subscribeButtonText}>
                      Commencer l'abonnement {selectedPlan === 'monthly' ? 'mensuel' : 'annuel'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

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
  planName: {
    fontSize: 20,
    fontWeight: '600',
  },
  planDescription: {
    fontSize: 14,
    marginTop: 4,
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