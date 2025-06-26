import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { logout, getCurrentUser } from '@/utils/auth';
import { IntegrationsManager, IntegrationStatus } from '@/utils/integrations';

export default function ProfilScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  
  const [editingObjectifs, setEditingObjectifs] = useState(false);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);

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
    }, [])
  );

  const loadUserData = async () => {
    try {
      const currentUser = await getCurrentUser();
      console.log('Données utilisateur récupérées:', currentUser);
      setUser(currentUser);
    } catch (error) {
      console.error('Erreur chargement utilisateur:', error);
    }
  };

  ;

  

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
      
      // Importer PersistentStorage
      const { PersistentStorage } = require('@/utils/storage');
      
      // Récupérer les utilisateurs et mettre à jour
      const users = await PersistentStorage.getUsers();
      const userIndex = users.findIndex((u: any) => u.email === currentUser.email);
      
      if (userIndex !== -1) {
        users[userIndex] = { ...users[userIndex], goals: selectedGoals };
        await PersistentStorage.saveUsers(users);
        await PersistentStorage.setCurrentUser(users[userIndex]);
        setUser(users[userIndex]);
        Alert.alert('Succès', 'Objectifs mis à jour avec succès');
      }
    } catch (error) {
      console.error('Erreur sauvegarde objectifs:', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder les modifications');
    } finally {
      setEditingObjectifs(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        { 
          text: 'Déconnexion', 
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/auth/login');
          }
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Mon profil</Text>
        </View>

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
                {user?.favoriteSport ? (
                  [
                    { id: 'musculation', emoji: '💪' },
                    { id: 'course', emoji: '🏃' },
                    { id: 'cyclisme', emoji: '🚴' },
                    { id: 'natation', emoji: '🏊' },
                    { id: 'yoga', emoji: '🧘' },
                    { id: 'boxe', emoji: '🥊' },
                    { id: 'tennis', emoji: '🎾' },
                    { id: 'football', emoji: '⚽' },
                    { id: 'basketball', emoji: '🏀' },
                    { id: 'escalade', emoji: '🧗' },
                    { id: 'crossfit', emoji: '🏋️' },
                    { id: 'danse', emoji: '💃' }
                  ].find(sport => sport.id === user.favoriteSport)?.emoji || '🏃'
                ) : '🏃'} Sport favori:
              </Text>
              <Text style={styles.infoValue}>
                {user?.favoriteSport ? (
                  [
                    { id: 'musculation', name: 'Musculation' },
                    { id: 'course', name: 'Course à pied' },
                    { id: 'cyclisme', name: 'Cyclisme' },
                    { id: 'natation', name: 'Natation' },
                    { id: 'yoga', name: 'Yoga' },
                    { id: 'boxe', name: 'Boxe/Arts martiaux' },
                    { id: 'tennis', name: 'Tennis' },
                    { id: 'football', name: 'Football' },
                    { id: 'basketball', name: 'Basketball' },
                    { id: 'escalade', name: 'Escalade' },
                    { id: 'crossfit', name: 'CrossFit' },
                    { id: 'danse', name: 'Danse' }
                  ].find(sport => sport.id === user.favoriteSport)?.name || 'Non renseigné'
                ) : 'Non renseigné'}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>📊 Activité:</Text>
              <Text style={styles.infoValue}>{user?.activityLevel || 'Non renseigné'}</Text>
            </View>
          </View>

          </View>

        {/* Objectifs */}
        <View style={styles.section}>
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

        

        

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Paramètres</Text>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push('/(client)/integrations')}
          >
            <Text style={styles.menuItemText}>🔗 Intégrations</Text>
            <Text style={styles.menuItemArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push('/(client)/parametres-application')}
          >
            <Text style={styles.menuItemText}>⚙️ Paramètres de l'application</Text>
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
    backgroundColor: '#6C757D',
  },
  connectedButtonText: {
    color: '#FFFFFF',
  },
  stravaConnection: {
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#21262D',
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
  },
    testButton: {
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
  connectedButton: {
    backgroundColor: '#2ecc71',
  },
  connectedButtonText: {
    color: '#000000',
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
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
  goalText: {
    fontSize: 15,
    color: '#FFFFFF',
    flex: 1,
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
});