'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PortalNav } from '@/components/portal/portal-nav';
import { getCurrentPortalUser } from '@/lib/supabase/mock-data';
import { fetchStudents } from '@/lib/supabase/student-service';
import { StudentRecord, UserProfile } from '@/lib/types/portal';
import { Award, CheckCircle2, Download, Eye, ShieldCheck, User, Search, Phone, Calendar, BookOpen } from 'lucide-react';

export default function StudentDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [student, setStudent] = useState<StudentRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = getCurrentPortalUser();
    if (!currentUser) {
      router.push('/student/login');
      return;
    }
    setUser(currentUser);

    fetchStudents().then((students) => {
      const targetRoll = currentUser.student_id?.toLowerCase() || '';
      const targetId = currentUser.id;

      const matched = students.find(
        (s) =>
          s.id === targetId ||
          (s.roll_no && s.roll_no.toLowerCase() === targetRoll) ||
          (s.student_id && s.student_id.toLowerCase() === targetRoll) ||
          (s.roll_number && s.roll_number.toLowerCase() === targetRoll)
      ) || (currentUser.role === 'admin' ? students[0] : null);

      setStudent(matched || null);
      setLoading(false);
    });
  }, [router]);

  if (loading || !user || !student) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <p className="text-sm text-slate-400">Loading student dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white pb-12">
      <PortalNav user={user} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Welcome Card */}
        <div className="bg-gradient-to-r from-amber-600 to-amber-700 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur rounded-full text-xs font-semibold uppercase tracking-wider text-amber-100">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Verified Student Account
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight font-serif">
              Welcome, {student.name}!
            </h1>
            <p className="text-amber-100 text-sm max-w-xl">
              Access and manage your official course completion certificate, verify credentials, or update profile details.
            </p>
          </div>
          <Award className="absolute -right-6 -bottom-6 w-56 h-56 text-white/10 pointer-events-none" />
        </div>

        {/* Student Details Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-md border border-slate-200 dark:border-slate-800 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <User className="w-5 h-5 text-amber-600" />
              Student Profile Credentials
            </h2>
            <span className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded text-slate-600 dark:text-slate-300">
              ID: {student.student_id}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Student Name</p>
              <p className="text-base font-semibold text-slate-900 dark:text-white">{student.name}</p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Father Name</p>
              <p className="text-base font-semibold text-slate-900 dark:text-white">{student.father_name}</p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Mobile Number</p>
              <p className="text-base font-mono font-semibold text-slate-900 dark:text-white">{student.mobile_no || student.phone || 'Not provided'}</p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Course Status</p>
              <div className="flex items-center gap-2 pt-0.5">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                    student.course_status === 'completed'
                      ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                      : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800 animate-pulse'
                  }`}
                >
                  {student.course_status === 'completed' ? '✅ Completed' : '⏳ Pending Completion'}
                </span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Course Name</p>
              <p className="text-base font-semibold text-amber-600 dark:text-amber-400">{student.course}</p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Academic Session</p>
              <p className="text-base font-semibold text-slate-900 dark:text-white">{student.session}</p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Course Starting Date</p>
              <p className="text-base font-mono font-semibold text-slate-900 dark:text-white">{student.start_date || 'Not specified'}</p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Course Ending Date</p>
              <p className="text-base font-mono font-semibold text-slate-900 dark:text-white">{student.end_date || 'Not specified'}</p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Certificate Number</p>
              <p className="text-base font-mono font-bold text-slate-800 dark:text-slate-200">{student.certificate_no}</p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Issue Date</p>
              <p className="text-base font-semibold text-slate-900 dark:text-white">{student.issue_date}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            href="/student/certificate"
            className="flex flex-col items-center justify-center p-6 bg-white dark:bg-slate-900 hover:bg-amber-50 dark:hover:bg-amber-950/20 border border-slate-200 dark:border-slate-800 hover:border-amber-400 rounded-2xl shadow-sm transition-all text-center group"
          >
            <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-3 group-hover:scale-110 transition-transform">
              <Eye className="w-6 h-6" />
            </div>
            <span className="font-bold text-slate-900 dark:text-white group-hover:text-amber-600">
              👁 View Certificate
            </span>
            <span className="text-xs text-slate-500 mt-1">Full certificate preview & seal</span>
          </Link>

          {student.course_status === 'completed' ? (
            <Link
              href="/student/certificate"
              className="flex flex-col items-center justify-center p-6 bg-white dark:bg-slate-900 hover:bg-blue-50 dark:hover:bg-blue-950/20 border border-slate-200 dark:border-slate-800 hover:border-blue-400 rounded-2xl shadow-sm transition-all text-center group"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-3 group-hover:scale-110 transition-transform">
                <Download className="w-6 h-6" />
              </div>
              <span className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600">
                ⬇ Download Certificate
              </span>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                Verified & Ready for PDF Download
              </span>
            </Link>
          ) : (
            <div
              className="flex flex-col items-center justify-center p-6 bg-slate-100/70 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800/80 rounded-2xl opacity-85 text-center cursor-not-allowed select-none"
              title="Course Status is Pending. Certificate download will unlock once course completion is marked by admin."
            >
              <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-3">
                <Download className="w-6 h-6 opacity-60" />
              </div>
              <span className="font-bold text-slate-500 dark:text-slate-400">
                🔒 Download Certificate
              </span>
              <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold mt-1">
                Locked: Course Status Pending
              </span>
            </div>
          )}

          <Link
            href={`/verify/${student.certificate_no}`}
            className="flex flex-col items-center justify-center p-6 bg-white dark:bg-slate-900 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 border border-slate-200 dark:border-slate-800 hover:border-emerald-400 rounded-2xl shadow-sm transition-all text-center group"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-3 group-hover:scale-110 transition-transform">
              <Search className="w-6 h-6" />
            </div>
            <span className="font-bold text-slate-900 dark:text-white group-hover:text-emerald-600">
              🔍 Verify Certificate
            </span>
            <span className="text-xs text-slate-500 mt-1">Public verification URL</span>
          </Link>
        </div>
      </main>
    </div>
  );
}
