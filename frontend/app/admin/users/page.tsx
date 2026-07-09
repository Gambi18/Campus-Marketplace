'use client';

import { useState } from 'react';
import Image from 'next/image';
import Button from '../../components/Button';
import StatusBadge from '../../components/StatusBadge';
import { adminFetch } from '../../utils/adminApi';
import { useApiResource } from '../../../customHooks/useApiResource';
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
  const { data, loading, error: loadError, refetch } = useApiResource(
    () => {
      const endpoint =
        tab === 'pending'
          ? '/api/v1/admin/pending-users?limit=100&offset=0'
          : '/api/v1/admin/users?limit=100&offset=0';
      return adminFetch<{ users: AdminUser[] }>(endpoint);
    },
    [tab],
  );
  const users = data?.users ?? [];
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const error = actionError ?? loadError;

  const runAction = async (userId: string, action: 'approve' | 'reject' | 'block') => {
    setActionId(userId);
    setActionError(null);
    try {
      const path =
        action === 'block'
          ? `/api/v1/admin/users/${userId}/block`
          : `/api/v1/admin/users/${userId}/${action}`;
      await adminFetch(path, { method: 'PATCH' });
      await refetch();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Action failed');
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
                      <StatusBadge
                        status={user.account_status}
                        colors={STATUS_STYLES}
                        baseClassName="inline-flex px-2 py-0.5 rounded text-xs font-medium capitalize"
                      />
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
                            onClick={() => runAction(user.id, 'block')}
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

    </div>
  );
}
