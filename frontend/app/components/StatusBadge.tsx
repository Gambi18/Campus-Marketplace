/**
 * Default status → colour map covering payment and report statuses. These are
 * consistent across the app (pending is always amber, released always green, …),
 * so a single map serves purchases, sales, reports and escrow tables.
 */
const DEFAULT_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-warning-bg text-warning',
  held: 'bg-info-bg text-info',
  released: 'bg-success-bg text-success',
  refunded: 'bg-danger-bg text-danger',
  expired: 'bg-gray-100 text-gray-600',
  resolved: 'bg-success-bg text-success',
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
