import { createClient, SupabaseClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://puymklalgdnvkrqtlqsw.supabase.co';
const supabaseKey =
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  'sb_publishable_hD45TsOJI6XmfBGOyYGsuw_sSvjdtqW';

let cachedClient: SupabaseClient | null = null;

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function isUuid(str?: string | null): boolean {
  if (!str) return false;
  return UUID_REGEX.test(str);
}

/**
 * Returns whether a high-privilege Secret Key or Service Role Key is configured.
 */
export function hasSupabaseAdminKey(): boolean {
  return !!(process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY);
}

/**
 * Returns a server-side Supabase client.
 * Uses SUPABASE_SECRET_KEY / SUPABASE_SERVICE_ROLE_KEY when available to bypass RLS and use Admin Auth APIs.
 * Never exposed to client bundles.
 */
export function getSupabaseServerClient(): SupabaseClient {
  if (!cachedClient) {
    cachedClient = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return cachedClient;
}

export interface ProfileRecord {
  id: string;
  email: string;
  full_name: string;
  role: 'student' | 'teacher' | 'admin';
  course?: string | null;
  section?: string | null;
  semester?: number | null;
  student_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * Fetch a profile from public.profiles by email or auth id
 */
export async function getProfileFromSupabase(identifier: { email?: string; id?: string }): Promise<ProfileRecord | null> {
  const supabase = getSupabaseServerClient();
  try {
    let query = supabase.from('profiles').select('*');
    if (identifier.id && isUuid(identifier.id)) {
      query = query.eq('id', identifier.id);
    } else if (identifier.email) {
      query = query.eq('email', identifier.email.trim().toLowerCase());
    } else {
      return null;
    }

    const fetchPromise = query.maybeSingle();
    const timeoutPromise = new Promise<{ data: null; error: null }>((resolve) =>
      setTimeout(() => resolve({ data: null, error: null }), 1500)
    );

    const { data, error } = (await Promise.race([fetchPromise, timeoutPromise])) as any;
    if (error || !data) {
      return null;
    }

    return {
      id: data.id,
      email: data.email,
      full_name: data.full_name || '',
      role: (data.role || 'student').toLowerCase() as any,
      course: data.course || null,
      section: data.section || null,
      semester: data.semester ? Number(data.semester) : null,
      student_id: data.student_id || null,
    };
  } catch (err) {
    console.error('Failed to fetch profile from Supabase:', err);
    return null;
  }
}

/**
 * Upsert a profile into public.profiles
 */
export async function upsertProfileInSupabase(profile: {
  id: string;
  email: string;
  full_name: string;
  role: string;
  course?: string | null;
  section?: string | null;
  semester?: number | null;
  student_id?: string | null;
}): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseServerClient();
  try {
    const cleanRole = profile.role.trim().toLowerCase();
    let targetId = profile.id;

    if (!isUuid(targetId)) {
      // Find existing profile by email first
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', profile.email.trim().toLowerCase())
        .maybeSingle();

      if (existing?.id && isUuid(existing.id)) {
        targetId = existing.id;
      } else {
        targetId = crypto.randomUUID();
      }
    }

    const payload = {
      id: targetId,
      email: profile.email.trim().toLowerCase(),
      full_name: profile.full_name,
      role: cleanRole,
      course: profile.course || null,
      section: profile.section || null,
      semester: profile.semester ? Number(profile.semester) : null,
      student_id: profile.student_id || null,
    };

    const { error } = await supabase.from('profiles').upsert(payload, { onConflict: 'id' });
    if (error) {
      console.warn('Notice updating public.profiles in Supabase:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    console.error('Error upserting profile in Supabase:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Delete a profile from public.profiles
 */
export async function deleteProfileFromSupabase(id: string): Promise<boolean> {
  const supabase = getSupabaseServerClient();
  try {
    if (!isUuid(id)) {
      return true;
    }
    const { error } = await supabase.from('profiles').delete().eq('id', id);
    if (error) {
      console.warn('Notice deleting from public.profiles:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error deleting profile from Supabase:', err);
    return false;
  }
}
