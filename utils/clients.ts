
import { supabase, Profile, ProgramAssignment } from './supabase';

// Récupérer tous les clients d'un coach
export async function getCoachClients(coachId: string): Promise<Profile[]> {
  try {
    // Pour cet exemple, nous récupérons tous les profils clients
    // En production, vous devriez avoir une table de relations coach-client
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_type', 'client')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur récupération clients:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Erreur récupération clients:', error);
    return [];
  }
}

// Récupérer les programmes assignés à un client spécifique
export async function getClientAssignments(clientId: string): Promise<ProgramAssignment[]> {
  try {
    const { data, error } = await supabase
      .from('program_assignments')
      .select(`
        *,
        nutrition_programs (
          title,
          description,
          total_calories
        ),
        workout_programs (
          title,
          description,
          difficulty,
          duration_weeks
        )
      `)
      .eq('client_id', clientId)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur récupération affectations client:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Erreur récupération affectations client:', error);
    return [];
  }
}

// Rechercher des clients par nom ou email
export async function searchClients(query: string): Promise<Profile[]> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_type', 'client')
      .or(`name.ilike.%${query}%,user_id.in.(select id from auth.users where email ilike %${query}%)`);

    if (error) {
      console.error('Erreur recherche clients:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Erreur recherche clients:', error);
    return [];
  }
}

// Récupérer les statistiques d'un client
export async function getClientStats(clientId: string): Promise<{
  activeNutritionPrograms: number;
  activeWorkoutPrograms: number;
  totalAssignments: number;
} | null> {
  try {
    const { data, error } = await supabase
      .from('program_assignments')
      .select('program_type')
      .eq('client_id', clientId)
      .eq('status', 'active');

    if (error) {
      console.error('Erreur récupération stats client:', error);
      return null;
    }

    const stats = {
      activeNutritionPrograms: data?.filter(p => p.program_type === 'nutrition').length || 0,
      activeWorkoutPrograms: data?.filter(p => p.program_type === 'workout').length || 0,
      totalAssignments: data?.length || 0
    };

    return stats;
  } catch (error) {
    console.error('Erreur récupération stats client:', error);
    return null;
  }
}

// Désassigner un programme d'un client
export async function unassignProgram(assignmentId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('program_assignments')
      .update({ status: 'completed' })
      .eq('id', assignmentId);

    if (error) {
      console.error('Erreur désassignation programme:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erreur désassignation programme:', error);
    return false;
  }
}
