import type { Reminder } from '@/types';
import { calendarDate } from '@/lib/vehicles/vehicle-model';

export type Schedule = 'overdue' | 'due-soon' | 'scheduled' | 'mileage-reached' | 'completed' | 'unknown';
export function localDateKey(now = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}
export function validDate(value: unknown): value is string {
  return typeof value === 'string' && calendarDate(value) !== 'Not recorded';
}
export function validMileage(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}
export function reminderPresentation(reminder: Pick<Reminder, 'dueDate' | 'dueMileage' | 'priority' | 'status' | 'isCompleted'>, mileage?: number | null, today = localDateKey()) {
  const days = validDate(reminder.dueDate) && validDate(today) ? Math.round((Date.parse(reminder.dueDate) - Date.parse(today)) / 86400000) : null;
  const remaining = validMileage(reminder.dueMileage) && validMileage(mileage) ? reminder.dueMileage - mileage : null;
  let schedule: Schedule = 'unknown';
  if (reminder.isCompleted || reminder.status === 'completed') schedule = 'completed';
  else if ((days !== null && days < 0) || reminder.status === 'overdue') schedule = 'overdue';
  else if (remaining !== null && remaining <= 0) schedule = 'mileage-reached';
  else if ((days !== null && days <= 30) || (remaining !== null && remaining <= 500)) schedule = 'due-soon';
  else if (days !== null || remaining !== null) schedule = 'scheduled';
  const labels: Record<Schedule, string> = { overdue: 'Overdue', 'due-soon': 'Due soon', scheduled: 'Scheduled', 'mileage-reached': 'Mileage threshold reached', completed: 'Completed', unknown: 'Insufficient information' };
  const reasons = [days !== null && days < 0 ? `${Math.abs(days)} calendar days past due` : null, remaining !== null && remaining <= 0 ? 'Recorded mileage has reached the threshold' : null, reminder.status === 'overdue' ? 'Stored status: overdue' : null].filter(Boolean);
  const priority = ['low', 'medium', 'high', 'critical'].includes(reminder.priority) ? reminder.priority : 'unknown';
  return { schedule, label: labels[schedule], priority, days, remaining, reason: reasons.join(' · '), overdue: schedule === 'overdue' || schedule === 'mileage-reached' };
}
