import { createClient } from '@supabase/supabase-js';

const envSupabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!envSupabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase credentials. Check .env.local file.');
}

// Development'ta CORS sorununu önlemek için Vite proxy kullan
const supabaseUrl = import.meta.env.DEV
    ? `${window.location.origin}/api/supabase`
    : envSupabaseUrl;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
