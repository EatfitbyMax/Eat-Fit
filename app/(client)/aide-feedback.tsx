
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, TextInput, Alert, Linking, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AideFeedbackScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState('');
  const [feedbackText, setFeedbackText] = useState('');
  const [email, setEmail] = useState('');
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

  useEffect(() => {
    loadUserEmail();
  }, []);

  const loadUserEmail = async () => {
    try {
      const userEmail = await AsyncStorage.getItem('userEmail');
      if (userEmail) {
        setEmail(userEmail);
      }
    } catch (error) {
      console.error('Erreur chargement email:', error);
    }
  };

  const faqItems = [
    {
      question: "Comment synchroniser mes données Apple Health ?",
      answer: "1. Allez dans Profil > Intégrations > Apple Health\n2. Cliquez sur 'Connecter'\n3. Autorisez l'accès aux données demandées dans les paramètres iOS\n4. La synchronisation se fera automatiquement",
      category: "Intégrations",
      priority: "high"
    },
    {
      question: "Comment suivre mes calories quotidiennes ?",
      answer: "1. Utilisez l'onglet Nutrition\n2. Scannez vos aliments avec l'appareil photo\n3. Ajoutez manuellement vos repas\n4. Consultez votre bilan quotidien dans l'onglet Accueil",
      category: "Nutrition",
      priority: "high"
    },
    {
      question: "Puis-je utiliser l'app sans abonnement premium ?",
      answer: "Oui ! Les fonctionnalités de base sont entièrement gratuites :\n• Suivi nutrition de base\n• Exercices simples\n• Synchronisation Apple Health\n\nL'abonnement premium débloque :\n• Coach IA personnalisé\n• Programmes avancés\n• Analyses détaillées",
      category: "Abonnement",
      priority: "high"
    },
    {
      question: "Comment connecter Strava à l'application ?",
      answer: "1. Allez dans Profil > Intégrations > Strava\n2. Cliquez sur 'Connecter'\n3. Connectez-vous avec vos identifiants Strava\n4. Autorisez l'accès à vos activités\n5. Vos activités apparaîtront automatiquement",
      category: "Intégrations",
      priority: "medium"
    },
    {
      question: "Mes données sont-elles sécurisées ?",
      answer: "Absolument ! Nous utilisons :\n• Chiffrement AES-256 pour toutes les données\n• Conformité RGPD stricte\n• Aucune vente de données personnelles\n• Serveurs sécurisés en Europe\n• Authentification biométrique optionnelle",
      category: "Sécurité",
      priority: "high"
    },
    {
      question: "Comment créer un programme d'entraînement ?",
      answer: "1. Allez dans l'onglet Entraînement\n2. Cliquez sur 'Créer un programme'\n3. Choisissez vos objectifs et niveau\n4. Sélectionnez vos exercices préférés\n5. Définissez la fréquence d'entraînement",
      category: "Entraînement",
      priority: "medium"
    },
    {
      question: "L'app fonctionne-t-elle hors ligne ?",
      answer: "Partiellement ! Vous pouvez :\n• Consulter vos données déjà synchronisées\n• Ajouter des entrées nutrition (sync à la reconnexion)\n• Utiliser les programmes téléchargés\n\nUne connexion est nécessaire pour :\n• Scanner de nouveaux aliments\n• Synchroniser avec les services externes\n• Accéder au coach IA",
      category: "Technique",
      priority: "medium"
    },
    {
      question: "Comment annuler mon abonnement premium ?",
      answer: "Pour annuler votre abonnement :\n\niOS :\n1. Paramètres > Votre nom > Abonnements\n2. Sélectionnez EatFitByMax\n3. Cliquez sur 'Annuler l'abonnement'\n\nAndroid :\n1. Google Play Store > Menu > Abonnements\n2. Sélectionnez EatFitByMax\n3. Cliquez sur 'Annuler'\n\nL'accès premium reste actif jusqu'à la fin de la période payée.",
      category: "Abonnement",
      priority: "high"
    }
  ];

  const contactMethods = [
    {
      title: "Email de support",
      description: "support@eatfitbymax.com",
      subtitle: "Réponse sous 24h",
      icon: "📧",
      action: () => Linking.openURL('mailto:support@eatfitbymax.com?subject=Support%20EatFitByMax')
    },
    {
      title: "Centre d'aide en ligne",
      description: "Documentation complète",
      subtitle: "Guides et tutoriels",
      icon: "🌐",
      action: () => Linking.openURL('https://help.eatfitbymax.com')
    },
    {
      title: "Chat en direct",
      description: "Lun-Ven 9h-18h (CET)",
      subtitle: "Support en temps réel",
      icon: "💬",
      action: () => Linking.openURL('https://help.eatfitbymax.com/chat')
    },
    {
      title: "Communauté Discord",
      description: "Forum des utilisateurs",
      subtitle: "Entraide entre utilisateurs",
      icon: "👥",
      action: () => Linking.openURL('https://discord.gg/eatfitbymax')
    },
    {
      title: "Support Premium",
      description: "Support prioritaire",
      subtitle: "Réservé aux abonnés Premium",
      icon: "👑",
      action: () => Linking.openURL('mailto:premium@eatfitbymax.com?subject=Support%20Premium')
    }
  ];

  const feedbackCategories = [
    "💡 Suggestion d'amélioration",
    "🐛 Signaler un bug",
    "⚡ Problème de performance",
    "✨ Demande de fonctionnalité",
    "📱 Problème d'interface",
    "🔗 Problème d'intégration",
    "❓ Autre"
  ];

  const submitFeedback = async () => {
    if (!feedbackText.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir votre message');
      return;
    }

    if (!selectedCategory) {
      Alert.alert('Erreur', 'Veuillez sélectionner une catégorie');
      return;
    }

    try {
      // Simulate feedback submission
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      Alert.alert(
        'Feedback envoyé',
        'Merci pour votre retour ! Nous vous répondrons dans les plus brefs délais.\n\nNuméro de ticket : #' + Date.now().toString().slice(-6),
        [{ 
          text: 'OK', 
          onPress: () => {
            setFeedbackText('');
            setSelectedCategory('');
          }
        }]
      );
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'envoyer le feedback. Veuillez réessayer.');
    }
  };

  const toggleFAQ = (index: number) => {
    setExpandedFAQ(expandedFAQ === index ? null : index);
  };

  const openAppStore = () => {
    const appStoreUrl = Platform.OS === 'ios' 
      ? 'https://apps.apple.com/app/eatfitbymax/id6748567188'
      : 'https://play.google.com/store/apps/details?id=com.eatfitbymax.app';
    Linking.openURL(appStoreUrl);
  };

  const shareApp = () => {
    const shareUrl = 'https://eatfitbymax.com/download';
    const shareText = 'Découvre EatFitByMax, l\'app qui révolutionne le fitness et la nutrition ! 💪';
    
    if (Platform.OS === 'ios') {
      Linking.openURL(`sms:&body=${shareText} ${shareUrl}`);
    } else {
      Linking.openURL(`whatsapp://send?text=${shareText} ${shareUrl}`);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.push('/(client)/profil')}
          >
            <Text style={[styles.backText, { color: theme.text }]}>←</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.text }]}>Aide et feedback</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Actions rapides */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>🚀 Actions rapides</Text>
          
          <View style={styles.quickActionsContainer}>
            <TouchableOpacity style={[styles.quickAction, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={openAppStore}>
              <Text style={styles.quickActionIcon}>⭐</Text>
              <Text style={[styles.quickActionText, { color: theme.text }]}>Noter l'app</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.quickAction, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={shareApp}>
              <Text style={styles.quickActionIcon}>📤</Text>
              <Text style={[styles.quickActionText, { color: theme.text }]}>Partager</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Questions fréquentes */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>❓ Questions fréquentes</Text>
          
          {faqItems.map((item, index) => (
            <TouchableOpacity 
              key={index} 
              style={[styles.faqItem, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={() => toggleFAQ(index)}
            >
              <View style={styles.faqHeader}>
                <Text style={[styles.faqQuestion, { color: theme.text }]}>{item.question}</Text>
                <Text style={[styles.faqToggle, { color: theme.textSecondary }]}>
                  {expandedFAQ === index ? '−' : '+'}
                </Text>
              </View>
              
              {expandedFAQ === index && (
                <View style={styles.faqAnswerContainer}>
                  <Text style={[styles.faqAnswer, { color: theme.textSecondary }]}>{item.answer}</Text>
                  <View style={styles.faqFooter}>
                    <View style={[styles.faqCategory, { backgroundColor: item.priority === 'high' ? '#F5A623' : '#238636' }]}>
                      <Text style={styles.faqCategoryText}>{item.category}</Text>
                    </View>
                  </View>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Contact */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>📞 Nous contacter</Text>
          
          {contactMethods.map((method, index) => (
            <TouchableOpacity 
              key={index} 
              style={[styles.contactItem, { backgroundColor: theme.card, borderColor: theme.border }]} 
              onPress={method.action}
            >
              <Text style={styles.contactIcon}>{method.icon}</Text>
              <View style={styles.contactInfo}>
                <Text style={[styles.contactTitle, { color: theme.text }]}>{method.title}</Text>
                <Text style={[styles.contactDescription, { color: theme.textSecondary }]}>{method.description}</Text>
                <Text style={[styles.contactSubtitle, { color: theme.textSecondary }]}>{method.subtitle}</Text>
              </View>
              <Text style={[styles.contactArrow, { color: theme.textSecondary }]}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Envoyer un feedback */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>💭 Envoyer un feedback</Text>
          
          <View style={[styles.feedbackForm, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>Catégorie *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryContainer}>
                {feedbackCategories.map((category, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.categoryButton, 
                      { borderColor: theme.border },
                      selectedCategory === category && [styles.selectedCategory, { backgroundColor: '#F5A623' }]
                    ]}
                    onPress={() => setSelectedCategory(category)}
                  >
                    <Text style={[
                      styles.categoryText, 
                      { color: theme.textSecondary },
                      selectedCategory === category && styles.selectedCategoryText
                    ]}>
                      {category}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>Email</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]}
                value={email}
                onChangeText={setEmail}
                placeholder="votre.email@exemple.com"
                placeholderTextColor="#6A737D"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>Votre message *</Text>
              <TextInput
                style={[styles.textInput, styles.textArea, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]}
                value={feedbackText}
                onChangeText={setFeedbackText}
                placeholder="Décrivez votre suggestion, problème ou question en détail..."
                placeholderTextColor="#6A737D"
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
              <Text style={[styles.characterCount, { color: theme.textSecondary }]}>
                {feedbackText.length}/1000 caractères
              </Text>
            </View>

            <TouchableOpacity 
              style={[
                styles.submitButton,
                (!feedbackText.trim() || !selectedCategory) && styles.submitButtonDisabled
              ]} 
              onPress={submitFeedback}
              disabled={!feedbackText.trim() || !selectedCategory}
            >
              <Text style={styles.submitButtonText}>Envoyer le feedback</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Ressources utiles */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>📚 Ressources utiles</Text>
          
          <TouchableOpacity 
            style={[styles.resourceItem, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => Linking.openURL('https://help.eatfitbymax.com/getting-started')}
          >
            <Text style={styles.resourceIcon}>📖</Text>
            <View style={styles.resourceInfo}>
              <Text style={[styles.resourceTitle, { color: theme.text }]}>Guide de démarrage</Text>
              <Text style={[styles.resourceDescription, { color: theme.textSecondary }]}>Premiers pas avec EatFitByMax</Text>
            </View>
            <Text style={[styles.resourceArrow, { color: theme.textSecondary }]}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.resourceItem, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => Linking.openURL('https://help.eatfitbymax.com/videos')}
          >
            <Text style={styles.resourceIcon}>🎥</Text>
            <View style={styles.resourceInfo}>
              <Text style={[styles.resourceTitle, { color: theme.text }]}>Tutoriels vidéo</Text>
              <Text style={[styles.resourceDescription, { color: theme.textSecondary }]}>Apprendre en vidéo</Text>
            </View>
            <Text style={[styles.resourceArrow, { color: theme.textSecondary }]}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.resourceItem, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => Linking.openURL('https://help.eatfitbymax.com/tips')}
          >
            <Text style={styles.resourceIcon}>💡</Text>
            <View style={styles.resourceInfo}>
              <Text style={[styles.resourceTitle, { color: theme.text }]}>Conseils et astuces</Text>
              <Text style={[styles.resourceDescription, { color: theme.textSecondary }]}>Optimiser votre utilisation</Text>
            </View>
            <Text style={[styles.resourceArrow, { color: theme.textSecondary }]}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.resourceItem, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => Linking.openURL('https://blog.eatfitbymax.com')}
          >
            <Text style={styles.resourceIcon}>📝</Text>
            <View style={styles.resourceInfo}>
              <Text style={[styles.resourceTitle, { color: theme.text }]}>Blog</Text>
              <Text style={[styles.resourceDescription, { color: theme.textSecondary }]}>Conseils nutrition et fitness</Text>
            </View>
            <Text style={[styles.resourceArrow, { color: theme.textSecondary }]}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Version et infos */}
        <View style={[styles.infoContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.infoTitle, { color: theme.text }]}>Informations de l'application</Text>
          <Text style={[styles.infoText, { color: theme.textSecondary }]}>Version: 1.0.0</Text>
          <Text style={[styles.infoText, { color: theme.textSecondary }]}>Build: 2024.27.07</Text>
          <Text style={[styles.infoText, { color: theme.textSecondary }]}>
            Plateforme: {Platform.OS === 'ios' ? 'iOS' : 'Android'} {Platform.Version}
          </Text>
          <Text style={[styles.infoText, { color: theme.textSecondary }]}>
            Environnement: {__DEV__ ? 'Développement' : 'Production'}
          </Text>
        </View>
      </ScrollView>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#21262D',
  },
  backButton: {
    padding: 8,
  },
  backText: {
    fontSize: 24,
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
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  quickAction: {
    flex: 1,
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#21262D',
    alignItems: 'center',
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  faqItem: {
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#21262D',
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
    marginRight: 12,
  },
  faqToggle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8B949E',
  },
  faqAnswerContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#21262D',
  },
  faqAnswer: {
    fontSize: 14,
    color: '#8B949E',
    lineHeight: 20,
    marginBottom: 12,
  },
  faqFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqCategory: {
    backgroundColor: '#F5A623',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  faqCategoryText: {
    fontSize: 12,
    color: '#000000',
    fontWeight: '600',
  },
  contactItem: {
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#21262D',
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  contactDescription: {
    fontSize: 14,
    color: '#8B949E',
    marginBottom: 2,
  },
  contactSubtitle: {
    fontSize: 12,
    color: '#6A737D',
    fontStyle: 'italic',
  },
  contactArrow: {
    fontSize: 18,
    color: '#8B949E',
  },
  feedbackForm: {
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#21262D',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  categoryContainer: {
    flexDirection: 'row',
  },
  categoryButton: {
    backgroundColor: '#21262D',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#30363D',
  },
  selectedCategory: {
    backgroundColor: '#F5A623',
    borderColor: '#F5A623',
  },
  categoryText: {
    fontSize: 14,
    color: '#8B949E',
    fontWeight: '500',
  },
  selectedCategoryText: {
    color: '#000000',
  },
  textInput: {
    backgroundColor: '#0D1117',
    borderWidth: 1,
    borderColor: '#30363D',
    borderRadius: 8,
    padding: 12,
    color: '#FFFFFF',
    fontSize: 16,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    color: '#6A737D',
    textAlign: 'right',
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: '#F5A623',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#6A737D',
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
  },
  resourceItem: {
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#21262D',
    flexDirection: 'row',
    alignItems: 'center',
  },
  resourceIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  resourceInfo: {
    flex: 1,
  },
  resourceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  resourceDescription: {
    fontSize: 14,
    color: '#8B949E',
  },
  resourceArrow: {
    fontSize: 18,
    color: '#8B949E',
  },
  infoContainer: {
    padding: 20,
    backgroundColor: '#161B22',
    margin: 20,
    marginTop: 0,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#21262D',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#8B949E',
    marginBottom: 4,
  },
});
