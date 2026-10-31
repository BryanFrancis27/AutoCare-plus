import { reminderPresentation, type Schedule } from '../lib/maintenance/presentation';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface GarageVehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  plate_number: string | null;
  current_mileage: number | null;
  created_at: string;
  image_url?: string | null;
}

type VehicleJoin = Pick<GarageVehicle, 'make' | 'model' | 'year'> & { current_mileage?: number | null };
export interface MaintenanceRow {
  id: string;
  vehicle_id: string;
  service_type: string;
  service_date: string;
  cost: number | string | null;
  vehicles?: VehicleJoin | VehicleJoin[] | null;
}
export interface ReminderRow {
  id: string;
  title: string | null;
  reminder_type: string;
  due_date: string | null;
  due_mileage: number | null;
  status: string | null;
  priority: string | null;
  vehicle_id: string;
  vehicles: VehicleJoin | VehicleJoin[] | null;
}
export interface DashboardActivity {
  id: string;
  description: string;
  date: string;
  vehicleName: string;
  vehicleId: string;
  type: 'maintenance' | 'vehicle_added';
}
export interface DashboardReminder {
  id: string;
  title: string;
  vehicleName: string;
  dueDate: string | null;
  dueMileage: number | null;
  overdue: boolean;
  schedule?: Schedule;
  scheduleLabel?: string;
  remaining?: number | null;
  priority: string | null;
}
export interface DashboardData {
  name: string;
  vehicles: GarageVehicle[];
  totalVehicles: number;
  maintenanceRecords: number;
  activeReminders: number;
  monthlyExpenses: number;
  monthLabel: string;
  activities: DashboardActivity[];
  reminders: DashboardReminder[];
}
export interface VehicleSummary {
  id: string;
  label: string;
  totalRecords: number;
  totalCost: number;
  lastService: string | null;
  recentServices: { serviceType: string; serviceDate: string; cost: number }[];
}

export class DashboardSessionError extends Error {
  constructor() { super('Your session could not be verified. Please sign in again.'); }
}

export function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function monthWindow(now: Date) {
  return {
    start: dateKey(new Date(now.getFullYear(), now.getMonth(), 1)),
    end: dateKey(new Date(now.getFullYear(), now.getMonth() + 1, 1)),
  };
}
export function vehicleLabel(vehicle: VehicleJoin | VehicleJoin[] | null | undefined): string {
  const item = Array.isArray(vehicle) ? vehicle[0] : vehicle;
  return item ? [item.year, item.make, item.model].filter(Boolean).join(' ') : 'Vehicle unavailable';
}
function money(value: number | string | null): number {
  if (value === null) return 0;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw new Error('A maintenance cost could not be read.');
  return parsed;
}
export function sumCosts(rows: { cost: number | string | null }[]): number {
  return Math.round(rows.reduce((sum, row) => sum + money(row.cost), 0) * 100) / 100;
}
export function buildActivities(vehicles: GarageVehicle[], logs: MaintenanceRow[]): DashboardActivity[] {
  return [
    ...vehicles.map(vehicle => ({ id: `vehicle-${vehicle.id}`, description: 'Added to your garage', date: vehicle.created_at, vehicleName: vehicleLabel(vehicle), vehicleId: vehicle.id, type: 'vehicle_added' as const })),
    ...logs.map(log => ({ id: `maintenance-${log.id}`, description: `${log.service_type} recorded`, date: log.service_date, vehicleName: vehicleLabel(log.vehicles), vehicleId: log.vehicle_id, type: 'maintenance' as const })),
  ].sort((a, b) => {
    const timestamp = (date: string) => new Date(date.length === 10 ? `${date}T00:00:00` : date).getTime();
    return timestamp(b.date) - timestamp(a.date) || a.id.localeCompare(b.id);
  }).slice(0, 5);
}
export function relevantReminders(rows: ReminderRow[], now: Date): DashboardReminder[] {
  const today = dateKey(now);
  const horizon = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 30);
  const priority: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  return rows.filter(row => row.status !== 'completed').map(row => {
    const vehicle = Array.isArray(row.vehicles) ? row.vehicles[0] : row.vehicles;
    const state = reminderPresentation({ dueDate: row.due_date ?? undefined, dueMileage: row.due_mileage ?? undefined, priority: row.priority as import('../types').MaintenancePriority, status: row.status as import('../types').Reminder['status'], isCompleted: false }, vehicle?.current_mileage, today);
    return ({
    id: row.id, title: row.title || row.reminder_type || 'Maintenance reminder',
    vehicleName: vehicleLabel(row.vehicles), dueDate: row.due_date,
    dueMileage: row.due_mileage, priority: row.priority,
    overdue: state.overdue, schedule: state.schedule, scheduleLabel: state.label, remaining: state.remaining,
  }); }).filter(row => row.overdue || row.schedule === 'due-soon' || !row.dueDate || row.dueDate <= dateKey(horizon))
    .sort((a, b) => Number(b.overdue) - Number(a.overdue) || (a.dueDate || '9999').localeCompare(b.dueDate || '9999') || (priority[a.priority || ''] ?? 4) - (priority[b.priority || ''] ?? 4) || a.id.localeCompare(b.id))
    .slice(0, 5);
}

async function authenticatedUser(client: SupabaseClient) {
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) throw new DashboardSessionError();
  return data.user;
}
function requireRows<T>(result: { data: T[] | null; error: unknown }, label: string): T[] {
  if (result.error || !result.data) throw new Error(`Could not load ${label}. Please try again.`);
  return result.data;
}
function requireCount(count: number | null, label: string): number {
  if (count === null) throw new Error(`Could not count ${label}. Please try again.`);
  return count;
}

