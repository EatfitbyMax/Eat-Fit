
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { getCurrentUser } from '@/utils/auth';
import { PersistentStorage } from '@/utils/storage';

export default function InformationsPersonnellesScreen() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    age: '',
    height: '',
    weight: '',
    gender: '',
    favoriteSport: ''
  });

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        setFormData({
          firstName: currentUser.firstName || '',
          lastName: currentUser.lastName || '',
          email: currentUser.email || '',
          age: currentUser.age || '',
          height: currentUser.height || '',
          weight: currentUser.weight || '',
          gender: currentUser.gender || '',
          favoriteSport: currentUser.favoriteSport || ''
        });
      }
    } catch (error) {
      console.error('Erreur chargement utilisateur:', error);
    }
  };

  const handleSave = async () => {
    try {
      const users = await PersistentStorage.getUsers();
      const userIndex = users.findIndex(u => u.email === user.email);
      
      if (userIndex !== -1) {
        users[userIndex] = { ...users[userIndex], ...formData };
        await PersistentStorage.saveUsers(users);
        await PersistentStorage.setCurrentUser(users[userIndex]);
        setUser(users[userIndex]);
        setIsEditing(false);
        Alert.alert('Succès', 'Informations mises à jour avec succès');
      }
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder les modifications');
    }
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
          <Text style={styles.title}>Informations personnelles</Text>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => isEditing ? handleSave() : setIsEditing(true)}
          >
            <Text style={styles.editText}>{isEditing ? 'Sauvegarder' : 'Modifier'}</Text>
          </TouchableOpacity>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Prénom</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.disabledInput]}
              value={formData.firstName}
              onChangeText={(text) => setFormData(prev => ({ ...prev, firstName: text }))}
              editable={isEditing}
              placeholder="Votre prénom"
              placeholderTextColor="#8B949E"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nom</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.disabledInput]}
              value={formData.lastName}
              onChangeText={(text) => setFormData(prev => ({ ...prev, lastName: text }))}
              editable={isEditing}
              placeholder="Votre nom"
              placeholderTextColor="#8B949E"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, styles.disabledInput]}
              value={formData.email}
              editable={false}
              placeholder="Votre email"
              placeholderTextColor="#8B949E"
            />
            <Text style={styles.helpText}>L'email ne peut pas être modifié</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Âge</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.disabledInput]}
              value={formData.age}
              onChangeText={(text) => setFormData(prev => ({ ...prev, age: text }))}
              editable={isEditing}
              placeholder="Votre âge"
              placeholderTextColor="#8B949E"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Taille (cm)</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.disabledInput]}
              value={formData.height}
              onChangeText={(text) => setFormData(prev => ({ ...prev, height: text }))}
              editable={isEditing}
              placeholder="Votre taille en cm"
              placeholderTextColor="#8B949E"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Poids (kg)</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.disabledInput]}
              value={formData.weight}
              onChangeText={(text) => setFormData(prev => ({ ...prev, weight: text }))}
              editable={isEditing}
              placeholder="Votre poids en kg"
              placeholderTextColor="#8B949E"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Sexe</Text>
            <View style={styles.genderContainer}>
              {['Homme', 'Femme'].map((gender) => (
                <TouchableOpacity
                  key={gender}
                  style={[
                    styles.genderButton,
                    formData.gender === gender && styles.selectedGender,
                    !isEditing && styles.disabledButton
                  ]}
                  onPress={() => isEditing && setFormData(prev => ({ ...prev, gender }))}
                  disabled={!isEditing}
                >
                  <Text style={[
                    styles.genderText,
                    formData.gender === gender && styles.selectedGenderText
                  ]}>
                    {gender}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Sport favori</Text>
            <View style={styles.sportContainer}>
              {[
                { id: 'musculation', name: 'Musculation', emoji: '💪' },
                { id: 'course', name: 'Course à pied', emoji: '🏃' },
                { id: 'cyclisme', name: 'Cyclisme', emoji: '🚴' },
                { id: 'natation', name: 'Natation', emoji: '🏊' },
                { id: 'yoga', name: 'Yoga', emoji: '🧘' },
                { id: 'boxe', name: 'Boxe/Arts martiaux', emoji: '🥊' },
                { id: 'tennis', name: 'Tennis', emoji: '🎾' },
                { id: 'football', name: 'Football', emoji: '⚽' },
                { id: 'basketball', name: 'Basketball', emoji: '🏀' },
                { id: 'escalade', name: 'Escalade', emoji: '🧗' },
                { id: 'crossfit', name: 'CrossFit', emoji: '🏋️' },
                { id: 'danse', name: 'Danse', emoji: '💃' }
              ].map((sport) => (
                <TouchableOpacity
                  key={sport.id}
                  style={[
                    styles.sportButton,
                    formData.favoriteSport === sport.id && styles.selectedSport,
                    !isEditing && styles.disabledButton
                  ]}
                  onPress={() => isEditing && setFormData(prev => ({ ...prev, favoriteSport: sport.id }))}
                  disabled={!isEditing}
                >
                  <Text style={styles.sportEmoji}>{sport.emoji}</Text>
                  <Text style={[
                    styles.sportText,
                    formData.favoriteSport === sport.id && styles.selectedSportText
                  ]}>
                    {sport.name}
                  </Text>
                  {formData.favoriteSport === sport.id && (
                    <Text style={styles.checkMark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
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
  editButton: {
    padding: 8,
  },
  editText: {
    fontSize: 16,
    color: '#1F6FEB',
    fontWeight: '600',
  },
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#161B22',
    borderWidth: 1,
    borderColor: '#21262D',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF',
  },
  disabledInput: {
    backgroundColor: '#0D1117',
    color: '#8B949E',
  },
  helpText: {
    fontSize: 12,
    color: '#8B949E',
    marginTop: 4,
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  genderButton: {
    flex: 1,
    backgroundColor: '#161B22',
    borderWidth: 1,
    borderColor: '#21262D',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  selectedGender: {
    backgroundColor: '#1F6FEB',
    borderColor: '#1F6FEB',
  },
  disabledButton: {
    opacity: 0.5,
  },
  genderText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  selectedGenderText: {
    fontWeight: '600',
  },
  sportContainer: {
    gap: 8,
  },
  sportButton: {
    backgroundColor: '#161B22',
    borderWidth: 1,
    borderColor: '#21262D',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectedSport: {
    backgroundColor: '#1F6FEB',
    borderColor: '#1F6FEB',
  },
  sportEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  sportText: {
    fontSize: 16,
    color: '#FFFFFF',
    flex: 1,
  },
  selectedSportText: {
    fontWeight: '600',
    color: '#FFFFFF',
  },
  checkMark: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});
