'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signInStudent } from '@/lib/supabase/auth-service';
import { getCurrentPortalUser } from '@/lib/supabase/mock-data';
import { Award, UserCheck, Calendar, Lock, ArrowRight, ShieldAlert, CheckCircle2, ShieldCheck, Mail } from 'lucide-react';

export default function StudentLoginPage() {
  const router = useRouter();
  const [rollNo, setRollNo] = useState('');
  const [dobOrPassword, setDobOrPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // If logged in as student, redirect to student dashboard
    const user = getCurrentPortalUser();
    if (user) {
      if (user.role === 'student') {
        router.push('/student/dashboard');
      } else if (user.role === 'admin') {
        router.push('/admin/dashboard');
      }
    }
  }, [router]);

  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await signInStudent({ roll_no: rollNo, dob_or_password: dobOrPassword });
      router.push('/student/dashboard');
    } catch (err: any) {
      console.warn('Student login failed:', err?.message || err);
      setError(err?.message || 'Invalid Roll Number or Date of Birth/Password.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center space-y-3">
        <Link href="/" className="inline-flex items-center gap-3 group">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-amber-500 flex items-center justify-center text-white font-extrabold text-2xl shadow-lg shadow-blue-600/30 group-hover:scale-105 transition-transform">
            SP
          </div>
        </Link>
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-xs font-semibold text-blue-400">
          <UserCheck className="w-4 h-4" />
          Student Portal Login
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight text-white font-serif">
          Student Credential Access
        </h2>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          Log in with your assigned Roll Number and Date of Birth to view and download your official certificate.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        <div className="bg-slate-900/90 backdrop-blur-2xl py-8 px-6 shadow-2xl rounded-3xl border border-slate-800 sm:px-10 space-y-6">
          {error && (
            <div className="flex items-center gap-2.5 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs text-rose-300">
              <ShieldAlert className="w-5 h-5 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleStudentLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Roll Number / Student ID *
              </label>
              <div className="relative rounded-2xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <UserCheck className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={rollNo}
                  onChange={(e) => setRollNo(e.target.value)}
                  placeholder="e.g. 10101 or SP2024001"
                  className="block w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-slate-800 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Date of Birth (YYYY-MM-DD) or Password *
              </label>
              <div className="relative rounded-2xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Calendar className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={dobOrPassword}
                  onChange={(e) => setDobOrPassword(e.target.value)}
                  placeholder="e.g. 2000-01-15 or password"
                  className="block w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-slate-800 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-amber-600 hover:from-blue-500 hover:to-amber-500 active:scale-[0.99] disabled:opacity-50 transition-all shadow-lg shadow-blue-600/20"
            >
              {isLoading ? (
                <span>Fetching Student Dashboard...</span>
              ) : (
                <>
                  <span>Sign In to Student Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
          {/* Links to Admin Login and Public Verification */}
          <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
            <Link
              href="/admin/login"
              className="hover:text-amber-400 transition-colors inline-flex items-center gap-1"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin Portal Login →</span>
            </Link>

            <Link
              href="/verify"
              className="hover:text-amber-400 transition-colors inline-flex items-center gap-1"
            >
              <Award className="w-3.5 h-3.5" />
              <span>Verify Certificate</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
