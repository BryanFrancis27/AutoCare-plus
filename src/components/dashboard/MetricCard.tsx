import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  iconBgColor: string;
  loading?: boolean;
}

const MetricSkeleton = () => (
  <div className="animate-pulse">
    <div className="h-4 w-24 bg-grayBorder rounded mb-2"></div>
    <div className="h-8 w-16 bg-grayBorder rounded"></div>
  </div>
);

export function MetricCard({ label, value, icon: Icon, iconBgColor, loading = false }: MetricCardProps) {
  return (
    <div className="bg-containerBg rounded-xl shadow-sm border border-grayBorder p-6">
      <div className="flex items-center justify-between">
        {loading ? (
          <MetricSkeleton />
        ) : (
          <div>
            <p className="text-sm font-medium text-textSecondary">{label}</p>
            <p className="text-3xl font-bold text-whitePure mt-1">{value}</p>
          </div>
        )}
        <div className="p-3 rounded-lg bg-redPrimary">
          <Icon className="h-6 w-6 text-whitePure" />
        </div>
      </div>
    </div>
  );
}
