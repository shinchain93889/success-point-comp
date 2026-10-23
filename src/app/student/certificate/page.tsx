'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PortalNav } from '@/components/portal/portal-nav';
import { CertificateCard } from '@/components/portal/certificate-card';
import { getCurrentPortalUser } from '@/lib/supabase/mock-data';
import { fetchStudents } from '@/lib/supabase/student-service';
import { StudentRecord, UserProfile } from '@/lib/types/portal';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function StudentCertificatePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [student, setStudent] = useState<StudentRecord | null>(null);

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
    });
  }, [router]);

  if (!user || !student) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white pb-16">
      <PortalNav user={user} />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="flex items-center justify-between print:hidden">
          <Link
            href="/student/dashboard"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-amber-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <span className="text-xs text-slate-400 font-mono">
            Cert ID: {student.certificate_no}
          </span>
        </div>

        <div className="w-full flex justify-center items-center">
          <CertificateCard student={student} showActions={true} />
        </div>
      </main>
    </div>
  );
}
