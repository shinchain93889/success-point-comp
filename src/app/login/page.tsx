'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getCurrentPortalUser } from '@/lib/supabase/mock-data';
import { ShieldCheck, UserCheck, Award, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    const user = getCurrentPortalUser();
    if (user) {
      if (user.role === 'admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/student/dashboard');
      }
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-xl relative z-10 text-center space-y-4 px-4">
        <Link href="/" className="inline-flex items-center gap-3 group">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-600 to-blue-600 flex items-center justify-center text-white font-extrabold text-2xl shadow-xl shadow-amber-600/20 group-hover:scale-105 transition-transform">
            SP
          </div>
        </Link>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-serif">
          Success Point Certificate Portal
        </h1>
        <p className="text-sm text-slate-400 max-w-md mx-auto">
          Select your destination portal below to sign in or verify certificate credentials.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl relative z-10 px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Admin Login Card */}
          <Link
            href="/admin/login"
            className="bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/50 p-6 rounded-3xl shadow-xl space-y-4 transition-all group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white font-serif group-hover:text-amber-400 transition-colors">
                  Admin Login
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  For administrators and staff to add, edit, upload, and manage student certificates.
                </p>
              </div>
            </div>
            <div className="pt-2 flex items-center justify-between text-xs font-semibold text-amber-400">
              <span>Go to Admin Login</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Student Login Card */}
          <Link
            href="/student/login"
            className="bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-blue-500/50 p-6 rounded-3xl shadow-xl space-y-4 transition-all group flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white font-serif group-hover:text-blue-400 transition-colors">
                  Student Login
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  For enrolled students to access credentials, view profile, and download certificates.
                </p>
              </div>
            </div>
            <div className="pt-2 flex items-center justify-between text-xs font-semibold text-blue-400">
              <span>Go to Student Login</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/verify"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-amber-400 transition-colors"
          >
            <Award className="w-4 h-4" />
            <span>Public Certificate Verification Portal →</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
