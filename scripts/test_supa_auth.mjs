import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://puymklalgdnvkrqtlqsw.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_hD45TsOJI6XmfBGOyYGsuw_sSvjdtqW';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAuth() {
  const emails = [
    `test_${Date.now()}@gmail.com`,
    `test_${Date.now()}@example.com`,
  ];

  for (const email of emails) {
    console.log('Testing signUp with:', email);
    const { data, error } = await supabase.auth.signUp({
      email,
      password: 'Password@123',
    });
    console.log('Result for', email, ':', { id: data?.user?.id, error });
  }
}

testAuth();
