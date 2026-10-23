'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PortalNav } from '@/components/portal/portal-nav';
import { getCurrentPortalUser, addAuditLog } from '@/lib/supabase/mock-data';
import { createStudent, uploadCertificateFile } from '@/lib/supabase/student-service';
import { UserProfile, BulkUploadRow } from '@/lib/types/portal';
import { INSTITUTE_COURSES, COURSE_SUBJECT_PRESETS } from '@/components/portal/certificate-card';
import Papa from 'papaparse';
import {
  FileSpreadsheet,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  FileText,
  UserPlus,
  Loader2,
  Upload,
} from 'lucide-react';

function AdminUploadPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') === 'single' ? 'single' : 'bulk';

  const [user, setUser] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'bulk' | 'single'>(initialTab);

  // Bulk state
  const [parsedRows, setParsedRows] = useState<BulkUploadRow[]>([]);
  const [parseError, setParseError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Single form state
  const [singleStudent, setSingleStudent] = useState({
    roll_no: '',
    student_name: '',
    father_name: '',
    mother_name: '',
    course: 'Diploma in Computer Application (DCA)',
    subject: 'Computer Fundamentals, Operating Systems & MS Office',
    session: '2023-2024',
    start_date: '',
    end_date: '',
    mobile_no: '',
    course_status: 'completed' as 'pending' | 'completed',
    certificate_url: '',
  });
  const [singleCertFile, setSingleCertFile] = useState<File | null>(null);
  const [singlePhotoFile, setSinglePhotoFile] = useState<File | null>(null);

  useEffect(() => {
    const currentUser = getCurrentPortalUser();
    if (!currentUser || currentUser.role !== 'admin') {
      router.push('/admin/login');
      return;
    }
    setUser(currentUser);
  }, [router]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setParseError('');
    setUploadSuccess('');
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          setParseError(`CSV Parsing Error: ${results.errors[0].message}`);
          return;
        }

        const rows: BulkUploadRow[] = (results.data as any[]).map((row, idx) => {
          const rollNo = row.roll_no || row['Roll Number'] || row['rollNo'] || row.roll_number || row.student_id || `${10100 + idx}`;
          const name = row.student_name || row['Student Name'] || row.name || row['Name'] || 'Student Name';
          const mobile = row.mobile_no || row['Mobile No'] || row.phone || row['Phone'] || '';
          const status = (row.course_status || row['Course Status'] || row.status || 'pending').toLowerCase() === 'completed' ? 'completed' : 'pending';
          const startDate = row.start_date || row['Start Date'] || row['starting_date'] || '';
          const endDate = row.end_date || row['End Date'] || row['ending_date'] || '';

          return {
            student_id: rollNo,
            roll_number: rollNo,
            name: name,
            father_name: row.father_name || row['Father Name'] || row['fatherName'] || 'Father Name',
            mother_name: row.mother_name || row['Mother Name'] || row['motherName'] || '',
            course: row.course || row['Course'] || 'Diploma in Computer Application (DCA)',
            subject: row.subject || row['Subject'] || row['subject_name'] || row.course || 'Diploma in Computer Application (DCA)',
            session: row.session || row['Session'] || '2023-2024',
            start_date: startDate,
            end_date: endDate,
            mobile_no: mobile,
            course_status: status,
            certificate_no: row.certificate_no || row['Certificate No'] || row['certNo'] || `SP-2024-${rollNo}`,
            issue_date: row.issue_date || row['Issue Date'] || new Date().toISOString().split('T')[0],
            phone: mobile,
          };
        });

        setParsedRows(rows);
      },
      error: (err) => {
        setParseError(`Failed to read file: ${err.message}`);
      },
    });
  };

  const handleConfirmBulkUpload = async () => {
    if (parsedRows.length === 0) return;
    setIsProcessing(true);
    setUploadSuccess('');
    setParseError('');

    try {
      let count = 0;
      for (const row of parsedRows) {
        await createStudent({
          roll_no: row.roll_number || row.student_id,
          student_name: row.name,
          father_name: row.father_name,
          mother_name: row.mother_name,
          course: row.course,
          session: row.session,
          start_date: row.start_date,
          end_date: row.end_date,
          mobile_no: row.mobile_no,
          course_status: row.course_status || 'pending',
        });
        count++;
      }

      addAuditLog('BULK_UPLOAD_STUDENTS', 'student', `${count}_records`, { count });
      setUploadSuccess(`Successfully imported ${count} student records into Supabase database!`);
      setParsedRows([]);
    } catch (err: any) {
      console.error('Bulk upload error:', err);
      setParseError(`Bulk upload error: ${err.message || 'Failed to save to Supabase.'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleStudent.roll_no || !singleStudent.student_name) return;

    setIsProcessing(true);
    setUploadSuccess('');
    setParseError('');

    try {
      await createStudent(singleStudent, singleCertFile, singlePhotoFile);
      setUploadSuccess(`Single student record created in Supabase for ${singleStudent.student_name} (Roll No: ${singleStudent.roll_no})! Course status: ${singleStudent.course_status.toUpperCase()}`);
      setSingleStudent({
        roll_no: '',
        student_name: '',
        father_name: '',
        mother_name: '',
        course: 'Diploma in Computer Application (DCA)',
        subject: 'Computer Fundamentals, Operating Systems & MS Office',
        session: '2023-2024',
        start_date: '',
        end_date: '',
        mobile_no: '',
        course_status: 'completed',
        certificate_url: '',
      });
      setSingleCertFile(null);
      setSinglePhotoFile(null);
    } catch (err: any) {
      console.error('Single submit error:', err);
      setParseError(`Failed to add student to Supabase: ${err.message || 'Check database permissions.'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadSampleCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'roll_no,student_name,father_name,mother_name,course,session,start_date,end_date,mobile_no,course_status\n' +
      'TEST001,Test Student,Test Father,Test Mother,DCA,2023-2024,2023-07-01,2024-06-30,+91 9999999999,pending\n' +
      '10110,Rohan Verma,Sanjay Verma,Sunita Verma,Diploma in Computer Application (DCA),2023-2024,2023-07-01,2024-06-30,+91 9876543210,completed\n';
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'sample_students_import.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white pb-16">
      <PortalNav user={user} />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold font-serif text-slate-900 dark:text-white">
            Upload Certificates & Add Students to Supabase
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Import bulk student records via Excel/CSV spreadsheets or add individual student certificates manually to Supabase.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 text-sm font-semibold">
          <button
            onClick={() => setActiveTab('bulk')}
            className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'bulk'
                ? 'border-amber-600 text-amber-600'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            Bulk CSV/Excel Import
          </button>

          <button
            onClick={() => setActiveTab('single')}
            className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'single'
                ? 'border-amber-600 text-amber-600'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            Single Student Entry
          </button>
        </div>

        {uploadSuccess && (
          <div className="flex items-center gap-2 p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-sm font-semibold rounded-2xl">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{uploadSuccess}</span>
          </div>
        )}

        {parseError && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{parseError}</span>
          </div>
        )}

        {/* Bulk Upload View */}
        {activeTab === 'bulk' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border-2 border-dashed border-slate-300 dark:border-slate-800 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 mx-auto">
                <UploadCloud className="w-8 h-8" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Drop your CSV file here or click to browse
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Supported format: .csv (Headers: roll_no, student_name, father_name, mother_name, course, session)
                </p>
              </div>

              <div className="flex justify-center items-center gap-3 pt-2">
                <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-xl shadow-md cursor-pointer transition-colors">
                  <FileText className="w-4 h-4" />
                  Select CSV File
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>

                <button
                  onClick={downloadSampleCSV}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition-colors"
                >
                  Download Sample CSV
                </button>
              </div>
            </div>

            {/* Parsed Preview Table */}
            {parsedRows.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Parsed Preview ({parsedRows.length} records ready for import)
                  </h3>
                  <button
                    onClick={handleConfirmBulkUpload}
                    disabled={isProcessing}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-md transition-colors"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Uploading to Supabase...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Confirm Bulk Import</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="overflow-x-auto max-h-72">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold sticky top-0">
                      <tr>
                        <th className="px-3 py-2">Roll No</th>
                        <th className="px-3 py-2">Student Name</th>
                        <th className="px-3 py-2">Father Name</th>
                        <th className="px-3 py-2">Mother Name</th>
                        <th className="px-3 py-2">Course</th>
                        <th className="px-3 py-2">Session</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {parsedRows.map((r, i) => (
                        <tr key={i}>
                          <td className="px-3 py-2 font-mono font-bold text-slate-900 dark:text-white">
                            {r.roll_number || r.student_id}
                          </td>
                          <td className="px-3 py-2 font-bold">{r.name}</td>
                          <td className="px-3 py-2">{r.father_name}</td>
                          <td className="px-3 py-2 text-slate-500">{r.mother_name || '-'}</td>
                          <td className="px-3 py-2 text-amber-600">{r.course}</td>
                          <td className="px-3 py-2">{r.session}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Single Student View */}
        {activeTab === 'single' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">➕ Single Student Entry Form</h3>
            <form onSubmit={handleSingleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Roll Number *</label>
                  <input
                    type="text"
                    required
                    value={singleStudent.roll_no}
                    onChange={(e) => setSingleStudent({ ...singleStudent, roll_no: e.target.value })}
                    placeholder="e.g. 10105"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Full Student Name *</label>
                  <input
                    type="text"
                    required
                    value={singleStudent.student_name}
                    onChange={(e) => setSingleStudent({ ...singleStudent, student_name: e.target.value })}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Father Name *</label>
                  <input
                    type="text"
                    required
                    value={singleStudent.father_name}
                    onChange={(e) => setSingleStudent({ ...singleStudent, father_name: e.target.value })}
                    placeholder="e.g. Vijay Sharma"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Mother Name (Optional)</label>
                  <input
                    type="text"
                    value={singleStudent.mother_name}
                    onChange={(e) => setSingleStudent({ ...singleStudent, mother_name: e.target.value })}
                    placeholder="e.g. Sunita Sharma"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Mobile Number</label>
                  <input
                    type="text"
                    value={singleStudent.mobile_no}
                    onChange={(e) => setSingleStudent({ ...singleStudent, mobile_no: e.target.value })}
                    placeholder="e.g. +91 9876543210"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Course Name *</label>
                  <input
                    type="text"
                    required
                    list="upload-courses-list"
                    value={singleStudent.course}
                    onChange={(e) => {
                      const newC = e.target.value;
                      const suggestions = COURSE_SUBJECT_PRESETS[newC];
                      setSingleStudent({
                        ...singleStudent,
                        course: newC,
                        subject: suggestions?.[0] || singleStudent.subject || newC,
                      });
                    }}
                    placeholder="e.g. Diploma in Computer Application (DCA)"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  />
                  <datalist id="upload-courses-list">
                    {INSTITUTE_COURSES.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Subject / Stream (in which student completed course)
                  </label>
                  <input
                    type="text"
                    value={singleStudent.subject}
                    onChange={(e) => setSingleStudent({ ...singleStudent, subject: e.target.value })}
                    placeholder="e.g. Computer Fundamentals, Operating Systems & MS Office"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Academic Session *</label>
                  <input
                    type="text"
                    required
                    value={singleStudent.session}
                    onChange={(e) => setSingleStudent({ ...singleStudent, session: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Starting Date</label>
                  <input
                    type="date"
                    value={singleStudent.start_date}
                    onChange={(e) => setSingleStudent({ ...singleStudent, start_date: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Ending Date</label>
                  <input
                    type="date"
                    value={singleStudent.end_date}
                    onChange={(e) => setSingleStudent({ ...singleStudent, end_date: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Course Status</label>
                  <select
                    value={singleStudent.course_status}
                    onChange={(e) =>
                      setSingleStudent({
                        ...singleStudent,
                        course_status: e.target.value as 'pending' | 'completed',
                      })
                    }
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold"
                  >
                    <option value="pending">⏳ Pending</option>
                    <option value="completed">✅ Completed</option>
                  </select>
                </div>

                {/* Student Photo Upload */}
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    📷 Student Photo / Passport Image (Appears on Certificate)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setSinglePhotoFile(e.target.files?.[0] || null)}
                    className="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {singlePhotoFile && (
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">
                      Selected photo: {singlePhotoFile.name} ({(singlePhotoFile.size / 1024).toFixed(1)} KB)
                    </p>
                  )}
                </div>

                {/* Certificate File Upload */}
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    📄 Certificate PDF / Image File
                  </label>
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    onChange={(e) => setSingleCertFile(e.target.files?.[0] || null)}
                    className="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-md transition-colors"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving to Supabase...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Save Student Record</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}

export default function AdminUploadPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <p className="text-sm text-slate-400">Loading upload page...</p>
      </div>
    }>
      <AdminUploadPageContent />
    </Suspense>
  );
}
