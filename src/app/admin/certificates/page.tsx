'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PortalNav } from '@/components/portal/portal-nav';
import { getCurrentPortalUser } from '@/lib/supabase/mock-data';
import { fetchStudents, updateStudent } from '@/lib/supabase/student-service';
import { calculateGradeFromMarks } from '@/components/portal/certificate-card';
import { StudentRecord, UserProfile } from '@/lib/types/portal';
import {
  Award,
  CheckCircle2,
  Eye,
  Printer,
  Search,
  Download,
  ShieldCheck,
  Percent,
  Edit2,
  X,
  Check,
  Loader2,
} from 'lucide-react';

export default function AdminCertificatesPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [query, setQuery] = useState('');

  // Manual Edit Percentage & Grade Modal State
  const [editingStudent, setEditingStudent] = useState<StudentRecord | null>(null);
  const [marksInput, setMarksInput] = useState<string>('');
  const [gradeInput, setGradeInput] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string>('');

  useEffect(() => {
    const verifyAuth = () => {
      const currentUser = getCurrentPortalUser();
      if (!currentUser || currentUser.role !== 'admin') {
        window.location.replace('/admin/login');
        return false;
      }
      setUser(currentUser);
      return true;
    };

    if (verifyAuth()) {
      fetchStudents().then(setStudents);
    }

    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        verifyAuth();
      }
    };
    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  };

  const openEditModal = (student: StudentRecord) => {
    const initialMarks = student.marks || '85%';
    const initialGrade = student.grade || calculateGradeFromMarks(initialMarks);
    setEditingStudent(student);
    setMarksInput(initialMarks);
    setGradeInput(initialGrade);
  };

  const handleSavePercentage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    let cleanMarks = marksInput.trim();
    if (!cleanMarks) cleanMarks = '85%';
    if (/^\d+(\.\d+)?$/.test(cleanMarks)) {
      cleanMarks = `${cleanMarks}%`;
    }
    const cleanGrade = gradeInput.trim() || calculateGradeFromMarks(cleanMarks);

    setIsSaving(true);
    try {
      const updated = await updateStudent(editingStudent.id, {
        ...editingStudent,
        marks: cleanMarks,
        grade: cleanGrade,
      });

      if (updated) {
        setStudents((prev) =>
          prev.map((s) => (s.id === updated.id ? { ...s, marks: cleanMarks, grade: cleanGrade } : s))
        );
      } else {
        setStudents((prev) =>
          prev.map((s) => (s.id === editingStudent.id ? { ...s, marks: cleanMarks, grade: cleanGrade } : s))
        );
      }

      showToast(`Updated ${editingStudent.student_name || editingStudent.name}: ${cleanMarks} (${cleanGrade})`);
      setEditingStudent(null);
    } catch (err: any) {
      console.error('Failed to update student percentage/grade:', err);
      showToast(err?.message || 'Failed to update record.');
    } finally {
      setIsSaving(false);
    }
  };

  const filtered = students.filter(
    (s) =>
      (s.certificate_no || '').toLowerCase().includes(query.toLowerCase()) ||
      (s.student_name || s.name || '').toLowerCase().includes(query.toLowerCase()) ||
      (s.course || '').toLowerCase().includes(query.toLowerCase()) ||
      (s.roll_no || s.student_id || s.roll_number || '').toLowerCase().includes(query.toLowerCase())
  );

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400 font-medium">Opening Certificates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white pb-16">
      <PortalNav user={user} />

      {/* Success Toast */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMsg}</span>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-serif text-slate-900 dark:text-white">
              Issued Certificates Registry
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Overview of all active certificates, student percentages, grades, verification URLs, and print options.
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
                    {student.name || student.student_name}
                  </h3>
                  <p className="text-xs text-slate-500">Student ID: <span className="font-mono">{student.student_id || student.roll_no}</span></p>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs space-y-1.5 text-slate-600 dark:text-slate-400">
                  <p><span className="font-semibold text-slate-500">Course:</span> {student.course}</p>
                  <p><span className="font-semibold text-slate-500">Session:</span> {student.session}</p>
                  
                  {/* Interactive Percentage & Grade Line */}
                  <div
                    onClick={() => openEditModal(student)}
                    className="flex items-center justify-between p-1.5 bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/50 rounded-lg cursor-pointer hover:border-amber-400 transition-colors group/item"
                    title="Click to manually edit student percentage and grade"
                  >
                    <div>
                      <span className="font-semibold text-slate-500">Percentage: </span>
                      <span className="font-mono font-bold text-blue-700 dark:text-blue-300">
                        {student.marks || '85%'}
                      </span>
                      <span className="ml-1 text-slate-600 dark:text-slate-400 font-bold">
                        ({student.grade || 'A'})
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 group-hover/item:underline">
                      <Edit2 className="w-3 h-3" /> Edit
                    </span>
                  </div>

                  <p><span className="font-semibold text-slate-500">Issue Date:</span> {student.issue_date}</p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => openEditModal(student)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 dark:text-amber-300 text-xs font-semibold rounded-lg transition-colors border border-amber-200 dark:border-amber-800"
                  title="Edit percentage and grade manually"
                >
                  <Percent className="w-3.5 h-3.5" />
                  Edit % & Grade
                </button>

                <div className="flex items-center gap-2">
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
            </div>
          ))}
        </div>
      </main>

      {/* Manual Percentage & Grade Edit Modal */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 max-w-md w-full rounded-2xl p-6 shadow-2xl space-y-4 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Percent className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Edit Percentage & Grade
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {editingStudent.student_name || editingStudent.name} ({editingStudent.roll_no || editingStudent.roll_number})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingStudent(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePercentage} className="space-y-4 text-xs">
              {/* Percentage Input */}
              <div className="space-y-1.5">
                <label className="block text-slate-700 dark:text-slate-300 font-semibold flex items-center justify-between">
                  <span>Student Percentage Obtained:</span>
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-mono font-medium">e.g. 85% or 92.5%</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={marksInput}
                    onChange={(e) => {
                      const val = e.target.value;
                      setMarksInput(val);
                      setGradeInput(calculateGradeFromMarks(val));
                    }}
                    placeholder="e.g. 85%"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono font-bold text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    autoFocus
                  />
                  <Percent className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
                </div>

                {/* Quick Percentage Presets */}
                <div className="pt-1">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1">
                    Quick Percentage Presets:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {['65%', '72%', '78%', '82%', '85%', '88%', '90%', '94%', '98%'].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => {
                          setMarksInput(pct);
                          setGradeInput(calculateGradeFromMarks(pct));
                        }}
                        className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                          marksInput.trim() === pct
                            ? 'bg-amber-600 text-white font-bold'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        {pct}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Grade Input */}
              <div className="space-y-1.5">
                <label className="block text-slate-700 dark:text-slate-300 font-semibold flex items-center justify-between">
                  <span>Grade Obtained:</span>
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">Auto-calculated or custom</span>
                </label>
                <input
                  type="text"
                  required
                  value={gradeInput}
                  onChange={(e) => setGradeInput(e.target.value)}
                  placeholder="e.g. A"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-bold text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />

                {/* Standard Grades */}
                <div className="pt-1">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1">
                    Standard Grades:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {['A+', 'A', 'B', 'C', 'D', 'Exemplary', 'Outstanding'].map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setGradeInput(g)}
                        className={`px-2.5 py-0.5 rounded text-[11px] font-bold transition-colors ${
                          gradeInput.trim() === g
                            ? 'bg-blue-600 text-white font-bold'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg shadow-sm disabled:opacity-50 transition-colors"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
