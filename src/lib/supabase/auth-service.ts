import { createClient, isSupabaseConfigured } from './client';
import { UserProfile } from '@/lib/types/portal';
import { setCurrentPortalUser } from './mock-data';

function requireSupabaseAuth() {
  if (!isSupabaseConfigured()) {
    throw new Error('Sign-in is unavailable because authentication is not configured.');
  }
  return createClient();
}

<<<<<<< HEAD
function getAuthFailureMessage(error: { message?: string; name?: string }, portal: 'admin' | 'student') {
  const message = error.message || '';
  if (/failed to fetch|fetch failed|network|timeout/i.test(message) || error.name === 'TypeError') {
    return 'Cannot reach Supabase Auth. Check NEXT_PUBLIC_SUPABASE_URL and try again.';
  }
  if (/invalid login credentials/i.test(message)) {
    return portal === 'admin'
      ? 'Invalid email or password. Sign in with an admin account created in Supabase Auth; the old local demo credentials are no longer accepted.'
      : 'Invalid roll number or password. Check that your student account is created in Supabase Auth.';
  }
  return message || `Could not sign in to the ${portal} portal.`;
=======
// -------------------------------------------------------
// ADMIN CREDENTIALS FROM ENVIRONMENT (.env / .env.local)
// -------------------------------------------------------
export function getAdminCredentials() {
  const rawEmail =
    process.env.PUBLIC_ADMIN_EMAIL ||
    process.env.NEXT_PUBLIC_ADMIN_EMAIL ||
    process.env.ADMIN_EMAIL ||
    'admin@gmail.com';

  const rawPassword =
    process.env.PUBLIC_ADMIN_PASSWORD ||
    process.env.NEXT_PUBLIC_ADMIN_PASSWORD ||
    process.env.ADMIN_PASSWORD ||
    'admin';

  const email = rawEmail.replace(/^["']|["']$/g, '').trim().toLowerCase();
  const password = rawPassword.replace(/^["']|["']$/g, '').trim();

  return { email, password };
>>>>>>> 3c9b19b0adbaee55640a526c505ea6865898215f
}

export async function signInAdmin({ email, password }: { email: string; password: string }): Promise<UserProfile> {
  const supabase = requireSupabaseAuth();
  const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
  if (error) throw new Error(getAuthFailureMessage(error, 'admin'));
  if (!data.user) throw new Error('Supabase Auth did not return an administrator account.');

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, role, full_name, created_at')
    .eq('id', data.user.id)
    .maybeSingle();

  if (profileError || !profile || profile.role !== 'admin') {
    await supabase.auth.signOut();
    setCurrentPortalUser(null);
    throw new Error('Access denied. This account is not an administrator.');
  }

  const admin: UserProfile = {
    id: data.user.id,
    full_name: profile.full_name || data.user.email || 'Admin',
    role: 'admin',
    created_at: profile.created_at || new Date().toISOString(),
  };
  setCurrentPortalUser(admin);
  return admin;
}

export async function signInStudent({ roll_no, dob_or_password }: { roll_no: string; dob_or_password: string }): Promise<UserProfile> {
  const rollNo = roll_no.trim();
  if (!rollNo) throw new Error('Please enter your Roll Number.');

  const supabase = requireSupabaseAuth();
  const email = `${rollNo.toLowerCase()}@student.successpoint.org`;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password: dob_or_password });
  if (error) throw new Error(getAuthFailureMessage(error, 'student'));
  if (!data.user) throw new Error('Supabase Auth did not return a student account.');

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, role, roll_no, full_name, created_at')
    .eq('id', data.user.id)
    .maybeSingle();

  if (profileError || !profile || profile.role !== 'student' || profile.roll_no?.toLowerCase() !== rollNo.toLowerCase()) {
    await supabase.auth.signOut();
    setCurrentPortalUser(null);
    throw new Error('Access denied. This account is not linked to that student roll number.');
  }

  const student: UserProfile = {
    id: data.user.id,
    full_name: profile.full_name || data.user.user_metadata?.full_name || `Student ${rollNo}`,
    role: 'student',
    student_id: profile.roll_no,
    created_at: profile.created_at || new Date().toISOString(),
  };
  setCurrentPortalUser(student);
  return student;
}

export async function sendPasswordResetEmail(email: string): Promise<string> {
  const cleanEmail = email.trim();
  if (!cleanEmail) throw new Error('Please enter a valid email address.');
  const supabase = requireSupabaseAuth();
  const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
    redirectTo: `${window.location.origin}/admin/login?reset=true`,
  });
  if (error) throw new Error(error.message || 'Failed to send password reset email.');
  return `Password reset email sent to ${cleanEmail}. Please check your inbox.`;
}

export async function signOutUser() {
  if (isSupabaseConfigured()) {
    try {
      await createClient().auth.signOut();
    } catch (error) {
      console.warn('Supabase sign out warning:', error);
    }
  }
  setCurrentPortalUser(null);
}
