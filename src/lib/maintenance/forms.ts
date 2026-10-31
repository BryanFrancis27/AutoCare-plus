import { validDate } from './presentation';
export type ServiceDraft = { vehicleId: string; serviceCategory: string; serviceType: string; serviceDate: string; mileage: string; cost: string; notes: string };
export type ReminderDraft = { vehicleId: string; title: string; reminderType: string; serviceCategory: string; description: string; dueDate: string; dueMileage: string; priority: string; notes: string };
export type FieldErrors = Partial<Record<string, string>>;
export function nonNegative(value: string): boolean {
  return /^\d+(\.\d+)?$/.test(value) && Number.isFinite(Number(value));
}
export function validateService(form: ServiceDraft): FieldErrors {
  const errors: FieldErrors = {};
  for (const key of ['vehicleId', 'serviceCategory', 'serviceType'] as const) if (!form[key].trim()) errors[key] = 'This field is required.';
  if (!validDate(form.serviceDate)) errors.serviceDate = 'Enter a valid calendar date.';
  if (!nonNegative(form.mileage)) errors.mileage = 'Enter a finite, non-negative mileage in km.';
  if (form.cost !== '' && !nonNegative(form.cost)) errors.cost = 'Enter a finite, non-negative cost in PHP.';
  return errors;
}
export function serviceSubmission(form: ServiceDraft) {
  return { ...form, serviceType: form.serviceType.trim(), mileage: Number(form.mileage), cost: form.cost === '' ? 0 : Number(form.cost), notes: form.notes || undefined };
}
export function validateReminder(form: ReminderDraft): FieldErrors {
  const errors: FieldErrors = {};
  for (const key of ['vehicleId', 'title', 'reminderType', 'serviceCategory'] as const) if (!form[key].trim()) errors[key] = 'This field is required.';
  if (!form.dueDate && !form.dueMileage) errors.dueDate = errors.dueMileage = 'Provide a due date or mileage threshold.';
  if (form.dueDate && !validDate(form.dueDate)) errors.dueDate = 'Enter a valid calendar date.';
  if (form.dueMileage && !nonNegative(form.dueMileage)) errors.dueMileage = 'Enter a finite, non-negative mileage in km.';
  if (!['low', 'medium', 'high', 'critical'].includes(form.priority)) errors.priority = 'Select a priority.';
  return errors;
}
export function reminderSubmission(form: ReminderDraft) {
  return { ...form, title: form.title.trim(), dueDate: form.dueDate || undefined, dueMileage: form.dueMileage === '' ? undefined : Number(form.dueMileage), notes: form.notes || undefined };
}
