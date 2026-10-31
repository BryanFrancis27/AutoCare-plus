'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui';
import { createMaintenanceRecord, updateMaintenanceRecord } from '@/app/actions/maintenance';
import { MAINTENANCE_CATEGORIES } from '@/lib/maintenance';
import { localDateKey } from '@/lib/maintenance/presentation';
import { validateService, serviceSubmission, type FieldErrors, type ServiceDraft } from '@/lib/maintenance/forms';
import { useConfirmedSubmit } from '@/lib/maintenance/use-confirmed-submit';
import { MaintenanceField as Field } from './MaintenanceField';
import type { MaintenanceRecord } from '@/types';

export type ServiceVehicle = { id: string; label: string; currentMileage: number | null };
export function MaintenanceForm({ vehicles, vehicleId, record, onSuccess, onCancel, onPendingChange }: { vehicles: ServiceVehicle[]; vehicleId?: string; record?: MaintenanceRecord; onSuccess?: () => void; onCancel?: () => void; onPendingChange?: (pending: boolean) => void }) {
  const router = useRouter();
  const selected = vehicles.find(v => v.id === (record?.vehicleId ?? vehicleId)) ?? vehicles[0];
  const [form, setForm] = useState<ServiceDraft>(() => ({ vehicleId: record?.vehicleId ?? selected?.id ?? '', serviceCategory: record?.serviceCategory ?? '', serviceType: record?.serviceType ?? '', serviceDate: record?.serviceDate ?? localDateKey(), mileage: String(record?.mileage ?? selected?.currentMileage ?? ''), cost: String(record?.cost ?? ''), notes: record?.notes ?? '' }));
  const [errors, setErrors] = useState<FieldErrors>({});
  const { pending, error, submit } = useConfirmedSubmit();
  const change = (key: keyof ServiceDraft, value: string) => setForm(old => ({ ...old, [key]: value }));
  async function save(event: React.FormEvent) {
    event.preventDefault();
    const validation = validateService(form); setErrors(validation);
    if (Object.keys(validation).length) return;
    await submit(async () => {
      onPendingChange?.(true);
      try { return record ? await updateMaintenanceRecord({ ...serviceSubmission(form), id: record.id, receiptUrl: record.receiptUrl }) : await createMaintenanceRecord(serviceSubmission(form)); }
      finally { onPendingChange?.(false); }
    }, () => { router.refresh(); if (onSuccess) onSuccess(); else router.push(`/vehicles/${form.vehicleId}/maintenance`); });
  }
  return <form noValidate onSubmit={save} className="space-y-5" aria-busy={pending}>
    <p className="text-sm text-muted">Record a service you have performed. * Required. Leave cost blank for a zero-cost service.</p>
    {error && <p role="alert" className="rounded-lg border border-accent bg-accentSoft p-3 text-sm text-accent">{error}</p>}
    {Object.keys(errors).length > 0 && <p role="alert" className="text-sm text-accent">Review the marked fields.</p>}
    <fieldset disabled={pending} className="min-w-0 space-y-4">
      <Field name="vehicleId" label="Vehicle" error={errors.vehicleId} required>{props => <select {...props} value={form.vehicleId} disabled={Boolean(vehicleId || record)} onChange={e => { const vehicle = vehicles.find(v => v.id === e.target.value); setForm(old => ({ ...old, vehicleId: e.target.value, mileage: String(vehicle?.currentMileage ?? '') })); }}><option value="">Select vehicle</option>{vehicles.map(v => <option key={v.id} value={v.id}>{v.label}</option>)}</select>}</Field>
      <div className="maintenance-form-grid">
        <Field name="serviceCategory" label="Service category" error={errors.serviceCategory} required>{props => <select {...props} value={form.serviceCategory} onChange={e => { const category = MAINTENANCE_CATEGORIES.find(c => c.id === e.target.value); setForm(old => ({ ...old, serviceCategory: e.target.value, serviceType: category?.name ?? old.serviceType })); }}><option value="">Select category</option>{MAINTENANCE_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}{form.serviceCategory && !MAINTENANCE_CATEGORIES.some(c => c.id === form.serviceCategory) && <option value={form.serviceCategory}>{form.serviceCategory}</option>}</select>}</Field>
        <Field name="serviceType" label="Service type" error={errors.serviceType} required>{props => <input {...props} value={form.serviceType} onChange={e => change('serviceType', e.target.value)} />}</Field>
        <Field name="serviceDate" label="Service date" error={errors.serviceDate} required>{props => <input {...props} type="date" value={form.serviceDate} onChange={e => change('serviceDate', e.target.value)} />}</Field>
        <Field name="mileage" label="Recorded mileage (km)" error={errors.mileage} required>{props => <input {...props} inputMode="decimal" value={form.mileage} onChange={e => change('mileage', e.target.value)} />}</Field>
        <Field name="cost" label="Cost (PHP)" error={errors.cost}>{props => <input {...props} inputMode="decimal" placeholder="0.00" value={form.cost} onChange={e => change('cost', e.target.value)} />}</Field>
      </div>
      <Field name="notes" label="Notes (optional)">{props => <textarea {...props} rows={3} value={form.notes} onChange={e => change('notes', e.target.value)} />}</Field>
    </fieldset>
    <div className="flex flex-wrap justify-end gap-3"><Button type="button" variant="secondary" disabled={pending} onClick={() => onCancel ? onCancel() : router.push(`/vehicles/${form.vehicleId}/maintenance`)}>Cancel</Button><Button type="submit" disabled={pending || !vehicles.length}>{pending ? 'Saving record…' : record ? 'Update Record' : 'Save Maintenance Record'}</Button></div>
  </form>;
}
