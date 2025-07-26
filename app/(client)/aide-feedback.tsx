
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, TextInput, Alert, Linking } from 'react-native';
import { useRouter } from 'expo-router';

export default function AideFeedbackScreen() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState('');
  const [feedbackText, setFeedbackText] = useState('');
  const [email, setEmail] = useState('');

  const faqItems = [
    {
      question: "Comment synchroniser mes données Apple Health ?",
      answer: "Allez dans Profil > Intégrations > Apple Health et cliquez sur 'Connecter'. Autorisez l'accès aux données demandées.",
      category: "Intégrations"
    },
    {
      question: "Comment suivre mes calories quotidiennes ?",
      answer: "Utilisez l'onglet Nutrition pour ajouter vos repas et suivre vos calories en temps réel.",
      category: "Nutrition"
    },
    {
      question: "Puis-je utiliser l'app sans abonnement premium ?",
      answer: "Oui, les fonctionnalités de base sont gratuites. L'abonnement premium débloque les programmes personnalisés et le coach.",
      category: "Abonnement"
    },
    {
      question: "Comment connecter Strava à l'application ?",
      answer: "Allez dans Profil > Intégrations > Strava et suivez les instructions de connexion.",
      category: "Intégrations"
    },
    {
      question: "Mes données sont-elles sécurisées ?",
      answer: "Oui, toutes vos données sont chiffrées et stockées de manière sécurisée. Nous ne vendons jamais vos données personnelles.",
      category: "Sécurité"
    },
  ];

  const contactMethods = [
    {
      title: "Email de support",
      description: "support@eatfitbymax.com",
      icon: "📧",
      action: () => Linking.openURL('mailto:support@eatfitbymax.com')
    },
    {
      title: "Centre d'aide en ligne",
      description: "Documentation complète",
      icon: "🌐",
      action: () => Linking.openURL('https://help.eatfitbymax.cloud')
    },
    {
      title: "Chat en direct",
      description: "Lun-Ven 9h-18h",
      icon: "💬",
      action: () => Alert.alert('Chat', 'Fonctionnalité bientôt disponible')
    },
    {
      title: "Communauté",
      description: "Forum des utilisateurs",
      icon: "👥",
      action: () => Linking.openURL('https://community.eatfitbymax.cloud')
    }
  ];

  const feedbackCategories = [
    "Suggestion d'amélioration",
    "Signaler un bug",
    "Problème de performance",
    "Demande de fonctionnalité",
    "Autre"
  ];

  const submitFeedback = () => {
    if (!feedbackText.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir votre message');
      return;
    }

    Alert.alert(
      'Feedback envoyé',
      'Merci pour votre retour ! Nous vous répondrons dans les plus brefs délais.',
      [{ text: 'OK', onPress: () => {
        setFeedbackText('');
        setSelectedCategory('');
        setEmail('');
      }}]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Aide et feedback</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Questions fréquentes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>❓ Questions fréquentes</Text>
          
          {faqItems.map((item, index) => (
            <View key={index} style={styles.faqItem}>
              <Text style={styles.faqQuestion}>{item.question}</Text>
              <Text style={styles.faqAnswer}>{item.answer}</Text>
              <View style={styles.faqCategory}>
                <Text style={styles.faqCategoryText}>{item.category}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Contact */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📞 Nous contacter</Text>
          
          {contactMethods.map((method, index) => (
            <TouchableOpacity key={index} style={styles.contactItem} onPress={method.action}>
              <Text style={styles.contactIcon}>{method.icon}</Text>
              <View style={styles.contactInfo}>
                <Text style={styles.contactTitle}>{method.title}</Text>
                <Text style={styles.contactDescription}>{method.description}</Text>
              </View>
              <Text style={styles.contactArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Envoyer un feedback */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💭 Envoyer un feedback</Text>
          
          <View style={styles.feedbackForm}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Catégorie</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryContainer}>
                {feedbackCategories.map((category, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[styles.categoryButton, selectedCategory === category && styles.selectedCategory]}
                    onPress={() => setSelectedCategory(category)}
                  >
                    <Text style={[styles.categoryText, selectedCategory === category && styles.selectedCategoryText]}>
                      {category}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email (optionnel)</Text>
              <TextInput
                style={styles.textInput}
                value={email}
                onChangeText={setEmail}
                placeholder="votre.email@exemple.com"
                placeholderTextColor="#6A737D"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Votre message</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={feedbackText}
                onChangeText={setFeedbackText}
                placeholder="Décrivez votre suggestion, problème ou question..."
                placeholderTextColor="#6A737D"
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity style={styles.submitButton} onPress={submitFeedback}>
              <Text style={styles.submitButtonText}>Envoyer le feedback</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Ressources utiles */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📚 Ressources utiles</Text>
          
          <TouchableOpacity style={styles.resourceItem}>
            <Text style={styles.resourceIcon}>📖</Text>
            <View style={styles.resourceInfo}>
              <Text style={styles.resourceTitle}>Guide de démarrage</Text>
              <Text style={styles.resourceDescription}>Commencer avec EatFitByMax</Text>
            </View>
            <Text style={styles.resourceArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.resourceItem}>
            <Text style={styles.resourceIcon}>🎥</Text>
            <View style={styles.resourceInfo}>
              <Text style={styles.resourceTitle}>Tutoriels vidéo</Text>
              <Text style={styles.resourceDescription}>Apprendre en vidéo</Text>
            </View>
            <Text style={styles.resourceArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.resourceItem}>
            <Text style={styles.resourceIcon}>💡</Text>
            <View style={styles.resourceInfo}>
              <Text style={styles.resourceTitle}>Conseils et astuces</Text>
              <Text style={styles.resourceDescription}>Optimiser votre utilisation</Text>
            </View>
            <Text style={styles.resourceArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Version et infos */}
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>Informations de l'application</Text>
          <Text style={styles.infoText}>Version: 1.0.0</Text>
          <Text style={styles.infoText}>Build: 2024.06.11</Text>
          <Text style={styles.infoText}>Plateforme: {process.env.NODE_ENV === 'development' ? 'Développement' : 'Production'}</Text>
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
  faqItem: {
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#21262D',
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  faqAnswer: {
    fontSize: 14,
    color: '#8B949E',
    lineHeight: 20,
    marginBottom: 12,
  },
  faqCategory: {
    alignSelf: 'flex-start',
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
  submitButton: {
    backgroundColor: '#F5A623',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
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
