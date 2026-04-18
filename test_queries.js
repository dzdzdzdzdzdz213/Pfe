const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://oevnivlaynqjoxqzaqwy.supabase.co';
const supabaseKey = 'sb_publishable_adYq_WdQxqdyoq9MpT8wMA_RXQt1fIh';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase.from('audit_logs').select('*, utilisateur:utilisateurs!utilisateur_id(nom, prenom, email, role)').limit(1);
  console.log('audit:', error ? error.message : 'OK');
}
run();
