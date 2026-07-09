/**
 * Default status → colour map covering payment and report statuses. These are
 * consistent across the app (pending is always amber, released always green, …),
 * so a single map serves purchases, sales, reports and escrow tables.
 */
const DEFAULT_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  held: 'bg-blue-100 text-blue-800',
  released: 'bg-green-100 text-green-800',
  refunded: 'bg-red-100 text-red-800',
  expired: 'bg-gray-100 text-gray-600',
  resolved: 'bg-green-100 text-green-800',
  dismissed: 'bg-gray-100 text-gray-600',
};

interface StatusBadgeProps {
  status: string;
  /** Override the status→classes map (e.g. admin account statuses). */
  colors?: Record<string, string>;
  /** Base wrapper classes; defaults to a rounded-full pill. */
  baseClassName?: string;
  /** Fallback classes for an unknown status. */
  fallback?: string;
}

export default function StatusBadge({
  status,
  colors = DEFAULT_STATUS_COLORS,
  baseClassName = 'px-2 py-0.5 rounded-full text-xs font-medium',
  fallback = 'bg-gray-100 text-gray-600',
}: StatusBadgeProps) {
  return (
    <span className={`${baseClassName} ${colors[status] || fallback}`}>
      {status}
    </span>
  );
}
