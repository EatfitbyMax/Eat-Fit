
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
    console.log('Début inscription pour:', userData.email);
    
    // Vérifier le format de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      console.error('Format email invalide:', userData.email);
      throw new Error('Format d\'email invalide');
    }
    
    // Créer le compte utilisateur avec métadonnées et désactiver la confirmation d'email
    const { data, error } = await supabase.auth.signUp({
      email: userData.email.toLowerCase().trim(),
      password: userData.password,
      options: {
        data: {
          name: userData.name,
          user_type: userData.userType
        },
        emailRedirectTo: undefined // Désactiver la redirection email
      }
    });

    if (error) {
      console.error('Erreur inscription Supabase:', error.message);
      
      // Messages d'erreur plus clairs
      if (error.message.includes('Email address') && error.message.includes('invalid')) {
        throw new Error('Adresse email invalide. Veuillez utiliser un format valide comme exemple@domaine.com');
      } else if (error.message.includes('User already registered')) {
        throw new Error('Un compte existe déjà avec cette adresse email');
      } else if (error.message.includes('Password')) {
        throw new Error('Le mot de passe ne respecte pas les critères requis');
      } else {
        throw new Error('Erreur lors de la création du compte: ' + error.message);
      }
    }

    if (!data.user) {
      console.log('Aucun utilisateur créé');
      return null;
    }

    console.log('Utilisateur créé avec ID:', data.user.id);
    console.log('Statut email confirmé:', data.user.email_confirmed_at);

    // Si l'email n'est pas confirmé automatiquement, créer quand même le profil
    if (!data.user.email_confirmed_at) {
      console.log('Email non confirmé, mais création du profil...');
    }

    // Attendre un peu pour que le trigger se déclenche
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Vérifier si le profil a été créé automatiquement par le trigger
    let { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', data.user.id)
      .single();

    // Si pas de profil, le créer manuellement
    if (profileError || !profile) {
      console.log('Création manuelle du profil...');
      const { data: newProfile, error: createError } = await supabase
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

      if (createError) {
        console.error('Erreur création manuelle profil:', createError);
        
        // Essayer de récupérer à nouveau le profil au cas où il aurait été créé entre temps
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', data.user.id)
          .single();
          
        if (!existingProfile) {
          return null;
        }
        profile = existingProfile;
      } else {
        profile = newProfile;
      }
    }

    const user: User = {
      id: data.user.id,
      email: userData.email,
      name: userData.name,
      userType: userData.userType,
      createdAt: new Date().toISOString()
    };

    console.log('Inscription réussie pour:', userData.email, 'avec profil:', profile.user_type);
    console.log('Utilisateur visible dans auth.users:', data.user.id);
    
    return user;
  } catch (error) {
    console.error('Erreur inscription:', error);
    return null;
  }
}
