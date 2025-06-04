
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
