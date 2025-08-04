
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, SafeAreaView } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

interface ComingSoonModalProps {
  visible: boolean;
  onClose: () => void;
  feature: string;
  description: string;
}

export default function ComingSoonModal({ visible, onClose, feature, description }: ComingSoonModalProps) {
  const { theme } = useTheme();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.content}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={[styles.closeText, { color: theme.text }]}>×</Text>
            </TouchableOpacity>
            <Text style={[styles.title, { color: theme.text }]}>Bientôt disponible</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Content avec ScrollView */}
          <ScrollView 
            style={styles.scrollContainer}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={true}
          >
            <View style={styles.body}>
              <View style={styles.iconContainer}>
                <Text style={styles.comingSoonIcon}>🚀</Text>
              </View>

              <Text style={[styles.featureTitle, { color: theme.text }]}>{feature}</Text>
              <Text style={[styles.featureDescription, { color: theme.textSecondary }]}>
                {description}
              </Text>

              <View style={[styles.infoBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Text style={[styles.infoTitle, { color: '#F5A623' }]}>📅 Prochaine mise à jour</Text>
                <Text style={[styles.infoText, { color: theme.textSecondary }]}>
                  Cette fonctionnalité sera disponible dans une prochaine version de l'application. 
                  Nous travaillons activement pour vous offrir la meilleure expérience possible.
                </Text>
              </View>

              <View style={[styles.benefitsContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Text style={[styles.benefitsTitle, { color: theme.text }]}>Ce qui vous attend :</Text>
                <View style={styles.benefitsList}>
                  <Text style={[styles.benefitItem, { color: theme.textSecondary }]}>
                    • Synchronisation automatique de vos données de santé
                  </Text>
                  <Text style={[styles.benefitItem, { color: theme.textSecondary }]}>
                    • Suivi en temps réel de votre activité physique
                  </Text>
                  <Text style={[styles.benefitItem, { color: theme.textSecondary }]}>
                    • Analyses personnalisées de vos performances
                  </Text>
                  <Text style={[styles.benefitItem, { color: theme.textSecondary }]}>
                    • Intégration complète avec l'écosystème Apple
                  </Text>
                </View>
              </View>

              <TouchableOpacity 
                style={[styles.notifyButton, { backgroundColor: '#F5A623' }]}
                onPress={onClose}
              >
                <Text style={styles.notifyButtonText}>J'ai compris</Text>
              </TouchableOpacity>

              <Text style={[styles.footerText, { color: theme.textSecondary }]}>
                Merci de votre patience et de votre confiance ! 🙏
              </Text>
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1117',
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#21262D',
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  placeholder: {
    width: 40,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  body: {
    padding: 20,
    alignItems: 'center',
  },
  iconContainer: {
    marginVertical: 30,
  },
  comingSoonIcon: {
    fontSize: 80,
    textAlign: 'center',
  },
  featureTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 10,
  },
  featureDescription: {
    fontSize: 16,
    color: '#8B949E',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  infoBox: {
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#21262D',
    width: '100%',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F5A623',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#8B949E',
    lineHeight: 20,
  },
  benefitsContainer: {
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#21262D',
    width: '100%',
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  benefitsList: {
    gap: 8,
  },
  benefitItem: {
    fontSize: 14,
    color: '#8B949E',
    lineHeight: 20,
  },
  notifyButton: {
    backgroundColor: '#F5A623',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 25,
    marginBottom: 20,
  },
  notifyButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#8B949E',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
