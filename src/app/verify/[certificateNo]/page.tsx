'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { StudentRecord } from '@/lib/types/portal';
import { fetchStudentByRollNo } from '@/lib/supabase/student-service';
import { CertificateCard } from '@/components/portal/certificate-card';
import { CheckCircle2, ShieldCheck, XCircle, Search, ArrowLeft, Building2 } from 'lucide-react';

export default function VerifyCertificatePage() {
  const params = useParams();
  const certNo = params?.certificateNo as string;
  const [student, setStudent] = useState<StudentRecord | null>(null);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (certNo) {
      fetchStudentByRollNo(certNo).then((res) => {
        setStudent(res);
        setSearched(true);
      });
    }
  }, [certNo]);

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-between">
      {/* Top Header */}
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
                Official Certificate Verification
              </p>
            </div>
          </Link>

          <Link
            href="/verify"
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-semibold text-slate-300 transition-colors"
          >
            <Search className="w-3.5 h-3.5" />
            Search Another Certificate
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-10 w-full space-y-8">
        {searched && student ? (
          <div className="space-y-6">
            {/* Status Banner */}
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
                    Authentic Certificate Record
                  </h2>
                  <p className="text-xs text-slate-300">
                    This certificate is officially issued by Success Point Institute and verified in our central register.
                  </p>
                </div>
              </div>
            </div>

            {/* Render Certificate Component */}
            <div className="text-slate-900">
              <CertificateCard student={student} showActions={true} />
            </div>
          </div>
        ) : (
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-8 sm:p-12 text-center max-w-lg mx-auto space-y-4">
            <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
              <XCircle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-white font-serif">Certificate Not Found</h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              No genuine certificate record was found matching certificate number{' '}
              <span className="font-mono font-bold text-rose-300">{certNo}</span>. Please verify the certificate number or contact the institute director.
            </p>
            <div className="pt-2">
              <Link
                href="/verify"
                className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs rounded-xl shadow-lg transition-colors"
              >
                <Search className="w-4 h-4" />
                Try Another Search
              </Link>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} Success Point Educational & Technical Institute. All rights reserved.</p>
      </footer>
    </div>
  );
}
