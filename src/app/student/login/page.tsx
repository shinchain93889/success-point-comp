'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { signInStudent } from '@/lib/supabase/auth-service';
import { getCurrentPortalUser } from '@/lib/supabase/mock-data';
import { Award, UserCheck, ArrowRight, ShieldAlert, ShieldCheck, FileCheck2, Search } from 'lucide-react';

export default function StudentLoginPage() {
  const router = useRouter();
  const [enrollmentNo, setEnrollmentNo] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // If already logged in as student, redirect to certificate
    const user = getCurrentPortalUser();
    if (user && user.role === 'student') {
      window.location.href = '/student/certificate';
    }
  }, []);

  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanInput = enrollmentNo.trim();
    if (!cleanInput) {
      setError('Please enter your Enrollment Number.');
      return;
    }

    setIsLoading(true);

    try {
      await signInStudent({ enrollment_no: cleanInput });
      window.location.href = '/student/certificate';
    } catch (err: any) {
      console.warn('Student certificate lookup failed:', err?.message || err);
      setError(
        err?.message ||
          `No student certificate found for Enrollment Number "${cleanInput}". Please check the number and try again.`
      );
      setIsLoading(false);
    }
  };

  const handleQuickFill = (no: string) => {
    setEnrollmentNo(no);
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center space-y-3">
        <Link href="/" className="inline-flex items-center gap-3 group">
          <Image src="/img/logosp.jpeg" alt="Success Point Logo" width={48} height={48} className="w-12 h-12 rounded-2xl object-cover shadow-lg shadow-blue-600/30 group-hover:scale-105 transition-transform" />
        </Link>
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-xs font-semibold text-blue-400">
          <Award className="w-4 h-4" />
          Student Certificate Portal
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight text-white font-serif">
          Generate Student Certificate
        </h2>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          Enter your official Enrollment Number to search, access, and generate your verified certificate.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        <div className="bg-slate-900/90 backdrop-blur-2xl py-8 px-6 shadow-2xl rounded-3xl border border-slate-800 sm:px-10 space-y-6">
          {error && (
            <div className="flex items-start gap-2.5 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs text-rose-300">
              <ShieldAlert className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleStudentLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Enrollment Number *
              </label>
              <div className="relative rounded-2xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Search className="w-4 h-4 text-amber-500" />
                </div>
                <input
                  type="text"
                  required
                  value={enrollmentNo}
                  onChange={(e) => {
                    setEnrollmentNo(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="e.g. EN-320 or 10101"
                  autoFocus
                  className="block w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-slate-800 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                Enter the Enrollment Number or Roll Number from your registration or admission receipt.
              </p>
            </div>

            {/* Quick Helper Samples */}
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1.5">
              <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
                <FileCheck2 className="w-3.5 h-3.5 text-emerald-400" />
                Quick demo enrollment numbers:
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {['EN-320', '320', 'EN-10101', '10101', 'EN-10102'].map((no) => (
                  <button
                    key={no}
                    type="button"
                    onClick={() => handleQuickFill(no)}
                    className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-md bg-slate-800 hover:bg-amber-500/20 hover:text-amber-300 text-slate-300 border border-slate-700 transition-colors"
                  >
                    {no}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-amber-600 hover:from-blue-500 hover:to-amber-500 active:scale-[0.99] disabled:opacity-50 transition-all shadow-lg shadow-blue-600/20 cursor-pointer"
            >
              {isLoading ? (
                <span>Generating Certificate...</span>
              ) : (
                <>
                  <Award className="w-4 h-4" />
                  <span>Generate Certificate</span>
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
              <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
              <span>Admin Login (Email & Password) →</span>
            </Link>

            <Link
              href="/verify"
              className="hover:text-amber-400 transition-colors inline-flex items-center gap-1"
            >
              <Award className="w-3.5 h-3.5 text-blue-400" />
              <span>Public Verification</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
