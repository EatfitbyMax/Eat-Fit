import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, TextInput, Alert } from 'react-native';
import { PersistentStorage } from '@/utils/storage';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentUser } from '@/utils/auth';
import { useAuth } from '@/context/AuthContext';

interface CoachInfo {
  prenom: string;
  nom: string;
  email: string;
  specialite: string;
  disponibilites: string;
}

export default function CoachProfilScreen() {
  const router = useRouter();
  const { logout } = useAuth();
  const [coachInfo, setCoachInfo] = useState<CoachInfo>({
    prenom: 'Maxime',
    nom: 'Renard',
    email: 'eatfitbymax@gmail.com',
    specialite: 'Coach Nutrition & Fitness',
    disponibilites: 'Lun-Ven, 8h-18h'
  });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    loadCoachInfo();
  }, []);

  const loadCoachInfo = async () => {
    try {
      // D'abord essayer de charger depuis le serveur
      const users = await PersistentStorage.getUsers();
      const coach = users.find(user => user.userType === 'coach' && user.email === 'eatfitbymax@gmail.com');

      if (coach) {
        const serverCoachInfo = {
          prenom: coach.firstName || coach.name.split(' ')[0] || 'Maxime',
          nom: coach.lastName || coach.name.split(' ')[1] || 'Renard',
          email: coach.email,
          specialite: coach.specialite || 'Coach Nutrition & Fitness',
          disponibilites: coach.disponibilites || 'Lun-Ven, 8h-18h'
        };
        setCoachInfo(serverCoachInfo);
        console.log('Données coach chargées depuis le serveur VPS');
      } else {
        // Fallback sur le stockage local si pas trouvé sur le serveur
        const savedInfo = await AsyncStorage.getItem('coachInfo');
        if (savedInfo) {
          setCoachInfo(JSON.parse(savedInfo));
          console.log('Données coach chargées depuis le stockage local');
        }
      }
    } catch (error) {
      console.error('Erreur chargement infos coach:', error);
      // En cas d'erreur, essayer le stockage local
      try {
        const savedInfo = await AsyncStorage.getItem('coachInfo');
        if (savedInfo) {
          setCoachInfo(JSON.parse(savedInfo));
        }
      } catch (localError) {
        console.error('Erreur chargement local:', localError);
      }
    }
  };

  const saveCoachInfo = async () => {
    try {
      // Sauvegarder localement
      await AsyncStorage.setItem('coachInfo', JSON.stringify(coachInfo));

      // Sauvegarder sur le serveur VPS
      const users = await PersistentStorage.getUsers();
      const coachIndex = users.findIndex(user => user.userType === 'coach' && user.email === 'eatfitbymax@gmail.com');

      if (coachIndex !== -1) {
        // Mettre à jour les données du coach
        users[coachIndex] = {
          ...users[coachIndex],
          firstName: coachInfo.prenom,
          lastName: coachInfo.nom,
          name: `${coachInfo.prenom} ${coachInfo.nom}`,
          email: coachInfo.email,
          specialite: coachInfo.specialite,
          disponibilites: coachInfo.disponibilites
        };

        // Sauvegarder sur le serveur
        await PersistentStorage.saveUsers(users);
        console.log('Données coach sauvegardées sur le serveur VPS');
      }

      setIsEditing(false);
      Alert.alert('Succès', 'Vos informations ont été sauvegardées');
    } catch (error) {
      console.error('Erreur sauvegarde infos coach:', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder vos informations');
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
            try {
              console.log('🚪 Bouton déconnexion appuyé - Début de la déconnexion...');
              await logout();
              console.log('✅ Déconnexion contexte terminée');
            } catch (error) {
              console.error('❌ Erreur lors de la déconnexion:', error);
              Alert.alert('Erreur', 'Impossible de se déconnecter. Réessayez.');
            }
          },
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

        {/* Profile Info */}
        <View style={styles.profileSection}>
          <View style={styles.profileHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {coachInfo.prenom[0]?.toUpperCase()}{coachInfo.nom[0]?.toUpperCase()}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.name}>{coachInfo.prenom} {coachInfo.nom}</Text>
              <Text style={styles.email}>{coachInfo.email}</Text>
              <Text style={styles.specialite}>{coachInfo.specialite}</Text>
            </View>

          </View>

          {isEditing && (
            <View style={styles.editSection}>
              <Text style={styles.editTitle}>Modifier mes informations</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Prénom</Text>
                <TextInput
                  style={styles.input}
                  value={coachInfo.prenom}
                  onChangeText={(text) => setCoachInfo({...coachInfo, prenom: text})}
                  placeholder="Prénom"
                  placeholderTextColor="#8B949E"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nom</Text>
                <TextInput
                  style={styles.input}
                  value={coachInfo.nom}
                  onChangeText={(text) => setCoachInfo({...coachInfo, nom: text})}
                  placeholder="Nom"
                  placeholderTextColor="#8B949E"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={coachInfo.email}
                  onChangeText={(text) => setCoachInfo({...coachInfo, email: text})}
                  placeholder="Email"
                  placeholderTextColor="#8B949E"
                  keyboardType="email-address"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Spécialité</Text>
                <TextInput
                  style={styles.input}
                  value={coachInfo.specialite}
                  onChangeText={(text) => setCoachInfo({...coachInfo, specialite: text})}
                  placeholder="Ex: Coach Nutrition & Fitness"
                  placeholderTextColor="#8B949E"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Disponibilités</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={coachInfo.disponibilites}
                  onChangeText={(text) => setCoachInfo({...coachInfo, disponibilites: text})}
                  placeholder="Ex: Lun-Ven, 8h-18h / Sam, 9h-12h"
                  placeholderTextColor="#8B949E"
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.editButtons}>
                <TouchableOpacity style={styles.cancelButton} onPress={() => setIsEditing(false)}>
                  <Text style={styles.cancelButtonText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={saveCoachInfo}>
                  <Text style={styles.saveButtonText}>Sauvegarder</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Informations personnelles */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Informations personnelles</Text>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => setIsEditing(!isEditing)}
          >
            <Text style={styles.menuItemText}>Informations personnelles</Text>
            <Text style={styles.menuItemArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuItemText}>Notifications</Text>
            <Text style={styles.menuItemArrow}>›</Text>
          </TouchableOpacity>
        </View>



        {/* Paramètres */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Paramètres</Text>

          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuItemText}>Paramètres de l'application</Text>
            <Text style={styles.menuItemArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuItemText}>Sécurité et confidentialité</Text>
            <Text style={styles.menuItemArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuItemText}>Aide et feedback</Text>
            <Text style={styles.menuItemArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>🚪 Se déconnecter</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Version 1.0.0</Text>
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
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  profileSection: {
    margin: 20,
    marginTop: 0,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F5A623',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#8B949E',
  },
  specialite: {
    fontSize: 12,
    color: '#F5A623',
    fontWeight: '500',
    marginTop: 2,
  },

  editSection: {
    marginTop: 20,
    backgroundColor: '#0D1117',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#21262D',
  },
  editTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 6,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#161B22',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#21262D',
    fontSize: 14,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  editButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#21262D',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#8B949E',
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#F5A623',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 8,
  },
  saveButtonText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    margin: 20,
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#161B22',
    borderRadius: 8,
    marginBottom: 8,
  },
  menuItemText: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  menuItemArrow: {
    fontSize: 16,
    color: '#8B949E',
  },


  logoutButton: {
    margin: 20,
    marginTop: 0,
    backgroundColor: '#DA3633',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  version: {
    fontSize: 12,
    color: '#6A737D',
    textAlign: 'center',
    marginBottom: 20,
  },
});