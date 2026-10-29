import { LucideIcon } from 'lucide-react';
import { LoadingState } from '@/components/ui';

interface MetricCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  iconBgColor: string;
  loading?: boolean;
}

export function MetricCard({ label, value, icon: Icon, iconBgColor, loading = false }: MetricCardProps) {
  return (
    <div className="bg-containerBg rounded-xl shadow-sm border border-grayBorder p-6">
      <div className="flex items-center justify-between">
        {loading ? (
          <LoadingState mode="inline" label={`Loading ${label.toLowerCase()}...`} />
        ) : (
          <div>
            <p className="text-sm font-medium text-textSecondary">{label}</p>
            <p className="text-3xl font-bold text-ink mt-1">{value}</p>
          </div>
        )}
        <div className="p-3 rounded-lg bg-redPrimary">
          <Icon className="h-6 w-6 text-onAccent" />
        </div>
      </div>
    </div>
  );
}
