
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

// Liste complète des 100 sports les plus pratiqués en France
export const allSports = [
  { id: 'football', name: 'Football', emoji: '⚽', category: 'Sport collectif' },
  { id: 'tennis', name: 'Tennis', emoji: '🎾', category: 'Sport de raquette' },
  { id: 'course', name: 'Course à pied', emoji: '🏃', category: 'Sport individuel' },
  { id: 'musculation', name: 'Musculation', emoji: '💪', category: 'Force' },
  { id: 'natation', name: 'Natation', emoji: '🏊', category: 'Sport aquatique' },
  { id: 'cyclisme', name: 'Cyclisme', emoji: '🚴', category: 'Sport individuel' },
  { id: 'basketball', name: 'Basketball', emoji: '🏀', category: 'Sport collectif' },
  { id: 'gymnastique', name: 'Gymnastique', emoji: '🤸', category: 'Sport artistique' },
  { id: 'judo', name: 'Judo', emoji: '🥋', category: 'Art martial' },
  { id: 'rugby', name: 'Rugby', emoji: '🏈', category: 'Sport collectif' },
  { id: 'volleyball', name: 'Volleyball', emoji: '🏐', category: 'Sport collectif' },
  { id: 'handball', name: 'Handball', emoji: '🤾', category: 'Sport collectif' },
  { id: 'badminton', name: 'Badminton', emoji: '🏸', category: 'Sport de raquette' },
  { id: 'ski', name: 'Ski alpin', emoji: '⛷️', category: 'Sport d\'hiver' },
  { id: 'golf', name: 'Golf', emoji: '⛳', category: 'Sport de précision' },
  { id: 'escalade', name: 'Escalade', emoji: '🧗', category: 'Sport d\'aventure' },
  { id: 'yoga', name: 'Yoga', emoji: '🧘', category: 'Bien-être' },
  { id: 'boxe', name: 'Boxe', emoji: '🥊', category: 'Sport de combat' },
  { id: 'danse', name: 'Danse', emoji: '💃', category: 'Sport artistique' },
  { id: 'crossfit', name: 'CrossFit', emoji: '🏋️', category: 'Fitness' },
  { id: 'athletisme', name: 'Athlétisme', emoji: '🏃‍♂️', category: 'Sport individuel' },
  { id: 'karate', name: 'Karaté', emoji: '🥋', category: 'Art martial' },
  { id: 'taekwondo', name: 'Taekwondo', emoji: '🦵', category: 'Art martial' },
  { id: 'equitation', name: 'Équitation', emoji: '🏇', category: 'Sport équestre' },
  { id: 'voile', name: 'Voile', emoji: '⛵', category: 'Sport nautique' },
  { id: 'surf', name: 'Surf', emoji: '🏄', category: 'Sport de glisse' },
  { id: 'snowboard', name: 'Snowboard', emoji: '🏂', category: 'Sport d\'hiver' },
  { id: 'ping-pong', name: 'Tennis de table', emoji: '🏓', category: 'Sport de raquette' },
  { id: 'aviron', name: 'Aviron', emoji: '🚣', category: 'Sport nautique' },
  { id: 'petanque', name: 'Pétanque', emoji: '⚪', category: 'Sport de précision' },
  { id: 'skateboard', name: 'Skateboard', emoji: '🛹', category: 'Sport de glisse' },
  { id: 'roller', name: 'Roller', emoji: '🛼', category: 'Sport de glisse' },
  { id: 'tir-arc', name: 'Tir à l\'arc', emoji: '🏹', category: 'Sport de précision' },
  { id: 'escrime', name: 'Escrime', emoji: '🤺', category: 'Sport de combat' },
  { id: 'triathlon', name: 'Triathlon', emoji: '🏊‍♂️', category: 'Sport d\'endurance' },
  { id: 'marathon', name: 'Marathon', emoji: '🏃‍♀️', category: 'Course longue distance' },
  { id: 'fitness', name: 'Fitness', emoji: '💪', category: 'Remise en forme' },
  { id: 'pilates', name: 'Pilates', emoji: '🧘‍♀️', category: 'Bien-être' },
  { id: 'zumba', name: 'Zumba', emoji: '💃', category: 'Danse fitness' },
  { id: 'aquagym', name: 'Aquagym', emoji: '🏊‍♀️', category: 'Sport aquatique' },
  { id: 'water-polo', name: 'Water-polo', emoji: '🤽', category: 'Sport aquatique' },
  { id: 'plongee', name: 'Plongée', emoji: '🤿', category: 'Sport aquatique' },
  { id: 'kitesurf', name: 'Kitesurf', emoji: '🪁', category: 'Sport de glisse' },
  { id: 'windsurf', name: 'Windsurf', emoji: '🏄‍♂️', category: 'Sport nautique' },
  { id: 'canoë', name: 'Canoë-kayak', emoji: '🛶', category: 'Sport nautique' },
  { id: 'paintball', name: 'Paintball', emoji: '🔫', category: 'Sport de stratégie' },
  { id: 'squash', name: 'Squash', emoji: '🎾', category: 'Sport de raquette' },
  { id: 'padel', name: 'Padel', emoji: '🎾', category: 'Sport de raquette' },
  { id: 'ultimate', name: 'Ultimate frisbee', emoji: '🥏', category: 'Sport collectif' },
  { id: 'baseball', name: 'Baseball', emoji: '⚾', category: 'Sport collectif' },
  { id: 'softball', name: 'Softball', emoji: '🥎', category: 'Sport collectif' },
  { id: 'cricket', name: 'Cricket', emoji: '🏏', category: 'Sport collectif' },
  { id: 'hockey-glace', name: 'Hockey sur glace', emoji: '🏒', category: 'Sport d\'hiver' },
  { id: 'hockey-gazon', name: 'Hockey sur gazon', emoji: '🏑', category: 'Sport collectif' },
  { id: 'futsal', name: 'Futsal', emoji: '⚽', category: 'Sport collectif' },
  { id: 'beach-volley', name: 'Beach-volley', emoji: '🏐', category: 'Sport de plage' },
  { id: 'beach-soccer', name: 'Beach soccer', emoji: '⚽', category: 'Sport de plage' },
  { id: 'lutte', name: 'Lutte', emoji: '🤼', category: 'Sport de combat' },
  { id: 'mma', name: 'MMA', emoji: '🥊', category: 'Sport de combat' },
  { id: 'krav-maga', name: 'Krav Maga', emoji: '🥋', category: 'Art martial' },
  { id: 'aikido', name: 'Aïkido', emoji: '🥋', category: 'Art martial' },
  { id: 'capoeira', name: 'Capoeira', emoji: '🤸‍♂️', category: 'Art martial' },
  { id: 'parkour', name: 'Parkour', emoji: '🏃‍♂️', category: 'Sport urbain' },
  { id: 'vtt', name: 'VTT', emoji: '🚵', category: 'Cyclisme' },
  { id: 'bmx', name: 'BMX', emoji: '🚴‍♂️', category: 'Cyclisme' },
  { id: 'course-orientation', name: 'Course d\'orientation', emoji: '🧭', category: 'Sport de nature' },
  { id: 'randonnee', name: 'Randonnée', emoji: '🥾', category: 'Sport de nature' },
  { id: 'trail', name: 'Trail', emoji: '🏃‍♀️', category: 'Course nature' },
  { id: 'alpinisme', name: 'Alpinisme', emoji: '🏔️', category: 'Sport d\'aventure' },
  { id: 'via-ferrata', name: 'Via ferrata', emoji: '🧗‍♀️', category: 'Sport d\'aventure' },
  { id: 'speleologie', name: 'Spéléologie', emoji: '🕳️', category: 'Sport souterrain' },
  { id: 'parapente', name: 'Parapente', emoji: '🪂', category: 'Sport aérien' },
  { id: 'saut-parachute', name: 'Saut en parachute', emoji: '🪂', category: 'Sport extrême' },
  { id: 'deltaplane', name: 'Deltaplane', emoji: '🛩️', category: 'Sport aérien' },
  { id: 'ulm', name: 'ULM', emoji: '✈️', category: 'Sport aérien' },
  { id: 'motocross', name: 'Motocross', emoji: '🏍️', category: 'Sport mécanique' },
  { id: 'karting', name: 'Karting', emoji: '🏎️', category: 'Sport mécanique' },
  { id: 'rallye', name: 'Rallye', emoji: '🚗', category: 'Sport automobile' },
  { id: 'quad', name: 'Quad', emoji: '🛻', category: 'Sport mécanique' },
  { id: 'patin-glace', name: 'Patinage sur glace', emoji: '⛸️', category: 'Sport d\'hiver' },
  { id: 'curling', name: 'Curling', emoji: '🥌', category: 'Sport d\'hiver' },
  { id: 'biathlon', name: 'Biathlon', emoji: '🎿', category: 'Sport d\'hiver' },
  { id: 'ski-fond', name: 'Ski de fond', emoji: '🎿', category: 'Sport d\'hiver' },
  { id: 'luge', name: 'Luge', emoji: '🛷', category: 'Sport d\'hiver' },
  { id: 'bobsleigh', name: 'Bobsleigh', emoji: '🛷', category: 'Sport d\'hiver' },
  { id: 'patinage-artistique', name: 'Patinage artistique', emoji: '⛸️', category: 'Sport artistique' },
  { id: 'danse-glace', name: 'Danse sur glace', emoji: '⛸️', category: 'Sport artistique' },
  { id: 'bowling', name: 'Bowling', emoji: '🎳', category: 'Sport de précision' },
  { id: 'billard', name: 'Billard', emoji: '🎱', category: 'Sport de précision' },
  { id: 'flechettes', name: 'Fléchettes', emoji: '🎯', category: 'Sport de précision' },
  { id: 'echecs', name: 'Échecs', emoji: '♟️', category: 'Sport mental' },
  { id: 'poker', name: 'Poker', emoji: '♠️', category: 'Sport mental' },
  { id: 'bridge', name: 'Bridge', emoji: '🃏', category: 'Sport mental' },
  { id: 'esport', name: 'E-sport', emoji: '🎮', category: 'Sport électronique' },
  { id: 'drone-racing', name: 'Course de drones', emoji: '🚁', category: 'Sport technologique' },
  { id: 'tchoukball', name: 'Tchoukball', emoji: '🥎', category: 'Sport collectif' },
  { id: 'kinball', name: 'Kin-ball', emoji: '⚪', category: 'Sport collectif' },
  { id: 'floorball', name: 'Floorball', emoji: '🏑', category: 'Sport collectif' },
  { id: 'sepak-takraw', name: 'Sepak takraw', emoji: '🦶', category: 'Sport collectif' },
  { id: 'netball', name: 'Netball', emoji: '🏀', category: 'Sport collectif' },
  { id: 'lacrosse', name: 'Lacrosse', emoji: '🥍', category: 'Sport collectif' },
  { id: 'rugby-americain', name: 'Football américain', emoji: '🏈', category: 'Sport collectif' },
  { id: 'step', name: 'Step', emoji: '📦', category: 'Fitness' },
  { id: 'body-pump', name: 'Body Pump', emoji: '🏋️‍♀️', category: 'Fitness' },
  { id: 'body-combat', name: 'Body Combat', emoji: '🥊', category: 'Fitness' },
  { id: 'rpm', name: 'RPM (cycling)', emoji: '🚴‍♀️', category: 'Fitness' },
  { id: 'tai-chi', name: 'Taï Chi', emoji: '🧘‍♂️', category: 'Art martial doux' },
  { id: 'qi-gong', name: 'Qi Gong', emoji: '🧘', category: 'Art martial doux' }
];

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
  const sportData = allSports.find(s => s.id === sport);
  return sportData?.emoji || '🏃';
};

export const getSportName = (sport: string): string => {
  const sportData = allSports.find(s => s.id === sport);
  return sportData?.name || sport;
};

export const getSportsByCategory = () => {
  const categories: Record<string, typeof allSports> = {};
  allSports.forEach(sport => {
    if (!categories[sport.category]) {
      categories[sport.category] = [];
    }
    categories[sport.category].push(sport);
  });
  return categories;
};

export const searchSports = (query: string) => {
  return allSports.filter(sport => 
    sport.name.toLowerCase().includes(query.toLowerCase()) ||
    sport.category.toLowerCase().includes(query.toLowerCase())
  );
};
