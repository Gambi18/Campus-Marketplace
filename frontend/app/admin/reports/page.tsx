import { Flag } from 'lucide-react';
import Link from 'next/link';

export default function AdminReportsPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl border border-gray-200 p-10 text-center shadow-sm">
        <div className="w-14 h-14 rounded-full bg-blue-50 text-brand-primary flex items-center justify-center mx-auto mb-4">
          <Flag className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-brand-neutral">Reports & moderation</h2>
        <p className="text-sm text-text-muted mt-2 leading-relaxed max-w-md mx-auto">
          Planned for a later phase. The backend already exposes report endpoints for admins, but this
          dashboard will not duplicate the mockup’s full moderation queue until the workflow is defined.
        </p>
        <p className="text-xs text-text-muted mt-4">
          API (when wired):{' '}
          <code className="bg-gray-100 px-1 rounded">GET /api/v1/admin/reports</code>,{' '}
          <code className="bg-gray-100 px-1 rounded">PATCH /api/v1/admin/reports/:id/status</code>
        </p>
        <Link
          href="/admin/users"
          className="inline-block mt-6 text-sm font-medium text-brand-primary hover:underline"
        >
          ← Back to users
        </Link>
      </div>
    </div>
  );
}
