import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://puymklalgdnvkrqtlqsw.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_hD45TsOJI6XmfBGOyYGsuw_sSvjdtqW';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAuthProfiles() {
  const email = 'test_1791382632570@gmail.com';
  const password = 'Password@123';

  console.log('Signing in...');
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  console.log('Sign in result:', { userId: authData?.user?.id, authErr });

  if (authData?.user) {
    console.log('Testing insert into profiles with authenticated user...');
    const { data: insData, error: insErr } = await supabase.from('profiles').insert({
      id: authData.user.id,
      email,
      full_name: 'Test Student',
      role: 'student',
      course: 'Computer Science & Engineering',
      section: 'CSE-A',
      semester: 6,
      student_id: '24BCSE101'
    }).select();

    console.log('Insert result:', { insData, insErr });

    const { data: myProfile, error: getErr } = await supabase.from('profiles').select('*').eq('id', authData.user.id);
    console.log('My profile:', { myProfile, getErr });
  }
}

testAuthProfiles();
