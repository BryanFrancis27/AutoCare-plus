import { reminderPresentation } from '@/lib/maintenance/presentation';
import { calendarDate } from '@/lib/vehicles/vehicle-model';
import { formatRecordedMileage } from '@/lib/vehicles/garage-model';
import type { Reminder } from '@/types';
export function ReminderSchedule({ reminder, mileage }: { reminder: Reminder; mileage?: number | null }) {
  const state = reminderPresentation(reminder, mileage);
  return <div className="mt-3 space-y-2 text-sm">
    <div className="flex flex-wrap gap-2"><span className={`rounded-md px-2 py-1 font-medium ${state.schedule === 'completed' ? 'bg-green-50 text-success' : state.overdue ? 'bg-accentSoft text-accent' : 'bg-canvas text-ink'}`}>{state.label}</span><span className="rounded-md bg-canvas px-2 py-1 capitalize text-muted">{state.priority} priority</span></div>
    <p className="text-muted">Due date: {calendarDate(reminder.dueDate)}{state.days === 0 ? ' · Today' : ''}</p>
    <p className="text-muted">Due mileage: {formatRecordedMileage(reminder.dueMileage)}{state.remaining !== null && state.schedule !== 'completed' ? ` · ${state.remaining > 0 ? `${formatRecordedMileage(state.remaining)} remaining` : `${formatRecordedMileage(Math.abs(state.remaining))} past threshold`}` : ''}</p>
    {state.reason && state.schedule !== 'completed' && <p className="text-muted">{state.reason}</p>}
  </div>;
}
