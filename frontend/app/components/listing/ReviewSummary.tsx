import { Eye } from 'lucide-react';
import { formatPrice } from '../../utils/format';
import type { ListingFormData } from '../../types';

interface ReviewSummaryProps {
  form: ListingFormData;
}

export default function ReviewSummary({ form }: ReviewSummaryProps) {
  const priceDisplay = form.price ? formatPrice(form.price) : '—';

  const rows = [
    { label: 'Title', value: form.title || '—' },
    { label: 'Category', value: form.categoryName || '—' },
    { label: 'Condition', value: form.condition },
    { label: 'Price', value: priceDisplay },
    { label: 'Location', value: form.location || '—' },
  ];

  return (
    <div className="rounded-xl bg-blue-50/80 border border-blue-100 p-5 space-y-4">
      <div className="flex items-center gap-2 text-brand-primary">
        <Eye className="w-5 h-5" />
        <h3 className="font-semibold text-brand-neutral">Review Your Listing</h3>
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-3">
        {rows.map((row) => (
          <div key={row.label}>
            <p className="text-xs text-text-muted">{row.label}</p>
            <p className="text-sm font-semibold text-brand-primary">{row.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
