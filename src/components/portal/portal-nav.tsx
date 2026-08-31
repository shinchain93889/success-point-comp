'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { UserProfile } from '@/lib/types/portal';
import { setCurrentPortalUser } from '@/lib/supabase/mock-data';
import { signOutUser } from '@/lib/supabase/auth-service';
import {
  Award,
  BookOpen,
  FileCheck,
  FileSpreadsheet,
  History,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  User,
  Users,
} from 'lucide-react';

interface PortalNavProps {
  user: UserProfile;
}

export function PortalNav({ user }: PortalNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    const isAdmin = user.role === 'admin';
    await signOutUser();
    router.push(isAdmin ? '/admin/login' : '/student/login');
  };

  const isStudent = user.role === 'student';

  const studentLinks = [
    { href: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/student/certificate', label: 'My Certificate', icon: Award },
    { href: '/student/profile', label: 'Profile Settings', icon: User },
  ];

  const adminLinks = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/students', label: 'Student Records', icon: Users },
    { href: '/admin/certificates', label: 'Certificates', icon: Award },
    { href: '/admin/upload', label: 'Upload & Import', icon: FileSpreadsheet },
    { href: '/admin/settings/audit-logs', label: 'Audit Logs', icon: History },
  ];

  const links = isStudent ? studentLinks : adminLinks;

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Portal Badge */}
          <div className="flex items-center gap-3">
            <Link href={isStudent ? '/student/dashboard' : '/admin/dashboard'} className="flex items-center gap-2">
              <Image
                src="/img/logosp.jpeg"
                alt="Success Point Logo"
                width={36}
                height={36}
                className="w-9 h-9 object-contain rounded-lg shadow-sm"
              />
              <span className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white tracking-tight hidden sm:inline uppercase">
                Success Point Computer School
              </span>
            </Link>
            <span
              className={`text-xs font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                isStudent
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
              }`}
            >
              {user.role} Portal
            </span>
          </div>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* User Info & Logout */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-slate-900 dark:text-white leading-tight">
                {user.full_name}
              </p>
              {user.student_id && (
                <p className="text-[10px] text-slate-500 font-mono">ID: {user.student_id}</p>
              )}
            </div>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 rounded-lg transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Row */}
        <div className="md:hidden flex items-center justify-around py-2 border-t border-slate-100 dark:border-slate-800 overflow-x-auto">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap ${
                  isActive
                    ? 'bg-amber-500/10 text-amber-600 font-semibold'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}
