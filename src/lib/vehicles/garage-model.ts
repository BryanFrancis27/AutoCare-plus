import { formatMileage } from '../maintenance/reminderCalculations';
import type { ServiceHistoryEntry } from '../../app/actions/maintenance';

export interface GarageVehicle {
  id: string;
  make: string;
  model: string;
  year: number | null;
  plate_number: string | null;
  color?: string | null;
  vehicle_type?: string | null;
  powertrain?: string | null;
  transmission?: string | null;
  current_mileage: number | null;
  purchase_date?: string | null;
  purchase_price?: number | null;
  notes?: string | null;
  image_url?: string | null;
  created_at?: string | null;
}

export type VehicleInput = Omit<GarageVehicle, 'plate_number' | 'current_mileage'> & {
  plate_number?: string | null;
  current_mileage?: number | null;
  license_plate?: string | null;
  photo_url?: string | null;
  image?: string | null;
};
export type GarageSort = 'name-asc' | 'name-desc' | 'year-newest' | 'year-oldest' | 'mileage-highest' | 'mileage-lowest' | 'recent';
export const GARAGE_SORTS: { value: GarageSort; label: string }[] = [
  { value: 'name-asc', label: 'Name A–Z' },
  { value: 'name-desc', label: 'Name Z–A' },
  { value: 'year-newest', label: 'Newest model year' },
  { value: 'year-oldest', label: 'Oldest model year' },
  { value: 'mileage-highest', label: 'Highest mileage' },
  { value: 'mileage-lowest', label: 'Lowest mileage' },
  { value: 'recent', label: 'Recently added' },
];

export function normalizeGarageVehicle(vehicle: VehicleInput): GarageVehicle {
  return {
    ...vehicle,
    plate_number: vehicle.plate_number ?? vehicle.license_plate ?? null,
    current_mileage: vehicle.current_mileage ?? null,
    image_url: vehicle.image_url ?? vehicle.photo_url ?? vehicle.image ?? null,
    created_at: vehicle.created_at ?? null,
  };
}

export function vehicleName(vehicle: Pick<GarageVehicle, 'make' | 'model'>): string {
  return [vehicle.make, vehicle.model].filter(Boolean).join(' ').trim();
}
export function vehicleIdentity(vehicle: GarageVehicle): string {
  return [vehicle.year, vehicleName(vehicle)].filter(value => value != null && value !== '').join(' ') || 'Vehicle details not recorded';
}
export function classificationLabel(value: string | null | undefined): string {
  if (!value?.trim()) return 'Not recorded';
  if (['suv', 'ev'].includes(value.toLowerCase())) return value.toUpperCase();
  return value.replace(/[_-]/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase());
}
export function formatRecordedMileage(value: number | null | undefined): string {
  return typeof value === 'number' && Number.isFinite(value) ? formatMileage(value) : 'Mileage not recorded';
}
export function usableVehiclePhoto(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;
  const source = value.trim();
  if (source.startsWith('/') && !source.startsWith('//')) return source;
  try {
    const url = new URL(source);
    return url.protocol === 'https:' || url.protocol === 'http:' ? source : null;
  } catch { return null; }
}

const collator = new Intl.Collator('en', { sensitivity: 'base', numeric: true });
function typeKey(vehicle: GarageVehicle): string { return vehicle.vehicle_type?.trim().toLowerCase() || 'unspecified'; }
export function garageTypeOptions(vehicles: GarageVehicle[]) {
  return Array.from(new Set(vehicles.map(typeKey))).sort(collator.compare).map(value => ({ value, label: value === 'unspecified' ? 'Not specified' : classificationLabel(value) }));
}
export function hasReliableTimestamps(vehicles: GarageVehicle[]): boolean {
  return vehicles.length > 0 && vehicles.every(vehicle => Boolean(vehicle.created_at && Number.isFinite(Date.parse(vehicle.created_at))));
}
function compareNumber(a: number | null | undefined, b: number | null | undefined, descending: boolean): number {
  const validA = typeof a === 'number' && Number.isFinite(a);
  const validB = typeof b === 'number' && Number.isFinite(b);
  if (!validA || !validB) return validA ? -1 : validB ? 1 : 0;
  return descending ? b - a : a - b;
}

export function selectGarageVehicles(vehicles: GarageVehicle[], query: string, vehicleType: string, sort: GarageSort): GarageVehicle[] {
  const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const effectiveSort = sort === 'recent' && !hasReliableTimestamps(vehicles) ? 'name-asc' : sort;
  return vehicles.filter(vehicle => {
    const haystack = [vehicle.make, vehicle.model, vehicle.year, vehicle.plate_number].filter(value => value != null).join(' ').toLocaleLowerCase();
    return (vehicleType === 'all' || typeKey(vehicle) === vehicleType) && terms.every(term => haystack.includes(term));
  }).sort((a, b) => {
    let comparison = 0;
    if (effectiveSort.startsWith('name')) {
      const nameA = vehicleName(a), nameB = vehicleName(b);
      comparison = !nameA || !nameB ? (nameA ? -1 : nameB ? 1 : 0) : collator.compare(nameA, nameB) * (effectiveSort === 'name-desc' ? -1 : 1);
    } else if (effectiveSort.startsWith('year')) comparison = compareNumber(a.year, b.year, effectiveSort === 'year-newest');
    else if (effectiveSort.startsWith('mileage')) comparison = compareNumber(a.current_mileage, b.current_mileage, effectiveSort === 'mileage-highest');
    else comparison = Date.parse(b.created_at!) - Date.parse(a.created_at!);
    return comparison || collator.compare(vehicleName(a), vehicleName(b)) || collator.compare(a.id, b.id);
  });
}

export function summarizeGarageExpenses(entries: ServiceHistoryEntry[], now = new Date()) {
  return entries.reduce((totals, entry) => {
    const parts = entry.serviceDate.split('-').map(Number);
    const date = parts.length >= 3 ? new Date(parts[0], parts[1] - 1, parts[2]) : new Date(entry.serviceDate);
    if (!Number.isNaN(date.getTime()) && date.getFullYear() === now.getFullYear()) {
      totals.yearlyTotal += Number(entry.cost) || 0;
      if (date.getMonth() === now.getMonth()) totals.monthlyTotal += Number(entry.cost) || 0;
    }
    return totals;
  }, { monthlyTotal: 0, yearlyTotal: 0 });
}
