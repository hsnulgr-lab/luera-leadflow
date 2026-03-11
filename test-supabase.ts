import { supabase } from './src/lib/supabase';
async function test() {
  const { data, error } = await supabase.from('whatsapp_sent_log').select('*').limit(1);
  console.log("Data:", data, "Error:", error);
}
test();
