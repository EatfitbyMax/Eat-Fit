
-- Création du schéma de base de données pour l'application coach/client

-- Table des profils utilisateurs (étend auth.users de Supabase)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  user_type VARCHAR(10) CHECK (user_type IN ('client', 'coach')) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des programmes de nutrition
CREATE TABLE IF NOT EXISTS nutrition_programs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  total_calories INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des repas
CREATE TABLE IF NOT EXISTS meals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id UUID REFERENCES nutrition_programs(id) ON DELETE CASCADE NOT NULL,
  day VARCHAR(20) NOT NULL, -- lundi, mardi, etc.
  meal_type VARCHAR(20) CHECK (meal_type IN ('petit_dejeuner', 'dejeuner', 'collation', 'diner')) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  calories INTEGER NOT NULL DEFAULT 0,
  ingredients JSONB DEFAULT '[]'::jsonb, -- Array de string stocké en JSON
  preparation TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des programmes d'entraînement
CREATE TABLE IF NOT EXISTS workout_programs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  duration_weeks INTEGER NOT NULL DEFAULT 1,
  difficulty VARCHAR(20) CHECK (difficulty IN ('debutant', 'intermediaire', 'avance')) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des entraînements
CREATE TABLE IF NOT EXISTS workouts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id UUID REFERENCES workout_programs(id) ON DELETE CASCADE NOT NULL,
  day VARCHAR(20) NOT NULL, -- lundi, mardi, etc.
  name VARCHAR(255) NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 0,
  rest_between_sets INTEGER NOT NULL DEFAULT 60, -- en secondes
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des exercices
CREATE TABLE IF NOT EXISTS exercises (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workout_id UUID REFERENCES workouts(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  sets INTEGER NOT NULL DEFAULT 1,
  reps VARCHAR(50) NOT NULL, -- "10-12" ou "30 secondes", etc.
  weight DECIMAL(5,2), -- poids en kg
  duration INTEGER, -- durée en secondes
  rest_time INTEGER NOT NULL DEFAULT 60, -- repos en secondes
  instructions TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des conversations
CREATE TABLE IF NOT EXISTS conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE NOT NULL,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(coach_id, client_id)
);

-- Table des messages
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  message_type VARCHAR(10) CHECK (message_type IN ('text', 'image', 'file')) DEFAULT 'text',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des affectations de programmes
CREATE TABLE IF NOT EXISTS program_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  coach_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE NOT NULL,
  program_id UUID NOT NULL, -- Référence générique vers nutrition_programs ou workout_programs
  program_type VARCHAR(20) CHECK (program_type IN ('nutrition', 'workout')) NOT NULL,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  status VARCHAR(20) CHECK (status IN ('active', 'completed', 'paused')) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_profiles_user_type ON profiles(user_type);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_nutrition_programs_coach_id ON nutrition_programs(coach_id);
CREATE INDEX IF NOT EXISTS idx_workout_programs_coach_id ON workout_programs(coach_id);
CREATE INDEX IF NOT EXISTS idx_meals_program_id ON meals(program_id);
CREATE INDEX IF NOT EXISTS idx_workouts_program_id ON workouts(program_id);
CREATE INDEX IF NOT EXISTS idx_exercises_workout_id ON exercises(workout_id);
CREATE INDEX IF NOT EXISTS idx_conversations_coach_client ON conversations(coach_id, client_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_unread ON messages(receiver_id) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_program_assignments_client ON program_assignments(client_id);
CREATE INDEX IF NOT EXISTS idx_program_assignments_coach ON program_assignments(coach_id);

-- Fonction pour mettre à jour le timestamp updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Déclencheurs pour mettre à jour automatiquement updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_nutrition_programs_updated_at BEFORE UPDATE ON nutrition_programs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workout_programs_updated_at BEFORE UPDATE ON workout_programs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Politiques RLS (Row Level Security) pour Supabase
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_assignments ENABLE ROW LEVEL SECURITY;

-- Politiques pour les profils
CREATE POLICY "Les utilisateurs peuvent voir leur propre profil" ON profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent mettre à jour leur propre profil" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Les coachs peuvent voir les profils clients" ON profiles
  FOR SELECT USING (
    user_type = 'client' AND 
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.user_id = auth.uid() AND p.user_type = 'coach'
    )
  );

-- Politiques pour les programmes de nutrition
CREATE POLICY "Les coachs peuvent gérer leurs programmes de nutrition" ON nutrition_programs
  FOR ALL USING (auth.uid() = coach_id);

CREATE POLICY "Les clients peuvent voir leurs programmes assignés" ON nutrition_programs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM program_assignments pa 
      WHERE pa.program_id = id 
      AND pa.client_id = auth.uid() 
      AND pa.program_type = 'nutrition'
      AND pa.status = 'active'
    )
  );

-- Politiques similaires pour les autres tables...
-- (Les politiques complètes seraient trop longues pour cet exemple)
