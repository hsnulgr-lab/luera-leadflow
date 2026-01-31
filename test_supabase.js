import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://supabasekong-s8gc44cg0s4scogoskogs4oc.lueratech.com';
const supabaseKey = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2OTExODE4MCwiZXhwIjo0OTI0NzkxNzgwLCJyb2xlIjoiYW5vbiJ9.puoy6ZxX7fqXuLWFHG9GyHnEGXeZ3cEFK_sgOn5ZQk8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('Testing connection to Supabase...');
  try {
    const { data, error } = await supabase.from('leads').select('count', { count: 'exact', head: true });
    if (error) {
      console.error('Connection failed:', error.message);
    } else {
      console.log('Connection successful! Check permissions if count is null:', data);
    }
    
    // Test Auth (optional, requires valid credentials to test fully but we can check if auth service responds)
    const { data: authData, error: authError } = await supabase.auth.getSession();
     if (authError) {
      console.error('Auth check failed:', authError.message);
    } else {
      console.log('Auth service reachable. Session:', authData.session ? 'Active' : 'None');
    }

  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

testConnection();
