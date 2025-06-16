
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Alert, TextInput } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';

interface ExerciceTemplate {
  nom: string;
  series: string;
  repetitions: string;
  poids: string;
  repos: string;
  notes: string;
}

export default function CreerExerciceScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const params = useLocalSearchParams();
  
  const typeActivite = params.typeActivite as string || 'Musculation';
  
  const [nouvelExercice, setNouvelExercice] = useState({
    nom: '',
    series: '',
    repetitions: '',
    poids: '',
    repos: '',
    notes: ''
  });

  // Templates d'exercices par type d'activité
  const exercicesTemplates: { [key: string]: ExerciceTemplate[] } = {
    'Musculation': [
      { nom: 'Développé couché', series: '4', repetitions: '8-12', poids: '', repos: '90', notes: 'Contrôler la descente' },
      { nom: 'Squat', series: '4', repetitions: '8-12', poids: '', repos: '120', notes: 'Descendre jusqu\'aux cuisses parallèles' },
      { nom: 'Soulevé de terre', series: '3', repetitions: '5-8', poids: '', repos: '180', notes: 'Garder le dos droit' },
      { nom: 'Développé militaire', series: '3', repetitions: '8-12', poids: '', repos: '90', notes: 'Pousser verticalement' },
      { nom: 'Tractions', series: '3', repetitions: '5-10', poids: '', repos: '120', notes: 'Amplitude complète' },
      { nom: 'Dips', series: '3', repetitions: '8-15', poids: '', repos: '90', notes: 'Descendre jusqu\'aux coudes à 90°' },
      { nom: 'Curl biceps', series: '3', repetitions: '10-15', poids: '', repos: '60', notes: 'Mouvement contrôlé' },
      { nom: 'Extension triceps', series: '3', repetitions: '10-15', poids: '', repos: '60', notes: 'Isoler les triceps' }
    ],
    'Course à pied': [
      { nom: 'Échauffement', series: '1', repetitions: '', poids: '', repos: '', notes: '10 minutes de course légère' },
      { nom: 'Intervalles courts', series: '8', repetitions: '30s', poids: '', repos: '30s', notes: 'Intensité maximale' },
      { nom: 'Fartlek', series: '1', repetitions: '20min', poids: '', repos: '', notes: 'Varier les allures' },
      { nom: 'Course continue', series: '1', repetitions: '30-60min', poids: '', repos: '', notes: 'Allure confortable' },
      { nom: 'Côtes', series: '6', repetitions: '1min', poids: '', repos: '2min', notes: 'Effort soutenu en montée' }
    ],
    'Cyclisme': [
      { nom: 'Échauffement', series: '1', repetitions: '15min', poids: '', repos: '', notes: 'Pédalage facile' },
      { nom: 'Intervalles de puissance', series: '5', repetitions: '3min', poids: '', repos: '2min', notes: 'Zone 4-5' },
      { nom: 'Endurance', series: '1', repetitions: '45-90min', poids: '', repos: '', notes: 'Zone 2' },
      { nom: 'Sprints', series: '8', repetitions: '15s', poids: '', repos: '45s', notes: 'Puissance maximale' }
    ],
    'Natation': [
      { nom: 'Échauffement crawl', series: '4', repetitions: '50m', poids: '', repos: '15s', notes: 'Technique et respiration' },
      { nom: 'Séries crawl', series: '8', repetitions: '100m', poids: '', repos: '20s', notes: 'Allure soutenue' },
      { nom: 'Brasse technique', series: '4', repetitions: '50m', poids: '', repos: '30s', notes: 'Focus sur la technique' },
      { nom: 'Dos crawlé', series: '4', repetitions: '50m', poids: '', repos: '20s', notes: 'Rotation des épaules' },
      { nom: 'Récupération', series: '1', repetitions: '200m', poids: '', repos: '', notes: 'Nage facile et relâchée' }
    ],
    'Yoga': [
      { nom: 'Salutation au soleil', series: '3', repetitions: '5 cycles', poids: '', repos: '30s', notes: 'Synchroniser avec la respiration' },
      { nom: 'Posture du guerrier', series: '2', repetitions: '1min', poids: '', repos: '30s', notes: 'Chaque côté' },
      { nom: 'Posture du chien tête en bas', series: '3', repetitions: '1min', poids: '', repos: '30s', notes: 'Étirer les ischio-jambiers' },
      { nom: 'Posture de l\'arbre', series: '2', repetitions: '1min', poids: '', repos: '30s', notes: 'Équilibre et concentration' },
      { nom: 'Relaxation finale', series: '1', repetitions: '5-10min', poids: '', repos: '', notes: 'Savasana' }
    ],
    'Crossfit': [
      { nom: 'Burpees', series: '3', repetitions: '10-15', poids: '', repos: '60s', notes: 'Mouvement explosif' },
      { nom: 'Box jumps', series: '3', repetitions: '10-15', poids: '', repos: '90s', notes: 'Atterrissage contrôlé' },
      { nom: 'Kettlebell swings', series: '3', repetitions: '20', poids: '16-24kg', repos: '60s', notes: 'Propulsion des hanches' },
      { nom: 'Thrusters', series: '3', repetitions: '10-15', poids: '', repos: '90s', notes: 'Squat + développé' },
      { nom: 'Pull-ups', series: '3', repetitions: '5-10', poids: '', repos: '90s', notes: 'Kipping autorisé' }
    ]
  };

  const [exercicesDisponibles, setExercicesDisponibles] = useState<ExerciceTemplate[]>([]);

  useEffect(() => {
    const templates = exercicesTemplates[typeActivite] || exercicesTemplates['Musculation'];
    setExercicesDisponibles(templates);
  }, [typeActivite]);

  const selectionnerTemplate = (template: ExerciceTemplate) => {
    setNouvelExercice({
      nom: template.nom,
      series: template.series,
      repetitions: template.repetitions,
      poids: template.poids,
      repos: template.repos,
      notes: template.notes
    });
  };

  const creerExercicePersonnalise = () => {
    setNouvelExercice({
      nom: '',
      series: '',
      repetitions: '',
      poids: '',
      repos: '',
      notes: ''
    });
  };

  const sauvegarderExercice = () => {
    if (!nouvelExercice.nom.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir un nom pour l\'exercice');
      return;
    }

    const exerciceAvecId = {
      id: Date.now().toString(),
      ...nouvelExercice
    };

    // Retourner à la page précédente avec l'exercice créé
    router.back();
    // Note: Nous devrons implémenter un système de callback ou d'état global 
    // pour transmettre l'exercice créé à la page d'entraînement
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Créer un exercice</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.typeIndicator}>
        <Text style={styles.typeText}>Type d'activité : {typeActivite}</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Section Templates */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Exercices suggérés pour {typeActivite}</Text>
          <Text style={styles.sectionSubtitle}>Cliquez sur un exercice pour l'utiliser comme base</Text>
          
          <View style={styles.templatesGrid}>
            {exercicesDisponibles.map((template, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.templateCard,
                  nouvelExercice.nom === template.nom && styles.templateCardSelected
                ]}
                onPress={() => selectionnerTemplate(template)}
              >
                <Text style={styles.templateName}>{template.nom}</Text>
                <View style={styles.templateDetails}>
                  {template.series && <Text style={styles.templateDetail}>{template.series} séries</Text>}
                  {template.repetitions && <Text style={styles.templateDetail}>{template.repetitions} reps</Text>}
                  {template.repos && <Text style={styles.templateDetail}>{template.repos}s repos</Text>}
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={styles.customButton}
            onPress={creerExercicePersonnalise}
          >
            <Text style={styles.customButtonText}>+ Créer un exercice personnalisé</Text>
          </TouchableOpacity>
        </View>

        {/* Formulaire de personnalisation */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Détails de l'exercice</Text>
          
          <View style={styles.formSection}>
            <Text style={styles.label}>Nom de l'exercice</Text>
            <TextInput
              style={styles.input}
              value={nouvelExercice.nom}
              onChangeText={(text) => setNouvelExercice({...nouvelExercice, nom: text})}
              placeholder="Ex: Développé couché"
              placeholderTextColor="#6A737D"
            />
          </View>

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
                placeholder="8-12"
                placeholderTextColor="#6A737D"
              />
            </View>
          </View>

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

          <View style={styles.formSection}>
            <Text style={styles.label}>Notes et instructions</Text>
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
        </View>
      </ScrollView>

      {/* Boutons d'action */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
          <Text style={styles.cancelButtonText}>Annuler</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.saveButton} onPress={sauvegarderExercice}>
          <Text style={styles.saveButtonText}>Ajouter l'exercice</Text>
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
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#21262D',
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#21262D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  placeholder: {
    width: 32,
  },
  typeIndicator: {
    backgroundColor: '#F5A623',
    paddingVertical: 8,
    paddingHorizontal: 16,
    margin: 16,
    borderRadius: 8,
  },
  typeText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#8B949E',
    marginBottom: 16,
  },
  templatesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  templateCard: {
    backgroundColor: '#161B22',
    borderRadius: 8,
    padding: 12,
    margin: 4,
    borderWidth: 1,
    borderColor: '#21262D',
    minWidth: '45%',
    flex: 1,
  },
  templateCardSelected: {
    borderColor: '#F5A623',
    backgroundColor: '#1C1F26',
  },
  templateName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  templateDetails: {
    flexDirection: 'column',
  },
  templateDetail: {
    color: '#8B949E',
    fontSize: 11,
    marginBottom: 2,
  },
  customButton: {
    borderWidth: 1,
    borderColor: '#21262D',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  customButtonText: {
    color: '#8B949E',
    fontSize: 14,
  },
  formSection: {
    marginBottom: 16,
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
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  column: {
    flex: 1,
    marginHorizontal: 4,
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
  saveButton: {
    flex: 1,
    backgroundColor: '#F5A623',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginLeft: 8,
  },
  saveButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
