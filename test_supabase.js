import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://supabasekong.vps.lueratech.com';
const supabaseKey = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc3NjY0OTA4MCwiZXhwIjo0OTMyMzIyNjgwLCJyb2xlIjoiYW5vbiJ9.CImzgPRU5KgBRk8Ov1ktg-XCucVWS89th1kg_-B3pno';

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
    
    // Test Auth Sign Up to see exact error
    console.log('Testing User Sign Up...');
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: 'test_lueratech@example.com',
      password: 'password12345',
    });
    
    if (signUpError) {
      console.error('Sign Up Error Details:', JSON.stringify(signUpError, null, 2));
    } else {
      console.log('Sign Up successful:', signUpData);
    }

  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

testConnection();
