
import { supabase } from './supabase';

export interface User {
  id: string;
  email: string;
  name: string;
  userType: 'client' | 'coach';
  createdAt: string;
}

export async function initializeAdminAccount(): Promise<void> {
  // Avec Supabase, pas besoin d'initialiser des comptes par défaut
  // Vous pouvez créer des comptes directement dans le dashboard Supabase
  console.log('Supabase prêt');
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      console.log('Aucun utilisateur connecté');
      return null;
    }

    // Récupérer le profil utilisateur
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', session.user.id)
      .single();

    if (error || !profile) {
      console.error('Erreur récupération profil:', error);
      return null;
    }

    const user: User = {
      id: profile.user_id,
      email: session.user.email || '',
      name: profile.name,
      userType: profile.user_type,
      createdAt: profile.created_at
    };

    console.log('Utilisateur connecté trouvé:', user.email);
    return user;
  } catch (error) {
    console.error('Erreur récupération utilisateur:', error);
    return null;
  }
}

export async function login(email: string, password: string): Promise<User | null> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.log('Erreur connexion:', error.message);
      return null;
    }

    if (!data.user) {
      console.log('Aucun utilisateur retourné');
      return null;
    }

    // Récupérer le profil
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', data.user.id)
      .single();

    if (profileError || !profile) {
      console.error('Erreur récupération profil:', profileError);
      return null;
    }

    const user: User = {
      id: profile.user_id,
      email: data.user.email || '',
      name: profile.name,
      userType: profile.user_type,
      createdAt: profile.created_at
    };

    console.log('Connexion réussie pour:', user.email);
    return user;
  } catch (error) {
    console.error('Erreur connexion:', error);
    return null;
  }
}

export async function logout(): Promise<void> {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Erreur déconnexion:', error);
    } else {
      console.log('Déconnexion réussie');
    }
  } catch (error) {
    console.error('Erreur déconnexion:', error);
  }
}

export async function register(userData: {
  email: string;
  password: string;
  name: string;
  userType: 'client' | 'coach';
}): Promise<User | null> {
  try {
    // Créer le compte utilisateur
    const { data, error } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password
    });

    if (error) {
      console.log('Erreur inscription:', error.message);
      return null;
    }

    if (!data.user) {
      console.log('Aucun utilisateur créé');
      return null;
    }

    // Créer le profil
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert([
        {
          user_id: data.user.id,
          name: userData.name,
          user_type: userData.userType
        }
      ])
      .select()
      .single();

    if (profileError) {
      console.error('Erreur création profil:', profileError);
      return null;
    }

    const user: User = {
      id: data.user.id,
      email: userData.email,
      name: userData.name,
      userType: userData.userType,
      createdAt: new Date().toISOString()
    };

    console.log('Inscription réussie pour:', userData.email);
    return user;
  } catch (error) {
    console.error('Erreur inscription:', error);
    return null;
  }
}
