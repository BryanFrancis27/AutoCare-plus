"use client";

import { useState } from 'react';
import { Button, Card } from "@/components/ui";
import { PageHeader } from "@/components/layout";
import { AddReminderModal } from "@/components/reminders/AddReminderModal";
import { formatMileage, formatDueDate, getPriorityColor } from "@/lib/maintenance";
import { MaintenancePriority } from "@/types";
import { formatCurrencyPHP } from "@/lib/currency";

type Vehicle = {
  id: string;
  year: number;
  make: string;
  model: string;
  licensePlate?: string | null;
  vin?: string | null;
  vehicleType?: string | null;
  powertrain?: string | null;
  currentMileage?: number | null;
};

type Stats = {
  totalRecords: number;
  totalCost: number;
  upcomingServices: number;
};

type Reminder = {
  id: string;
  title: string | undefined;
  priority: string;
  dueDate?: string | null;
};

type Props = {
  vehicle: Vehicle;
  stats: Stats | null;
  upcomingReminders: Reminder[];
};

export function VehicleDetailsClient({ vehicle, stats, upcomingReminders }: Props) {
  const [isAddReminderModalOpen, setIsAddReminderModalOpen] = useState(false);

  return (
    <>
      {/* Mobile adjustment: adaptive spacing to avoid cramped layouts on phones */}
      <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8 space-y-6">
        <PageHeader
          title={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
          description={vehicle.licensePlate || "No license plate"}
          actions={
            <>
              <Button variant="secondary" href={`/vehicles/${vehicle.id}/edit`} className="w-full sm:w-auto">
                Edit Vehicle
              </Button>
              <Button href={`/vehicles/${vehicle.id}/maintenance/add`} className="w-full sm:w-auto">
                Log Maintenance
              </Button>
            </>
          }
        />

        {/* Vehicle Information */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="p-4 sm:p-6">
            <h2 className="font-semibold text-textPrimary mb-4">Vehicle Details</h2>
            <dl className="space-y-2">
              <div>
                <dt className="text-xs text-textSecondary">Make & Model</dt>
                <dd className="text-sm font-medium">{vehicle.make} {vehicle.model}</dd>
              </div>
              <div>
                <dt className="text-xs text-textSecondary">Year</dt>
                <dd className="text-sm font-medium">{vehicle.year}</dd>
              </div>
              <div>
                <dt className="text-xs text-textSecondary">License Plate</dt>
                <dd className="text-sm font-medium">{vehicle.licensePlate || "Not set"}</dd>
              </div>
              <div>
                <dt className="text-xs text-textSecondary">VIN</dt>
                <dd className="text-xs font-medium">{vehicle.vin || "Not set"}</dd>
              </div>
              {vehicle.vehicleType && (
                <div>
                  <dt className="text-xs text-textSecondary">Type</dt>
                  <dd className="text-sm font-medium capitalize">{vehicle.vehicleType}</dd>
                </div>
              )}
              {vehicle.powertrain && (
                <div>
                  <dt className="text-xs text-textSecondary">Powertrain</dt>
                  <dd className="text-sm font-medium capitalize">{vehicle.powertrain}</dd>
                </div>
              )}
              {vehicle.currentMileage && (
                <div>
                  <dt className="text-xs text-textSecondary">Current Mileage</dt>
                  <dd className="text-sm font-medium">{formatMileage(vehicle.currentMileage)}</dd>
                </div>
              )}
            </dl>
          </Card>

          <Card className="p-4 sm:p-6">
            {/* Mobile adjustment: stack card heading and CTA before `sm` breakpoint */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
              <h2 className="font-semibold text-textPrimary">Maintenance Summary</h2>
              <Button variant="secondary" href={`/vehicles/${vehicle.id}/maintenance`} className="w-full sm:w-auto">
                View All
              </Button>
            </div>
            {stats ? (
              <dl className="space-y-3">
                <div>
                  <dt className="text-xs text-textSecondary">Total Services</dt>
                  <dd className="text-2xl font-bold text-primary">{stats.totalRecords}</dd>
                </div>
                <div>
                  <dt className="text-xs text-textSecondary">Total Spent</dt>
                  <dd className="text-2xl font-bold text-textPrimary">{formatCurrencyPHP(stats.totalCost)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-textSecondary">Upcoming Services</dt>
                  <dd className="text-2xl font-bold text-accent">{stats.upcomingServices}</dd>
                </div>
              </dl>
            ) : (
              <p className="text-sm text-textSecondary">No maintenance records yet.</p>
            )}
          </Card>

          <Card className="p-4 sm:p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
              <h2 className="font-semibold text-textPrimary">Upcoming Reminders</h2>
              <Button 
                variant="secondary" 
                onClick={() => setIsAddReminderModalOpen(true)}
                className="w-full sm:w-auto"
              >
                Add
              </Button>
            </div>
            {upcomingReminders && upcomingReminders.length > 0 ? (
              <div className="space-y-2">
                {upcomingReminders.slice(0, 3).map((reminder) => (
                  <div key={reminder.id} className="p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <span className={`px-1.5 py-0.5 text-xs font-medium rounded ${getPriorityColor(reminder.priority as MaintenancePriority)}`}>
                        {reminder.priority.toUpperCase()}
                      </span>
                      <span className="text-sm font-medium">{reminder.title || 'No title'}</span>
                    </div>
                    {reminder.dueDate && (
                      <p className="text-xs text-textSecondary mt-1">
                        Due: {formatDueDate(reminder.dueDate)}
                      </p>
                    )}
                  </div>
                ))}
                {upcomingReminders.length > 3 && (
                  <p className="text-xs text-textSecondary text-center pt-2">
                    + {upcomingReminders.length - 3} more
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-textSecondary">No upcoming reminders.</p>
            )}
          </Card>
        </div>
      </main>

      {/* Add Reminder Modal */}
      <AddReminderModal
        isOpen={isAddReminderModalOpen}
        onClose={() => setIsAddReminderModalOpen(false)}
        vehicleId={vehicle.id}
        vehicleName={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
      />
    </>
  );
}
