'use client';

import { Eye, Pencil, Trash2, Wrench, ReceiptText } from 'lucide-react';
import { classificationLabel, formatRecordedMileage, vehicleIdentity, vehicleName, type GarageVehicle } from '@/lib/vehicles/garage-model';
import { VehicleImage } from './VehicleImage';

interface GarageVehicleCardProps {
  vehicle: GarageVehicle;
  featured?: boolean;
  onView: (vehicle: GarageVehicle) => void;
  onDelete: (vehicle: GarageVehicle) => void;
  onLogMaintenance: (vehicle: GarageVehicle) => void;
  onServiceHistory: (vehicle: GarageVehicle) => void;
}
export function GarageVehicleCard({ vehicle, featured = false, onView, onDelete, onLogMaintenance, onServiceHistory }: GarageVehicleCardProps) {
  const identity = vehicleIdentity(vehicle);
  return <article className={`flex h-full min-w-0 flex-col overflow-hidden rounded-card border border-line bg-surface shadow-card transition-colors hover:border-accent/30 ${featured ? "garage-vehicle-card-featured" : ""}`} aria-labelledby={`vehicle-${vehicle.id}-title`}>
    <VehicleImage src={vehicle.image_url} name={identity} featured={featured} />
    <div className="garage-vehicle-body flex min-w-0 flex-1 flex-col p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
        <span>{vehicle.year ?? 'Year not recorded'}</span>
        {vehicle.vehicle_type && <span>{classificationLabel(vehicle.vehicle_type)}</span>}
      </div>
      <h2 id={`vehicle-${vehicle.id}-title`} className="mt-1 break-words text-xl font-semibold tracking-tight text-ink">{vehicleName(vehicle) || 'Vehicle details not recorded'}</h2>
      <p className="mt-1 break-words text-sm text-muted">{vehicle.plate_number || 'License plate not recorded'}</p>
      <dl className="my-4 grid grid-cols-2 gap-3 rounded-lg border border-line bg-canvas p-3 text-sm">
        <div className="min-w-0"><dt className="text-muted">Recorded mileage</dt><dd className="mt-1 break-words font-semibold text-ink">{formatRecordedMileage(vehicle.current_mileage)}</dd></div>
        <div className="min-w-0"><dt className="text-muted">Powertrain</dt><dd className="mt-1 break-words font-medium text-ink">{classificationLabel(vehicle.powertrain)}</dd></div>
      </dl>
      <p className="mb-4 max-w-prose text-sm leading-5 text-muted">Record services to keep this vehicle&apos;s maintenance history up to date.</p>
      <div className="garage-vehicle-actions mt-auto space-y-2">
        <button type="button" onClick={() => onView(vehicle)} aria-label={`View vehicle: ${identity}`} className="button-primary min-h-11 w-full gap-2"><Eye className="h-4 w-4" aria-hidden="true" />View Vehicle</button>
        <div className="grid gap-2 sm:grid-cols-2">
          <button type="button" onClick={() => onLogMaintenance(vehicle)} aria-label={`Log maintenance for ${identity}`} className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-controlBorder px-3 py-2 text-sm font-medium text-ink hover:bg-canvas"><Wrench className="h-4 w-4 shrink-0" aria-hidden="true" />Log Maintenance</button>
          <button type="button" onClick={() => onServiceHistory(vehicle)} aria-label={`Service and expenses for ${identity}`} className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-controlBorder px-3 py-2 text-sm font-medium text-ink hover:bg-canvas"><ReceiptText className="h-4 w-4 shrink-0" aria-hidden="true" />Service &amp; Expenses</button>
        </div>
        <div className="flex flex-wrap justify-between gap-2 border-t border-line pt-2">
          <a href={`/vehicles/${vehicle.id}/edit`} aria-label={`Edit vehicle: ${identity}`} className="flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-medium text-ink hover:bg-canvas"><Pencil className="h-4 w-4" aria-hidden="true" />Edit Vehicle</a>
          <button type="button" onClick={() => onDelete(vehicle)} aria-label={`Delete vehicle: ${identity}`} className="flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-medium text-accent hover:bg-accentSoft"><Trash2 className="h-4 w-4" aria-hidden="true" />Delete Vehicle</button>
        </div>
      </div>
    </div>
  </article>;
}
