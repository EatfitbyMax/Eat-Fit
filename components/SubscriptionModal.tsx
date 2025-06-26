
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
  userId: string;
  currentPlanId?: string;
  onSubscriptionUpdate?: () => void;
}

export default function SubscriptionModal({ 
  visible, 
  onClose, 
  userId, 
  currentPlanId = 'free',
  onSubscriptionUpdate 
}: SubscriptionModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePlanSelection = async (plan: SubscriptionPlan) => {
    if (plan.id === 'free') {
      Alert.alert(
        'Version Gratuite',
        'Vous êtes déjà sur la version gratuite avec les fonctionnalités de base.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (plan.id === currentPlanId) {
      Alert.alert(
        'Abonnement Actuel',
        'Vous êtes déjà abonné à ce plan.',
        [{ text: 'OK' }]
      );
      return;
    }

    setSelectedPlan(plan);
    
    Alert.alert(
      `Abonnement ${plan.name}`,
      `Prix: ${plan.price}€/${plan.duration}\n\nFonctionnalités incluses:\n${plan.features.join('\n• ')}`,
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: Platform.OS === 'ios' ? 'Payer avec Apple Pay' : 'Payer avec Google Pay',
          onPress: () => handlePayment(plan)
        }
      ]
    );
  };

  const handlePayment = async (plan: SubscriptionPlan) => {
    setLoading(true);
    
    try {
      let success = false;
      
      if (Platform.OS === 'ios') {
        success = await PaymentService.presentApplePayPayment(plan, userId);
      } else if (Platform.OS === 'android') {
        success = await PaymentService.presentGooglePayPayment(plan, userId);
      } else {
        Alert.alert('Erreur', 'Paiement non supporté sur cette plateforme');
        return;
      }

      if (success) {
        Alert.alert(
          'Paiement Réussi ! 🎉',
          `Votre abonnement ${plan.name} a été activé avec succès.\n\nVous avez maintenant accès à toutes les fonctionnalités premium.`,
          [
            {
              text: 'Parfait !',
              onPress: () => {
                onSubscriptionUpdate?.();
                onClose();
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('Erreur paiement:', error);
      Alert.alert(
        'Erreur de Paiement',
        'Une erreur est survenue lors du paiement. Veuillez réessayer.'
      );
    } finally {
      setLoading(false);
      setSelectedPlan(null);
    }
  };

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'free': return '🆓';
      case 'bronze': return '🥉';
      case 'silver': return '🥈';
      case 'gold': return '🥇';
      default: return '💎';
    }
  };

  const getPlanColor = (planId: string) => {
    switch (planId) {
      case 'bronze': return ['#CD7F32', '#8B4513'];
      case 'silver': return ['#C0C0C0', '#808080'];
      case 'gold': return ['#FFD700', '#B8860B'];
      default: return ['#4A4A4A', '#2A2A2A'];
    }
  };

  const isCurrentPlan = (planId: string) => planId === currentPlanId;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Choisir un Abonnement</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {SUBSCRIPTION_PLANS.map((plan) => (
            <TouchableOpacity
              key={plan.id}
              style={[
                styles.planCard,
                isCurrentPlan(plan.id) && styles.currentPlanCard
              ]}
              onPress={() => handlePlanSelection(plan)}
              disabled={loading}
            >
              <LinearGradient
                colors={getPlanColor(plan.id)}
                style={styles.planGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.planHeader}>
                  <Text style={styles.planIcon}>{getPlanIcon(plan.id)}</Text>
                  <View style={styles.planTitleContainer}>
                    <Text style={styles.planName}>{plan.name}</Text>
                    {isCurrentPlan(plan.id) && (
                      <Text style={styles.currentPlanLabel}>Actuel</Text>
                    )}
                  </View>
                  <View style={styles.planPriceContainer}>
                    {plan.price > 0 ? (
                      <>
                        <Text style={styles.planPrice}>{plan.price}€</Text>
                        <Text style={styles.planDuration}>/{plan.duration}</Text>
                      </>
                    ) : (
                      <Text style={styles.planPrice}>Gratuit</Text>
                    )}
                  </View>
                </View>

                <View style={styles.featuresContainer}>
                  {plan.features.map((feature, index) => (
                    <Text key={index} style={styles.feature}>
                      • {feature}
                    </Text>
                  ))}
                </View>

                {plan.price > 0 && !isCurrentPlan(plan.id) && (
                  <View style={styles.paymentButton}>
                    <Text style={styles.paymentButtonText}>
                      {Platform.OS === 'ios' ? '🍎 Apple Pay' : '📱 Google Pay'}
                    </Text>
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#D4A574" />
            <Text style={styles.loadingText}>Traitement du paiement...</Text>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E1E',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#3A3A3A',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#3A3A3A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  planCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  currentPlanCard: {
    borderWidth: 2,
    borderColor: '#D4A574',
  },
  planGradient: {
    padding: 20,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  planIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  planTitleContainer: {
    flex: 1,
  },
  planName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  currentPlanLabel: {
    fontSize: 12,
    color: '#D4A574',
    fontWeight: '600',
    marginTop: 2,
  },
  planPriceContainer: {
    alignItems: 'flex-end',
  },
  planPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  planDuration: {
    fontSize: 14,
    color: '#CCCCCC',
  },
  featuresContainer: {
    marginBottom: 16,
  },
  feature: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 4,
    opacity: 0.9,
  },
  paymentButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  paymentButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 12,
  },
});
