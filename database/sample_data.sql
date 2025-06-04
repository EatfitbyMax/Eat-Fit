
-- Données d'exemple pour tester l'application

-- Insertion de profils d'exemple (après inscription via Supabase Auth)
-- Note: Les UUID doivent correspondre aux utilisateurs créés via Supabase Auth

-- Exemple de programmes de nutrition
INSERT INTO nutrition_programs (coach_id, title, description, total_calories) VALUES
  ('coach-uuid-here', 'Programme Prise de Masse', 'Programme nutritionnel pour la prise de masse musculaire', 3000),
  ('coach-uuid-here', 'Programme Sèche', 'Programme nutritionnel pour la perte de graisse', 1800),
  ('coach-uuid-here', 'Programme Équilibré', 'Programme nutritionnel équilibré pour maintien', 2200);

-- Exemple de repas
INSERT INTO meals (program_id, day, meal_type, name, description, calories, ingredients, preparation) VALUES
  ((SELECT id FROM nutrition_programs WHERE title = 'Programme Prise de Masse' LIMIT 1), 
   'lundi', 'petit_dejeuner', 'Petit-déjeuner protéiné', 
   'Petit-déjeuner riche en protéines', 500, 
   '["3 œufs", "2 tranches de pain complet", "1 avocat", "1 verre de lait"]',
   'Faire cuire les œufs brouillés, griller le pain, écraser l''avocat avec un peu de sel');

-- Exemple de programmes d'entraînement
INSERT INTO workout_programs (coach_id, title, description, duration_weeks, difficulty) VALUES
  ('coach-uuid-here', 'Programme Débutant Full Body', 'Programme pour débutants 3x par semaine', 8, 'debutant'),
  ('coach-uuid-here', 'Programme Push/Pull/Legs', 'Programme intermédiaire en split', 12, 'intermediaire'),
  ('coach-uuid-here', 'Programme Force Avancé', 'Programme axé sur la force maximale', 16, 'avance');

-- Exemple d'entraînements
INSERT INTO workouts (program_id, day, name, duration_minutes, rest_between_sets) VALUES
  ((SELECT id FROM workout_programs WHERE title = 'Programme Débutant Full Body' LIMIT 1),
   'lundi', 'Full Body A', 60, 90),
  ((SELECT id FROM workout_programs WHERE title = 'Programme Débutant Full Body' LIMIT 1),
   'mercredi', 'Full Body B', 60, 90),
  ((SELECT id FROM workout_programs WHERE title = 'Programme Débutant Full Body' LIMIT 1),
   'vendredi', 'Full Body C', 60, 90);

-- Exemple d'exercices
INSERT INTO exercises (workout_id, name, description, sets, reps, weight, rest_time, instructions) VALUES
  ((SELECT id FROM workouts WHERE name = 'Full Body A' LIMIT 1),
   'Squat', 'Squat avec barre', 3, '8-10', 60.0, 120, 
   'Descendez en gardant le dos droit, remontez en poussant sur les talons'),
  ((SELECT id FROM workouts WHERE name = 'Full Body A' LIMIT 1),
   'Développé couché', 'Développé couché avec barre', 3, '8-10', 80.0, 120,
   'Descendez la barre jusqu''à la poitrine, remontez en contrôlant le mouvement'),
  ((SELECT id FROM workouts WHERE name = 'Full Body A' LIMIT 1),
   'Rowing barre', 'Tirage horizontal avec barre', 3, '8-10', 70.0, 120,
   'Tirez la barre vers le bas du torse en serrant les omoplates');
