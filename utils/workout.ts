
import { supabase, WorkoutProgram, Workout, Exercise, ProgramAssignment } from './supabase';

// Créer un programme d'entraînement
export async function createWorkoutProgram(programData: {
  title: string;
  description: string;
  duration_weeks: number;
  difficulty: 'debutant' | 'intermediaire' | 'avance';
  coach_id: string;
}): Promise<WorkoutProgram | null> {
  try {
    const { data, error } = await supabase
      .from('workout_programs')
      .insert([{
        coach_id: programData.coach_id,
        title: programData.title,
        description: programData.description,
        duration_weeks: programData.duration_weeks,
        difficulty: programData.difficulty
      }])
      .select()
      .single();

    if (error) {
      console.error('Erreur création programme entraînement:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Erreur création programme entraînement:', error);
    return null;
  }
}

// Récupérer les programmes d'un coach
export async function getCoachWorkoutPrograms(coachId: string): Promise<WorkoutProgram[]> {
  try {
    const { data, error } = await supabase
      .from('workout_programs')
      .select(`
        *,
        workouts (
          *,
          exercises (*)
        )
      `)
      .eq('coach_id', coachId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur récupération programmes entraînement:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Erreur récupération programmes entraînement:', error);
    return [];
  }
}

// Ajouter un entraînement à un programme
export async function addWorkoutToProgram(workoutData: {
  program_id: string;
  day: string;
  name: string;
  duration_minutes: number;
  rest_between_sets: number;
}): Promise<Workout | null> {
  try {
    const { data, error } = await supabase
      .from('workouts')
      .insert([workoutData])
      .select()
      .single();

    if (error) {
      console.error('Erreur ajout entraînement:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Erreur ajout entraînement:', error);
    return null;
  }
}

// Ajouter un exercice à un entraînement
export async function addExerciseToWorkout(exerciseData: {
  workout_id: string;
  name: string;
  description: string;
  sets: number;
  reps: string;
  weight?: number;
  duration?: number;
  rest_time: number;
  instructions: string;
}): Promise<Exercise | null> {
  try {
    const { data, error } = await supabase
      .from('exercises')
      .insert([exerciseData])
      .select()
      .single();

    if (error) {
      console.error('Erreur ajout exercice:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Erreur ajout exercice:', error);
    return null;
  }
}

// Assigner un programme d'entraînement à un client
export async function assignWorkoutProgram(assignmentData: {
  coach_id: string;
  client_id: string;
  program_id: string;
  start_date: string;
  end_date?: string;
}): Promise<ProgramAssignment | null> {
  try {
    const { data, error } = await supabase
      .from('program_assignments')
      .insert([{
        ...assignmentData,
        program_type: 'workout',
        status: 'active'
      }])
      .select()
      .single();

    if (error) {
      console.error('Erreur affectation programme entraînement:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Erreur affectation programme entraînement:', error);
    return null;
  }
}

// Récupérer les programmes assignés à un client
export async function getClientWorkoutPrograms(clientId: string): Promise<WorkoutProgram[]> {
  try {
    const { data, error } = await supabase
      .from('program_assignments')
      .select(`
        workout_programs (
          *,
          workouts (
            *,
            exercises (*)
          )
        )
      `)
      .eq('client_id', clientId)
      .eq('program_type', 'workout')
      .eq('status', 'active');

    if (error) {
      console.error('Erreur récupération programmes client:', error);
      return [];
    }

    return data?.map(assignment => assignment.workout_programs).filter(Boolean) || [];
  } catch (error) {
    console.error('Erreur récupération programmes client:', error);
    return [];
  }
}

// Supprimer un programme d'entraînement
export async function deleteWorkoutProgram(programId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('workout_programs')
      .delete()
      .eq('id', programId);

    if (error) {
      console.error('Erreur suppression programme:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erreur suppression programme:', error);
    return false;
  }
}
