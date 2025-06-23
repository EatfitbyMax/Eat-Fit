
export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  rest: string;
  description: string;
  difficulty: 'Débutant' | 'Intermédiaire' | 'Avancé';
  muscleGroups: string[];
}

export interface WorkoutProgram {
  id: string;
  name: string;
  description: string;
  duration: string;
  difficulty: 'Débutant' | 'Intermédiaire' | 'Avancé';
  exercises: Exercise[];
  equipment?: string[];
}

export const sportPrograms: Record<string, WorkoutProgram[]> = {
  musculation: [
    {
      id: 'musculation-debutant',
      name: 'Programme Full Body Débutant',
      description: 'Un programme complet pour développer la force de base',
      duration: '45 min',
      difficulty: 'Débutant',
      equipment: ['Haltères', 'Banc', 'Barre'],
      exercises: [
        {
          id: 'squat',
          name: 'Squat',
          sets: 3,
          reps: '12-15',
          rest: '90s',
          description: 'Mouvement de base pour les jambes',
          difficulty: 'Débutant',
          muscleGroups: ['Quadriceps', 'Fessiers']
        },
        {
          id: 'developpe-couche',
          name: 'Développé couché',
          sets: 3,
          reps: '10-12',
          rest: '2 min',
          description: 'Exercice principal pour les pectoraux',
          difficulty: 'Débutant',
          muscleGroups: ['Pectoraux', 'Triceps']
        },
        {
          id: 'rowing',
          name: 'Rowing barre',
          sets: 3,
          reps: '10-12',
          rest: '90s',
          description: 'Développement du dos',
          difficulty: 'Débutant',
          muscleGroups: ['Dorsaux', 'Biceps']
        }
      ]
    }
  ],
  course: [
    {
      id: 'course-debutant',
      name: 'Programme Course Débutant',
      description: 'Développez votre endurance progressivement',
      duration: '30 min',
      difficulty: 'Débutant',
      exercises: [
        {
          id: 'echauffement-course',
          name: 'Échauffement',
          sets: 1,
          reps: '5 min',
          rest: '0',
          description: 'Marche rapide puis jogging léger',
          difficulty: 'Débutant',
          muscleGroups: ['Cardio']
        },
        {
          id: 'interval-course',
          name: 'Intervalles course/marche',
          sets: 6,
          reps: '2 min course / 1 min marche',
          rest: '1 min marche',
          description: 'Alternance course modérée et marche',
          difficulty: 'Débutant',
          muscleGroups: ['Cardio', 'Jambes']
        }
      ]
    }
  ],
  yoga: [
    {
      id: 'yoga-debutant',
      name: 'Flow Yoga Débutant',
      description: 'Séquence douce pour la flexibilité',
      duration: '30 min',
      difficulty: 'Débutant',
      equipment: ['Tapis de yoga'],
      exercises: [
        {
          id: 'salutation-soleil',
          name: 'Salutation au soleil',
          sets: 3,
          reps: '1 séquence',
          rest: '30s',
          description: 'Enchaînement classique du yoga',
          difficulty: 'Débutant',
          muscleGroups: ['Corps entier']
        }
      ]
    }
  ],
  crossfit: [
    {
      id: 'crossfit-debutant',
      name: 'WOD Débutant',
      description: 'Entraînement fonctionnel adapté',
      duration: '20 min',
      difficulty: 'Débutant',
      exercises: [
        {
          id: 'burpees',
          name: 'Burpees',
          sets: 3,
          reps: '10',
          rest: '60s',
          description: 'Exercice complet au poids du corps',
          difficulty: 'Débutant',
          muscleGroups: ['Corps entier']
        }
      ]
    }
  ]
};

export const getRecommendedPrograms = (sport: string): WorkoutProgram[] => {
  return sportPrograms[sport] || sportPrograms.musculation;
};

export const getSportEmoji = (sport: string): string => {
  const emojiMap: Record<string, string> = {
    musculation: '💪',
    course: '🏃',
    cyclisme: '🚴',
    natation: '🏊',
    yoga: '🧘',
    boxe: '🥊',
    tennis: '🎾',
    football: '⚽',
    basketball: '🏀',
    escalade: '🧗',
    crossfit: '🏋️',
    danse: '💃'
  };
  return emojiMap[sport] || '🏃';
};

export const getSportName = (sport: string): string => {
  const nameMap: Record<string, string> = {
    musculation: 'Musculation',
    course: 'Course à pied',
    cyclisme: 'Cyclisme',
    natation: 'Natation',
    yoga: 'Yoga',
    boxe: 'Boxe/Arts martiaux',
    tennis: 'Tennis',
    football: 'Football',
    basketball: 'Basketball',
    escalade: 'Escalade',
    crossfit: 'CrossFit',
    danse: 'Danse'
  };
  return nameMap[sport] || sport;
};
