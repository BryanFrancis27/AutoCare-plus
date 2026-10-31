'use client';
import { MaintenanceForm } from '@/components/maintenance/MaintenanceForm';
import type { MaintenanceRecord } from '@/types';
export function EditMaintenanceForm({ record }: { record: MaintenanceRecord }) {
  return <div className="card p-4 sm:p-6"><MaintenanceForm record={record} vehicles={[{ id: record.vehicleId, label: 'Vehicle associated with this record', currentMileage: record.mileage }]} /></div>;
}
