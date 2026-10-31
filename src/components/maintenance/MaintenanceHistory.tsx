'use client';
import { useState } from 'react';
import { Button } from '@/components/ui';
import { filterHistory, historySummary, defaultHistoryFilters } from '@/lib/maintenance/history-model';
import { calendarDate } from '@/lib/vehicles/vehicle-model';
import { formatRecordedMileage } from '@/lib/vehicles/garage-model';
import { formatCurrencyPHP } from '@/lib/currency';
import { MAINTENANCE_CATEGORIES } from '@/lib/maintenance';
import { maintenanceControl } from './MaintenanceField';
import type { MaintenanceRecord } from '@/types';
export function MaintenanceHistory({ records, vehicleId }: { records: MaintenanceRecord[]; vehicleId: string }) {
  const [filters, setFilters] = useState(defaultHistoryFilters);
  const summary = historySummary(records), rows = filterHistory(records, filters);
  const change = (key: keyof typeof filters, value: string) => setFilters(old => ({ ...old, [key]: value }));
  const categoryName = (id: string) => MAINTENANCE_CATEGORIES.find(c => c.id === id)?.name || id;
  return <>
    <div className="maintenance-summary-grid">{[['Maintenance records', summary.count], ['Recorded service spending', formatCurrencyPHP(summary.total)], ['Last recorded service', summary.latest ? calendarDate(summary.latest) : 'No service recorded']].map(([label, value]) => <div key={label} className="card min-w-0 p-5"><p className="text-sm text-muted">{label}</p><p className="mt-2 break-words text-2xl font-semibold text-ink">{value}</p></div>)}</div>
    <section aria-label="History filters" className="card space-y-4 p-4 sm:p-5">
      <div className="maintenance-toolbar-grid">
        <label className="min-w-0 text-sm font-medium">Search<input className={maintenanceControl + ' mt-2'} placeholder="Service type or category" value={filters.search} onChange={e => change('search', e.target.value)} /></label>
        <label className="min-w-0 text-sm font-medium">Category<select className={maintenanceControl + ' mt-2'} value={filters.category} onChange={e => change('category', e.target.value)}><option value="">All categories</option>{Array.from(new Set(records.map(r => r.serviceCategory))).sort().map(category => <option key={category} value={category}>{categoryName(category)}</option>)}</select></label>
        <label className="min-w-0 text-sm font-medium">From date<input type="date" className={maintenanceControl + ' mt-2'} value={filters.from} onChange={e => change('from', e.target.value)} /></label>
        <label className="min-w-0 text-sm font-medium">Through date<input type="date" className={maintenanceControl + ' mt-2'} value={filters.to} onChange={e => change('to', e.target.value)} /></label>
        <label className="min-w-0 text-sm font-medium">Sort<select className={maintenanceControl + ' mt-2'} value={filters.sort} onChange={e => change('sort', e.target.value)}>{[['newest', 'Newest service'], ['oldest', 'Oldest service'], ['cost-high', 'Highest cost'], ['cost-low', 'Lowest cost']].map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3"><p role="status" className="text-sm text-muted">{rows.length} of {records.length} records shown. Totals include all records.</p><Button variant="secondary" onClick={() => setFilters(defaultHistoryFilters)}>Reset Filters</Button></div>
      {filters.from && filters.to && filters.from > filters.to && <p role="alert" className="text-sm text-accent">From date must be on or before Through date.</p>}
    </section>
    {rows.length ? <div className="space-y-4">{rows.map(record => <article key={record.id} className="card p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4"><div className="min-w-0"><p className="text-sm text-muted">{categoryName(record.serviceCategory)}</p><h2 className="mt-1 break-words text-lg font-semibold text-ink">{record.serviceType}</h2></div><Button variant="secondary" href={`/maintenance/${record.id}/edit`} aria-label={`Edit ${record.serviceType}`}>Edit</Button></div>
      <dl className="maintenance-summary-grid mt-5 text-sm"><div><dt className="text-muted">Service date</dt><dd className="mt-1 font-medium">{calendarDate(record.serviceDate)}</dd></div><div><dt className="text-muted">Recorded mileage</dt><dd className="mt-1 font-medium">{formatRecordedMileage(record.mileage)}</dd></div><div><dt className="text-muted">Cost (PHP)</dt><dd className="mt-1 font-medium">{formatCurrencyPHP(record.cost)}</dd></div></dl>
      {record.notes && <p className="mt-4 whitespace-pre-wrap break-words rounded-lg bg-canvas p-3 text-sm text-muted">{record.notes}</p>}
      {(record.nextDueDate || record.nextDueMileage != null) && <p className="mt-4 text-sm text-muted">Recorded next due date: {calendarDate(record.nextDueDate)} · Next mileage: {formatRecordedMileage(record.nextDueMileage)}</p>}
    </article>)}</div> : <div className="card space-y-3 p-8 text-center"><h2 className="text-lg font-semibold">{records.length ? 'No matching service records' : 'No maintenance records yet'}</h2><p className="text-muted">{records.length ? 'Try a different search or reset your filters.' : 'Record completed services to start this vehicle’s maintenance history.'}</p>{!records.length && <Button href={`/vehicles/${vehicleId}/maintenance/add`}>Log First Maintenance</Button>}</div>}
  </>;
}
