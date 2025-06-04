
import { supabase, NutritionProgram, Meal, ProgramAssignment } from './supabase';

// Créer un programme de nutrition
export async function createNutritionProgram(programData: {
  title: string;
  description: string;
  total_calories: number;
  coach_id: string;
}): Promise<NutritionProgram | null> {
  try {
    const { data, error } = await supabase
      .from('nutrition_programs')
      .insert([{
        coach_id: programData.coach_id,
        title: programData.title,
        description: programData.description,
        total_calories: programData.total_calories
      }])
      .select()
      .single();

    if (error) {
      console.error('Erreur création programme nutrition:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Erreur création programme nutrition:', error);
    return null;
  }
}

// Récupérer les programmes d'un coach
export async function getCoachNutritionPrograms(coachId: string): Promise<NutritionProgram[]> {
  try {
    const { data, error } = await supabase
      .from('nutrition_programs')
      .select(`
        *,
        meals (*)
      `)
      .eq('coach_id', coachId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur récupération programmes:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Erreur récupération programmes:', error);
    return [];
  }
}

// Ajouter un repas à un programme
export async function addMealToProgram(mealData: {
  program_id: string;
  day: string;
  meal_type: 'petit_dejeuner' | 'dejeuner' | 'collation' | 'diner';
  name: string;
  description: string;
  calories: number;
  ingredients: string[];
  preparation: string;
}): Promise<Meal | null> {
  try {
    const { data, error } = await supabase
      .from('meals')
      .insert([mealData])
      .select()
      .single();

    if (error) {
      console.error('Erreur ajout repas:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Erreur ajout repas:', error);
    return null;
  }
}

// Assigner un programme nutrition à un client
export async function assignNutritionProgram(assignmentData: {
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
        program_type: 'nutrition',
        status: 'active'
      }])
      .select()
      .single();

    if (error) {
      console.error('Erreur affectation programme:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Erreur affectation programme:', error);
    return null;
  }
}

// Récupérer les programmes assignés à un client
export async function getClientNutritionPrograms(clientId: string): Promise<NutritionProgram[]> {
  try {
    const { data, error } = await supabase
      .from('program_assignments')
      .select(`
        nutrition_programs (
          *,
          meals (*)
        )
      `)
      .eq('client_id', clientId)
      .eq('program_type', 'nutrition')
      .eq('status', 'active');

    if (error) {
      console.error('Erreur récupération programmes client:', error);
      return [];
    }

    return data?.map(assignment => assignment.nutrition_programs).filter(Boolean) || [];
  } catch (error) {
    console.error('Erreur récupération programmes client:', error);
    return [];
  }
}

// Supprimer un programme de nutrition
export async function deleteNutritionProgram(programId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('nutrition_programs')
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
