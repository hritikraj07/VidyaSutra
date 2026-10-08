import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://puymklalgdnvkrqtlqsw.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_hD45TsOJI6XmfBGOyYGsuw_sSvjdtqW';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testProfiles() {
  const testId = '00000000-0000-0000-0000-000000000001';
  console.log('Testing insert into profiles...');
  const { data: insData, error: insErr } = await supabase.from('profiles').insert({
    id: testId,
    email: 'admin@vidyasutra.edu.in',
    full_name: 'Institutional Administrator',
    role: 'admin',
  }).select();

  console.log('Insert result:', { insData, insErr });

  const { data: selData, error: selErr } = await supabase.from('profiles').select('*');
  console.log('Select result:', { selData, selErr });

  if (!insErr) {
    const { error: delErr } = await supabase.from('profiles').delete().eq('id', testId);
    console.log('Delete result:', { delErr });
  }
}

testProfiles();
