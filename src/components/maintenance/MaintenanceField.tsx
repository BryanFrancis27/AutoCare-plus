import { useId, type ReactNode } from 'react';
export const maintenanceControl = 'w-full min-w-0 min-h-11 rounded-lg border border-controlBorder bg-surface px-3 py-2 text-ink focus:ring-2 focus:ring-accent';
export function MaintenanceField({ name, label, error, required, children }: { name: string; label: string; error?: string; required?: boolean; children: (props: { id: string; name: string; 'aria-invalid': boolean; 'aria-describedby'?: string; required: boolean; className: string }) => ReactNode }) {
  const id = useId();
  return <div className="min-w-0"><label htmlFor={id} className="mb-2 block text-sm font-medium text-ink">{label}{required ? ' *' : ''}</label>{children({ id, name, 'aria-invalid': Boolean(error), 'aria-describedby': error ? `${id}-error` : undefined, required: Boolean(required), className: maintenanceControl })}{error && <p id={`${id}-error`} className="mt-1 text-sm text-accent">{error}</p>}</div>;
}
