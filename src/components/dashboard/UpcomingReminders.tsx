import Link from 'next/link';
import { CalendarDays, AlertTriangle, ArrowRight } from 'lucide-react';
import type { DashboardReminder } from '../../services/dashboardService';

export function UpcomingReminders({ reminders }: { reminders: DashboardReminder[] }) {
  return (
    <section className="card p-4 sm:p-6" aria-labelledby="upcoming-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="upcoming-title" className="text-lg font-semibold text-ink">Maintenance ahead</h2>
        <Link href="/reminders" className="inline-flex min-h-11 items-center gap-1 text-sm font-medium text-accent hover:underline">All reminders <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
      </div>
      <p className="mt-1 text-sm text-muted">Overdue items first, then the next 30 days and reminders without a due date.</p>
      {reminders.length ? <ul className="mt-4 divide-y divide-line">
        {reminders.map(reminder => {
          const Icon = reminder.overdue ? AlertTriangle : CalendarDays;
          return <li key={reminder.id}>
            <Link href="/reminders" className="-mx-2 flex items-start gap-3 rounded-lg px-2 py-4 hover:bg-canvas">
              <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${reminder.overdue ? 'text-accent' : 'text-muted'}`} aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="break-words text-sm font-semibold text-ink">{reminder.title}</p>
                  {reminder.overdue && <span className="rounded-full bg-accentSoft px-2 py-0.5 text-sm leading-5 font-medium text-accent">Overdue</span>}
                  {reminder.priority && <span className="text-sm leading-5 capitalize text-muted">{reminder.priority} priority</span>}
                </div>
                <p className="mt-1 break-words text-sm text-muted">{reminder.vehicleName}</p>
                <p className="mt-1 text-sm leading-5 text-muted">{reminder.dueDate ? `Due ${new Date(reminder.dueDate.slice(0, 10) + 'T12:00:00').toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}` : 'No due date set'}{reminder.dueMileage != null ? ` · ${reminder.dueMileage.toLocaleString('en-PH')} km` : ''}</p>
              </div>
            </Link>
          </li>;
        })}
      </ul> : <div className="mt-4 rounded-lg bg-canvas p-4">
        <p className="text-sm font-medium text-ink">Nothing due in the next 30 days</p>
        <p className="mt-1 text-sm text-muted">Your other reminders are still available in Reminders. Add a service reminder whenever you need one.</p>
      </div>}
    </section>
  );
}
