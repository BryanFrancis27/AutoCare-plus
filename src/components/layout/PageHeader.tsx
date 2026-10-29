import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      {/* Mobile adjustment: stack title and actions on small screens to avoid overflow */}
      <div className="space-y-1 min-w-0">
        <h1 className="text-2xl sm:text-3xl font-semibold text-ink break-words">{title}</h1>
        {description && <p className="text-sm sm:text-base text-textSecondary">{description}</p>}
      </div>
      {actions && <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">{actions}</div>}
    </div>
  );
}
