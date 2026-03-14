import { Card, Button } from "@/components/ui";
import { PageHeader } from "@/components/layout";
import { getAllReminders } from "@/app/actions/reminders";
import { formatDueDate, getPriorityColor, getReminderStatusMessage, calculateDaysUntilDue } from "@/lib/maintenance";
import Link from "next/link";

export default async function RemindersPage() {
  const { data: reminders, error } = await getAllReminders();

  if (error) {
    return (
      <main className="flex-1 px-6 py-8 space-y-4">
        <PageHeader title="Reminders" description="Upcoming and overdue service reminders." />
        <Card className="p-6">
          <p className="text-red-600">Error loading reminders: {error}</p>
        </Card>
      </main>
    );
  }

  // Categorize reminders
  const overdue = reminders?.filter(r => !r.isCompleted && r.dueDate && new Date(r.dueDate) < new Date()) || [];
  const upcoming = reminders?.filter(r => !r.isCompleted && r.dueDate && new Date(r.dueDate) >= new Date()) || [];
  const completed = reminders?.filter(r => r.isCompleted) || [];

  return (
    <main className="flex-1 px-6 py-8 space-y-6">
      <PageHeader
        title="Service Reminders"
        description="Track and manage upcoming vehicle maintenance."
      />

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4">
          <div className="text-sm font-medium text-textSecondary">Overdue</div>
          <div className="text-3xl font-bold text-red-600">{overdue.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-medium text-textSecondary">Upcoming</div>
          <div className="text-3xl font-bold text-blue-600">{upcoming.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-medium text-textSecondary">Completed</div>
          <div className="text-3xl font-bold text-green-600">{completed.length}</div>
        </Card>
      </div>

      {/* Overdue Reminders */}
      {overdue.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-textPrimary">Overdue ({overdue.length})</h2>
          <div className="space-y-2">
            {overdue.map((reminder) => (
              <Card key={reminder.id} className="p-4 border-l-4 border-red-500">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-textPrimary">{reminder.title || reminder.reminderType}</h3>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded ${getPriorityColor(reminder.priority)}`}>
                        {reminder.priority.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-textSecondary mt-1">{reminder.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-textSecondary">
                      {reminder.dueDate && (
                        <span>Due: {formatDueDate(reminder.dueDate)} ({Math.abs(calculateDaysUntilDue(reminder.dueDate))} days overdue)</span>
                      )}
                      {reminder.dueMileage && <span>Due at: {reminder.dueMileage.toLocaleString()} km</span>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="secondary" href={`/reminders/${reminder.id}`}>
                      View
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Upcoming Reminders */}
      {upcoming.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-textPrimary">Upcoming ({upcoming.length})</h2>
          <div className="space-y-2">
            {upcoming.map((reminder) => {
              const daysUntil = reminder.dueDate ? calculateDaysUntilDue(reminder.dueDate) : null;
              return (
                <Card key={reminder.id} className="p-4 border-l-4 border-blue-500">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-textPrimary">{reminder.title || reminder.reminderType}</h3>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded ${getPriorityColor(reminder.priority)}`}>
                          {reminder.priority.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-textSecondary mt-1">{reminder.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-textSecondary">
                        {reminder.dueDate && (
                          <span>Due: {formatDueDate(reminder.dueDate)} {daysUntil !== null && `(in ${daysUntil} days)`}</span>
                        )}
                        {reminder.dueMileage && <span>Due at: {reminder.dueMileage.toLocaleString()} km</span>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="secondary" href={`/reminders/${reminder.id}`}>
                        View
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {/* Completed Reminders */}
      {completed.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-textPrimary">Completed ({completed.length})</h2>
          <div className="space-y-2">
            {completed.slice(0, 5).map((reminder) => (
              <Card key={reminder.id} className="p-4 bg-gray-50 opacity-75">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-textPrimary line-through">{reminder.title || reminder.reminderType}</h3>
                      <span className="px-2 py-0.5 text-xs font-medium rounded bg-green-50 text-green-600">
                        COMPLETED
                      </span>
                    </div>
                    <p className="text-sm text-textSecondary mt-1">{reminder.description}</p>
                  </div>
                </div>
              </Card>
            ))}
            {completed.length > 5 && (
              <p className="text-sm text-textSecondary text-center pt-2">
                And {completed.length - 5} more completed reminders
              </p>
            )}
          </div>
        </section>
      )}

      {/* Empty State */}
      {reminders && reminders.length === 0 && (
        <Card className="p-12 text-center">
          <h3 className="text-lg font-semibold text-textPrimary mb-2">No Reminders Yet</h3>
          <p className="text-textSecondary mb-6">
            Add vehicles to automatically generate maintenance reminders.
          </p>
          <Button href="/vehicles">View Vehicles</Button>
        </Card>
      )}
    </main>
  );
}
