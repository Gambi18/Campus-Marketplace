'use client';

import { useState } from 'react';
import { Plus, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { adminFetch } from '../../utils/adminApi';
import { useApiResource } from '../../../customHooks/useApiResource';

type AdminAccount = {
  id: string;
  username: string;
  email: string;
  created_at: string;
};

const emptyForm = { username: '', email: '', password: '' };

export default function AdminAdminsPage() {
  const { data, loading, error: loadError, refetch } = useApiResource(
    () => adminFetch<{ admins: AdminAccount[] }>('/api/v1/admin/admins'),
    [],
  );
  const admins = data?.admins ?? [];
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const error = actionError ?? loadError;
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  const openCreate = () => {
    setForm(emptyForm);
    setActionError(null);
    setSuccessMsg(null);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setForm(emptyForm);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username.trim() || !form.email.trim() || !form.password) return;
    setSaving(true);
    setActionError(null);
    setSuccessMsg(null);
    try {
      await adminFetch('/api/v1/admin/admins', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setSuccessMsg(`Admin "${form.username}" created — they can now sign in.`);
      closeForm();
      await refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not create admin');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return isNaN(d.getTime()) ? '' : d.toLocaleDateString();
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-brand-neutral">Admins</h2>
          <p className="text-sm text-text-muted mt-1">
            Create additional admin accounts. New admins sign in at the admin login with the credentials you set here.
          </p>
        </div>
        <Button variant="primary" onClick={openCreate}>
          <Plus className="w-4 h-4 mr-1.5" />
          Add admin
        </Button>
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">{error}</p>
      )}
      {successMsg && (
        <p role="status" className="text-sm text-success bg-success-bg rounded-lg px-4 py-3">{successMsg}</p>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
          <h3 className="font-semibold text-brand-neutral">New admin</h3>
          <Input
            label="Username"
            name="username"
            required
            autoComplete="off"
            value={form.username}
            onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
          />
          <Input
            label="Email"
            name="email"
            type="email"
            required
            autoComplete="off"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />
          <div className="relative">
            <Input
              label="Password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="new-password"
              placeholder="At least 6 characters"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showPassword}
              className="absolute right-2 bottom-2 p-2 text-gray-400 hover:text-gray-600 rounded-md cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-100 focus:text-brand-primary"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          <div className="flex gap-2">
            <Button type="submit" variant="primary" loading={saving}>
              {saving ? 'Creating…' : 'Create admin'}
            </Button>
            <Button type="button" variant="outlined" onClick={closeForm}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm divide-y divide-gray-100">
        {loading ? (
          <p className="p-8 text-center text-text-muted text-sm">Loading admins…</p>
        ) : admins.length === 0 ? (
          <p className="p-8 text-center text-text-muted text-sm">No admins yet.</p>
        ) : (
          admins.map((a) => (
            <div key={a.id} className="flex items-center gap-3 p-4">
              <div className="w-9 h-9 rounded-full bg-brand-tertiary text-brand-primary flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-brand-neutral truncate">{a.username}</p>
                <p className="text-sm text-text-muted truncate">{a.email}</p>
              </div>
              {formatDate(a.created_at) && (
                <p className="text-xs text-text-muted ml-auto flex-shrink-0">Added {formatDate(a.created_at)}</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
