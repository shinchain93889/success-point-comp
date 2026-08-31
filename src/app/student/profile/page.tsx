'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PortalNav } from '@/components/portal/portal-nav';
import { getCurrentPortalUser, updateStoredStudent } from '@/lib/supabase/mock-data';
import { fetchStudents } from '@/lib/supabase/student-service';
import { StudentRecord, UserProfile } from '@/lib/types/portal';
import { CheckCircle2, Phone, User, Camera, Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function StudentProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [student, setStudent] = useState<StudentRecord | null>(null);
  const [phone, setPhone] = useState('');
  const [profilePictureUrl, setProfilePictureUrl] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const currentUser = getCurrentPortalUser();
    if (!currentUser) {
      router.push('/student/login');
      return;
    }
    setUser(currentUser);

    fetchStudents().then((students) => {
      const matched = students.find(
        (s) => s.id === currentUser.id || s.student_id === currentUser.student_id || s.roll_no === currentUser.student_id
      ) || students[0];

      if (matched) {
        setStudent(matched);
        setPhone(matched.phone || '');
        setProfilePictureUrl(matched.profile_picture_url || '');
      }
    });
  }, [router]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!student) return;

    const updated = updateStoredStudent(student.id, {
      phone,
      profile_picture_url: profilePictureUrl,
    });

    if (updated) {
      setStudent(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  if (!user || !student) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white pb-16">
      <PortalNav user={user} />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <Link
          href="/student/dashboard"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-amber-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 shadow-md border border-slate-200 dark:border-slate-800 space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <User className="w-5 h-5 text-amber-600" />
              Update Profile Information
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Note: Name, Roll Number, Course, and Certificate details are verified and can only be modified by an Admin.
            </p>
          </div>

          {saved && (
            <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Profile details updated successfully!</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-5">
            {/* Readonly Info Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl text-xs">
              <div>
                <span className="text-slate-400 font-medium">Full Name:</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200">{student.name}</p>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Student ID:</span>
                <p className="font-mono font-semibold text-slate-800 dark:text-slate-200">{student.student_id}</p>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Course:</span>
                <p className="font-semibold text-amber-600 dark:text-amber-400">{student.course}</p>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Session:</span>
                <p className="font-semibold text-slate-800 dark:text-slate-200">{student.session}</p>
              </div>
            </div>

            {/* Editable Fields */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 9876543210"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Profile Photo URL
              </label>
              <div className="relative">
                <Camera className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="url"
                  value={profilePictureUrl}
                  onChange={(e) => setProfilePictureUrl(e.target.value)}
                  placeholder="https://example.com/photo.jpg"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Enter an image URL for your profile photo displayed on your digital certificate preview.
              </p>
            </div>

            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm rounded-xl shadow-md transition-colors"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
