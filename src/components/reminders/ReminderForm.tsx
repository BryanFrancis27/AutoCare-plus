'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui';
import { createReminder } from '@/app/actions/reminders';
import { validateReminder, reminderSubmission, type ReminderDraft, type FieldErrors } from '@/lib/maintenance/forms';
import { useConfirmedSubmit } from '@/lib/maintenance/use-confirmed-submit';
import { MaintenanceField as Field } from '@/components/maintenance/MaintenanceField';
const types = ['Oil Change', 'Tire Rotation', 'Brake Inspection', 'Air Filter', 'Transmission Service', 'Coolant Flush', 'Battery Check', 'Wheel Alignment', 'Inspection', 'Registration Renewal', 'Insurance Renewal', 'Custom'];
const categories = ['Engine', 'Transmission', 'Brakes', 'Tires', 'Fluids', 'Electrical', 'Inspection', 'Documentation', 'Other'];
export function ReminderForm({ vehicleId, vehicleName, onSuccess, onCancel, onPendingChange }: { vehicleId: string; vehicleName?: string; onSuccess?: () => void; onCancel: () => void; onPendingChange?: (pending: boolean) => void }) {
  const router = useRouter();
  const [form, setForm] = useState<ReminderDraft>({ vehicleId, title: '', reminderType: '', serviceCategory: '', description: '', dueDate: '', dueMileage: '', priority: 'medium', notes: '' });
  const [errors, setErrors] = useState<FieldErrors>({});
  const { pending, error, submit } = useConfirmedSubmit();
  const change = (key: keyof ReminderDraft, value: string) => setForm(old => ({ ...old, [key]: value }));
  async function save(event: React.FormEvent) {
    event.preventDefault();
    const validation = validateReminder(form); setErrors(validation);
    if (Object.keys(validation).length) return;
    await submit(async () => { onPendingChange?.(true); try { return await createReminder(reminderSubmission(form)); } finally { onPendingChange?.(false); } }, () => { router.refresh(); onSuccess?.(); });
  }
  return <form noValidate onSubmit={save} aria-busy={pending} className="space-y-5">
    <p className="rounded-lg bg-canvas p-3 text-sm text-ink">Vehicle: {vehicleName || 'Selected vehicle'}</p>
    <p className="text-sm text-muted">* Required. Provide a date, mileage threshold, or both. Either threshold can make a reminder due. Priority describes importance; it does not change the schedule.</p>
    {error && <p role="alert" className="rounded-lg bg-accentSoft p-3 text-sm text-accent">{error}</p>}
    {Object.keys(errors).length > 0 && <p role="alert" className="text-sm text-accent">Review the marked fields.</p>}
    <fieldset disabled={pending} className="min-w-0 space-y-4">
      <Field name="title" label="Title" required error={errors.title}>{props => <input {...props} value={form.title} onChange={e => change('title', e.target.value)} />}</Field>
      <div className="maintenance-form-grid">
        <Field name="reminderType" label="Reminder type" required error={errors.reminderType}>{props => <select {...props} value={form.reminderType} onChange={e => change('reminderType', e.target.value)}><option value="">Select type</option>{types.map(type => <option key={type}>{type}</option>)}</select>}</Field>
        <Field name="serviceCategory" label="Category" required error={errors.serviceCategory}>{props => <select {...props} value={form.serviceCategory} onChange={e => change('serviceCategory', e.target.value)}><option value="">Select category</option>{categories.map(category => <option key={category}>{category}</option>)}</select>}</Field>
        <Field name="priority" label="Priority" required error={errors.priority}>{props => <select {...props} value={form.priority} onChange={e => change('priority', e.target.value)}>{['low', 'medium', 'high', 'critical'].map(priority => <option key={priority} value={priority}>{priority.charAt(0).toUpperCase() + priority.slice(1)}</option>)}</select>}</Field>
        <Field name="dueDate" label="Due date" error={errors.dueDate}>{props => <input {...props} type="date" value={form.dueDate} onChange={e => change('dueDate', e.target.value)} />}</Field>
        <Field name="dueMileage" label="Due mileage (km)" error={errors.dueMileage}>{props => <input {...props} inputMode="decimal" value={form.dueMileage} onChange={e => change('dueMileage', e.target.value)} />}</Field>
      </div>
      <Field name="description" label="Description (optional)">{props => <textarea {...props} rows={2} value={form.description} onChange={e => change('description', e.target.value)} />}</Field>
      <Field name="notes" label="Notes (optional)">{props => <textarea {...props} rows={2} value={form.notes} onChange={e => change('notes', e.target.value)} />}</Field>
    </fieldset>
    <div className="flex flex-wrap justify-end gap-3"><Button type="button" variant="secondary" disabled={pending} onClick={onCancel}>Cancel</Button><Button type="submit" disabled={pending}>{pending ? 'Creating reminder…' : 'Create Reminder'}</Button></div>
  </form>;
}
