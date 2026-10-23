'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Award,
  Search,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Download,
  FileText,
  User,
  BookOpen,
  Calendar,
  Loader2,
  Printer,
  Phone,
} from 'lucide-react';
import { fetchStudentByRollNo } from '@/lib/supabase/student-service';
import { StudentRecord } from '@/lib/types/portal';
import { CertificateCard } from '@/components/portal/certificate-card';

function VerificationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialRoll = searchParams.get('roll_no') || searchParams.get('roll') || '';

  const [rollNoInput, setRollNoInput] = useState(initialRoll);
  const [student, setStudent] = useState<StudentRecord | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialRoll) {
      handleSearchByRoll(initialRoll);
    }
  }, [initialRoll]);

  const handleSearchByRoll = async (rollToSearch: string) => {
    const clean = rollToSearch.trim();
    if (!clean) return;

    setIsLoading(true);
    setError('');
    setSearched(true);

    try {
      const res = await fetchStudentByRollNo(clean);
      if (res) {
        setStudent(res);
      } else {
        setStudent(null);
        setError(`No genuine certificate record found for Roll Number "${clean}". Please verify your roll number.`);
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('An error occurred while verifying the record. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rollNoInput.trim()) return;
    router.push(`/verify?roll_no=${encodeURIComponent(rollNoInput.trim())}`);
    handleSearchByRoll(rollNoInput);
  };

  const certUrl = student?.certificate_url || student?.pdf_url;

  return (
    <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-12 w-full space-y-10">
      {/* Search Header */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-full text-xs font-semibold text-amber-400">
          <ShieldCheck className="w-4 h-4" />
          Official Roll Number Authenticity Portal
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-serif text-white">
          Student Certificate Verification
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm">
          Enter your student <strong className="text-amber-400">Roll Number</strong> below to verify your course completion record and download your official certificate.
        </p>

        {/* Search Form */}
        <form onSubmit={handleFormSubmit} className="space-y-3 pt-2">
          <div className="relative max-w-xl mx-auto">
            <Search className="w-5 h-5 absolute left-4 top-3.5 text-slate-400" />
            <input
              type="text"
              required
              value={rollNoInput}
              onChange={(e) => setRollNoInput(e.target.value)}
              placeholder="Enter Roll Number (e.g. 10101, 10102, SP2024001)"
              className="w-full pl-12 pr-32 py-3.5 bg-slate-800/90 border border-slate-700 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-xl"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="absolute right-2 top-2 bottom-2 px-5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-md transition-colors flex items-center gap-1.5"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Search</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Sample Roll Numbers for testing */}
        {!searched && (
          <div className="pt-4 space-y-2 text-xs text-slate-400">
            <p className="text-slate-400">Quick Test Roll Numbers:</p>
            <div className="flex flex-wrap justify-center gap-2">
              {['10101', '10102', '10103'].map((rn) => (
                <button
                  key={rn}
                  type="button"
                  onClick={() => {
                    setRollNoInput(rn);
                    router.push(`/verify?roll_no=${rn}`);
                    handleSearchByRoll(rn);
                  }}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700/80 rounded-lg font-mono text-amber-300 transition-colors"
                >
                  Roll No: {rn}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-12 text-center max-w-lg mx-auto">
          <Loader2 className="w-10 h-10 animate-spin text-amber-500 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-300">Searching Supabase records...</p>
        </div>
      )}

      {/* Verification Result */}
      {!isLoading && searched && (
        <div>
          {student ? (
            <div className="space-y-8 animate-in fade-in duration-300">
              {/* Genuine Status Banner */}
              <div className="bg-emerald-500/10 border-2 border-emerald-500/40 p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left backdrop-blur-xl">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400 shrink-0 shadow-lg shadow-emerald-500/10">
                    <ShieldCheck className="w-8 h-8" />
                  </div>
                  <div>
                    <div className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 uppercase tracking-wider bg-emerald-500/20 px-2.5 py-0.5 rounded-full mb-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> VERIFIED GENUINE
                    </div>
                    <h2 className="text-xl font-bold text-white font-serif">
                      Authentic Student Record Found
                    </h2>
                    <p className="text-xs text-slate-300">
                      This certificate is officially registered in Success Point Database.
                    </p>
                  </div>
                </div>

                {/* Download Certificate Button */}
                {certUrl ? (
                  <a
                    href={certUrl}
                    target="_blank"
                    download
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-900/30 transition-colors shrink-0"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Certificate</span>
                  </a>
                ) : (
                  <a
                    href="#certificate-card"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl shadow-lg transition-colors shrink-0"
                  >
                    <Printer className="w-4 h-4" />
                    <span>View & Print Certificate</span>
                  </a>
                )}
              </div>

              {/* Student Info Details Card */}
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 sm:p-8 space-y-6">
                <div className="border-b border-slate-700 pb-4 flex items-center justify-between">
                  <h3 className="font-bold text-lg text-white font-serif flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-500" />
                    Student Details
                  </h3>
                  <span className="font-mono text-xs text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                    Roll No: {student.roll_no || student.roll_number}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
                  <div className="space-y-1">
                    <p className="text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-amber-400" /> Student Name
                    </p>
                    <p className="text-base font-bold text-white">
                      {student.student_name || student.name}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-amber-400" /> Father's Name
                    </p>
                    <p className="text-base font-bold text-white">{student.father_name}</p>
                  </div>

                  {student.mother_name && (
                    <div className="space-y-1">
                      <p className="text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-amber-400" /> Mother's Name
                      </p>
                      <p className="text-base font-bold text-white">{student.mother_name}</p>
                    </div>
                  )}

                  {(student.mobile_no || student.phone) && (
                    <div className="space-y-1">
                      <p className="text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-amber-400" /> Mobile Number
                      </p>
                      <p className="text-base font-bold font-mono text-white">{student.mobile_no || student.phone}</p>
                    </div>
                  )}

                  <div className="space-y-1">
                    <p className="text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-amber-400" /> Course Enrolled
                    </p>
                    <p className="text-sm font-semibold text-amber-300">{student.course}</p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-amber-400" /> Academic Session
                    </p>
                    <p className="text-sm font-semibold text-white">{student.session}</p>
                  </div>
                </div>

                {/* Direct Download Action Row */}
                {certUrl && (
                  <div className="pt-4 border-t border-slate-700/80 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-xs text-slate-300">
                      <FileText className="w-4 h-4 text-emerald-400" />
                      <span>Official Certificate Document file is ready.</span>
                    </div>
                    <a
                      href={certUrl}
                      target="_blank"
                      download
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Certificate File</span>
                    </a>
                  </div>
                )}
              </div>

              {/* Render Printable Certificate Card component */}
              <div id="certificate-card" className="pt-4 text-slate-900 w-full flex justify-center items-center">
                <CertificateCard student={student} showActions={true} />
              </div>
            </div>
          ) : (
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-8 sm:p-12 text-center max-w-lg mx-auto space-y-4">
              <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
                <XCircle className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-white font-serif">Record Not Found</h2>
              <p className="text-xs text-slate-300 leading-relaxed">{error}</p>
            </div>
          )}
        </div>
      )}
    </main>
  );
}

export default function VerifyIndexPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-between">
      {/* Navigation Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur py-4 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/img/logosp.jpeg"
              alt="Success Point Logo"
              width={40}
              height={40}
              className="w-10 h-10 object-contain rounded-xl shadow-md bg-white p-0.5"
            />
            <div>
              <h1 className="font-extrabold text-base tracking-tight font-serif uppercase">SUCCESS POINT COMPUTER SCHOOL</h1>
              <p className="text-[10px] text-amber-400 uppercase tracking-widest font-semibold">
                Certificate Verification Portal
              </p>
            </div>
          </Link>

          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 rounded-xl text-xs font-semibold text-white shadow-md transition-colors"
          >
            Portal Login
          </Link>
        </div>
      </header>

      <Suspense fallback={
        <div className="flex-1 flex items-center justify-center py-20 text-slate-400 text-sm">
          <Loader2 className="w-6 h-6 animate-spin text-amber-500 mr-2" />
          Loading Verification Portal...
        </div>
      }>
        <VerificationContent />
      </Suspense>

      <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} Success Point Educational & Technical Institute. All rights reserved.</p>
      </footer>
    </div>
  );
}
