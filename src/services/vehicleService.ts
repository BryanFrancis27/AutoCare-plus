import { getMaintenanceStats } from '@/app/actions/maintenance';
import { getRemindersForVehicle } from '@/app/actions/reminders';
import { vehicleReminders } from '@/lib/vehicles/vehicle-model';

export async function getVehicleOverview(vehicleId: string) {
  const [maintenance, reminders] = await Promise.all([
    getMaintenanceStats(vehicleId).catch(() => ({ data: null, error: 'Unavailable' })),
    getRemindersForVehicle(vehicleId).catch(() => ({ data: null, error: 'Unavailable' })),
  ]);
  return {
    stats: maintenance.error ? null : maintenance.data,
    maintenanceError: Boolean(maintenance.error || !maintenance.data),
    upcomingReminders: vehicleReminders(reminders.data ?? [], vehicleId),
    remindersError: Boolean(reminders.error || !reminders.data),
  };
}
