'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { getCurrentPortalUser } from '@/lib/supabase/mock-data';
import { signOutUser, signInStudent } from '@/lib/supabase/auth-service';
import { UserProfile } from '@/lib/types/portal';
import {
  ShieldCheck,
  Award,
  ArrowRight,
  Lock,
  Search,
  LogOut,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [quickEnrollment, setQuickEnrollment] = useState('');
  const [studentError, setStudentError] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    setCurrentUser(getCurrentPortalUser());
  }, []);

  const handleQuickStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setStudentError('');

    const cleanInput = quickEnrollment.trim();
    if (!cleanInput) {
      setStudentError('Please enter your Enrollment Number.');
      return;
    }

    setIsGenerating(true);

    try {
      await signInStudent({ enrollment_no: cleanInput });
      window.location.href = '/student/certificate';
    } catch (err: any) {
      setStudentError(
        err?.message ||
        `No student record found for Enrollment Number "${cleanInput}". Please try again or open Student Portal.`
      );
      setIsGenerating(false);
    }
  };

  const handleLogout = async () => {
    await signOutUser();
    setCurrentUser(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header section */}
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl relative z-10 text-center space-y-4 px-4">
        <Link href="/" className="inline-flex items-center gap-3 group">
          <Image src="/img/logosp.jpeg" alt="Success Point Logo" width={56} height={56} className="w-14 h-14 rounded-2xl object-cover shadow-xl shadow-amber-600/20 group-hover:scale-105 transition-transform" />
        </Link>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-serif">
          Success Point Institute Portals
        </h1>
        <p className="text-sm text-slate-400 max-w-lg mx-auto">
          Please select your portal. Institute administrators sign in with credentials, and students generate certificates by Enrollment Number.
        </p>

        {/* Active Session Notification if logged in */}
        {currentUser && (
          <div className="p-3.5 bg-slate-900/90 border border-amber-500/30 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs max-w-lg mx-auto shadow-md">
            <div className="flex items-center gap-2 text-left">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>
                Active Session:{' '}
                <strong className="text-amber-400">{currentUser.full_name}</strong> (
                {currentUser.role === 'admin' ? 'Administrator' : 'Student'})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleLogout}
                className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-medium transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Portal Selection Cards */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-3xl relative z-10 px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Admin Portal Login */}
          <div className="bg-slate-900/90 border border-slate-800 hover:border-amber-500/50 p-6 sm:p-7 rounded-3xl shadow-xl space-y-5 transition-all flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  Restricted
                </span>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white font-serif group-hover:text-amber-400 transition-colors">
                  Admin Portal Login
                </h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Only authorized institute administrators can access this portal using their registered email and password.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
                <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Secure Supabase Authentication</span>
                </div>
                <p className="text-slate-400">Sign in with your registered institute administrator Gmail and password.</p>
              </div>
            </div>

            <Link
              href="/admin/login"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 transition-all shadow-md group-hover:shadow-amber-500/20"
            >
              <span>Sign In as Admin</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Card 2: Student Certificate Portal */}
          <div className="bg-slate-900/90 border border-slate-800 hover:border-blue-500/50 p-6 sm:p-7 rounded-3xl shadow-xl space-y-5 transition-all flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Award className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/30">
                  Student
                </span>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white font-serif group-hover:text-blue-400 transition-colors">
                  Student Certificate Portal
                </h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Students can generate and view their official verified certificate simply by entering their Enrollment Number. No password required.
                </p>
              </div>

              {/* Inline Quick Certificate Search Form */}
              <form onSubmit={handleQuickStudentLogin} className="space-y-2">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Search className="w-3.5 h-3.5 text-blue-400" />
                  </div>
                  <input
                    type="text"
                    value={quickEnrollment}
                    onChange={(e) => {
                      setQuickEnrollment(e.target.value);
                      if (studentError) setStudentError('');
                    }}
                    placeholder="Enter Enrollment No (e.g. EN-320)"
                    className="block w-full pl-9 pr-3 py-2 text-xs bg-slate-950/90 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono"
                  />
                </div>
                {studentError && (
                  <p className="text-[11px] text-rose-400 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{studentError}</span>
                  </p>
                )}
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>{isGenerating ? 'Generating...' : 'Quick Generate Certificate'}</span>
                </button>
              </form>
            </div>

            <Link
              href="/student/login"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all shadow-md group-hover:border-blue-500/50"
            >
              <span>Go to Student Portal</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Public Certificate Verification Link */}
        <div className="mt-8 text-center">
          <Link
            href="/verify"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-amber-400 transition-colors"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Public Certificate Verification Portal →</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
