
import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { getCurrentUser, updateUserData } from '@/utils/auth';
import { allSports, getSportsByCategory, searchSports } from '@/utils/sportPrograms';

interface UserData {
  email: string;
  firstName: string;
  lastName: string;
  gender: 'Homme' | 'Femme' | null;
  age: string;
  height: string;
  weight: string;
  favoriteSport: string;
}

export default function PersonalInformationScreen() {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isSportSearchActive, setIsSportSearchActive] = useState(false);
  const [formData, setFormData] = useState<UserData>({
    email: '',
    firstName: '',
    lastName: '',
    gender: null,
    age: '',
    height: '',
    weight: '',
    favoriteSport: '',
  });

  const sportsByCategory = useMemo(() => getSportsByCategory(), []);
  const categories = Object.keys(sportsByCategory);

  const filteredSports = useMemo(() => {
    if (!isEditing) return [];

    let sports = allSports;

    if (searchQuery) {
      sports = searchSports(searchQuery);
    }

    if (selectedCategory) {
      sports = sports.filter(sport => sport.category === selectedCategory);
    }

    return sports;
  }, [searchQuery, selectedCategory, isEditing]);

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    // Activer la recherche sport si on a une requête de recherche ou une catégorie sélectionnée
    setIsSportSearchActive(searchQuery.length > 0 || selectedCategory !== null);
  }, [searchQuery, selectedCategory]);

  const loadUserData = async () => {
    try {
      const user = await getCurrentUser();
      if (user) {
        setFormData({
          email: user.email,
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          gender: user.gender || null,
          age: user.age?.toString() || '',
          height: user.height?.toString() || '',
          weight: user.weight?.toString() || '',
          favoriteSport: user.favoriteSport || '',
        });
      }
    } catch (error) {
      console.error('Erreur chargement données utilisateur:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const updateData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        gender: formData.gender,
        age: parseInt(formData.age) || 0,
        height: parseInt(formData.height) || 0,
        weight: parseInt(formData.weight) || 0,
        favoriteSport: formData.favoriteSport,
      };

      const success = await updateUserData(formData.email, updateData);

      if (success) {
        setIsEditing(false);
        setSearchQuery('');
        setSelectedCategory(null);
        setIsSportSearchActive(false);
        Alert.alert('Succès', 'Vos informations ont été mises à jour.');
      } else {
        Alert.alert('Erreur', 'Impossible de mettre à jour vos informations.');
      }
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de la sauvegarde.');
    }
  };

  const clearSportFilters = () => {
    setSearchQuery('');
    setSelectedCategory(null);
    setIsSportSearchActive(false);
  };

  const getSelectedSportData = () => {
    return allSports.find(sport => sport.id === formData.favoriteSport);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setSearchQuery('');
    setSelectedCategory(null);
    setIsSportSearchActive(false);
    loadUserData(); // Recharger les données originales
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Informations personnelles</Text>
        <View style={styles.headerActions}>
          {isEditing && (
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={handleCancelEdit}
            >
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => {
              if (isEditing) {
                handleSave();
              } else {
                setIsEditing(true);
              }
            }}
          >
            <Text style={styles.editButtonText}>
              {isEditing ? 'Sauvegarder' : 'Modifier'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.form} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: isSportSearchActive ? 50 : 20 }}
      >
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={[styles.input, styles.disabledInput]}
            value={formData.email}
            editable={false}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Prénom</Text>
          <TextInput
            style={[styles.input, !isEditing && styles.disabledInput]}
            value={formData.firstName}
            onChangeText={(text) => setFormData(prev => ({ ...prev, firstName: text }))}
            editable={isEditing}
            placeholder="Prénom"
            placeholderTextColor="#666666"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nom</Text>
          <TextInput
            style={[styles.input, !isEditing && styles.disabledInput]}
            value={formData.lastName}
            onChangeText={(text) => setFormData(prev => ({ ...prev, lastName: text }))}
            editable={isEditing}
            placeholder="Nom"
            placeholderTextColor="#666666"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Genre</Text>
          <View style={styles.genderContainer}>
            <TouchableOpacity
              style={[
                styles.genderButton,
                formData.gender === 'Homme' && styles.selectedGender,
                !isEditing && styles.disabledButton
              ]}
              onPress={() => isEditing && setFormData(prev => ({ ...prev, gender: 'Homme' }))}
              disabled={!isEditing}
            >
              <Text style={[
                styles.genderText,
                formData.gender === 'Homme' && styles.selectedGenderText
              ]}>
                Homme
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.genderButton,
                formData.gender === 'Femme' && styles.selectedGender,
                !isEditing && styles.disabledButton
              ]}
              onPress={() => isEditing && setFormData(prev => ({ ...prev, gender: 'Femme' }))}
              disabled={!isEditing}
            >
              <Text style={[
                styles.genderText,
                formData.gender === 'Femme' && styles.selectedGenderText
              ]}>
                Femme
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Âge</Text>
          <TextInput
            style={[styles.input, !isEditing && styles.disabledInput]}
            value={formData.age}
            onChangeText={(text) => setFormData(prev => ({ ...prev, age: text }))}
            editable={isEditing}
            placeholder="Âge"
            placeholderTextColor="#666666"
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
            placeholder="Taille"
            placeholderTextColor="#666666"
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
            placeholder="Poids"
            placeholderTextColor="#666666"
            keyboardType="numeric"
          />
        </View>

        {/* Section Sport Favori */}
        <View style={[styles.inputGroup, isSportSearchActive && styles.expandedInputGroup]}>
          <Text style={styles.label}>Sport favori</Text>
          
          {!isEditing && formData.favoriteSport ? (
            <View style={styles.selectedSportDisplay}>
              <Text style={styles.selectedSportEmoji}>
                {getSelectedSportData()?.emoji || '🏃'}
              </Text>
              <View style={styles.selectedSportInfo}>
                <Text style={styles.selectedSportName}>
                  {getSelectedSportData()?.name || 'Sport non défini'}
                </Text>
                <Text style={styles.selectedSportCategory}>
                  {getSelectedSportData()?.category || ''}
                </Text>
              </View>
            </View>
          ) : isEditing ? (
            <View style={[styles.sportSelectionContainer, isSportSearchActive && styles.expandedSportContainer]}>
              {/* Barre de recherche */}
              <TextInput
                style={styles.searchInput}
                placeholder="Rechercher un sport..."
                placeholderTextColor="#666666"
                value={searchQuery}
                onChangeText={setSearchQuery}
                onFocus={() => setIsSportSearchActive(true)}
              />

              {/* Filtres par catégorie - seulement si recherche active */}
              {isSportSearchActive && (
                <>
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    style={styles.categoriesContainer}
                    contentContainerStyle={styles.categoriesContent}
                  >
                    <TouchableOpacity
                      style={[styles.categoryButton, !selectedCategory && styles.selectedCategoryButton]}
                      onPress={() => setSelectedCategory(null)}
                    >
                      <Text style={[styles.categoryText, !selectedCategory && styles.selectedCategoryText]}>
                        Tous
                      </Text>
                    </TouchableOpacity>
                    {categories.map((category) => (
                      <TouchableOpacity
                        key={category}
                        style={[styles.categoryButton, selectedCategory === category && styles.selectedCategoryButton]}
                        onPress={() => setSelectedCategory(selectedCategory === category ? null : category)}
                      >
                        <Text style={[styles.categoryText, selectedCategory === category && styles.selectedCategoryText]}>
                          {category}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  {/* En-tête des résultats */}
                  <View style={styles.resultsHeader}>
                    <Text style={styles.resultsCount}>
                      {filteredSports.length} sport{filteredSports.length > 1 ? 's' : ''} trouvé{filteredSports.length > 1 ? 's' : ''}
                    </Text>
                    {(searchQuery || selectedCategory) && (
                      <TouchableOpacity onPress={clearSportFilters}>
                        <Text style={styles.clearFilters}>Effacer</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Liste des sports */}
                  <View style={styles.sportsListContainer}>
                    {filteredSports.length > 0 ? (
                      filteredSports.map((sport) => (
                        <TouchableOpacity
                          key={sport.id}
                          style={[
                            styles.sportButton,
                            formData.favoriteSport === sport.id && styles.selectedSport
                          ]}
                          onPress={() => {
                            setFormData(prev => ({ ...prev, favoriteSport: sport.id }));
                            // Optionnel : fermer la recherche après sélection
                            // setIsSportSearchActive(false);
                            // setSearchQuery('');
                            // setSelectedCategory(null);
                          }}
                        >
                          <Text style={styles.sportEmoji}>{sport.emoji}</Text>
                          <View style={styles.sportInfo}>
                            <Text style={[
                              styles.sportText,
                              formData.favoriteSport === sport.id && styles.selectedSportText
                            ]}>
                              {sport.name}
                            </Text>
                            <Text style={[
                              styles.sportCategoryText,
                              formData.favoriteSport === sport.id && styles.selectedSportCategoryText
                            ]}>
                              {sport.category}
                            </Text>
                          </View>
                          {formData.favoriteSport === sport.id && (
                            <Text style={styles.checkMark}>✓</Text>
                          )}
                        </TouchableOpacity>
                      ))
                    ) : (
                      <Text style={styles.noSportText}>Aucun sport trouvé</Text>
                    )}
                  </View>
                </>
              )}

              {/* Message d'aide si recherche pas active */}
              {!isSportSearchActive && (
                <Text style={styles.helpText}>
                  Commencez à taper pour rechercher un sport
                </Text>
              )}
            </View>
          ) : (
            <Text style={styles.noSportText}>Aucun sport favori défini</Text>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1117',
    paddingTop: 60,
  },
  loadingText: {
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 100,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  backText: {
    color: '#FFFFFF',
    fontSize: 24,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cancelButton: {
    backgroundColor: '#21262D',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#30363D',
  },
  cancelButtonText: {
    color: '#8B949E',
    fontSize: 14,
    fontWeight: '600',
  },
  editButton: {
    backgroundColor: '#1F6FEB',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  form: {
    flex: 1,
    paddingHorizontal: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  expandedInputGroup: {
    marginBottom: 30,
  },
  label: {
    color: '#F0F6FC',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#161B22',
    borderWidth: 1,
    borderColor: '#21262D',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#FFFFFF',
  },
  disabledInput: {
    backgroundColor: '#0D1117',
    color: '#8B949E',
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
    paddingVertical: 12,
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
  selectedSportDisplay: {
    backgroundColor: '#161B22',
    borderWidth: 1,
    borderColor: '#21262D',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedSportEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  selectedSportInfo: {
    flex: 1,
  },
  selectedSportName: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
    marginBottom: 2,
  },
  selectedSportCategory: {
    fontSize: 12,
    color: '#8B949E',
  },
  sportSelectionContainer: {
    backgroundColor: '#161B22',
    borderWidth: 1,
    borderColor: '#21262D',
    borderRadius: 8,
    padding: 16,
  },
  expandedSportContainer: {
    minHeight: 200,
  },
  searchInput: {
    backgroundColor: '#0D1117',
    borderWidth: 1,
    borderColor: '#21262D',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 12,
  },
  categoriesContainer: {
    marginBottom: 12,
  },
  categoriesContent: {
    paddingRight: 16,
  },
  categoryButton: {
    backgroundColor: '#0D1117',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#21262D',
  },
  selectedCategoryButton: {
    backgroundColor: '#1F6FEB',
    borderColor: '#1F6FEB',
  },
  categoryText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  selectedCategoryText: {
    color: '#FFFFFF',
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultsCount: {
    fontSize: 12,
    color: '#8B949E',
  },
  clearFilters: {
    fontSize: 12,
    color: '#1F6FEB',
    fontWeight: '500',
  },
  sportsListContainer: {
    maxHeight: 300,
  },
  helpText: {
    fontSize: 14,
    color: '#8B949E',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  sportButton: {
    backgroundColor: '#0D1117',
    borderWidth: 1,
    borderColor: '#21262D',
    borderRadius: 6,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  selectedSport: {
    backgroundColor: '#1F6FEB',
    borderColor: '#1F6FEB',
  },
  sportEmoji: {
    fontSize: 20,
    marginRight: 10,
  },
  sportInfo: {
    flex: 1,
  },
  sportText: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 2,
  },
  selectedSportText: {
    fontWeight: '600',
    color: '#FFFFFF',
  },
  sportCategoryText: {
    fontSize: 11,
    color: '#8B949E',
  },
  selectedSportCategoryText: {
    color: '#FFFFFF',
  },
  checkMark: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  noSportText: {
    fontSize: 14,
    color: '#8B949E',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
});
