
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Repas {
  jour: string;
  petitDejeuner: string;
  dejeuner: string;
  collation: string;
  diner: string;
  calories: number;
}

const PROGRAMMES_STORAGE_KEY = 'programmes_coach';

export default function CreerProgrammeNutritionScreen() {
  const router = useRouter();
  const [nomProgramme, setNomProgramme] = useState('');
  const [description, setDescription] = useState('');
  const [repas, setRepas] = useState<Repas[]>([]);
  const [nouveauRepas, setNouveauRepas] = useState({
    jour: '',
    petitDejeuner: '',
    dejeuner: '',
    collation: '',
    diner: '',
    calories: 0
  });
  const [estPublic, setEstPublic] = useState(false);

  const ajouterRepas = () => {
    if (nouveauRepas.jour.trim()) {
      setRepas([...repas, { ...nouveauRepas }]);
      setNouveauRepas({
        jour: '',
        petitDejeuner: '',
        dejeuner: '',
        collation: '',
        diner: '',
        calories: 0
      });
    } else {
      Alert.alert('Erreur', 'Veuillez saisir au moins le jour du repas');
    }
  };

  const supprimerRepas = (index: number) => {
    const nouveauxRepas = repas.filter((_, i) => i !== index);
    setRepas(nouveauxRepas);
  };

  const sauvegarderProgramme = async () => {
    if (!nomProgramme.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir un nom pour le programme');
      return;
    }

    if (repas.length === 0) {
      Alert.alert('Erreur', 'Veuillez ajouter au moins un repas au programme');
      return;
    }

    try {
      // Charger les programmes existants
      const programmesStockes = await AsyncStorage.getItem(PROGRAMMES_STORAGE_KEY);
      const programmesExistants = programmesStockes ? JSON.parse(programmesStockes) : [];

      // Calculer les calories totales moyennes
      const caloriesTotal = repas.reduce((total, r) => total + r.calories, 0);
      const caloriesMoyennes = Math.round(caloriesTotal / repas.length);

      // Créer le nouveau programme
      const nouveauProgramme = {
        id: Date.now().toString(),
        nom: nomProgramme.trim(),
        description: description.trim() || `Programme nutrition créé le ${new Date().toLocaleDateString('fr-FR')}`,
        type: 'nutrition' as const,
        calories: caloriesMoyennes,
        dateCreation: new Date().toLocaleDateString('fr-FR'),
        details: {
          repas: repas,
          public: estPublic
        }
      };

      // Sauvegarder
      const nouveauxProgrammes = [...programmesExistants, nouveauProgramme];
      await AsyncStorage.setItem(PROGRAMMES_STORAGE_KEY, JSON.stringify(nouveauxProgrammes));

      Alert.alert(
        'Programme créé !',
        `Le programme "${nomProgramme}" a été créé avec succès.`,
        [
          {
            text: 'OK',
            onPress: () => router.back()
          }
        ]
      );
    } catch (error) {
      console.error('Erreur sauvegarde programme:', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder le programme');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nouveau Programme de Nutrition Complet</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Nom du programme */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nom du programme</Text>
          <TextInput
            style={styles.input}
            value={nomProgramme}
            onChangeText={setNomProgramme}
            placeholder="Programme perte de poids - 1 semaine"
            placeholderTextColor="#6A737D"
          />
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Description du programme..."
            placeholderTextColor="#6A737D"
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Repas du programme */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Repas du programme</Text>
          <Text style={styles.sectionSubtitle}>
            Ajouter les différents repas qui composeront ce programme
          </Text>

          {/* Formulaire nouveau repas */}
          <View style={styles.repasForm}>
            <TextInput
              style={styles.input}
              value={nouveauRepas.jour}
              onChangeText={(text) => setNouveauRepas({...nouveauRepas, jour: text})}
              placeholder="Jour (ex: Lundi, Jour 1...)"
              placeholderTextColor="#6A737D"
            />
            
            <TextInput
              style={styles.input}
              value={nouveauRepas.petitDejeuner}
              onChangeText={(text) => setNouveauRepas({...nouveauRepas, petitDejeuner: text})}
              placeholder="Petit déjeuner"
              placeholderTextColor="#6A737D"
            />
            
            <TextInput
              style={styles.input}
              value={nouveauRepas.dejeuner}
              onChangeText={(text) => setNouveauRepas({...nouveauRepas, dejeuner: text})}
              placeholder="Déjeuner"
              placeholderTextColor="#6A737D"
            />
            
            <TextInput
              style={styles.input}
              value={nouveauRepas.collation}
              onChangeText={(text) => setNouveauRepas({...nouveauRepas, collation: text})}
              placeholder="Collation"
              placeholderTextColor="#6A737D"
            />
            
            <TextInput
              style={styles.input}
              value={nouveauRepas.diner}
              onChangeText={(text) => setNouveauRepas({...nouveauRepas, diner: text})}
              placeholder="Dîner"
              placeholderTextColor="#6A737D"
            />
            
            <TextInput
              style={styles.input}
              value={nouveauRepas.calories.toString()}
              onChangeText={(text) => setNouveauRepas({...nouveauRepas, calories: parseInt(text) || 0})}
              placeholder="Calories totales"
              placeholderTextColor="#6A737D"
              keyboardType="numeric"
            />

            <TouchableOpacity style={styles.ajouterButton} onPress={ajouterRepas}>
              <Text style={styles.ajouterButtonText}>+ Ajouter un repas au programme</Text>
            </TouchableOpacity>
          </View>

          {/* Liste des repas ajoutés */}
          {repas.map((repasSingle, index) => (
            <View key={index} style={styles.repasCard}>
              <View style={styles.repasHeader}>
                <Text style={styles.repasJour}>{repasSingle.jour}</Text>
                <TouchableOpacity 
                  style={styles.supprimerButton}
                  onPress={() => supprimerRepas(index)}
                >
                  <Text style={styles.supprimerText}>×</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.repasDetail}>🌅 Petit déjeuner: {repasSingle.petitDejeuner}</Text>
              <Text style={styles.repasDetail}>☀️ Déjeuner: {repasSingle.dejeuner}</Text>
              <Text style={styles.repasDetail}>🍪 Collation: {repasSingle.collation}</Text>
              <Text style={styles.repasDetail}>🌙 Dîner: {repasSingle.diner}</Text>
              <Text style={styles.repasCalories}>{repasSingle.calories} kcal</Text>
            </View>
          ))}
        </View>

        {/* Options */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.optionButton}
            onPress={() => setEstPublic(!estPublic)}
          >
            <View style={[styles.checkbox, estPublic && styles.checkboxSelected]} />
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Rendre ce programme public</Text>
              <Text style={styles.optionSubtitle}>
                Si activé, ce programme sera disponible pour tous vos clients. Sinon, il ne sera visible que par vous.
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Bouton sauvegarder */}
        <TouchableOpacity style={styles.sauvegarderButton} onPress={sauvegarderProgramme}>
          <Text style={styles.sauvegarderButtonText}>Créer le programme de repas</Text>
        </TouchableOpacity>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1117',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#21262D',
  },
  backButton: {
    marginBottom: 12,
  },
  backText: {
    color: '#F5A623',
    fontSize: 16,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#8B949E',
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#161B22',
    borderWidth: 1,
    borderColor: '#21262D',
    borderRadius: 8,
    padding: 12,
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 12,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  repasForm: {
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#21262D',
    marginBottom: 16,
  },
  ajouterButton: {
    backgroundColor: '#21262D',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  ajouterButtonText: {
    color: '#F5A623',
    fontSize: 14,
    fontWeight: '500',
  },
  repasCard: {
    backgroundColor: '#161B22',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#21262D',
    marginBottom: 12,
  },
  repasHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  repasJour: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  supprimerButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#8B949E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  supprimerText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  repasDetail: {
    fontSize: 14,
    color: '#8B949E',
    marginBottom: 4,
  },
  repasCalories: {
    fontSize: 14,
    color: '#F5A623',
    fontWeight: '600',
    marginTop: 8,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    backgroundColor: '#161B22',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#21262D',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#6A737D',
    marginRight: 12,
    marginTop: 2,
  },
  checkboxSelected: {
    backgroundColor: '#F5A623',
    borderColor: '#F5A623',
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  optionSubtitle: {
    fontSize: 14,
    color: '#8B949E',
    lineHeight: 18,
  },
  sauvegarderButton: {
    backgroundColor: '#F5A623',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  sauvegarderButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomPadding: {
    height: 40,
  },
});
