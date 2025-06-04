
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'VOTRE_SUPABASE_URL';
const supabaseKey = 'VOTRE_SUPABASE_ANON_KEY';

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
