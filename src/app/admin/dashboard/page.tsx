'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PortalNav } from '@/components/portal/portal-nav';
import { getCurrentPortalUser, getStoredAuditLogs } from '@/lib/supabase/mock-data';
import { fetchStudents } from '@/lib/supabase/student-service';
import { AuditLog, StudentRecord, UserProfile } from '@/lib/types/portal';
import {
  Award,
  Users,
  FileCheck,
  UserPlus,
  FileSpreadsheet,
  Edit,
  Trash2,
  Search,
  BarChart3,
  History,
  TrendingUp,
  Clock,
  Download,
  ShieldCheck,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    const currentUser = getCurrentPortalUser();
    if (!currentUser || currentUser.role !== 'admin') {
      router.push('/admin/login');
      return;
    }
    setUser(currentUser);

    fetchStudents().then(setStudents);
    setLogs(getStoredAuditLogs());
  }, [router]);

  const handleExportStudentsCSV = () => {
    if (students.length === 0) return;
    const headers = 'Roll No,Student Name,Father Name,Course,Session,Certificate URL\n';
    const rows = students
      .map(
        (s) =>
          `"${s.roll_no || s.student_id}","${s.student_name || s.name}","${s.father_name}","${s.course}","${s.session}","${s.certificate_url || s.pdf_url || ''}"`
      )
      .join('\n');

    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(headers + rows);
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', `students_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportLogsCSV = () => {
    if (logs.length === 0) return;
    const headers = 'Log ID,User Email,Action,Target Type,Target ID,Timestamp\n';
    const rows = logs
      .map(
        (l) =>
          `"${l.id}","${l.user_email || 'System'}","${l.action}","${l.target_type}","${l.target_id}","${l.created_at}"`
      )
      .join('\n');

    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(headers + rows);
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', `audit_logs_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!user) return null;

  const totalStudents = students.length;
  const totalCertificates = students.filter((s) => s.certificate_no || s.certificate_url).length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white pb-16">
      <PortalNav user={user} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              Authenticated Admin Portal
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-serif text-slate-900 dark:text-white">
              Admin Portal Overview
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage student records, issue verified certificates, bulk import CSVs, and view audit history.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleExportStudentsCSV}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 transition-colors shadow-sm"
            >
              <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Export Students CSV
            </button>

            <Link
              href="/admin/upload"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl shadow-md transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Add / Import Students
            </Link>
          </div>
        </div>

        {/* Analytics Counter Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Students</p>
              <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">{totalStudents}</h3>
              <p className="text-[11px] text-emerald-600 font-medium mt-1 inline-flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> Active Enrollment
              </p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Users className="w-7 h-7" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Certificates</p>
              <h3 className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">{totalCertificates}</h3>
              <p className="text-[11px] text-amber-600 font-medium mt-1 inline-flex items-center gap-1">
                <FileCheck className="w-3 h-3" /> Verified & Issued
              </p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Award className="w-7 h-7" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">System Audit Logs</p>
              <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">{logs.length}</h3>
              <button
                onClick={handleExportLogsCSV}
                className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium mt-1 inline-flex items-center gap-1 hover:underline"
              >
                <Download className="w-3 h-3" /> Export Logs CSV
              </button>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-purple-50 dark:bg-purple-950/50 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <History className="w-7 h-7" />
            </div>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Admin Quick Actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <Link
              href="/admin/upload?tab=single"
              className="flex flex-col items-center justify-center p-5 bg-white dark:bg-slate-900 hover:border-amber-500 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm transition-all text-center group"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-600 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
                <UserPlus className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">➕ Add Student</span>
            </Link>

            <Link
              href="/admin/upload"
              className="flex flex-col items-center justify-center p-5 bg-white dark:bg-slate-900 hover:border-blue-500 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm transition-all text-center group"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">📄 Upload / CSV</span>
            </Link>

            <Link
              href="/admin/students"
              className="flex flex-col items-center justify-center p-5 bg-white dark:bg-slate-900 hover:border-emerald-500 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm transition-all text-center group"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
                <Edit className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">✏ Edit Student</span>
            </Link>

            <Link
              href="/admin/students"
              className="flex flex-col items-center justify-center p-5 bg-white dark:bg-slate-900 hover:border-rose-500 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm transition-all text-center group"
            >
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/50 text-rose-600 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
                <Trash2 className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">🗑 Delete Student</span>
            </Link>

            <Link
              href="/admin/students"
              className="flex flex-col items-center justify-center p-5 bg-white dark:bg-slate-900 hover:border-indigo-500 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm transition-all text-center group"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
                <Search className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">🔍 Search Student</span>
            </Link>

            <Link
              href="/admin/settings/audit-logs"
              className="flex flex-col items-center justify-center p-5 bg-white dark:bg-slate-900 hover:border-purple-500 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm transition-all text-center group"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/50 text-purple-600 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
                <History className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">📋 Audit Logs</span>
            </Link>
          </div>
        </div>

        {/* Recently Added Students Table */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Recently Added Students</h2>
            <Link
              href="/admin/students"
              className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline"
            >
              View All Records →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="px-4 py-3 rounded-l-lg">Student ID</th>
                  <th className="px-4 py-3">Roll No</th>
                  <th className="px-4 py-3">Student Name</th>
                  <th className="px-4 py-3">Course</th>
                  <th className="px-4 py-3">Certificate No</th>
                  <th className="px-4 py-3 rounded-r-lg text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {students.slice(0, 5).map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-mono font-semibold text-slate-900 dark:text-slate-200">
                      {s.roll_no || s.student_id}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-400">{s.roll_no || s.roll_number || s.student_id}</td>
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{s.student_name || s.name}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{s.course}</td>
                    <td className="px-4 py-3 font-mono text-amber-600 dark:text-amber-400">{s.certificate_no}</td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/verify/${s.certificate_no}`}
                        className="inline-flex items-center gap-1 text-slate-600 hover:text-amber-600 font-medium"
                      >
                        View Cert
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
