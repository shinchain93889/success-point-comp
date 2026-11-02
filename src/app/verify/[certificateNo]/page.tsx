'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { StudentRecord } from '@/lib/types/portal';
import { fetchStudentByRollNo } from '@/lib/supabase/student-service';
import { CertificateCard } from '@/components/portal/certificate-card';
import { getCurrentPortalUser } from '@/lib/supabase/mock-data';
import { CheckCircle2, ShieldCheck, XCircle, Search } from 'lucide-react';

export default function VerifyCertificatePage() {
  const params = useParams();
  const certNo = params?.certificateNo as string;
  const [student, setStudent] = useState<StudentRecord | null>(null);
  const [searched, setSearched] = useState(false);
  const [lookupError, setLookupError] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const user = getCurrentPortalUser();
    setIsAdmin(user?.role === 'admin');
  }, []);

  useEffect(() => {
    if (certNo) {
      let active = true;
      fetchStudentByRollNo(certNo)
        .then((res) => {
          if (!active) return;
          setStudent(res);
          setSearched(true);
        })
        .catch(() => {
          if (!active) return;
          setLookupError('Certificate verification is currently unavailable. Please try again shortly.');
          setSearched(true);
        });
      return () => { active = false; };
    }
  }, [certNo]);

  return (
          <div className="min-h-screen bg-slate-900 text-white flex flex-col">
            {/* Sleek Breadcrumb / Action Bar without Duplicate Branding */}
            <div className="border-b border-slate-800/60 bg-slate-950/40 px-4 sm:px-6 py-2">
              <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs">
                  <span className="inline-flex items-center gap-1.5 font-semibold text-amber-400 uppercase tracking-wider text-[11px] sm:text-xs">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    Certificate Verification
                  </span>
                  <span className="text-slate-600">/</span>
                  <span className="font-mono text-slate-300 text-xs">
                    {student?.certificate_no || certNo}
                  </span>
                </div>

                <Link
                  href="/verify"
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-800/80 hover:bg-slate-700 hover:text-white border border-slate-700/60 rounded-lg text-xs font-medium text-slate-300 transition-colors shrink-0"
                >
                  <Search className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden xs:inline sm:inline">Search Another Certificate</span>
                  <span className="xs:hidden sm:hidden">Search</span>
                </Link>
              </div>
            </div>

            {/* Main Content with Reduced Top Spacing */}
            <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6 pb-12 w-full space-y-4 sm:space-y-5">
              {searched && student ? (
                <div className="space-y-4 sm:space-y-5">
                  {/* Green Verification Status Card - Perfectly Aligned */}
                  <div className="bg-gradient-to-r from-emerald-950/40 via-emerald-900/25 to-slate-900/60 border-2 border-emerald-500/40 rounded-2xl p-4 sm:p-5 md:p-6 backdrop-blur-md shadow-xl shadow-emerald-950/20">
                    <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-5 text-center sm:text-left">
                      {/* Shield Icon - Centered horizontally and vertically */}
                      <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400 shrink-0 shadow-md shadow-emerald-500/10 mx-auto sm:mx-0">
                        <ShieldCheck className="w-7 h-7 sm:w-8 sm:h-8" />
                      </div>

                      {/* Verification Text Content */}
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center justify-center sm:justify-start gap-2 mb-1 flex-wrap">
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-300 uppercase tracking-wider bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> VERIFIED GENUINE
                          </span>
                          <span className="text-xs font-mono font-semibold text-emerald-300/90 bg-emerald-950/80 border border-emerald-800/60 px-2.5 py-0.5 rounded-md hidden xs:inline-block">
                            Cert #{student.certificate_no || certNo}
                          </span>
                        </div>
                        <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                          Authentic Certificate Record
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-normal">
                          This certificate is officially issued by Success Point Computer School and verified in our central register.
                        </p>
                      </div>
                    </div>
                  </div>

            {/* Certificate Component (Borders, Dimensions, & Actions Preserved) */}
                    <div className="text-slate-900 w-full flex justify-center items-center">
                      <CertificateCard student={student} showActions={true} isAdmin={false} />
                    </div>
                </div>
              ) : (
                <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-8 sm:p-12 text-center max-w-lg mx-auto space-y-4 my-8">
                  <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
                    <XCircle className="w-8 h-8" />
                  </div>
                  <h2 className="text-xl font-bold text-white tracking-tight">
                    {lookupError ? 'Verification Unavailable' : 'Certificate Record Not Found'}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
                    {lookupError || (
                      <>
                        No genuine certificate record was found matching certificate number{' '}
                        <span className="font-mono font-bold text-rose-300">{certNo}</span> at{' '}
                        <span className="font-semibold text-white">SUCCESS POINT COMPUTER SCHOOL</span>.
                        Please verify the certificate number or contact the administration.
                      </>
                    )}
                  </p>
                  <div className="pt-2">
                    <Link
                      href="/verify"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs rounded-xl shadow-lg transition-colors"
                    >
                      <Search className="w-4 h-4" />
                      Search Another Certificate
                    </Link>
                  </div>
                </div>
              )}
        </main>
      </div>
      );
}
