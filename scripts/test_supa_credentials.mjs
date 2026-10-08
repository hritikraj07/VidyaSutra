import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://puymklalgdnvkrqtlqsw.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_hD45TsOJI6XmfBGOyYGsuw_sSvjdtqW';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSeededAuth() {
  const accounts = [
    { email: 'admin@vidyasutra.edu.in', passwords: ['Admin@123', 'Password@123', 'admin', 'admin123'] },
    { email: 'teacher@vidyasutra.edu.in', passwords: ['Teacher@123', 'Password@123', 'teacher', 'teacher123'] },
    { email: 'student@vidyasutra.edu.in', passwords: ['Student@123', 'Password@123', 'student', 'student123'] },
  ];

  for (const acc of accounts) {
    for (const pw of acc.passwords) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: acc.email,
        password: pw,
      });
      if (data?.user) {
        console.log(`SUCCESS! ${acc.email} signed in with ${pw}! User ID: ${data.user.id}`);
        break;
      } else {
        if (!error.message.includes('Invalid login credentials')) {
          console.log(`${acc.email} with ${pw}: ${error.message}`);
          break;
        }
      }
    }
  }
}

checkSeededAuth();
