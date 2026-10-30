import { createBrowserClient } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

function sanitizeUrl(url: string | undefined): string {
  if (!url) return '';
  return url.trim().replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
}

export function createClient() {
  const rawUrl = process.env.PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseUrl = sanitizeUrl(rawUrl);
<<<<<<< HEAD
  const supabaseKey = (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
=======
  const supabaseAnonKey = (
    process.env.PUBLIC_SUPABASE_ANON_KEY ||
>>>>>>> 3c9b19b0adbaee55640a526c505ea6865898215f
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    ''
  ).trim();

  if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder-project')) {
    return createBrowserClient(
      'https://placeholder-project.supabase.co',
      'placeholder-anon-key'
    );
  }

  return createBrowserClient(supabaseUrl, supabaseKey);
}

export function isSupabaseConfigured(): boolean {
  const rawUrl = process.env.PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseUrl = sanitizeUrl(rawUrl);
<<<<<<< HEAD
  const supabaseKey = (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
=======
  const supabaseAnonKey = (
    process.env.PUBLIC_SUPABASE_ANON_KEY ||
>>>>>>> 3c9b19b0adbaee55640a526c505ea6865898215f
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    ''
  ).trim();
  return Boolean(
    supabaseUrl &&
    supabaseKey &&
    !supabaseUrl.includes('placeholder-project') &&
    !supabaseKey.includes('placeholder-anon-key')
  );
}

export const supabase = createSupabaseClient(
<<<<<<< HEAD
  sanitizeUrl(process.env.NEXT_PUBLIC_SUPABASE_URL) || 'https://placeholder-project.supabase.co',
  (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
=======
  sanitizeUrl(process.env.PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL) ||
    'https://placeholder-project.supabase.co',
  (
    process.env.PUBLIC_SUPABASE_ANON_KEY ||
>>>>>>> 3c9b19b0adbaee55640a526c505ea6865898215f
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    'placeholder-anon-key'
  ).trim()
);