// Read every page rather than silently accepting Supabase's default row cap.
// The stable id order also makes pagination deterministic for unchanged records.
export async function readAll<T>(query: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>, label: string, signal: AbortSignal): Promise<T[]> {
  const rows: T[] = [];
  const size = 500;
  for (let from = 0; ; from += size) {
    signal.throwIfAborted();
    const page = requireRows(await query(from, from + size - 1), label);
    rows.push(...page);
    if (page.length < size) return rows;
  }
}

export async function loadDashboard(client: SupabaseClient, signal: AbortSignal, now = new Date()): Promise<DashboardData> {
  const user = await authenticatedUser(client);
  signal.throwIfAborted();
  const window = monthWindow(now);
  const [garageResult, logsResult, expenses, reminderRows] = await Promise.all([
    // Existing vehicle records may store their photo under any of three legacy columns.
    client.from('vehicles').select('*', { count: 'exact' }).eq('user_id', user.id).order('created_at', { ascending: false }).order('id').limit(5).abortSignal(signal),
    client.from('maintenance_logs').select('id, vehicle_id, service_type, service_date, cost, vehicles(make, model, year)', { count: 'exact' }).eq('user_id', user.id).order('service_date', { ascending: false }).order('id').limit(5).abortSignal(signal),
    readAll<{ cost: number | string | null }>((from, to) => client.from('maintenance_logs').select('id, cost').eq('user_id', user.id).gte('service_date', window.start).lt('service_date', window.end).order('id').range(from, to).abortSignal(signal), 'monthly expenses', signal),
    readAll<ReminderRow>((from, to) => client.from('reminders').select('id, title, reminder_type, due_date, due_mileage, status, priority, vehicle_id, vehicles(make, model, year, current_mileage)').eq('user_id', user.id).eq('is_completed', false).order('id').range(from, to).abortSignal(signal), 'reminders', signal),
  ]);
  const vehicles = requireRows<GarageVehicle & { photo_url?: string | null; image?: string | null }>(garageResult, 'vehicles')
    .map(vehicle => ({ ...vehicle, image_url: vehicle.image_url ?? vehicle.photo_url ?? vehicle.image ?? null }));
  const logs = requireRows<MaintenanceRow>(logsResult, 'maintenance activity');
  const name = [user.user_metadata?.full_name, user.user_metadata?.name, user.email?.split('@')[0]].find(value => typeof value === 'string' && value.trim());
  return {
    name: name?.trim() || 'there',
    vehicles, totalVehicles: requireCount(garageResult.count, 'vehicles'), maintenanceRecords: requireCount(logsResult.count, 'maintenance records'),
    activeReminders: reminderRows.length, monthlyExpenses: sumCosts(expenses),
    monthLabel: now.toLocaleDateString('en-PH', { month: 'long', year: 'numeric' }),
    activities: buildActivities(vehicles, logs), reminders: relevantReminders(reminderRows, now),
  };
}

export function summarizeServices(vehicles: Pick<GarageVehicle, 'id' | 'make' | 'model' | 'year'>[], logs: MaintenanceRow[]): VehicleSummary[] {
  const grouped = new Map<string, MaintenanceRow[]>();
  for (const log of logs) {
    const entries = grouped.get(log.vehicle_id) || [];
    entries.push(log);
    grouped.set(log.vehicle_id, entries);
  }
  return vehicles.map(vehicle => {
    const entries = (grouped.get(vehicle.id) || []).sort((a, b) => b.service_date.localeCompare(a.service_date) || a.id.localeCompare(b.id));
    return { id: vehicle.id, label: vehicleLabel(vehicle), totalRecords: entries.length, totalCost: sumCosts(entries), lastService: entries[0]?.service_date || null,
      recentServices: entries.slice(0, 5).map(log => ({ serviceType: log.service_type, serviceDate: log.service_date, cost: money(log.cost) })) };
  });
}
export async function loadServiceExpenses(client: SupabaseClient, signal: AbortSignal): Promise<VehicleSummary[]> {
  const user = await authenticatedUser(client);
  signal.throwIfAborted();
  const [vehicles, logs] = await Promise.all([
    readAll<Pick<GarageVehicle, 'id' | 'make' | 'model' | 'year'>>((from, to) => client.from('vehicles').select('id, make, model, year').eq('user_id', user.id).order('id').range(from, to).abortSignal(signal), 'vehicles', signal),
    readAll<MaintenanceRow>((from, to) => client.from('maintenance_logs').select('id, vehicle_id, service_type, service_date, cost').eq('user_id', user.id).order('id').range(from, to).abortSignal(signal), 'service records', signal),
  ]);
  return summarizeServices(vehicles, logs);
}

export async function withDeadline<T>(work: (signal: AbortSignal) => Promise<T>, signal: AbortSignal, timeoutMs = 20000): Promise<T> {
  const controller = new AbortController();
  const abort = () => controller.abort(signal.reason);
  signal.addEventListener('abort', abort, { once: true });
  if (signal.aborted) abort();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let rejectAbort: (() => void) | undefined;
  try {
    return await Promise.race([
      Promise.resolve().then(() => { controller.signal.throwIfAborted(); return work(controller.signal); }),
      new Promise<never>((_, reject) => {
        rejectAbort = () => reject(controller.signal.reason);
        controller.signal.addEventListener('abort', rejectAbort, { once: true });
        if (controller.signal.aborted) rejectAbort();
        timer = setTimeout(() => controller.abort(new Error('Loading took too long. Please try again.')), timeoutMs);
      }),
    ]);
  } finally {
    clearTimeout(timer);
    signal.removeEventListener('abort', abort);
    if (rejectAbort) controller.signal.removeEventListener('abort', rejectAbort);
    controller.abort();
  }
}
