'use client';
import { MaintenanceForm, type ServiceVehicle } from '@/components/maintenance/MaintenanceForm';
export function AddMaintenanceForm({ vehicleId, vehicle }: { vehicleId: string; vehicle: ServiceVehicle }) {
  return <div className="card p-4 sm:p-6"><MaintenanceForm vehicleId={vehicleId} vehicles={[vehicle]} /></div>;
}
