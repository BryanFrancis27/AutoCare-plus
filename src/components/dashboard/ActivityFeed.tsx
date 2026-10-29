import Link from 'next/link';
import { Car, Wrench, Clock3 } from 'lucide-react';
import type { DashboardActivity } from '../../services/dashboardService';

export function ActivityFeed({ activities }: { activities: DashboardActivity[] }) {
  return (
    <section className="card p-4 sm:p-6" aria-labelledby="activity-title">
      <h2 id="activity-title" className="text-lg font-semibold text-ink">Recent activity</h2>
      <p className="mt-1 text-sm text-muted">Your latest vehicle additions and service records.</p>
      {activities.length ? <ul className="mt-4 divide-y divide-line">
        {activities.map(activity => {
          const Icon = activity.type === 'maintenance' ? Wrench : Car;
          return <li key={activity.id} className="flex items-start gap-3 py-4">
            <span className="rounded-lg bg-canvas p-2 text-muted"><Icon className="h-4 w-4" aria-hidden="true" /></span>
            <div className="min-w-0 flex-1">
              <p className="break-words text-sm font-medium text-ink">{activity.description}</p>
              <Link href={`/vehicles/${activity.vehicleId}`} className="mt-1 inline-block break-words text-sm text-accent hover:underline">{activity.vehicleName}</Link>
              <time dateTime={activity.date} className="mt-1 block text-sm leading-5 text-muted">{new Date(activity.date.length === 10 ? activity.date + 'T12:00:00' : activity.date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}</time>
            </div>
          </li>;
        })}
      </ul> : <div className="mt-4 flex items-start gap-3 rounded-lg bg-canvas p-4">
        <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-muted" aria-hidden="true" />
        <p className="text-sm text-muted">No recent activity yet. Your vehicle additions and maintenance records will appear here.</p>
      </div>}
    </section>
  );
}
