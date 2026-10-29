'use client';

import { Search, RotateCcw } from 'lucide-react';
import { GARAGE_SORTS, type GarageSort } from '@/lib/vehicles/garage-model';

interface GarageToolbarProps {
  query: string;
  vehicleType: string;
  sort: GarageSort;
  types: { value: string; label: string }[];
  canSortRecent: boolean;
  matchingCount: number;
  total: number;
  onQuery: (value: string) => void;
  onType: (value: string) => void;
  onSort: (value: GarageSort) => void;
  onReset: () => void;
}
export function GarageToolbar({ query, vehicleType, sort, types, canSortRecent, matchingCount, total, onQuery, onType, onSort, onReset }: GarageToolbarProps) {
  return <section aria-label="Find a vehicle" className="card p-4 sm:p-5">
    <div className="garage-toolbar-grid">
      <div className="garage-toolbar-search min-w-0">
        <label htmlFor="garage-search" className="mb-1.5 block text-sm font-medium text-ink">Search your garage</label>
        <div className="relative"><Search className="pointer-events-none absolute left-3 top-3 h-5 w-5 text-muted" aria-hidden="true" /><input id="garage-search" type="search" value={query} onChange={event => onQuery(event.target.value)} placeholder="Make, model, year or license plate" className="min-h-11 w-full min-w-0 pl-10 text-sm" /></div>
      </div>
      <div className="min-w-0"><label htmlFor="garage-type" className="mb-1.5 block text-sm font-medium text-ink">Vehicle type</label><select id="garage-type" value={vehicleType} onChange={event => onType(event.target.value)} className="min-h-11 w-full min-w-0 text-sm"><option value="all">All vehicle types</option>{types.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}</select></div>
      <div className="min-w-0"><label htmlFor="garage-sort" className="mb-1.5 block text-sm font-medium text-ink">Sort by</label><select id="garage-sort" value={sort} onChange={event => onSort(event.target.value as GarageSort)} className="min-h-11 w-full min-w-0 text-sm">{GARAGE_SORTS.filter(option => option.value !== 'recent' || canSortRecent).map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div>
      <button type="button" onClick={onReset} className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-controlBorder px-3 text-sm font-medium text-ink hover:bg-canvas"><RotateCcw className="h-4 w-4" aria-hidden="true" />Reset Filters</button>
    </div>
    <p role="status" aria-live="polite" aria-atomic="true" className="mt-3 text-sm text-muted">Showing {matchingCount} of {total} {total === 1 ? 'vehicle' : 'vehicles'}</p>
  </section>;
}
