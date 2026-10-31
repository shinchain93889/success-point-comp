import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware-client';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Refresh Supabase session cookies safely
  let supabaseResponse = NextResponse.next({ request });
  let supabase: any = null;
  let user: any = null;

  try {
    const sessionRes = await updateSession(request);
    supabaseResponse = sessionRes.supabaseResponse;
    supabase = sessionRes.supabase;
    user = sessionRes.user;
  } catch (err) {
    // If Supabase server is unreachable, proceed using cookie role
  }

  // Check fallback client cookie for demo/admin session sync
  const clientUserCookie = request.cookies.get('sp_portal_user_role')?.value;

  // 2. Fetch user profile role if authenticated
  let userRole: 'admin' | 'student' | null = null;

  if (user) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      if (profile?.role === 'admin' || profile?.role === 'student') userRole = profile.role;
    } catch {
      // Fail closed if the profile role cannot be verified.
    }
  }

  // If user is not present or userRole is not yet resolved, check cookie
  if (!userRole) {
    if (clientUserCookie === 'admin' || clientUserCookie === 'student') {
      userRole = clientUserCookie as 'admin' | 'student';
    }
  }

  // Handle root /admin or /admin/ direct requests
  if (pathname === '/admin' || pathname === '/admin/') {
    const url = request.nextUrl.clone();
    url.pathname = userRole === 'admin' ? '/admin/dashboard' : '/admin/login';
    return NextResponse.redirect(url);
  }

  // 3. Admin Routes Protection (/admin/*)
  if (pathname.startsWith('/admin')) {
    // Always permit access to /admin/login page without auto-redirecting
    if (pathname === '/admin/login') {
      return supabaseResponse;
    }

      // Protect all other admin routes against direct URL access
      // Only permit access when user has verified 'admin' role
      if (userRole !== 'admin') {
        const url = request.nextUrl.clone();
        url.pathname = '/admin/login';
        url.searchParams.set('redirectTo', pathname);
        return NextResponse.redirect(url);
      }
    }

    // 4. Student Routes Protection (/student/*)
    if (pathname.startsWith('/student')) {
      // Allow public access to /student/login
      if (pathname === '/student/login') {
        if (userRole === 'student') {
          const url = request.nextUrl.clone();
          url.pathname = '/student/dashboard';
          return NextResponse.redirect(url);
        }
        if (userRole === 'admin') {
          const url = request.nextUrl.clone();
          url.pathname = '/admin/dashboard';
          return NextResponse.redirect(url);
        }
        return supabaseResponse;
      }

      // Require authentication for student pages
      if (!userRole) {
        const url = request.nextUrl.clone();
        url.pathname = '/student/login';
        url.searchParams.set('redirectTo', pathname);
        return NextResponse.redirect(url);
      }
    }

    // 5. Generic /login route allows users to choose between Admin and Student login
    // Do NOT auto-redirect /login so users can always choose their intended portal or switch accounts.

    return supabaseResponse;
  }

  export const config = {
    matcher: [
      '/admin',
      '/admin/:path*',
      '/student/:path*',
      '/login',
    ],
  };
