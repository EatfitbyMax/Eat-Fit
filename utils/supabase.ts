
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vunwpcwqxmtdhqojqjvi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1bndwY3dxeG10ZGhxb2pxanZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwMjk3MTEsImV4cCI6MjA2NDYwNTcxMX0.iler6HnVrAp1WIWNLo5kELNy-jHA4ukhGna_1pEuA1o';

export const supabase = createClient(supabaseUrl, supabaseKey);

export interface User {
  id: string;
  email: string;
  name: string;
  user_type: 'client' | 'coach';
  created_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  name: string;
  user_type: 'client' | 'coach';
  created_at: string;
}

// Types pour les programmes de nutrition
export interface NutritionProgram {
  id: string;
  coach_id: string;
  title: string;
  description: string;
  total_calories: number;
  meals: Meal[];
  created_at: string;
  updated_at: string;
}

export interface Meal {
  id: string;
  program_id: string;
  day: string;
  meal_type: 'petit_dejeuner' | 'dejeuner' | 'collation' | 'diner';
  name: string;
  description: string;
  calories: number;
  ingredients: string[];
  preparation: string;
}

// Types pour les programmes d'entraînement
export interface WorkoutProgram {
  id: string;
  coach_id: string;
  title: string;
  description: string;
  duration_weeks: number;
  difficulty: 'debutant' | 'intermediaire' | 'avance';
  workouts: Workout[];
  created_at: string;
  updated_at: string;
}

export interface Workout {
  id: string;
  program_id: string;
  day: string;
  name: string;
  duration_minutes: number;
  exercises: Exercise[];
  rest_between_sets: number;
}

export interface Exercise {
  id: string;
  workout_id: string;
  name: string;
  description: string;
  sets: number;
  reps: string;
  weight?: number;
  duration?: number;
  rest_time: number;
  instructions: string;
}

// Types pour la messagerie
export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  message_type: 'text' | 'image' | 'file';
  is_read: boolean;
  created_at: string;
}

export interface Conversation {
  id: string;
  coach_id: string;
  client_id: string;
  last_message_at: string;
  created_at: string;
}

// Types pour les affectations
export interface ProgramAssignment {
  id: string;
  coach_id: string;
  client_id: string;
  program_id: string;
  program_type: 'nutrition' | 'workout';
  start_date: string;
  end_date?: string;
  status: 'active' | 'completed' | 'paused';
  created_at: string;
}
