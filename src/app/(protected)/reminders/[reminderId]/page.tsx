import { Button, Card } from "@/components/ui";
import { PageHeader } from "@/components/layout";
import { getReminderById } from "@/app/actions/reminders";
import { getVehicleById } from "@/app/actions/vehicles";
import { formatDueDate, formatMileage, getPriorityColor, getMaintenanceCategoryById, calculateDaysUntilDue } from "@/lib/maintenance";
import { ReminderActions } from "./ReminderActions";
import Link from "next/link";

type Props = { params: { reminderId: string } };

export default async function ReminderDetailsPage({ params }: Props) {
  const { data: reminder, error } = await getReminderById(params.reminderId);

  if (error || !reminder) {
    return (
      <main className="flex-1 px-6 py-8 space-y-4">
        <PageHeader title="Reminder Details" description="Loading..." />
        <Card className="p-6">
          <p className="text-red-600">Error loading reminder: {error || 'Reminder not found'}</p>
        </Card>
      </main>
    );
  }

  // Fetch vehicle details if vehicleId exists
  const vehicleResult = reminder.vehicleId ? await getVehicleById(reminder.vehicleId) : null;
  const vehicle = vehicleResult?.data;

  // Get category details
  const category = reminder.serviceCategory ? getMaintenanceCategoryById(reminder.serviceCategory) : null;

  // Calculate days until due
  const daysUntil = reminder.dueDate ? calculateDaysUntilDue(reminder.dueDate) : null;
  const isOverdue = daysUntil !== null && daysUntil < 0;

  return (
    <main className="flex-1 px-6 py-8 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-textSecondary">
        <Link href="/reminders" className="hover:text-primary">Reminders</Link>
        <span>/</span>
        <span className="text-textPrimary">{reminder.title}</span>
      </div>

      <PageHeader
        title={reminder.title || 'Reminder Details'}
        description={reminder.description || 'Maintenance reminder'}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Details Card */}
        <Card className="p-6 lg:col-span-2 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-textPrimary mb-4">Reminder Details</h3>
            
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-xs text-textSecondary mb-1">Status</dt>
                <dd>
                  {reminder.isCompleted ? (
                    <span className="px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-800">
                      Completed
                    </span>
                  ) : isOverdue ? (
                    <span className="px-2 py-1 text-xs font-medium rounded bg-red-100 text-red-800">
                      Overdue
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800">
                      Pending
                    </span>
                  )}
                </dd>
              </div>

              <div>
                <dt className="text-xs text-textSecondary mb-1">Priority</dt>
                <dd>
                  <span className={`px-2 py-1 text-xs font-medium rounded ${getPriorityColor(reminder.priority)}`}>
                    {reminder.priority.toUpperCase()}
                  </span>
                </dd>
              </div>

              {reminder.dueDate && (
                <div>
                  <dt className="text-xs text-textSecondary mb-1">Due Date</dt>
                  <dd className="text-sm font-medium">
                    {formatDueDate(reminder.dueDate)}
                    {daysUntil !== null && (
                      <span className={`ml-2 text-xs ${isOverdue ? 'text-red-600' : 'text-textSecondary'}`}>
                        ({isOverdue ? `${Math.abs(daysUntil)} days overdue` : `in ${daysUntil} days`})
                      </span>
                    )}
                  </dd>
                </div>
              )}

              {reminder.dueMileage && (
                <div>
                  <dt className="text-xs text-textSecondary mb-1">Due Mileage</dt>
                  <dd className="text-sm font-medium">{formatMileage(reminder.dueMileage)}</dd>
                </div>
              )}

              {reminder.timeIntervalMonths && (
                <div>
                  <dt className="text-xs text-textSecondary mb-1">Time Interval</dt>
                  <dd className="text-sm font-medium">{reminder.timeIntervalMonths} months</dd>
                </div>
              )}

              {reminder.mileageIntervalKm && (
                <div>
                  <dt className="text-xs text-textSecondary mb-1">Mileage Interval</dt>
                  <dd className="text-sm font-medium">{formatMileage(reminder.mileageIntervalKm)}</dd>
                </div>
              )}
            </dl>
          </div>

          {category && (
            <div>
              <h3 className="text-lg font-semibold text-textPrimary mb-2">Service Category</h3>
              <div className="p-4 bg-gray-50 rounded">
                <p className="font-medium text-textPrimary">{category.name}</p>
                <p className="text-sm text-textSecondary mt-1">{category.description}</p>
              </div>
            </div>
          )}

          {reminder.notes && (
            <div>
              <h3 className="text-lg font-semibold text-textPrimary mb-2">Notes</h3>
              <div className="p-4 bg-gray-50 rounded text-sm text-textSecondary">
                {reminder.notes}
              </div>
            </div>
          )}
        </Card>

        {/* Vehicle & Actions Card */}
        <div className="space-y-6">
          {vehicle && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-textPrimary mb-4">Vehicle</h3>
              <div className="space-y-2">
                <p className="font-medium text-textPrimary">
                  {vehicle.year} {vehicle.make} {vehicle.model}
                </p>
                {vehicle.licensePlate && (
                  <p className="text-sm text-textSecondary">
                    License: {vehicle.licensePlate}
                  </p>
                )}
                {vehicle.currentMileage && (
                  <p className="text-sm text-textSecondary">
                    Current: {formatMileage(vehicle.currentMileage)}
                  </p>
                )}
                <Button
                  variant="secondary"
                  href={`/vehicles/${vehicle.id}`}
                  className="w-full mt-3"
                >
                  View Vehicle
                </Button>
              </div>
            </Card>
          )}

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-textPrimary mb-4">Actions</h3>
            <ReminderActions 
              reminderId={reminder.id} 
              vehicleId={reminder.vehicleId}
              isCompleted={reminder.isCompleted}
            />
          </Card>
        </div>
      </div>
    </main>
  );
}

