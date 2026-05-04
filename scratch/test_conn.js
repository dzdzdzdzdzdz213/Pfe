const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_ANON_KEY);

async function testConnection() {
  console.log("Testing Supabase connection with URL:", process.env.REACT_APP_SUPABASE_URL);
  const { data, error } = await supabase.from('utilisateurs').select('email, role').limit(5);
  if (error) {
    console.error("❌ Connection failed:", error.message);
  } else {
    console.log("✅ Connection successful! Found users:", data);
  }
}

testConnection();
