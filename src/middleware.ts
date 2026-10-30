import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware-client';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Refresh Supabase session cookies
  const { supabaseResponse, supabase, user } = await updateSession(request);

<<<<<<< HEAD
  // Only a role stored in the authenticated user's profile is authoritative.
=======
  // Determine configured admin email
  const envAdminEmail = (
    process.env.PUBLIC_ADMIN_EMAIL ||
    process.env.NEXT_PUBLIC_ADMIN_EMAIL ||
    process.env.ADMIN_EMAIL ||
    'admin@gmail.com'
  ).toLowerCase().trim();

  // Check fallback client cookie for demo/localStorage session sync
  const clientUserCookie = request.cookies.get('sp_portal_user_role')?.value;

  // 2. Fetch user profile role if authenticated
>>>>>>> 3c9b19b0adbaee55640a526c505ea6865898215f
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

  // Handle root /admin or /admin/ direct requests
  if (pathname === '/admin' || pathname === '/admin/') {
    const url = request.nextUrl.clone();
    url.pathname = userRole === 'admin' ? '/admin/dashboard' : '/admin/login';
    return NextResponse.redirect(url);
  }

  // 3. Admin Routes Protection (/admin/*)
  if (pathname.startsWith('/admin')) {
    // Allow public access to /admin/login
    if (pathname === '/admin/login') {
      if (userRole === 'admin') {
        const url = request.nextUrl.clone();
        url.pathname = '/admin/dashboard';
        return NextResponse.redirect(url);
      }
      return supabaseResponse;
    }

    // Require authentication for all other /admin routes
    if (!userRole) {
      const url = request.nextUrl.clone();
      url.pathname = '/admin/login';
      url.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(url);
    }

    // If role is student trying to access admin pages, redirect to student dashboard
    if (userRole === 'student') {
      const url = request.nextUrl.clone();
      url.pathname = '/student/dashboard';
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

  // 5. Generic /login redirect
  if (pathname === '/login') {
    if (userRole === 'admin') {
      const url = request.nextUrl.clone();
      url.pathname = '/admin/dashboard';
      return NextResponse.redirect(url);
    }
    if (userRole === 'student') {
      const url = request.nextUrl.clone();
      url.pathname = '/student/dashboard';
      return NextResponse.redirect(url);
    }
  }

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

