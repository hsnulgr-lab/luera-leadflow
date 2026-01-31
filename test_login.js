import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://supabasekong-s8gc44cg0s4scogoskogs4oc.lueratech.com';
const supabaseKey = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2OTExODE4MCwiZXhwIjo0OTI0NzkxNzgwLCJyb2xlIjoiYW5vbiJ9.puoy6ZxX7fqXuLWFHG9GyHnEGXeZ3cEFK_sgOn5ZQk8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testLogin() {
  console.log('Attempting login for furkan@lueratech.com...');
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'furkan@lueratech.com',
    password: 'Luera123456'
  });

  if (error) {
    console.error('Login Failed:', error.message);
    if(error.message.includes('Email not confirmed')) {
        console.log('ACTION: User needs to confirm email.');
    }
  } else {
    console.log('Login Successful! User ID:', data.user.id);
  }
}

testLogin();
