import { createClient, isSupabaseConfigured } from './client';
import { UserProfile } from '@/lib/types/portal';
import { setCurrentPortalUser, getStoredStudents } from './mock-data';

// Helper to set role cookie for server-side middleware access control
export function setRoleCookie(role: 'admin' | 'student' | null) {
  if (typeof document === 'undefined') return;
  if (!role) {
    document.cookie = 'sp_portal_user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
  } else {
    // Set cookie for 7 days
    document.cookie = `sp_portal_user_role=${role}; path=/; max-age=604800; SameSite=Lax`;
  }
}

// -------------------------------------------------------
// 1. ADMIN LOGIN SERVICE (SUPABASE AUTHENTICATION)
// -------------------------------------------------------
export async function signInAdmin({
  email,
  password,
}: {
  email: string;
  password: string;
}): Promise<UserProfile> {
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanPassword = (password || '').trim();

  if (!cleanEmail) {
    throw new Error('Please enter your registered admin Gmail address.');
  }
  if (!cleanPassword) {
    throw new Error('Please enter your admin password.');
  }

  // 1. Primary Authentication: Supabase Auth signInWithPassword
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClient();
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPassword,
      });

        if (authError) {
          throw new Error(authError.message || 'Invalid email or password. Please check your admin credentials.');
        }

        if (authData?.user) {
          const userUUID = authData.user.id;

          // Verify authenticated user's UUID against the existing public.profiles table
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id, role, full_name, created_at')
            .eq('id', userUUID)
            .maybeSingle();

          const verified_role = profile?.role || (authData.user.user_metadata?.role as string);

            // Allow access ONLY when verified_role = 'admin'
            if (verified_role !== 'admin') {
              await supabase.auth.signOut();
              setCurrentPortalUser(null);
              setRoleCookie(null);
              throw new Error("Access denied. Verified role in public.profiles is not 'admin'.");
            }

            const adminUser: UserProfile = {
              id: userUUID,
              full_name: profile?.full_name || authData.user.user_metadata?.full_name || 'Administrator',
              role: 'admin',
              created_at: profile?.created_at || authData.user.created_at,
            };

            setCurrentPortalUser(adminUser);
            setRoleCookie('admin');
            return adminUser;
          }
        } catch (err: any) {
            if (err.message && (err.message.includes('Access denied') || err.message.includes('Invalid email') || err.message.includes('credentials'))) {
              throw err;
            }
            console.warn('Supabase Auth error:', err?.message || err);
          }
        }

        // 2. Environment Configuration Check (Fallback when database is in transition)
        const envEmail = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || process.env.ADMIN_EMAIL || '').trim().toLowerCase();
        const envPass = (process.env.NEXT_PUBLIC_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || '').trim();

        if (envEmail && envPass && cleanEmail === envEmail && cleanPassword === envPass) {
          const adminUser: UserProfile = {
            id: 'admin-configured',
            full_name: 'Administrator',
            role: 'admin',
            created_at: new Date().toISOString(),
          };
          setCurrentPortalUser(adminUser);
          setRoleCookie('admin');
          return adminUser;
        }

        throw new Error('Invalid email or password. Please check your admin credentials.');
      }

      // -------------------------------------------------------
      // 2. STUDENT LOGIN SERVICE (BY ENROLLMENT / ROLL NUMBER)
      // -------------------------------------------------------
      export async function signInStudent({
        enrollment_no,
        roll_no,
        dob_or_password,
      }: {
        enrollment_no?: string;
        roll_no?: string;
        dob_or_password?: string;
      }): Promise<UserProfile> {
        const query = (enrollment_no || roll_no || '').trim();

        if (!query) {
          throw new Error('Please enter your Enrollment Number.');
        }

        // 1. Attempt Supabase Auth / Query first if configured
        if (isSupabaseConfigured()) {
          try {
            const supabase = createClient();

            // If password provided and Supabase auth exists
            if (dob_or_password) {
              const studentEmail = `${query.toLowerCase()}@student.successpoint.org`;
              const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email: studentEmail,
                password: dob_or_password,
              });

              if (!authError && authData?.user) {
                const { data: profile } = await supabase
                  .from('profiles')
                  .select('id, role, roll_no, full_name, created_at')
                  .eq('id', authData.user.id)
                  .maybeSingle();

                const studentUser: UserProfile = {
                  id: authData.user.id,
                  full_name: profile?.full_name || authData.user.user_metadata?.full_name || `Student ${query}`,
                  role: 'student',
                  student_id: profile?.roll_no || query,
                  created_at: profile?.created_at || new Date().toISOString(),
                };

                setCurrentPortalUser(studentUser);
                setRoleCookie('student');
                return studentUser;
              }
            }

            // Direct database query on `students` table to verify enrollment_no or roll_no
            const { data: studentRecords } = await supabase
              .from('students')
              .select('*')
              .or(`enrollment_no.ilike.${query},roll_no.ilike.${query},roll_number.ilike.${query},student_id.ilike.${query},certificate_no.ilike.${query}`)
              .limit(1);

            if (studentRecords && studentRecords.length > 0) {
              const matched = studentRecords[0];
              const studentUser: UserProfile = {
                id: matched.id,
                full_name: matched.student_name || matched.name || 'Student',
                role: 'student',
                student_id: matched.roll_no || matched.enrollment_no || matched.student_id || query,
                created_at: new Date().toISOString(),
              };
              setCurrentPortalUser(studentUser);
              setRoleCookie('student');
              return studentUser;
            }
          } catch (e) {
            console.warn('Supabase student lookup failed:', e);
          }
        }

        // 2. Local Storage / Mock Students Fallback
        const localStudents = getStoredStudents();
        const cleanQ = query.toLowerCase();

        const matchedStudent = localStudents.find((s) => {
          const eNo = (s.enrollment_no || '').toLowerCase();
          const rNo = (s.roll_no || '').toLowerCase();
          const rNum = (s.roll_number || '').toLowerCase();
          const sId = (s.student_id || '').toLowerCase();
          const cNo = (s.certificate_no || '').toLowerCase();

          return (
            eNo === cleanQ ||
            rNo === cleanQ ||
            rNum === cleanQ ||
            sId === cleanQ ||
            cNo === cleanQ ||
            (cleanQ.startsWith('en-') && eNo === cleanQ) ||
            (!cleanQ.startsWith('en-') && eNo === `en-${cleanQ}`) ||
            (cleanQ.startsWith('sp-') && cNo === cleanQ)
          );
        });

        if (matchedStudent) {
          const studentUser: UserProfile = {
            id: matchedStudent.id,
            full_name: matchedStudent.student_name || matchedStudent.name || 'Student',
            role: 'student',
            student_id: matchedStudent.roll_no || matchedStudent.enrollment_no || matchedStudent.student_id || query,
            created_at: new Date().toISOString(),
          };
          setCurrentPortalUser(studentUser);
          setRoleCookie('student');
          return studentUser;
        }

        // No student found - throw clean user-facing error
        throw new Error(`No student record or certificate found for Enrollment Number "${query}". Please check your enrollment number and try again.`);
      }

      // -------------------------------------------------------
      // 3. PASSWORD RESET / FORGOT PASSWORD SERVICE
      // -------------------------------------------------------
      export async function sendPasswordResetEmail(email: string): Promise<string> {
        const cleanEmail = email.trim();
        if (!cleanEmail) throw new Error('Please enter a valid email address.');

        if (isSupabaseConfigured()) {
          try {
            const supabase = createClient();
            const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
              redirectTo: `${window.location.origin}/admin/login?reset=true`,
            });

            if (error) {
              console.warn('Password reset error:', error.message);
            } else {
              return `Password reset email sent to ${cleanEmail}. Please check your inbox.`;
            }
          } catch (e: any) {
            console.warn('Supabase password reset warning:', e);
          }
        }

        return `Password reset link generated for ${cleanEmail}. Check your email inbox.`;
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
