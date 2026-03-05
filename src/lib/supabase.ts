import { createClient } from '@supabase/supabase-js';

const tenant = localStorage.getItem('tenant') || 'furkan';

let envSupabaseUrl = import.meta.env.VITE_SUPABASE_URL;
let supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (tenant === 'gokhan') {
    envSupabaseUrl = import.meta.env.VITE_GOKHAN_SUPABASE_URL;
    supabaseAnonKey = import.meta.env.VITE_GOKHAN_SUPABASE_ANON_KEY;
}

if (!envSupabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase credentials. Check .env.local file.');
}

// In development, use Vite proxy to bypass CORS only for the primary tenant.
// Secondary tenants use the direct URL.
const useProxy = import.meta.env.DEV && tenant !== 'gokhan';

const supabaseUrl = useProxy
    ? `${window.location.origin}/api/supabase`
    : envSupabaseUrl;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
