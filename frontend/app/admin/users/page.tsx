'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Button from '../../components/Button';
import { adminFetch } from '../../utils/adminApi';
import type { AdminUser } from '../../types/admin';

type Tab = 'all' | 'pending';

const STATUS_STYLES: Record<string, string> = {
  approved: 'bg-emerald-50 text-emerald-700',
  pending: 'bg-amber-50 text-amber-700',
  rejected: 'bg-red-50 text-red-700',
  blocked: 'bg-slate-200 text-slate-700',
};

export default function AdminUsersPage() {
  const [tab, setTab] = useState<Tab>('all');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const endpoint = tab === 'pending' ? '/api/v1/admin/pending-users' : '/api/v1/admin/users';
      const data = await adminFetch<{ users: AdminUser[] }>(endpoint);
      setUsers(data.users ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const [blockTarget, setBlockTarget] = useState<AdminUser | null>(null);

  const runAction = async (userId: string, action: 'approve' | 'reject' | 'block') => {
    setActionId(userId);
    setError(null);
    try {
      const path =
        action === 'block'
          ? `/api/v1/admin/users/${userId}/block`
          : `/api/v1/admin/users/${userId}/${action}`;
      await adminFetch(path, { method: 'PATCH' });
      await loadUsers();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Action failed');
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-brand-neutral">Users</h2>
        <p className="text-sm text-text-muted mt-1">
          View all students on the platform. Approve sign-ups, reject verification, or block accounts.
        </p>
      </div>

      <div className="flex gap-2 border-b border-gray-200">
        {(['all', 'pending'] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === t
              ? 'border-brand-primary text-brand-primary'
              : 'border-transparent text-text-muted hover:text-brand-neutral'
              }`}
          >
            {t === 'all' ? 'All users' : 'Pending verification'}
          </button>
        ))}
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">{error}</p>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <p className="p-8 text-center text-text-muted text-sm">Loading users…</p>
        ) : users.length === 0 ? (
          <p className="p-8 text-center text-text-muted text-sm">No users found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-brand-neutral">User</th>
                  <th className="text-left px-4 py-3 font-semibold text-brand-neutral">Status</th>
                  <th className="text-center px-4 py-3 font-semibold text-brand-neutral">Reports</th>
                  <th className="text-right px-4 py-3 font-semibold text-brand-neutral">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-brand-neutral">{user.username}</p>
                      <p className="text-text-muted text-xs">{user.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-xs font-medium capitalize ${STATUS_STYLES[user.account_status] ?? 'bg-gray-100 text-gray-600'
                          }`}
                      >
                        {user.account_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {user.account_status === 'approved' && user.report_count != null && user.report_count > 0 ? (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${user.report_count >= 5
                          ? 'bg-red-50 text-red-700 ring-1 ring-red-200'
                          : 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
                          }`}>
                          {user.report_count >= 5 && (
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          )}
                          {user.report_count}
                        </span>
                      ) : (
                        <span className="text-text-muted text-xs">–</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap justify-end gap-2">
                        {user.student_id_url && (
                          <a
                            href={user.student_id_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0"
                            title="View student ID document"
                          >
                            <Image
                              src={user.student_id_url}
                              alt="Student ID"
                              width={40}
                              height={40}
                              className="w-10 h-10 rounded-lg border border-gray-200 object-cover hover:ring-2 hover:ring-brand-primary transition-all cursor-pointer"
                            />
                          </a>
                        )}
                        {user.account_status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              variant="primary"
                              disabled={actionId === user.id}
                              onClick={() => runAction(user.id, 'approve')}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outlined"
                              disabled={actionId === user.id}
                              onClick={() => runAction(user.id, 'reject')}
                            >
                              Reject
                            </Button>
                          </>
                        )}
                        {user.account_status === 'approved' && (
                          <Button
                            size="sm"
                            variant="outlined"
                            disabled={actionId === user.id}
                            onClick={() => setBlockTarget(user)}
                            className="!text-red-600 !border-red-200 hover:!bg-red-50"
                          >
                            Block
                          </Button>
                        )}
                        {user.account_status === 'blocked' && (
                          <span className="text-xs text-text-muted self-center">Blocked</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {blockTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full mx-4 p-6 space-y-4">
            <h3 className="text-lg font-bold text-brand-neutral">Block user</h3>
            <p className="text-sm text-text-muted">
              Are you sure you want to block <strong>{blockTarget.username}</strong>
              {blockTarget.report_count != null && blockTarget.report_count > 0
                ? ` (${blockTarget.report_count} report${blockTarget.report_count !== 1 ? 's' : ''})`
                : ''}
              ? They will no longer be able to log in or use the platform.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button size="sm" variant="outlined" onClick={() => setBlockTarget(null)}>
                Cancel
              </Button>
              <Button
                size="sm"
                variant="primary"
                className="!bg-red-600 hover:!bg-red-700 !border-red-600"
                disabled={actionId === blockTarget.id}
                onClick={() => {
                  runAction(blockTarget.id, 'block');
                  setBlockTarget(null);
                }}
              >
                Block user
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
