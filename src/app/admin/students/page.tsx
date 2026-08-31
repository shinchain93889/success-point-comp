'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PortalNav } from '@/components/portal/portal-nav';
import { getCurrentPortalUser } from '@/lib/supabase/mock-data';
import {
  fetchStudents,
  createStudent,
  updateStudent,
  deleteStudent,
} from '@/lib/supabase/student-service';
import { StudentRecord, UserProfile } from '@/lib/types/portal';
import {
  Search,
  Filter,
  UserPlus,
  Edit,
  Trash2,
  Eye,
  X,
  CheckCircle2,
  FileText,
  Upload,
  ExternalLink,
  Download,
  Loader2,
} from 'lucide-react';

export default function AdminStudentsPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('ALL');
  const [selectedSession, setSelectedSession] = useState('ALL');

  // File Upload State
  const [addCertFile, setAddCertFile] = useState<File | null>(null);
  const [editCertFile, setEditCertFile] = useState<File | null>(null);

  // Edit Modal State
  const [editingStudent, setEditingStudent] = useState<StudentRecord | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Add Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newStudent, setNewStudent] = useState({
    roll_no: '',
    student_name: '',
    father_name: '',
    course: 'Diploma in Computer Application (DCA)',
    session: '2023-2024',
    start_date: '',
    end_date: '',
    mobile_no: '',
    course_status: 'pending' as 'pending' | 'completed',
    certificate_url: '',
  });

  const [notification, setNotification] = useState('');

  useEffect(() => {
    const currentUser = getCurrentPortalUser();
    if (!currentUser || currentUser.role !== 'admin') {
      router.push('/admin/login');
      return;
    }
    setUser(currentUser);
    refreshStudents();
  }, [router]);

  const refreshStudents = async () => {
    setIsLoading(true);
    try {
      const data = await fetchStudents();
      setStudents(data);
    } catch (e) {
      console.error('Failed to load students:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 4000);
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete student record for ${name}?`)) {
      setIsLoading(true);
      try {
        const deleted = await deleteStudent(id);
        if (deleted) {
          showToast(`Deleted student record for ${name}`);
        } else {
          showToast(`Could not delete student record for ${name}. Check Supabase connection or permissions.`);
        }
      } catch (err: any) {
        console.error('Delete error:', err);
        showToast('Error deleting student record. Please try again.');
      } finally {
        await refreshStudents();
      }
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudent.roll_no || !newStudent.student_name) return;

    setIsSubmitting(true);
    try {
      await createStudent(newStudent, addCertFile);
      await refreshStudents();
      setShowAddModal(false);
      showToast(`Successfully added student ${newStudent.student_name}`);
      setNewStudent({
        roll_no: '',
        student_name: '',
        father_name: '',
        course: 'Diploma in Computer Application (DCA)',
        session: '2023-2024',
        start_date: '',
        end_date: '',
        mobile_no: '',
        course_status: 'pending',
        certificate_url: '',
      });
      setAddCertFile(null);
    } catch (err: any) {
      console.error('Error adding student:', err);
      showToast(err?.message || 'Failed to add student. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (student: StudentRecord, newStatus: 'pending' | 'completed') => {
    try {
      const rollNo = student.roll_no || student.roll_number || student.student_id || '';
      const name = student.student_name || student.name || 'Student';
      await updateStudent(student.id, {
        ...student,
        roll_no: rollNo,
        student_name: name,
        course_status: newStatus,
      });
      await refreshStudents();
      showToast(`Course status for ${name} set to ${newStatus.toUpperCase()} in Supabase!`);
    } catch (err: any) {
      console.error('Error updating status:', err);
      showToast(`Failed to update status in Supabase: ${err?.message || 'Check database permissions.'}`);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    setIsSubmitting(true);
    try {
      await updateStudent(editingStudent.id, editingStudent, editCertFile);
      await refreshStudents();
      setShowEditModal(false);
      setEditingStudent(null);
      setEditCertFile(null);
      showToast(`Updated student record for ${editingStudent.student_name || editingStudent.name} in Supabase!`);
    } catch (err: any) {
      console.error('Error updating student:', err);
      showToast(`Failed to update student in Supabase: ${err?.message || 'Check database permissions.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter & Search logic
  const filteredStudents = students.filter((s) => {
    const q = searchQuery.toLowerCase();
    const name = (s.student_name || s.name || '').toLowerCase();
    const rollNo = (s.roll_no || s.roll_number || s.student_id || '').toLowerCase();

    const matchesQuery = !q || name.includes(q) || rollNo.includes(q);
    const matchesCourse = selectedCourse === 'ALL' || s.course === selectedCourse;
    const matchesSession = selectedSession === 'ALL' || s.session === selectedSession;

    return matchesQuery && matchesCourse && matchesSession;
  });

  const courses = Array.from(new Set(students.map((s) => s.course).filter(Boolean)));
  const sessions = Array.from(new Set(students.map((s) => s.session).filter(Boolean)));

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white pb-16">
      <PortalNav user={user} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-serif text-slate-900 dark:text-white">
              Student Records & Certificate Management
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Add new student details, edit records, delete students, and upload certificate PDFs/images to Supabase storage.
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-xl shadow-md transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Add New Student
          </button>
        </div>

        {notification && (
          <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold rounded-xl">
            <CheckCircle2 className="w-4 h-4" />
            <span>{notification}</span>
          </div>
        )}

        {/* Search & Filter Toolbar */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Name or Roll No..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <Filter className="w-4 h-4" />
              <span>Filters:</span>
            </div>

            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none"
            >
              <option value="ALL">All Courses</option>
              {courses.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <select
              value={selectedSession}
              onChange={(e) => setSelectedSession(e.target.value)}
              className="py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none"
            >
              <option value="ALL">All Sessions</option>
              {sessions.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Student Table */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-semibold uppercase border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3.5">Roll No</th>
                  <th className="px-4 py-3.5">Student Name</th>
                  <th className="px-4 py-3.5">Father Name</th>
                  <th className="px-4 py-3.5">Mobile No</th>
                  <th className="px-4 py-3.5">Course</th>
                  <th className="px-4 py-3.5">Session</th>
                  <th className="px-4 py-3.5">Start Date</th>
                  <th className="px-4 py-3.5">End Date</th>
                  <th className="px-4 py-3.5">Course Status</th>
                  <th className="px-4 py-3.5">Certificate URL / File</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {isLoading ? (
                  <tr>
                    <td colSpan={11} className="text-center py-12 text-slate-400">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin text-amber-600" />
                        <span>Loading student records...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => {
                    const certUrl = student.certificate_url || student.pdf_url;
                    const status = student.course_status === 'completed' ? 'completed' : 'pending';
                    return (
                      <tr key={student.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="px-4 py-3.5 font-mono font-semibold text-slate-900 dark:text-slate-200">
                          {student.roll_no || student.roll_number || student.student_id}
                        </td>
                        <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-white">
                          {student.student_name || student.name}
                        </td>
                        <td className="px-4 py-3.5 text-slate-600 dark:text-slate-400">
                          {student.father_name}
                        </td>
                        <td className="px-4 py-3.5 font-mono text-slate-600 dark:text-slate-300">
                          {student.mobile_no || student.phone || '-'}
                        </td>
                        <td className="px-4 py-3.5 text-amber-600 dark:text-amber-400 font-medium">
                          {student.course}
                        </td>
                        <td className="px-4 py-3.5 text-slate-600 dark:text-slate-400">
                          {student.session}
                        </td>
                        <td className="px-4 py-3.5 font-mono text-slate-600 dark:text-slate-300">
                          {student.start_date || '-'}
                        </td>
                        <td className="px-4 py-3.5 font-mono text-slate-600 dark:text-slate-300">
                          {student.end_date || '-'}
                        </td>
                        <td className="px-4 py-3.5">
                          <select
                            value={status}
                            onChange={(e) => handleStatusChange(student, e.target.value as 'pending' | 'completed')}
                            className={`px-2.5 py-1 text-xs font-bold rounded-lg border cursor-pointer focus:outline-none transition-colors ${
                              status === 'completed'
                                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800'
                                : 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-800'
                            }`}
                          >
                            <option value="pending">⏳ Pending</option>
                            <option value="completed">✅ Completed</option>
                          </select>
                        </td>
                        <td className="px-4 py-3.5">
                          {certUrl ? (
                            <a
                              href={certUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 text-blue-600 dark:text-blue-400 hover:underline font-mono text-[11px]"
                            >
                              <FileText className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate max-w-[150px]">Certificate Link</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-slate-400 italic">No File Uploaded</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-right space-x-2">
                          <Link
                            href={`/verify?roll_no=${encodeURIComponent(student.roll_no || student.roll_number || '')}`}
                            className="inline-flex items-center p-1.5 text-slate-600 hover:text-amber-600 bg-slate-100 dark:bg-slate-800 rounded-lg"
                            title="Verify Record"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => {
                              setEditingStudent({
                                ...student,
                                student_name: student.student_name || student.name || '',
                                roll_no: student.roll_no || student.roll_number || '',
                              });
                              setShowEditModal(true);
                            }}
                            className="inline-flex items-center p-1.5 text-slate-600 hover:text-blue-600 bg-slate-100 dark:bg-slate-800 rounded-lg"
                            title="Edit Student Record"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() =>
                              handleDelete(student.id, student.student_name || student.name || '')
                            }
                            className="inline-flex items-center p-1.5 text-slate-600 hover:text-rose-600 bg-slate-100 dark:bg-slate-800 rounded-lg"
                            title="Delete Record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-slate-400">
                      No student records found matching your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 max-w-lg w-full rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">➕ Add New Student</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Roll Number *</label>
                  <input
                    type="text"
                    required
                    value={newStudent.roll_no}
                    onChange={(e) => setNewStudent({ ...newStudent, roll_no: e.target.value })}
                    placeholder="e.g. 10104"
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Student Name *</label>
                  <input
                    type="text"
                    required
                    value={newStudent.student_name}
                    onChange={(e) => setNewStudent({ ...newStudent, student_name: e.target.value })}
                    placeholder="e.g. Anjali Sharma"
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Father Name *</label>
                  <input
                    type="text"
                    required
                    value={newStudent.father_name}
                    onChange={(e) => setNewStudent({ ...newStudent, father_name: e.target.value })}
                    placeholder="e.g. Rajender Sharma"
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Mobile Number</label>
                  <input
                    type="text"
                    value={newStudent.mobile_no}
                    onChange={(e) => setNewStudent({ ...newStudent, mobile_no: e.target.value })}
                    placeholder="e.g. +91 9876543210"
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Starting Date</label>
                  <input
                    type="date"
                    value={newStudent.start_date}
                    onChange={(e) => setNewStudent({ ...newStudent, start_date: e.target.value })}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Ending Date</label>
                  <input
                    type="date"
                    value={newStudent.end_date}
                    onChange={(e) => setNewStudent({ ...newStudent, end_date: e.target.value })}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Course Name *</label>
                  <input
                    type="text"
                    required
                    value={newStudent.course}
                    onChange={(e) => setNewStudent({ ...newStudent, course: e.target.value })}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Session *</label>
                  <input
                    type="text"
                    required
                    value={newStudent.session}
                    onChange={(e) => setNewStudent({ ...newStudent, session: e.target.value })}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Course Status</label>
                  <select
                    value={newStudent.course_status}
                    onChange={(e) =>
                      setNewStudent({
                        ...newStudent,
                        course_status: e.target.value as 'pending' | 'completed',
                      })
                    }
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-bold"
                  >
                    <option value="pending">⏳ Pending</option>
                    <option value="completed">✅ Completed</option>
                  </select>
                </div>
              </div>

              {/* Certificate File Upload */}
              <div className="space-y-1 pt-1">
                <label className="block text-slate-500 font-semibold">
                  Certificate PDF / Image File (Uploads to 'certificates' bucket)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    onChange={(e) => setAddCertFile(e.target.files?.[0] || null)}
                    className="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100"
                  />
                </div>
                {addCertFile && (
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                    Selected file: {addCertFile.name} ({(addCertFile.size / 1024).toFixed(1)} KB)
                  </p>
                )}
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-semibold rounded-lg shadow"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Student</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {showEditModal && editingStudent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 max-w-lg w-full rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                ✏ Edit Student Information
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Roll Number</label>
                  <input
                    type="text"
                    required
                    value={editingStudent.roll_no || editingStudent.roll_number || ''}
                    onChange={(e) =>
                      setEditingStudent({ ...editingStudent, roll_no: e.target.value })
                    }
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Student Name</label>
                  <input
                    type="text"
                    required
                    value={editingStudent.student_name || editingStudent.name || ''}
                    onChange={(e) =>
                      setEditingStudent({ ...editingStudent, student_name: e.target.value })
                    }
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Father Name</label>
                  <input
                    type="text"
                    required
                    value={editingStudent.father_name}
                    onChange={(e) =>
                      setEditingStudent({ ...editingStudent, father_name: e.target.value })
                    }
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Mobile Number</label>
                  <input
                    type="text"
                    value={editingStudent.mobile_no || editingStudent.phone || ''}
                    onChange={(e) =>
                      setEditingStudent({ ...editingStudent, mobile_no: e.target.value })
                    }
                    placeholder="e.g. +91 9876543210"
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Starting Date</label>
                  <input
                    type="date"
                    value={editingStudent.start_date || ''}
                    onChange={(e) =>
                      setEditingStudent({ ...editingStudent, start_date: e.target.value })
                    }
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Ending Date</label>
                  <input
                    type="date"
                    value={editingStudent.end_date || ''}
                    onChange={(e) =>
                      setEditingStudent({ ...editingStudent, end_date: e.target.value })
                    }
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Course Name</label>
                  <input
                    type="text"
                    required
                    value={editingStudent.course}
                    onChange={(e) =>
                      setEditingStudent({ ...editingStudent, course: e.target.value })
                    }
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Session</label>
                  <input
                    type="text"
                    required
                    value={editingStudent.session}
                    onChange={(e) =>
                      setEditingStudent({ ...editingStudent, session: e.target.value })
                    }
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Course Status</label>
                  <select
                    value={editingStudent.course_status || 'pending'}
                    onChange={(e) =>
                      setEditingStudent({
                        ...editingStudent,
                        course_status: e.target.value as 'pending' | 'completed',
                      })
                    }
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-bold"
                  >
                    <option value="pending">⏳ Pending</option>
                    <option value="completed">✅ Completed</option>
                  </select>
                </div>
              </div>

              {/* Certificate File Upload */}
              <div className="space-y-1 pt-1">
                <label className="block text-slate-500 font-semibold">
                  Upload / Replace Certificate File
                </label>
                <input
                  type="file"
                  accept=".pdf,image/*"
                  onChange={(e) => setEditCertFile(e.target.files?.[0] || null)}
                  className="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {(editingStudent.certificate_url || editingStudent.pdf_url) && (
                  <p className="text-[11px] text-slate-500 mt-1">
                    Current Certificate:{' '}
                    <a
                      href={editingStudent.certificate_url || editingStudent.pdf_url || '#'}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:underline font-mono"
                    >
                      View File
                    </a>
                  </p>
                )}
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-lg shadow"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Updating...</span>
                    </>
                  ) : (
                    <span>Update Record</span>
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
