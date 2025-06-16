
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Alert, TextInput } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';

export default function AjouterExerciceScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { theme } = useTheme();
  const { t } = useLanguage();

  const [nouvelExercice, setNouvelExercice] = useState({
    id: '',
    nom: '',
    series: '',
    repetitions: '',
    poids: '',
    repos: '',
    notes: ''
  });

  const ajouterExercice = () => {
    if (!nouvelExercice.nom.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir un nom pour l\'exercice');
      return;
    }

    // Créer l'exercice avec un ID unique
    const exercice = {
      id: Date.now().toString(),
      ...nouvelExercice
    };

    // Retourner à la page précédente avec les données de l'exercice
    router.back();
    
    // Ici vous pourrez ajouter la logique pour passer les données à l'écran parent
    // via un callback ou un state management global
    console.log('Exercice créé:', exercice);
    
    Alert.alert('Succès', 'Exercice ajouté avec succès!');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ajouter un exercice</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content}>
        {/* Nom de l'exercice */}
        <View style={styles.section}>
          <Text style={styles.label}>Nom de l'exercice</Text>
          <TextInput
            style={styles.input}
            value={nouvelExercice.nom}
            onChangeText={(text) => setNouvelExercice({...nouvelExercice, nom: text})}
            placeholder="Ex: Développé couché"
            placeholderTextColor="#6A737D"
          />
        </View>

        {/* Séries et Répétitions */}
        <View style={styles.row}>
          <View style={styles.column}>
            <Text style={styles.label}>Séries</Text>
            <TextInput
              style={styles.input}
              value={nouvelExercice.series}
              onChangeText={(text) => setNouvelExercice({...nouvelExercice, series: text})}
              placeholder="4"
              placeholderTextColor="#6A737D"
              keyboardType="numeric"
            />
          </View>
          <View style={styles.column}>
            <Text style={styles.label}>Répétitions</Text>
            <TextInput
              style={styles.input}
              value={nouvelExercice.repetitions}
              onChangeText={(text) => setNouvelExercice({...nouvelExercice, repetitions: text})}
              placeholder="12"
              placeholderTextColor="#6A737D"
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Poids et Repos */}
        <View style={styles.row}>
          <View style={styles.column}>
            <Text style={styles.label}>Poids (kg)</Text>
            <TextInput
              style={styles.input}
              value={nouvelExercice.poids}
              onChangeText={(text) => setNouvelExercice({...nouvelExercice, poids: text})}
              placeholder="80"
              placeholderTextColor="#6A737D"
              keyboardType="numeric"
            />
          </View>
          <View style={styles.column}>
            <Text style={styles.label}>Repos (sec)</Text>
            <TextInput
              style={styles.input}
              value={nouvelExercice.repos}
              onChangeText={(text) => setNouvelExercice({...nouvelExercice, repos: text})}
              placeholder="90"
              placeholderTextColor="#6A737D"
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={nouvelExercice.notes}
            onChangeText={(text) => setNouvelExercice({...nouvelExercice, notes: text})}
            placeholder="Instructions ou notes sur cet exercice..."
            placeholderTextColor="#6A737D"
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Exemples d'exercices populaires */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Exercices populaires</Text>
          <View style={styles.exercicesSuggestions}>
            {[
              'Développé couché',
              'Squat',
              'Soulevé de terre',
              'Tractions',
              'Dips',
              'Développé militaire',
              'Curl biceps',
              'Extension triceps'
            ].map((exercice, index) => (
              <TouchableOpacity 
                key={index}
                style={styles.suggestionButton}
                onPress={() => setNouvelExercice({...nouvelExercice, nom: exercice})}
              >
                <Text style={styles.suggestionText}>{exercice}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Boutons d'action */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
          <Text style={styles.cancelButtonText}>Annuler</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.addButton} onPress={ajouterExercice}>
          <Text style={styles.addButtonText}>Ajouter l'exercice</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1117',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#21262D',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#21262D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#161B22',
    borderWidth: 1,
    borderColor: '#F5A623',
    borderRadius: 8,
    padding: 12,
    color: '#FFFFFF',
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  column: {
    flex: 1,
    marginHorizontal: 4,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  exercicesSuggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestionButton: {
    backgroundColor: '#21262D',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#30363D',
  },
  suggestionText: {
    color: '#8B949E',
    fontSize: 12,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#21262D',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#21262D',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  addButton: {
    flex: 1,
    backgroundColor: '#F5A623',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginLeft: 8,
  },
  addButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
