import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useRegistration } from '@/context/RegistrationContext';
import { allSports, getSportsByCategory } from '@/utils/sportPrograms';

export default function RegisterSportScreen() {
  const router = useRouter();
  const { registrationData, updateRegistrationData } = useRegistration();
  const [selectedSport, setSelectedSport] = useState(registrationData.favoriteSport || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const sportsByCategory = useMemo(() => getSportsByCategory(), []);
  const categories = Object.keys(sportsByCategory);

  const filteredSports = useMemo(() => {
    let sports = allSports;

    if (searchQuery) {
      sports = sports.filter(sport => 
        sport.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sport.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCategory) {
      sports = sports.filter(sport => sport.category === selectedCategory);
    }

    return sports;
  }, [searchQuery, selectedCategory]);

  const handleNext = () => {
    if (selectedSport) {
      updateRegistrationData({ favoriteSport: selectedSport });
      router.push('/auth/register-activity');
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory(null);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Text style={styles.backText}>←</Text>
      </TouchableOpacity>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressStep, styles.activeStep]} />
          <View style={[styles.progressStep, styles.activeStep]} />
          <View style={[styles.progressStep, styles.activeStep]} />
          <View style={styles.progressStep} />
          <View style={styles.progressStep} />
        </View>
      </View>

      <Text style={styles.title}>Sport favori</Text>
      <Text style={styles.subtitle}>Choisissez votre sport principal parmi plus de 100 disciplines</Text>

      {/* Barre de recherche */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un sport..."
          placeholderTextColor="#666666"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Filtres par catégorie */}
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

      {/* Résultats */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsCount}>
          {filteredSports.length} sport{filteredSports.length > 1 ? 's' : ''} trouvé{filteredSports.length > 1 ? 's' : ''}
        </Text>
        {(searchQuery || selectedCategory) && (
          <TouchableOpacity onPress={clearFilters}>
            <Text style={styles.clearFilters}>Effacer les filtres</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
        {filteredSports.map((sport) => (
          <TouchableOpacity
            key={sport.id}
            style={[
              styles.sportButton,
              selectedSport === sport.id && styles.selectedSport
            ]}
            onPress={() => setSelectedSport(sport.id)}
          >
            <View style={styles.sportContent}>
              <View style={styles.sportLeft}>
                <Text style={styles.sportEmoji}>{sport.emoji}</Text>
                <View style={styles.sportInfo}>
                  <Text style={[
                    styles.sportName,
                    selectedSport === sport.id && styles.selectedSportText
                  ]}>
                    {sport.name}
                  </Text>
                  <Text style={[
                    styles.sportCategory,
                    selectedSport === sport.id && styles.selectedSportCategory
                  ]}>
                    {sport.category}
                  </Text>
                </View>
              </View>
              {selectedSport === sport.id && (
                <Text style={styles.checkMark}>✓</Text>
              )}
            </View>
          </TouchableOpacity>
        ))}

        {filteredSports.length === 0 && (
          <View style={styles.noResults}>
            <Text style={styles.noResultsText}>Aucun sport trouvé</Text>
            <Text style={styles.noResultsSubtext}>Essayez de modifier votre recherche</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.navigationContainer}>
        <TouchableOpacity 
          style={styles.backNavButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backNavText}>← Retour</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.nextButton, !selectedSport && styles.disabledButton]}
          onPress={handleNext}
          disabled={!selectedSport}
        >
          <Text style={styles.nextButtonText}>Suivant</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 1,
  },
  backText: {
    color: '#FFFFFF',
    fontSize: 24,
  },
  progressContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 30,
  },
  progressBar: {
    flexDirection: 'row',
    gap: 8,
  },
  progressStep: {
    width: 60,
    height: 4,
    backgroundColor: '#333333',
    borderRadius: 2,
  },
  activeStep: {
    backgroundColor: '#F5A623',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  searchContainer: {
    marginBottom: 15,
  },
  searchInput: {
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#333333',
  },
  categoriesContainer: {
    marginBottom: 15,
  },
  categoriesContent: {
    paddingRight: 20,
  },
    categoryButton: {
      backgroundColor: '#1A1A1A',
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 2,
      marginRight: 6,
      borderWidth: 1,
      borderColor: '#333333',
      alignSelf: 'flex-start',
  },
  selectedCategoryButton: {
    backgroundColor: '#F5A623',
    borderColor: '#F5A623',
  },
  categoryText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  selectedCategoryText: {
    color: '#000000',
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  resultsCount: {
    fontSize: 14,
    color: '#888888',
  },
  clearFilters: {
    fontSize: 14,
    color: '#F5A623',
    fontWeight: '500',
  },
  form: {
    flex: 1,
  },
  sportButton: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#333333',
  },
  selectedSport: {
    backgroundColor: '#F5A623',
    borderColor: '#F5A623',
  },
  sportContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sportLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sportEmoji: {
    fontSize: 20,
    marginRight: 12,
  },
  sportInfo: {
    flex: 1,
  },
  sportName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  selectedSportText: {
    color: '#000000',
  },
  sportCategory: {
    fontSize: 12,
    color: '#888888',
  },
  selectedSportCategory: {
    color: '#333333',
  },
  checkMark: {
    fontSize: 16,
    color: '#000000',
    fontWeight: 'bold',
  },
  noResults: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noResultsText: {
    fontSize: 16,
    color: '#888888',
    fontWeight: '500',
    marginBottom: 8,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: '#666666',
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 40,
    paddingTop: 20,
  },
  backNavButton: {
    padding: 16,
  },
  backNavText: {
    color: '#CCCCCC',
    fontSize: 16,
  },
  nextButton: {
    backgroundColor: '#F5A623',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  disabledButton: {
    backgroundColor: '#333333',
  },
  nextButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
});