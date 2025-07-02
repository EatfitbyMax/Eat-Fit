
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
  { id: 'qi-gong', name: 'Qi Gong', emoji: '🧘', category: 'Art martial doux' },
  
  // Sports d'endurance et multisports
  { id: 'triathlon-sprint', name: 'Triathlon Sprint', emoji: '🏊‍♂️', category: 'Multisport' },
  { id: 'triathlon-olympique', name: 'Triathlon Olympique', emoji: '🏊‍♂️', category: 'Multisport' },
  { id: 'triathlon-longue-distance', name: 'Triathlon Longue Distance', emoji: '🏊‍♂️', category: 'Multisport' },
  { id: 'ironman', name: 'Ironman', emoji: '🏊‍♂️', category: 'Multisport' },
  { id: 'duathlon', name: 'Duathlon', emoji: '🏃‍♂️', category: 'Multisport' },
  { id: 'aquathlon', name: 'Aquathlon', emoji: '🏊‍♂️', category: 'Multisport' },
  { id: 'biathlon-ete', name: 'Biathlon d\'été', emoji: '🏃‍♂️', category: 'Sport d\'endurance' },
  { id: 'pentathlon-moderne', name: 'Pentathlon moderne', emoji: '🤺', category: 'Multisport' },
  { id: 'decathlon', name: 'Décathlon', emoji: '🏃‍♂️', category: 'Athlétisme' },
  { id: 'heptathlon', name: 'Heptathlon', emoji: '🏃‍♀️', category: 'Athlétisme' },
  
  // Sports nautiques et sauvetage
  { id: 'sauvetage-sportif', name: 'Sauvetage sportif', emoji: '🏊‍♂️', category: 'Sport aquatique' },
  { id: 'sauvetage-cotier', name: 'Sauvetage côtier', emoji: '🏖️', category: 'Sport aquatique' },
  { id: 'kayak-mer', name: 'Kayak de mer', emoji: '🛶', category: 'Sport nautique' },
  { id: 'kayak-riviere', name: 'Kayak de rivière', emoji: '🛶', category: 'Sport nautique' },
  { id: 'kayak-polo', name: 'Kayak-polo', emoji: '🛶', category: 'Sport nautique' },
  { id: 'dragon-boat', name: 'Dragon boat', emoji: '🐉', category: 'Sport nautique' },
  { id: 'raft', name: 'Rafting', emoji: '🚣‍♂️', category: 'Sport d\'aventure' },
  { id: 'stand-up-paddle', name: 'Stand Up Paddle', emoji: '🏄‍♂️', category: 'Sport nautique' },
  { id: 'wakeboard', name: 'Wakeboard', emoji: '🏄‍♂️', category: 'Sport nautique' },
  { id: 'ski-nautique', name: 'Ski nautique', emoji: '🎿', category: 'Sport nautique' },
  { id: 'jetski', name: 'Jet-ski', emoji: '🛥️', category: 'Sport nautique' },
  { id: 'voile-habitable', name: 'Voile habitable', emoji: '⛵', category: 'Sport nautique' },
  { id: 'voile-derive', name: 'Voile dériveur', emoji: '⛵', category: 'Sport nautique' },
  { id: 'voile-planche', name: 'Planche à voile', emoji: '🏄‍♂️', category: 'Sport nautique' },
  
  // Sports de montagne et d'aventure
  { id: 'alpinisme-rocheux', name: 'Alpinisme rocheux', emoji: '🧗‍♂️', category: 'Sport d\'aventure' },
  { id: 'alpinisme-glaciaire', name: 'Alpinisme glaciaire', emoji: '🏔️', category: 'Sport d\'aventure' },
  { id: 'escalade-sportive', name: 'Escalade sportive', emoji: '🧗‍♀️', category: 'Sport d\'aventure' },
  { id: 'escalade-bloc', name: 'Escalade de bloc', emoji: '🧗‍♂️', category: 'Sport d\'aventure' },
  { id: 'escalade-glace', name: 'Escalade sur glace', emoji: '🧊', category: 'Sport d\'hiver' },
  { id: 'canyon', name: 'Canyoning', emoji: '🏞️', category: 'Sport d\'aventure' },
  { id: 'raquettes', name: 'Raquettes à neige', emoji: '🥾', category: 'Sport d\'hiver' },
  { id: 'ski-randonnee', name: 'Ski de randonnée', emoji: '🎿', category: 'Sport d\'hiver' },
  { id: 'ski-alpinisme', name: 'Ski-alpinisme', emoji: '🎿', category: 'Sport d\'hiver' },
  { id: 'splitboard', name: 'Splitboard', emoji: '🏂', category: 'Sport d\'hiver' },
  { id: 'telemark', name: 'Télémark', emoji: '🎿', category: 'Sport d\'hiver' },
  
  // Sports de vitesse et mécaniques
  { id: 'formule-1', name: 'Formule 1', emoji: '🏎️', category: 'Sport automobile' },
  { id: 'rallye-raid', name: 'Rallye-raid', emoji: '🚗', category: 'Sport automobile' },
  { id: 'endurance-auto', name: 'Endurance automobile', emoji: '🏁', category: 'Sport automobile' },
  { id: 'drift', name: 'Drift', emoji: '🚗', category: 'Sport automobile' },
  { id: 'superbike', name: 'Superbike', emoji: '🏍️', category: 'Sport mécanique' },
  { id: 'enduro-moto', name: 'Enduro moto', emoji: '🏍️', category: 'Sport mécanique' },
  { id: 'trial-moto', name: 'Trial moto', emoji: '🏍️', category: 'Sport mécanique' },
  { id: 'speedway', name: 'Speedway', emoji: '🏍️', category: 'Sport mécanique' },
  { id: 'velo-route', name: 'Vélo de route', emoji: '🚴‍♂️', category: 'Cyclisme' },
  { id: 'velo-piste', name: 'Vélo sur piste', emoji: '🚴‍♀️', category: 'Cyclisme' },
  { id: 'cyclo-cross', name: 'Cyclo-cross', emoji: '🚴‍♂️', category: 'Cyclisme' },
  { id: 'trial-velo', name: 'Trial vélo', emoji: '🚴‍♂️', category: 'Cyclisme' },
  
  // Sports de précision et tir
  { id: 'tir-sportif', name: 'Tir sportif', emoji: '🎯', category: 'Sport de précision' },
  { id: 'tir-pistolet', name: 'Tir au pistolet', emoji: '🔫', category: 'Sport de précision' },
  { id: 'tir-carabine', name: 'Tir à la carabine', emoji: '🔫', category: 'Sport de précision' },
  { id: 'ball-trap', name: 'Ball-trap', emoji: '🎯', category: 'Sport de précision' },
  { id: 'tir-3d', name: 'Tir à l\'arc 3D', emoji: '🏹', category: 'Sport de précision' },
  { id: 'sarbacane', name: 'Sarbacane', emoji: '🎯', category: 'Sport de précision' },
  
  // Sports collectifs spécialisés
  { id: 'water-basket', name: 'Water-basket', emoji: '🏀', category: 'Sport aquatique' },
  { id: 'underwater-hockey', name: 'Hockey subaquatique', emoji: '🏒', category: 'Sport aquatique' },
  { id: 'underwater-rugby', name: 'Rugby subaquatique', emoji: '🏈', category: 'Sport aquatique' },
  { id: 'quidditch', name: 'Quidditch', emoji: '🧙‍♂️', category: 'Sport fantastique' },
  { id: 'roller-derby', name: 'Roller derby', emoji: '🛼', category: 'Sport de contact' },
  { id: 'roller-hockey', name: 'Roller hockey', emoji: '🏒', category: 'Sport collectif' },
  { id: 'unihockey', name: 'Unihockey', emoji: '🏑', category: 'Sport collectif' },
  { id: 'rink-hockey', name: 'Rink hockey', emoji: '🏒', category: 'Sport collectif' },
  
  // Sports de force et haltérophilie
  { id: 'halterophilie', name: 'Haltérophilie', emoji: '🏋️‍♂️', category: 'Sport de force' },
  { id: 'powerlifting', name: 'Powerlifting', emoji: '🏋️‍♀️', category: 'Sport de force' },
  { id: 'strongman', name: 'Strongman', emoji: '💪', category: 'Sport de force' },
  { id: 'kettlebell', name: 'Kettlebell', emoji: '🏋️‍♂️', category: 'Fitness' },
  { id: 'calisthenics', name: 'Callisthénie', emoji: '🤸‍♂️', category: 'Fitness' },
  { id: 'street-workout', name: 'Street Workout', emoji: '💪', category: 'Fitness' },
  
  // Sports artistiques et acrobatiques
  { id: 'gymnastique-artistique', name: 'Gymnastique artistique', emoji: '🤸‍♀️', category: 'Sport artistique' },
  { id: 'gymnastique-rythmique', name: 'Gymnastique rythmique', emoji: '🤸‍♀️', category: 'Sport artistique' },
  { id: 'trampoline', name: 'Trampoline', emoji: '🤸‍♂️', category: 'Sport acrobatique' },
  { id: 'tumbling', name: 'Tumbling', emoji: '🤸‍♀️', category: 'Sport acrobatique' },
  { id: 'acrosport', name: 'Acrosport', emoji: '🤸‍♂️', category: 'Sport acrobatique' },
  { id: 'cheerleading', name: 'Cheerleading', emoji: '📣', category: 'Sport artistique' },
  { id: 'twirling', name: 'Twirling bâton', emoji: '🎭', category: 'Sport artistique' },
  
  // Sports équestres spécialisés
  { id: 'dressage', name: 'Dressage', emoji: '🐎', category: 'Sport équestre' },
  { id: 'saut-obstacles', name: 'Saut d\'obstacles', emoji: '🐎', category: 'Sport équestre' },
  { id: 'concours-complet', name: 'Concours complet', emoji: '🐎', category: 'Sport équestre' },
  { id: 'endurance-equestre', name: 'Endurance équestre', emoji: '🐎', category: 'Sport équestre' },
  { id: 'polo', name: 'Polo', emoji: '🐎', category: 'Sport équestre' },
  { id: 'horse-ball', name: 'Horse-ball', emoji: '🐎', category: 'Sport équestre' },
  { id: 'voltige-equestre', name: 'Voltige équestre', emoji: '🐎', category: 'Sport équestre' },
  
  // Sports de raquette spécialisés
  { id: 'frontenis', name: 'Frontenis', emoji: '🎾', category: 'Sport de raquette' },
  { id: 'pelote-basque', name: 'Pelote basque', emoji: '🎾', category: 'Sport de raquette' },
  { id: 'jai-alai', name: 'Jai alai', emoji: '🎾', category: 'Sport de raquette' },
  { id: 'speedminton', name: 'Speedminton', emoji: '🏸', category: 'Sport de raquette' },
  
  // Sports de glisse urbaine
  { id: 'skateboard-street', name: 'Skateboard street', emoji: '🛹', category: 'Sport urbain' },
  { id: 'skateboard-vert', name: 'Skateboard vert', emoji: '🛹', category: 'Sport urbain' },
  { id: 'longboard', name: 'Longboard', emoji: '🛹', category: 'Sport urbain' },
  { id: 'trottinette-freestyle', name: 'Trottinette freestyle', emoji: '🛴', category: 'Sport urbain' },
  { id: 'roller-agressif', name: 'Roller agressif', emoji: '🛼', category: 'Sport urbain' },
  { id: 'roller-course', name: 'Roller course', emoji: '🛼', category: 'Sport de vitesse' },
  
  // Sports de santé et récupération
  { id: 'aqua-fitness', name: 'Aqua fitness', emoji: '🏊‍♀️', category: 'Fitness aquatique' },
  { id: 'aqua-bike', name: 'Aqua bike', emoji: '🚴‍♀️', category: 'Fitness aquatique' },
  { id: 'stretching', name: 'Stretching', emoji: '🧘‍♀️', category: 'Bien-être' },
  { id: 'meditation', name: 'Méditation', emoji: '🧘', category: 'Bien-être' },
  { id: 'sophrologie', name: 'Sophrologie', emoji: '🧘‍♀️', category: 'Bien-être' },
  { id: 'reflexologie', name: 'Réflexologie', emoji: '🦶', category: 'Bien-être' },
  
  // Sports émergents et modernes
  { id: 'parkour-freerun', name: 'Parkour/Freerun', emoji: '🏃‍♂️', category: 'Sport urbain' },
  { id: 'obstacle-race', name: 'Course d\'obstacles', emoji: '🏃‍♀️', category: 'Sport d\'endurance' },
  { id: 'mud-run', name: 'Mud run', emoji: '🏃‍♂️', category: 'Sport d\'endurance' },
  { id: 'spartan-race', name: 'Spartan Race', emoji: '🏃‍♀️', category: 'Sport d\'endurance' },
  { id: 'ninja-warrior', name: 'Ninja Warrior', emoji: '🥷', category: 'Sport d\'obstacles' },
  { id: 'slackline', name: 'Slackline', emoji: '🎪', category: 'Sport d\'équilibre' },
  { id: 'highlining', name: 'Highlining', emoji: '🎪', category: 'Sport extrême' },
  
  // Sports de lancer
  { id: 'lancer-poids', name: 'Lancer du poids', emoji: '🥎', category: 'Athlétisme' },
  { id: 'lancer-disque', name: 'Lancer du disque', emoji: '🥏', category: 'Athlétisme' },
  { id: 'lancer-marteau', name: 'Lancer du marteau', emoji: '🔨', category: 'Athlétisme' },
  { id: 'lancer-javelot', name: 'Lancer du javelot', emoji: '🗡️', category: 'Athlétisme' },
  
  // Sports de saut
  { id: 'saut-longueur', name: 'Saut en longueur', emoji: '🏃‍♂️', category: 'Athlétisme' },
  { id: 'triple-saut', name: 'Triple saut', emoji: '🏃‍♀️', category: 'Athlétisme' },
  { id: 'saut-hauteur', name: 'Saut en hauteur', emoji: '🏃‍♂️', category: 'Athlétisme' },
  { id: 'saut-perche', name: 'Saut à la perche', emoji: '🏃‍♀️', category: 'Athlétisme' },
  { id: 'base-jump', name: 'Base jump', emoji: '🪂', category: 'Sport extrême' },
  { id: 'bungee', name: 'Saut à l\'élastique', emoji: '🪂', category: 'Sport extrême' },
  
  // Sports de course spécialisés
  { id: 'sprint', name: 'Sprint', emoji: '🏃‍♂️', category: 'Athlétisme' },
  { id: 'demi-fond', name: 'Demi-fond', emoji: '🏃‍♀️', category: 'Athlétisme' },
  { id: 'fond', name: 'Course de fond', emoji: '🏃‍♂️', category: 'Athlétisme' },
  { id: 'haies', name: 'Course de haies', emoji: '🏃‍♀️', category: 'Athlétisme' },
  { id: 'steeplechase', name: 'Steeple-chase', emoji: '🏃‍♂️', category: 'Athlétisme' },
  { id: 'marche-sportive', name: 'Marche sportive', emoji: '🚶‍♀️', category: 'Athlétisme' },
  { id: 'ultra-trail', name: 'Ultra-trail', emoji: '🏃‍♂️', category: 'Course nature' },
  { id: 'skyrunning', name: 'Skyrunning', emoji: '🏔️', category: 'Course nature' }
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
