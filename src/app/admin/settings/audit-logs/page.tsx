'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PortalNav } from '@/components/portal/portal-nav';
import { getCurrentPortalUser, getStoredAuditLogs } from '@/lib/supabase/mock-data';
import { AuditLog, UserProfile } from '@/lib/types/portal';
import { History, ShieldCheck, Clock, User, FileText } from 'lucide-react';

export default function AdminAuditLogsPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [logs, setLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    const currentUser = getCurrentPortalUser();
    if (!currentUser || currentUser.role !== 'admin') {
      router.push('/admin/login');
      return;
    }
    setUser(currentUser);
    setLogs(getStoredAuditLogs());
  }, [router]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white pb-16">
      <PortalNav user={user} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold font-serif text-slate-900 dark:text-white flex items-center gap-2">
            <History className="w-6 h-6 text-purple-600" />
            System Audit Log Trail
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Complete record showing who created, modified, or deleted student and certificate entries with timestamps.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 uppercase font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3.5">Timestamp</th>
                  <th className="px-4 py-3.5">User</th>
                  <th className="px-4 py-3.5">Action</th>
                  <th className="px-4 py-3.5">Target</th>
                  <th className="px-4 py-3.5">Target ID</th>
                  <th className="px-4 py-3.5">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3.5 whitespace-nowrap font-mono text-slate-500">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5 font-medium text-slate-900 dark:text-white">
                      {log.user_email || 'System Admin'}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-300">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 uppercase tracking-wider text-[10px] font-bold text-slate-500">
                      {log.target_type}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-amber-600 font-semibold">
                      {log.target_id}
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                      {log.details ? JSON.stringify(log.details) : '-'}
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
