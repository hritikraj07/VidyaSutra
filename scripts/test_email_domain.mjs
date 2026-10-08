import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://puymklalgdnvkrqtlqsw.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_hD45TsOJI6XmfBGOyYGsuw_sSvjdtqW';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testEmails() {
  const list = [
    'admin@vidyasutra.edu.in',
    'student@vidyasutra.edu.in',
    'teacher@vidyasutra.edu.in',
    'admin@test.com',
    'admin@gmail.com'
  ];

  for (const email of list) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: 'wrongpassword'
    });
    console.log(`signIn with ${email}:`, error?.message || 'success');
  }
}

testEmails();
