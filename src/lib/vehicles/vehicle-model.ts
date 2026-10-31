import type { GarageVehicle } from './garage-model';
import type { Reminder } from '@/types';

const text = (value: unknown): string | null => typeof value === 'string' ? value : null;
const numeric = (value: unknown): number | null => {
  if (typeof value !== 'number' && typeof value !== 'string') return null;
  if (typeof value === 'string' && !value.trim()) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

// Only persisted, supported fields enter the presentation/form contract.
export function normalizeVehicle(row: Record<string, unknown>): GarageVehicle {
  return {
    id: text(row.id) ?? '', make: text(row.make) ?? '', model: text(row.model) ?? '',
    year: numeric(row.year),
    plate_number: text(row.plate_number !== undefined ? row.plate_number : row.license_plate),
    vehicle_type: text(row.vehicle_type), powertrain: text(row.powertrain),
    transmission: text(row.transmission), color: text(row.color),
    current_mileage: numeric(row.current_mileage),
    purchase_date: text(row.purchase_date), purchase_price: numeric(row.purchase_price),
    notes: text(row.notes), image_url: text(row.image_url !== undefined ? row.image_url : row.photo_url !== undefined ? row.photo_url : row.image),
    created_at: text(row.created_at),
  };
}

export function vehicleReminders(reminders: Reminder[], vehicleId: string): Reminder[] {
  return reminders.filter(reminder => reminder.vehicleId === vehicleId && !reminder.isCompleted && reminder.status !== 'completed');
}

export function calendarDate(value: string | null | undefined): string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return 'Not recorded';
  const date = new Date(`${value}T12:00:00Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) return 'Not recorded';
  return new Intl.DateTimeFormat('en-PH', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(date);
}

export type VehicleFormData = {
  make: string; model: string; year: string; licensePlate: string; color: string;
  vehicleType: string; powertrain: string; transmission: string; currentMileage: string;
  purchaseDate: string; purchasePrice: string; notes: string;
};
export type VehicleFormErrors = Partial<Record<keyof VehicleFormData, string>>;
export const VEHICLE_STEPS = ['Basic Information', 'Technical & Mileage Details', 'Ownership & Photo'];
export const STEP_FIELDS: (keyof VehicleFormData)[][] = [
  ['make', 'model', 'year', 'vehicleType', 'licensePlate', 'color'],
  ['powertrain', 'transmission', 'currentMileage'], ['purchaseDate', 'purchasePrice', 'notes'],
];
export const VEHICLE_FIELD_LABELS: Record<keyof VehicleFormData, string> = {
  make: 'Make', model: 'Model', year: 'Model year', vehicleType: 'Vehicle type',
  licensePlate: 'License plate', color: 'Color', powertrain: 'Powertrain',
  transmission: 'Transmission', currentMileage: 'Current mileage (km)',
  purchaseDate: 'Purchase date', purchasePrice: 'Purchase price (PHP)', notes: 'Notes',
};
export const REQUIRED_VEHICLE_FIELDS = new Set<keyof VehicleFormData>(['make', 'model', 'year', 'vehicleType', 'powertrain', 'transmission', 'currentMileage']);

export function vehicleDraftIsDirty(form: VehicleFormData, original: VehicleFormData, photoChanged = false): boolean {
  return photoChanged || (Object.keys(original) as (keyof VehicleFormData)[]).some(field => form[field] !== original[field]);
}

export function vehicleFormValues(vehicle?: GarageVehicle | null): VehicleFormData {
  return {
    make: vehicle?.make ?? '', model: vehicle?.model ?? '', year: vehicle?.year ? String(vehicle.year) : '',
    licensePlate: vehicle?.plate_number ?? '', color: vehicle?.color ?? '',
    vehicleType: vehicle?.vehicle_type ?? '', powertrain: vehicle?.powertrain ?? '',
    transmission: vehicle?.transmission ?? '', currentMileage: vehicle?.current_mileage != null ? String(vehicle.current_mileage) : '',
    purchaseDate: vehicle?.purchase_date ?? '', purchasePrice: vehicle?.purchase_price != null ? String(vehicle.purchase_price) : '',
    notes: vehicle?.notes ?? '',
  };
}

export function validateVehicleForm(form: VehicleFormData): VehicleFormErrors {
  const errors: VehicleFormErrors = {};
  for (const field of ['make', 'model', 'year', 'vehicleType', 'powertrain', 'transmission', 'currentMileage'] as const) {
    if (!form[field].trim()) errors[field] = 'This field is required.';
  }
  if (form.year && (!/^\d{4}$/.test(form.year) || Number(form.year) < 1886 || Number(form.year) > new Date().getFullYear() + 1)) errors.year = 'Enter a valid model year.';
  for (const field of ['currentMileage', 'purchasePrice'] as const) {
    if (form[field] && (!/^\d+(\.\d+)?$/.test(form[field]) || !Number.isFinite(Number(form[field])) || Number(form[field]) < 0)) errors[field] = 'Enter a non-negative number, without commas or units.';
  }
  if (form.purchaseDate && calendarDate(form.purchaseDate) === 'Not recorded') errors.purchaseDate = 'Enter a valid purchase date.';
  return errors;
}

export function vehicleSubmission(form: VehicleFormData) {
  return {
    make: form.make.trim(), model: form.model.trim(), year: Number(form.year),
    licensePlate: form.licensePlate.trim(), color: form.color.trim(),
    vehicleType: form.vehicleType, powertrain: form.powertrain, transmission: form.transmission,
    currentMileage: Number(form.currentMileage), purchaseDate: form.purchaseDate || null,
    purchasePrice: form.purchasePrice === '' ? null : Number(form.purchasePrice), notes: form.notes,
  };
}

// Do not publish optimistic form values: a successful write must return a persisted row.
export async function confirmedVehicleSave(write: () => Promise<{ data: Record<string, unknown> | null; error: string | null }>): Promise<GarageVehicle> {
  try {
    const result = await write();
    if (result.error || !result.data || typeof result.data.id !== 'string') throw new Error();
    return normalizeVehicle(result.data);
  } catch {
    throw new Error('We could not save this vehicle. It may no longer be available. Your entries are retained; please try again.');
  }
}
