import type { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
}

export function MetricCard({ label, value, icon: Icon, description }: MetricCardProps) {
  return (
    <div className="card min-w-0 p-4 sm:p-5">
      <div className="flex items-center gap-2 text-muted">
        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
        <p className="text-sm font-medium">{label}</p>
      </div>
      <p className="mt-2 break-words text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{value}</p>
      {description && <p className="mt-1 text-sm leading-5 text-muted">{description}</p>}
    </div>
  );
}
