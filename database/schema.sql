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
  duration_weeks INTEGER NOT NULL DEFAULT 4,
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
  duration_minutes INTEGER NOT NULL DEFAULT 60,
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
  reps VARCHAR(50) NOT NULL, -- ex: "8-10", "12", "30 sec"
  weight DECIMAL(5,2), -- poids en kg
  duration INTEGER, -- durée en secondes pour exercices chronométrés
  rest_time INTEGER NOT NULL DEFAULT 60, -- temps de repos en secondes
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
  program_id UUID NOT NULL, -- UUID générique pour pointer vers nutrition ou workout
  program_type VARCHAR(20) CHECK (program_type IN ('nutrition', 'workout')) NOT NULL,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  status VARCHAR(20) CHECK (status IN ('active', 'completed', 'paused')) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_user_type ON profiles(user_type);
CREATE INDEX IF NOT EXISTS idx_nutrition_programs_coach_id ON nutrition_programs(coach_id);
CREATE INDEX IF NOT EXISTS idx_meals_program_id ON meals(program_id);
CREATE INDEX IF NOT EXISTS idx_workout_programs_coach_id ON workout_programs(coach_id);
CREATE INDEX IF NOT EXISTS idx_workouts_program_id ON workouts(program_id);
CREATE INDEX IF NOT EXISTS idx_exercises_workout_id ON exercises(workout_id);
CREATE INDEX IF NOT EXISTS idx_conversations_coach_id ON conversations(coach_id);
CREATE INDEX IF NOT EXISTS idx_conversations_client_id ON conversations(client_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_program_assignments_client_id ON program_assignments(client_id);
CREATE INDEX IF NOT EXISTS idx_program_assignments_coach_id ON program_assignments(coach_id);

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_nutrition_programs_updated_at BEFORE UPDATE ON nutrition_programs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workout_programs_updated_at BEFORE UPDATE ON workout_programs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour créer automatiquement un profil après inscription
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, user_type)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email), 
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'client')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour création automatique du profil
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();