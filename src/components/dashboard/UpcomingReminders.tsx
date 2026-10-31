import Link from 'next/link';
import { CalendarDays, AlertTriangle, ArrowRight } from 'lucide-react';
import type { DashboardReminder } from '../../services/dashboardService';
import { calendarDate } from '@/lib/vehicles/vehicle-model';

export function UpcomingReminders({ reminders }: { reminders: DashboardReminder[] }) {
  return (
    <section className="card p-4 sm:p-6" aria-labelledby="upcoming-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="upcoming-title" className="text-lg font-semibold text-ink">Maintenance ahead</h2>
        <Link href="/reminders" className="inline-flex min-h-11 items-center gap-1 text-sm font-medium text-accent hover:underline">All reminders <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
      </div>
      <p className="mt-1 text-sm text-muted">Overdue and reached mileage thresholds first, then services due soon and undated reminders.</p>
      {reminders.length ? <ul className="mt-4 divide-y divide-line">
        {reminders.map(reminder => {
          const Icon = reminder.overdue ? AlertTriangle : CalendarDays;
          return <li key={reminder.id}>
            <Link href="/reminders" className="-mx-2 flex items-start gap-3 rounded-lg px-2 py-4 hover:bg-canvas">
              <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${reminder.overdue ? 'text-accent' : 'text-muted'}`} aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="break-words text-sm font-semibold text-ink">{reminder.title}</p>
                  {reminder.scheduleLabel && <span className={`rounded-full px-2 py-0.5 text-sm leading-5 font-medium ${reminder.overdue ? 'bg-accentSoft text-accent' : 'bg-canvas text-ink'}`}>{reminder.scheduleLabel}</span>}
                  {reminder.priority && <span className="text-sm leading-5 capitalize text-muted">{reminder.priority} priority</span>}
                </div>
                <p className="mt-1 break-words text-sm text-muted">{reminder.vehicleName}</p>
                <p className="mt-1 text-sm leading-5 text-muted">{reminder.dueDate ? `Due ${calendarDate(reminder.dueDate)}` : 'No due date set'}</p>
                {reminder.dueMileage != null && <p className="mt-1 text-sm text-muted">Due at {reminder.dueMileage.toLocaleString('en-PH')} km</p>}
                {reminder.remaining != null && reminder.remaining > 0 && <p className="mt-1 text-sm text-muted">{reminder.remaining.toLocaleString('en-PH')} km remaining</p>}
              </div>
            </Link>
          </li>;
        })}
      </ul> : <div className="mt-4 rounded-lg bg-canvas p-4">
        <p className="text-sm font-medium text-ink">No reminders in this preview</p>
        <p className="mt-1 text-sm text-muted">Your other reminders are still available in Reminders. Add a service reminder whenever you need one.</p>
      </div>}
    </section>
  );
}
