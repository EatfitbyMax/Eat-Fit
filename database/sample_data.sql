
-- Données d'exemple pour tester l'application

-- Note: Ces données d'exemple utilisent des UUIDs génériques
-- En production, vous devrez remplacer ces UUIDs par ceux d'utilisateurs réels créés via Supabase Auth

-- Générer des UUIDs pour les exemples
DO $$
DECLARE
    coach_uuid UUID := gen_random_uuid();
    client_uuid UUID := gen_random_uuid();
    nutrition_program_1 UUID;
    nutrition_program_2 UUID;
    nutrition_program_3 UUID;
    workout_program_1 UUID;
    workout_program_2 UUID;
    workout_program_3 UUID;
    workout_1 UUID;
    workout_2 UUID;
    workout_3 UUID;
    conversation_1 UUID;
BEGIN
    -- Insertion de programmes de nutrition
    INSERT INTO nutrition_programs (id, coach_id, title, description, total_calories) VALUES
      (gen_random_uuid(), coach_uuid, 'Programme Prise de Masse', 'Programme nutritionnel pour la prise de masse musculaire', 3000),
      (gen_random_uuid(), coach_uuid, 'Programme Sèche', 'Programme nutritionnel pour la perte de graisse', 1800),
      (gen_random_uuid(), coach_uuid, 'Programme Équilibré', 'Programme nutritionnel équilibré pour maintien', 2200)
    RETURNING id INTO nutrition_program_1;

    -- Récupérer l'ID du premier programme pour les repas
    SELECT id INTO nutrition_program_1 FROM nutrition_programs WHERE title = 'Programme Prise de Masse' LIMIT 1;

    -- Insertion de repas d'exemple
    INSERT INTO meals (program_id, day, meal_type, name, description, calories, ingredients, preparation) VALUES
      (nutrition_program_1, 'lundi', 'petit_dejeuner', 'Petit-déjeuner protéiné', 
       'Petit-déjeuner riche en protéines', 500, 
       '["3 œufs", "2 tranches de pain complet", "1 avocat", "1 verre de lait"]',
       'Faire cuire les œufs brouillés, griller le pain, écraser l''avocat avec un peu de sel'),
      (nutrition_program_1, 'lundi', 'dejeuner', 'Déjeuner équilibré', 
       'Déjeuner avec protéines et légumes', 700, 
       '["150g de poulet", "200g de riz", "légumes verts", "huile d''olive"]',
       'Cuire le poulet, faire le riz, faire sauter les légumes'),
      (nutrition_program_1, 'lundi', 'diner', 'Dîner léger', 
       'Dîner riche en protéines', 600, 
       '["150g de saumon", "légumes vapeur", "quinoa"]',
       'Cuire le saumon, faire cuire les légumes à la vapeur');

    -- Insertion de programmes d'entraînement
    INSERT INTO workout_programs (id, coach_id, title, description, duration_weeks, difficulty) VALUES
      (gen_random_uuid(), coach_uuid, 'Programme Débutant Full Body', 'Programme pour débutants 3x par semaine', 8, 'debutant'),
      (gen_random_uuid(), coach_uuid, 'Programme Push/Pull/Legs', 'Programme intermédiaire en split', 12, 'intermediaire'),
      (gen_random_uuid(), coach_uuid, 'Programme Force Avancé', 'Programme axé sur la force maximale', 16, 'avance')
    RETURNING id INTO workout_program_1;

    -- Récupérer l'ID du premier programme pour les workouts
    SELECT id INTO workout_program_1 FROM workout_programs WHERE title = 'Programme Débutant Full Body' LIMIT 1;

    -- Insertion d'entraînements
    INSERT INTO workouts (id, program_id, day, name, duration_minutes, rest_between_sets) VALUES
      (gen_random_uuid(), workout_program_1, 'lundi', 'Full Body A', 60, 90),
      (gen_random_uuid(), workout_program_1, 'mercredi', 'Full Body B', 60, 90),
      (gen_random_uuid(), workout_program_1, 'vendredi', 'Full Body C', 60, 90)
    RETURNING id INTO workout_1;

    -- Récupérer l'ID du premier workout pour les exercices
    SELECT id INTO workout_1 FROM workouts WHERE name = 'Full Body A' LIMIT 1;

    -- Insertion d'exercices
    INSERT INTO exercises (workout_id, name, description, sets, reps, weight, rest_time, instructions) VALUES
      (workout_1, 'Squat', 'Squat avec barre', 3, '8-10', 60.0, 120, 
       'Descendez en gardant le dos droit, remontez en poussant sur les talons'),
      (workout_1, 'Développé couché', 'Développé couché avec barre', 3, '8-10', 80.0, 120,
       'Descendez la barre jusqu''à la poitrine, remontez en contrôlant le mouvement'),
      (workout_1, 'Rowing barre', 'Tirage horizontal avec barre', 3, '8-10', 70.0, 120,
       'Tirez la barre vers le bas du torse en serrant les omoplates'),
      (workout_1, 'Développé militaire', 'Développé épaules debout', 3, '8-10', 50.0, 120,
       'Poussez la barre au-dessus de la tête en gardant le tronc stable'),
      (workout_1, 'Tractions', 'Tractions à la barre fixe', 3, '5-8', NULL, 120,
       'Tirez-vous vers le haut jusqu''à ce que le menton dépasse la barre');

    -- Insertion d'une conversation d'exemple
    INSERT INTO conversations (id, coach_id, client_id, last_message_at) VALUES
      (gen_random_uuid(), coach_uuid, client_uuid, NOW());

    -- Récupérer l'ID de la conversation
    SELECT id INTO conversation_1 FROM conversations WHERE coach_id = coach_uuid LIMIT 1;

    -- Insertion de messages d'exemple
    INSERT INTO messages (conversation_id, sender_id, receiver_id, content, message_type, is_read) VALUES
      (conversation_1, coach_uuid, client_uuid, 'Bonjour ! Comment allez-vous aujourd''hui ?', 'text', false),
      (conversation_1, client_uuid, coach_uuid, 'Très bien merci ! J''ai terminé mon entraînement.', 'text', true),
      (conversation_1, coach_uuid, client_uuid, 'Parfait ! Comment vous sentez-vous après la séance ?', 'text', false);

    -- Insertion d'affectations de programmes
    INSERT INTO program_assignments (coach_id, client_id, program_id, program_type, start_date, status) VALUES
      (coach_uuid, client_uuid, nutrition_program_1, 'nutrition', CURRENT_DATE, 'active'),
      (coach_uuid, client_uuid, workout_program_1, 'workout', CURRENT_DATE, 'active');

END $$;
