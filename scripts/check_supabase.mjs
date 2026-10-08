import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://puymklalgdnvkrqtlqsw.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_hD45TsOJI6XmfBGOyYGsuw_sSvjdtqW';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Testing connection to Supabase:', supabaseUrl);
  
  const { data: profiles, error: profErr } = await supabase.from('profiles').select('*').limit(5);
  console.log('profiles query:', { count: profiles?.length, profiles, profErr });

  const { data: users, error: userErr } = await supabase.from('users').select('*').limit(5);
  console.log('users query:', { count: users?.length, users, userErr });
}

run();
