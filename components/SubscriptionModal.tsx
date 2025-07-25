
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
import { PaymentService, SUBSCRIPTION_PLANS, SubscriptionPlan } from '../utils/payments';

interface SubscriptionModalProps {
  visible: boolean;
  onClose: () => void;
  onSubscribe?: (planId: string) => void;
}

export default function SubscriptionModal({ visible, onClose, onSubscribe }: SubscriptionModalProps) {
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  // Filtrer pour exclure le plan gratuit
  const premiumPlans = SUBSCRIPTION_PLANS.filter(plan => plan.id !== 'free');

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    if (loading) return;
    
    setLoading(true);
    setSelectedPlan(plan.id);

    try {
      let success = false;

      if (Platform.OS === 'ios') {
        success = await PaymentService.presentApplePayPayment(plan, 'current_user_id');
      } else if (Platform.OS === 'android') {
        success = await PaymentService.presentGooglePayPayment(plan, 'current_user_id');
      } else {
        Alert.alert('Erreur', 'Paiement non disponible sur cette plateforme');
        return;
      }

      if (success) {
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
      }
    } catch (error) {
      console.error('Erreur abonnement:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors du traitement de votre paiement.');
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
          gradient: ['#E6E6FA', '#DA70D6', '#9370DB'],
          border: '#9370DB',
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
                            {plan.price.toFixed(2)}€/mois
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
});
