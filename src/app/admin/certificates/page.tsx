'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PortalNav } from '@/components/portal/portal-nav';
import { getCurrentPortalUser } from '@/lib/supabase/mock-data';
import { fetchStudents } from '@/lib/supabase/student-service';
import { StudentRecord, UserProfile } from '@/lib/types/portal';
import { Award, CheckCircle2, Eye, Printer, Search, Download, ShieldCheck } from 'lucide-react';

export default function AdminCertificatesPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const currentUser = getCurrentPortalUser();
    if (!currentUser || currentUser.role !== 'admin') {
      router.push('/admin/login');
      return;
    }
    setUser(currentUser);
    fetchStudents().then(setStudents);
  }, [router]);

  const filtered = students.filter(
    (s) =>
      (s.certificate_no || '').toLowerCase().includes(query.toLowerCase()) ||
      (s.student_name || s.name || '').toLowerCase().includes(query.toLowerCase()) ||
      (s.course || '').toLowerCase().includes(query.toLowerCase()) ||
      (s.roll_no || s.student_id || s.roll_number || '').toLowerCase().includes(query.toLowerCase())
  );

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white pb-16">
      <PortalNav user={user} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-serif text-slate-900 dark:text-white">
              Issued Certificates Registry
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Overview of all active certificates, verification URLs, QR code links, and print commands.
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter by cert no, name..."
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Certificate Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((student) => (
            <div
              key={student.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col justify-between space-y-4 hover:border-amber-500/50 transition-all group"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2.5 py-1 rounded-md">
                    {student.certificate_no}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded">
                    <CheckCircle2 className="w-3 h-3" /> VERIFIED
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-amber-600 transition-colors">
                    {student.name}
                  </h3>
                  <p className="text-xs text-slate-500">Student ID: <span className="font-mono">{student.student_id}</span></p>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs space-y-1 text-slate-600 dark:text-slate-400">
                  <p><span className="font-semibold text-slate-500">Course:</span> {student.course}</p>
                  <p><span className="font-semibold text-slate-500">Session:</span> {student.session}</p>
                  <p><span className="font-semibold text-slate-500">Issue Date:</span> {student.issue_date}</p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <Link
                  href={`/verify/${student.certificate_no}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  View & Verify
                </Link>

                <Link
                  href={`/verify/${student.certificate_no}`}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-amber-600 hover:text-amber-700 text-xs font-semibold"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print PDF
                </Link>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
