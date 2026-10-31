import type { MaintenanceRecord } from '@/types';
import { MAINTENANCE_CATEGORIES } from './maintenanceCategories';
export type HistoryFilters = { search: string; category: string; from: string; to: string; sort: string };
export const defaultHistoryFilters: HistoryFilters = { search: '', category: '', from: '', to: '', sort: 'newest' };
export function filterHistory(records: MaintenanceRecord[], filters: HistoryFilters) {
  const search = filters.search.trim().toLowerCase();
  return records.filter(row => `${row.serviceType} ${row.serviceCategory.replaceAll('-', ' ')} ${MAINTENANCE_CATEGORIES.find(c => c.id === row.serviceCategory)?.name ?? ''}`.toLowerCase().includes(search) && (!filters.category || row.serviceCategory === filters.category) && (!filters.from || row.serviceDate >= filters.from) && (!filters.to || row.serviceDate <= filters.to))
    .sort((a, b) => (filters.sort === 'cost-high' ? b.cost - a.cost : filters.sort === 'cost-low' ? a.cost - b.cost : filters.sort === 'oldest' ? a.serviceDate.localeCompare(b.serviceDate) : b.serviceDate.localeCompare(a.serviceDate)) || a.id.localeCompare(b.id));
}
export function historySummary(records: MaintenanceRecord[]) {
  return { count: records.length, total: Math.round(records.reduce((sum, row) => sum + Number(row.cost), 0) * 100) / 100, latest: records.reduce<string | null>((date, row) => !date || row.serviceDate > date ? row.serviceDate : date, null) };
}
