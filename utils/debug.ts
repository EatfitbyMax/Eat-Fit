
import { supabase } from './supabase';

export async function debugSupabaseConfig() {
  console.log('=== DIAGNOSTIC SUPABASE ===');
  
  try {
    // Tester la connexion
    const { data: testData, error: testError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('❌ Erreur connexion Supabase:', testError);
      return;
    }
    
    console.log('✅ Connexion Supabase OK');
    
    // Vérifier les utilisateurs dans auth.users (nécessite des permissions admin)
    const { data: session } = await supabase.auth.getSession();
    console.log('Session actuelle:', session?.user?.email || 'Aucune');
    
    // Compter les profils
    const { count: profileCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });
    
    console.log('Nombre de profils:', profileCount);
    
    // Lister les profils existants
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, name, user_type, created_at')
      .order('created_at', { ascending: false })
      .limit(5);
    
    console.log('Derniers profils créés:', profiles);
    
  } catch (error) {
    console.error('❌ Erreur diagnostic:', error);
  }
}

export async function testUserCreation() {
  console.log('=== TEST CRÉATION UTILISATEUR ===');
  
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'motdepasse123';
  
  try {
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          name: 'Test User',
          user_type: 'client'
        }
      }
    });
    
    if (error) {
      console.error('❌ Erreur test création:', error);
      return;
    }
    
    console.log('✅ Test création réussi');
    console.log('User ID:', data.user?.id);
    console.log('Email confirmé:', data.user?.email_confirmed_at ? 'Oui' : 'Non');
    
    // Vérifier si le profil est créé
    setTimeout(async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', data.user!.id)
        .single();
      
      console.log('Profil créé:', profile ? 'Oui' : 'Non');
      if (profile) {
        console.log('Données profil:', profile);
      }
    }, 3000);
    
  } catch (error) {
    console.error('❌ Erreur test création:', error)or);
  }
}

export async function testUserCreation() {
  console.log('=== TEST CRÉATION UTILISATEUR ===');
  
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'motdepasse123';
  
  try {
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          name: 'Test User',
          user_type: 'client'
        }
      }
    });
    
    if (error) {
      console.error('❌ Erreur test création:', error);
      return;
    }
    
    console.log('✅ Test création réussi');
    console.log('User ID:', data.user?.id);
    console.log('Email confirmé:', data.user?.email_confirmed_at ? 'Oui' : 'Non');
    
    // Vérifier si le profil est créé
    setTimeout(async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', data.user!.id)
        .single();
      
      console.log('Profil créé:', profile ? 'Oui' : 'Non');
      if (profile) {
        console.log('Données profil:', profile);
      }
    }, 3000);
    
  } catch (error) {
    console.error('❌ Erreur test:', error);
  }
}
