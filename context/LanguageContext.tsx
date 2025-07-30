import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type SupportedLanguage = 'fr' | 'en' | 'es' | 'de';

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// Traductions
const translations = {
  fr: {
    // Navigation
    home: 'Accueil',
    nutrition: 'Nutrition',
    training: 'Entraînement',
    progress: 'Progrès',
    profile: 'Profil',

    // Page d'accueil
    today: 'Aujourd\'hui',
    calories: 'Calories',
    water: 'Eau',
    steps: 'Pas',
    training_sessions: 'Séances',

    // Nutrition
    breakfast: 'Petit-déjeuner',
    lunch: 'Déjeuner',
    dinner: 'Dîner',
    snacks: 'Collations',
    add_food: 'Ajouter un aliment',

    // Entraînement
    workout: 'Entraînement',
    journal: 'Journal',
    programs: 'Programmes',
    monday: 'Lundi',
    tuesday: 'Mardi',
    wednesday: 'Mercredi',
    thursday: 'Jeudi',
    friday: 'Vendredi',
    saturday: 'Samedi',
    sunday: 'Dimanche',
    no_workout_added: 'Aucun entraînement ajouté',
    add_workout: '+ Ajouter un entraînement',

    // Paramètres
    app_settings: 'Paramètres de l\'application',
    appearance: 'Apparence',
    dark_mode: 'Mode sombre',
    dark_interface: 'Interface sombre pour vos yeux',
    language: 'Langue',
    units: 'Unités',
    metric_units: 'Métrique (kg, cm)',
    imperial_units: 'Impérial (lbs, ft)',

    // Actions
    save: 'Sauvegarder',
    cancel: 'Annuler',
    create: 'Créer',
    edit: 'Modifier',
    delete: 'Supprimer',
    back: '←',

    // Modal
    new_workout: 'Nouvel entraînement',
    workout_name: 'Nom',
    activity_type: 'Type d\'activité',
    difficulty: 'Difficulté',
    duration_minutes: 'Durée (minutes)',
    notes: 'Notes',
    exercises: 'Exercices',
    add_exercise: '+ Ajouter',
    no_exercises: 'Aucun exercice ajouté. Cliquez sur "Ajouter" pour créer un exercice.',

    // Langues
    french: 'Français',
    english: 'English',
    spanish: 'Español',
    german: 'Deutsch',
    choose_language: 'Choisir la langue',
  },
  en: {
    // Navigation
    home: 'Home',
    nutrition: 'Nutrition',
    training: 'Training',
    progress: 'Progress',
    profile: 'Profile',

    // Home page
    today: 'Today',
    calories: 'Calories',
    water: 'Water',
    steps: 'Steps',
    training_sessions: 'Sessions',

    // Nutrition
    breakfast: 'Breakfast',
    lunch: 'Lunch',
    dinner: 'Dinner',
    snacks: 'Snacks',
    add_food: 'Add food',

    // Training
    workout: 'Workout',
    journal: 'Journal',
    programs: 'Programs',
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    sunday: 'Sunday',
    no_workout_added: 'No workout added',
    add_workout: '+ Add workout',

    // Settings
    app_settings: 'App Settings',
    appearance: 'Appearance',
    dark_mode: 'Dark mode',
    dark_interface: 'Dark interface for your eyes',
    language: 'Language',
    units: 'Units',
    metric_units: 'Metric (kg, cm)',
    imperial_units: 'Imperial (lbs, ft)',

    // Actions
    save: 'Save',
    cancel: 'Cancel',
    create: 'Create',
    edit: 'Edit',
    delete: 'Delete',
    back: '←',

    // Modal
    new_workout: 'New workout',
    workout_name: 'Name',
    activity_type: 'Activity type',
    difficulty: 'Difficulty',
    duration_minutes: 'Duration (minutes)',
    notes: 'Notes',
    exercises: 'Exercises',
    add_exercise: '+ Add',
    no_exercises: 'No exercises added. Click "Add" to create an exercise.',

    // Languages
    french: 'Français',
    english: 'English',
    spanish: 'Español',
    german: 'Deutsch',
    choose_language: 'Choose language',
  },
  es: {
    // Navigation
    home: 'Inicio',
    nutrition: 'Nutrición',
    training: 'Entrenamiento',
    progress: 'Progreso',
    profile: 'Perfil',

    // Home page
    today: 'Hoy',
    calories: 'Calorías',
    water: 'Agua',
    steps: 'Pasos',
    training_sessions: 'Sesiones',

    // Nutrition
    breakfast: 'Desayuno',
    lunch: 'Almuerzo',
    dinner: 'Cena',
    snacks: 'Meriendas',
    add_food: 'Añadir comida',

    // Training
    workout: 'Entrenamiento',
    journal: 'Diario',
    programs: 'Programas',
    monday: 'Lunes',
    tuesday: 'Martes',
    wednesday: 'Miércoles',
    thursday: 'Jueves',
    friday: 'Viernes',
    saturday: 'Sábado',
    sunday: 'Domingo',
    no_workout_added: 'Ningún entrenamiento añadido',
    add_workout: '+ Añadir entrenamiento',

    // Settings
    app_settings: 'Configuración de la aplicación',
    appearance: 'Apariencia',
    dark_mode: 'Modo oscuro',
    dark_interface: 'Interfaz oscura para tus ojos',
    language: 'Idioma',
    units: 'Unidades',
    metric_units: 'Métrico (kg, cm)',
    imperial_units: 'Imperial (lbs, ft)',

    // Actions
    save: 'Guardar',
    cancel: 'Cancelar',
    create: 'Crear',
    edit: 'Editar',
    delete: 'Eliminar',
    back: '←',

    // Modal
    new_workout: 'Nuevo entrenamiento',
    workout_name: 'Nombre',
    activity_type: 'Tipo de actividad',
    difficulty: 'Dificultad',
    duration_minutes: 'Duración (minutos)',
    notes: 'Notas',
    exercises: 'Ejercicios',
    add_exercise: '+ Añadir',
    no_exercises: 'Ningún ejercicio añadido. Haz clic en "Añadir" para crear un ejercicio.',

    // Languages
    french: 'Français',
    english: 'English',
    spanish: 'Español',
    german: 'Deutsch',
    choose_language: 'Elegir idioma',
  },
  de: {
    // Navigation
    home: 'Startseite',
    nutrition: 'Ernährung',
    training: 'Training',
    progress: 'Fortschritt',
    profile: 'Profil',

    // Home page
    today: 'Heute',
    calories: 'Kalorien',
    water: 'Wasser',
    steps: 'Schritte',
    training_sessions: 'Sitzungen',

    // Nutrition
    breakfast: 'Frühstück',
    lunch: 'Mittagessen',
    dinner: 'Abendessen',
    snacks: 'Snacks',
    add_food: 'Lebensmittel hinzufügen',

    // Training
    workout: 'Training',
    journal: 'Tagebuch',
    programs: 'Programme',
    monday: 'Montag',
    tuesday: 'Dienstag',
    wednesday: 'Mittwoch',
    thursday: 'Donnerstag',
    friday: 'Freitag',
    saturday: 'Samstag',
    sunday: 'Sonntag',
    no_workout_added: 'Kein Training hinzugefügt',
    add_workout: '+ Training hinzufügen',

    // Settings
    app_settings: 'App-Einstellungen',
    appearance: 'Erscheinungsbild',
    dark_mode: 'Dunkler Modus',
    dark_interface: 'Dunkle Oberfläche für Ihre Augen',
    language: 'Sprache',
    units: 'Einheiten',
    metric_units: 'Metrisch (kg, cm)',
    imperial_units: 'Imperial (lbs, ft)',

    // Actions
    save: 'Speichern',
    cancel: 'Abbrechen',
    create: 'Erstellen',
    edit: 'Bearbeiten',
    delete: 'Löschen',
    back: '←',

    // Modal
    new_workout: 'Neues Training',
    workout_name: 'Name',
    activity_type: 'Aktivitätstyp',
    difficulty: 'Schwierigkeit',
    duration_minutes: 'Dauer (Minuten)',
    notes: 'Notizen',
    exercises: 'Übungen',
    add_exercise: '+ Hinzufügen',
    no_exercises: 'Keine Übungen hinzugefügt. Klicken Sie auf "Hinzufügen", um eine Übung zu erstellen.',

    // Languages
    french: 'Français',
    english: 'English',
    spanish: 'Español',
    german: 'Deutsch',
    choose_language: 'Sprache wählen',
  },
};

const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>('fr');

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem('app_language');
      if (savedLanguage && ['fr', 'en', 'es', 'de'].includes(savedLanguage)) {
        setLanguageState(savedLanguage as SupportedLanguage);
      }
    } catch (error) {
      console.error('Erreur chargement langue:', error);
    }
  };

  const setLanguage = async (lang: SupportedLanguage) => {
    try {
      await AsyncStorage.setItem('app_language', lang);
      setLanguageState(lang);

      // Synchroniser avec le serveur VPS
      try {
        const { PersistentStorage } = await import('../utils/storage');
        const currentUser = await PersistentStorage.getCurrentUser();
        if (currentUser?.id) {
          const preferences = await PersistentStorage.getAppPreferences(currentUser.id);
          preferences.language = lang;
          await PersistentStorage.saveAppPreferences(currentUser.id, preferences);
        }
      } catch (error) {
        console.warn('Impossible de synchroniser la langue avec le serveur:', error);
      }
    } catch (error) {
      console.error('Erreur sauvegarde langue:', error);
    }
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export { useLanguage, LanguageProvider };