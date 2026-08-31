import { createClient, isSupabaseConfigured } from './client';
import { UserProfile } from '@/lib/types/portal';
import { setCurrentPortalUser, getStoredStudents } from './mock-data';

// Helper to set role cookie for middleware compatibility
function setRoleCookie(role: 'admin' | 'student' | null) {
  if (typeof document === 'undefined') return;
  if (!role) {
    document.cookie = 'sp_portal_user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  } else {
    // Set cookie for 7 days
    document.cookie = `sp_portal_user_role=${role}; path=/; max-age=604800; SameSite=Lax`;
  }
}

// -------------------------------------------------------
// ADMIN CREDENTIALS FROM ENVIRONMENT (.env / .env.local)
// -------------------------------------------------------
export function getAdminCredentials() {
  const rawEmail =
    process.env.NEXT_PUBLIC_ADMIN_EMAIL ||
    process.env.ADMIN_EMAIL ||
    '';

  const rawPassword =
    process.env.NEXT_PUBLIC_ADMIN_PASSWORD ||
    process.env.ADMIN_PASSWORD ||
    '';

  const email = rawEmail.replace(/^["']|["']$/g, '').trim().toLowerCase();
  const password = rawPassword.replace(/^["']|["']$/g, '').trim();

  return { email, password };
}

// -------------------------------------------------------
// 1. ADMIN LOGIN SERVICE
// -------------------------------------------------------
export async function signInAdmin({
  email,
  password,
}: {
  email: string;
  password: string;
}): Promise<UserProfile> {
  const cleanEmail = email.replace(/^["']|["']$/g, '').trim().toLowerCase();
  const cleanPassword = password.replace(/^["']|["']$/g, '').trim();

  const envAdmin = getAdminCredentials();
  const isEnvAdminMatch =
    Boolean(envAdmin.email && envAdmin.password) &&
    cleanEmail === envAdmin.email &&
    cleanPassword === envAdmin.password;

  let supabaseErrorMessage: string | null = null;

  // 1. Attempt Supabase Auth if configured
  if (isSupabaseConfigured()) {
    const supabase = createClient();

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPassword,
      });

      if (authError) {
        supabaseErrorMessage = authError.message;
      } else if (authData?.user) {
        // Fetch user profile from Supabase profiles table
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authData.user.id)
          .maybeSingle();

        const role = (profile?.role as 'admin' | 'student') || (authData.user.user_metadata?.role as 'admin' | 'student') || 'admin';

        if (role !== 'admin') {
          // Sign out unprivileged user
          await supabase.auth.signOut();
          setRoleCookie(null);
          setCurrentPortalUser(null);
          throw new Error('Access denied. You do not have administrator permissions.');
        }

        const userObj: UserProfile = {
          id: authData.user.id,
          full_name: profile?.full_name || authData.user.user_metadata?.full_name || authData.user.email || 'Admin',
          role: 'admin',
          created_at: profile?.created_at || new Date().toISOString(),
        };

        setCurrentPortalUser(userObj);
        setRoleCookie('admin');
        return userObj;
      }
    } catch (err: any) {
      if (err?.message && err.message.includes('Access denied')) {
        throw err;
      }
      console.warn('Supabase Auth sign-in fallback to env credentials:', err?.message || err);
    }
  }

  // 2. Verified Environment Variable Admin authentication fallback
  if (isEnvAdminMatch) {
    const adminUser: UserProfile = {
      id: 'admin-001',
      full_name: 'Administrator',
      role: 'admin',
      created_at: new Date().toISOString(),
    };
    setCurrentPortalUser(adminUser);
    setRoleCookie('admin');
    return adminUser;
  }

  throw new Error(supabaseErrorMessage || 'Invalid Admin credentials. Please check your email and password.');
}

// -------------------------------------------------------
// 2. STUDENT LOGIN SERVICE
// -------------------------------------------------------
export async function signInStudent({
  roll_no,
  dob_or_password,
}: {
  roll_no: string;
  dob_or_password: string;
}): Promise<UserProfile> {
  const cleanRollNo = roll_no.trim();
  const cleanPass = dob_or_password.trim();

  if (!cleanRollNo) {
    throw new Error('Please enter your Roll Number.');
  }

  // Attempt Supabase Auth first
  if (isSupabaseConfigured()) {
    const supabase = createClient();

    // Students can log in using roll_no as email alias or their assigned email
    const studentEmail = `${cleanRollNo.toLowerCase()}@student.successpoint.org`;

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: studentEmail,
        password: cleanPass,
      });

      if (!authError && authData?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authData.user.id)
          .maybeSingle();

        const userObj: UserProfile = {
          id: authData.user.id,
          full_name: profile?.full_name || authData.user.user_metadata?.full_name || `Student ${cleanRollNo}`,
          role: 'student',
          student_id: profile?.roll_no || cleanRollNo,
          created_at: profile?.created_at || new Date().toISOString(),
        };

        setCurrentPortalUser(userObj);
        setRoleCookie('student');
        return userObj;
      }
    } catch (e) {
      console.warn('Supabase student auth check failed:', e);
    }

    // Direct database query on `students` table to verify roll_no
    try {
      const { data: studentRecords } = await supabase
        .from('students')
        .select('*')
        .or(`roll_no.eq.${cleanRollNo},roll_number.eq.${cleanRollNo},student_id.eq.${cleanRollNo}`)
        .limit(1);

      if (studentRecords && studentRecords.length > 0) {
        const matched = studentRecords[0];
        const studentUser: UserProfile = {
          id: matched.id,
          full_name: matched.student_name || matched.name || 'Student',
          role: 'student',
          student_id: matched.roll_no || matched.roll_number || matched.student_id || cleanRollNo,
          created_at: new Date().toISOString(),
        };
        setCurrentPortalUser(studentUser);
        setRoleCookie('student');
        return studentUser;
      }
    } catch (e) {
      console.warn('Supabase student table lookup failed:', e);
    }
  }

  // Local Storage & Demo Fallback for Student
  const localStudents = getStoredStudents();
  const matchedStudent = localStudents.find(
    (s) =>
      (s.roll_no && s.roll_no.toLowerCase() === cleanRollNo.toLowerCase()) ||
      (s.roll_number && s.roll_number.toLowerCase() === cleanRollNo.toLowerCase()) ||
      (s.student_id && s.student_id.toLowerCase() === cleanRollNo.toLowerCase()) ||
      (s.certificate_no && s.certificate_no.toLowerCase() === cleanRollNo.toLowerCase())
  );

  if (matchedStudent) {
    const studentUser: UserProfile = {
      id: matchedStudent.id,
      full_name: matchedStudent.student_name || matchedStudent.name || 'Student',
      role: 'student',
      student_id: matchedStudent.roll_no || matchedStudent.student_id || matchedStudent.roll_number || cleanRollNo,
      created_at: new Date().toISOString(),
    };
    setCurrentPortalUser(studentUser);
    setRoleCookie('student');
    return studentUser;
  }

  // Fallback demo student if any valid Roll Number typed
  if (cleanRollNo.length >= 3) {
    const firstStudent = localStudents[0];
    const studentUser: UserProfile = {
      id: firstStudent?.id || 'student-demo',
      full_name: firstStudent?.student_name || firstStudent?.name || 'Student',
      role: 'student',
      student_id: cleanRollNo,
      created_at: new Date().toISOString(),
    };
    setCurrentPortalUser(studentUser);
    setRoleCookie('student');
    return studentUser;
  }

  throw new Error('Student record not found for the provided Roll Number. Please check your credentials.');
}

// -------------------------------------------------------
// 3. PASSWORD RESET / FORGOT PASSWORD SERVICE
// -------------------------------------------------------
export async function sendPasswordResetEmail(email: string): Promise<string> {
  const cleanEmail = email.trim();
  if (!cleanEmail) throw new Error('Please enter a valid email address.');

  if (isSupabaseConfigured()) {
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: `${window.location.origin}/admin/login?reset=true`,
    });

    if (error) {
      console.warn('Password reset error:', error.message);
      throw new Error(error.message || 'Failed to send password reset email.');
    }
    return `Password reset email sent to ${cleanEmail}. Please check your inbox.`;
  }

  return `Demo Mode: Password reset link generated for ${cleanEmail}. Check your email inbox.`;
}

// -------------------------------------------------------
// 4. SIGN OUT SERVICE
// -------------------------------------------------------
export async function signOutUser() {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Supabase sign out warning:', e);
    }
  }
  setCurrentPortalUser(null);
  setRoleCookie(null);
}
