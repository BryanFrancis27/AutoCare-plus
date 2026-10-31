'use client';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Dialog, LoadingState } from '@/components/ui';
import { PageHeader } from '@/components/layout';
import { VehicleImage } from '@/components/vehicles/VehicleImage';
import { getReminderModalData, completeReminderWithServiceLog, type ReminderModalData } from '@/app/actions/reminders';
import { reminderPresentation } from '@/lib/maintenance/presentation';
import { calendarDate } from '@/lib/vehicles/vehicle-model';
import { formatRecordedMileage } from '@/lib/vehicles/garage-model';
import { maintenanceControl } from '@/components/maintenance/MaintenanceField';
import { ReminderSchedule } from './ReminderSchedule';
import { AddReminderModal } from './AddReminderModal';
import type { Reminder } from '@/types';
type Vehicle = { id: string; make: string; model: string; year: number | null; plate_number: string | null; current_mileage: number | null };
export function RemindersListClient({ initialReminders, initialVehicles, initialError, created = false }: { initialReminders: Reminder[]; initialVehicles: Vehicle[]; initialError: string | null; created?: boolean }) {
  const router = useRouter();
  const [vehicleId, setVehicleId] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('active');
  const [sort, setSort] = useState('schedule');
  const [adding, setAdding] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [details, setDetails] = useState<ReminderModalData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [feedback, setFeedback] = useState(created ? 'Reminder created.' : '');
  const request = useRef(0), busy = useRef(false);
  const vehicleName = (vehicle: Vehicle) => [vehicle.year, vehicle.make, vehicle.model, vehicle.plate_number].filter(Boolean).join(' ');
  const mileage = (reminder: Reminder) => reminder.currentMileage ?? initialVehicles.find(v => v.id === reminder.vehicleId)?.current_mileage;
  const state = (reminder: Reminder) => reminderPresentation(reminder, mileage(reminder));
  const scoped = initialReminders.filter(r => !vehicleId || r.vehicleId === vehicleId);
  const completed = scoped.filter(r => state(r).schedule === 'completed').length;
  const overdue = scoped.filter(r => state(r).overdue).length;
  const rank = { overdue: 0, 'mileage-reached': 1, 'due-soon': 2, scheduled: 3, unknown: 4, completed: 5 };
  const priorities: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3, unknown: 4 };
  const rows = scoped.filter(r => {
    const schedule = state(r).schedule;
    return (status === 'all' || (status === 'active' ? schedule !== 'completed' : status === 'overdue' ? state(r).overdue : status === schedule)) && [r.title, r.reminderType, r.serviceCategory, r.description, r.vehicleName, initialVehicles.find(v => v.id === r.vehicleId)?.plate_number].join(' ').toLowerCase().includes(search.trim().toLowerCase());
  }).sort((a, b) => (sort === 'priority' ? priorities[state(a).priority] - priorities[state(b).priority] : sort === 'date' ? (a.dueDate || '9999').localeCompare(b.dueDate || '9999') : rank[state(a).schedule] - rank[state(b).schedule]) || (a.dueDate || '9999').localeCompare(b.dueDate || '9999') || a.id.localeCompare(b.id));
  async function open(id: string) {
    const sequence = ++request.current; setActiveId(id); setDetails(null); setLoading(true); setError(null); setConfirmed(false);
    try { const result = await getReminderModalData(id); if (sequence !== request.current) return; if (result.error || !result.data) throw new Error(); setDetails(result.data); }
    catch { if (sequence === request.current) setError('Reminder details could not be loaded. Close and try again.'); }
    finally { if (sequence === request.current) setLoading(false); }
  }
  function close() { if (busy.current) return; request.current++; setActiveId(null); setDetails(null); }
  async function complete() {
    if (!activeId || !confirmed || busy.current) return;
    busy.current = true; setPending(true); setError(null);
    try { const result = await completeReminderWithServiceLog(activeId); if (result.error || !result.success) throw new Error(result.error || 'Could not update reminder.'); setFeedback('Reminder updated. Review maintenance history to verify its service entry.'); busy.current = false; close(); router.refresh(); }
    catch (failure) { setError(failure instanceof Error ? failure.message : 'Update could not be confirmed. Review history before retrying.'); }
    finally { busy.current = false; setPending(false); }
  }
  const selected = initialVehicles.find(v => v.id === vehicleId);
  return <>
    <main className="application-workspace space-y-6 py-6 sm:py-8">
      <PageHeader title="Service Reminders" description="Plan maintenance by calendar date and recorded mileage." actions={<Button disabled={!selected || Boolean(initialError)} onClick={() => setAdding(true)}>Add Reminder</Button>} />
      {feedback && <p role="status" className="card p-4">{feedback}</p>}
      {initialError ? <div role="alert" className="card space-y-3 p-6"><p>Reminders or vehicles could not be loaded. Totals and results are unavailable.</p><Button variant="secondary" onClick={() => router.refresh()}>Try again</Button></div> : <>
        <div className="maintenance-summary-grid">{[['Active reminders', scoped.length - completed], ['Overdue or mileage reached', overdue], ['Completed reminders', completed]].map(([label, value]) => <div key={label} className="card min-w-0 p-5"><p className="text-sm text-muted">{label}</p><p className="mt-2 text-3xl font-semibold text-ink">{value}</p></div>)}</div>
        <section className="card space-y-4 p-4 sm:p-5" aria-label="Reminder filters">
          <div className="maintenance-toolbar-grid">
            <label className="min-w-0 text-sm font-medium">Search<input className={maintenanceControl + ' mt-2'} value={search} onChange={e => setSearch(e.target.value)} placeholder="Service, category or vehicle" /></label>
            <label className="min-w-0 text-sm font-medium">Vehicle<select className={maintenanceControl + ' mt-2'} value={vehicleId} onChange={e => setVehicleId(e.target.value)}><option value="">All vehicles</option>{initialVehicles.map(v => <option key={v.id} value={v.id}>{vehicleName(v)}</option>)}</select></label>
            <label className="min-w-0 text-sm font-medium">Status<select className={maintenanceControl + ' mt-2'} value={status} onChange={e => setStatus(e.target.value)}>{[['active', 'Active'], ['all', 'All statuses'], ['overdue', 'Overdue / mileage reached'], ['due-soon', 'Due soon'], ['scheduled', 'Scheduled'], ['completed', 'Completed'], ['unknown', 'Insufficient information']].map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <label className="min-w-0 text-sm font-medium">Sort<select className={maintenanceControl + ' mt-2'} value={sort} onChange={e => setSort(e.target.value)}><option value="schedule">Schedule</option><option value="date">Due date</option><option value="priority">Priority</option></select></label>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-muted">Select a vehicle to add a reminder. Due soon means within 30 calendar days or 500 km of recorded mileage.</p><Button variant="secondary" onClick={() => { setSearch(''); setVehicleId(''); setStatus('active'); setSort('schedule'); }}>Reset Filters</Button></div>
        </section>
        <p role="status" className="text-sm text-muted">{rows.length} of {scoped.length} reminders shown{selected ? ' for ' + vehicleName(selected) : ''}</p>
        {rows.length ? <div className="maintenance-record-grid">{rows.map(reminder => <article key={reminder.id} className="card flex min-w-0 flex-col p-5">
          <p className="break-words text-sm text-muted">{reminder.vehicleName || initialVehicles.find(v => v.id === reminder.vehicleId) && vehicleName(initialVehicles.find(v => v.id === reminder.vehicleId)!) || 'Vehicle unavailable'}</p>
          <h2 className="mt-2 break-words text-lg font-semibold text-ink">{reminder.title || reminder.reminderType}</h2><p className="mt-1 break-words text-sm text-muted">{reminder.serviceCategory}</p>
          <ReminderSchedule reminder={reminder} mileage={mileage(reminder)} /><p className="mt-3 break-words text-sm text-muted">{reminder.description}</p>
          <div className="mt-auto pt-5"><Button variant="secondary" onClick={() => open(reminder.id)} aria-label={'View details for ' + (reminder.title || reminder.reminderType)}>View details</Button></div>
        </article>)}</div> : <div className="card space-y-2 p-8 text-center"><h2 className="text-lg font-semibold">{scoped.length ? 'No matching reminders' : 'No reminders yet'}</h2><p className="text-muted">{scoped.length ? 'Try another search or reset your filters.' : selected ? 'Add a reminder to plan your next service.' : 'Choose a vehicle to add a reminder, or add a vehicle in My Garage.'}</p>{!initialVehicles.length && <Button href="/vehicles">My Garage</Button>}</div>}
      </>}
    </main>
    <Dialog isOpen={Boolean(activeId)} onClose={close} showCloseButton={!pending} title={details?.reminder.title || 'Reminder details'} size="lg">
      {loading && <LoadingState mode="inline" label="Loading reminder..." />}{error && <p role="alert" className="mb-4 rounded-lg bg-accentSoft p-3 text-accent">{error}</p>}
      {details && <div className="space-y-4">
        <VehicleImage src={details.vehicle?.imageUrl} name={details.vehicle?.displayName || 'Vehicle unavailable'} contained />
        <p className="break-words font-semibold">{details.vehicle?.displayName || 'Vehicle unavailable'} &middot; {details.vehicle?.plateNumber || 'Plate not recorded'}</p>
        <p className="text-sm text-muted">Recorded mileage: {formatRecordedMileage(details.vehicle?.currentMileage)} &middot; Last service: {calendarDate(details.vehicle?.lastServiceDate)}</p>
        <p className="break-words text-sm">{details.reminder.reminderType} &middot; {details.reminder.serviceCategory}</p>
        <ReminderSchedule reminder={details.reminder} mileage={details.vehicle?.currentMileage} /><p className="whitespace-pre-wrap break-words text-sm text-muted">{details.reminder.description}</p>{details.reminder.notes && <p className="whitespace-pre-wrap break-words text-sm">Notes: {details.reminder.notes}</p>}
        {reminderPresentation(details.reminder).schedule !== 'completed' && <div className="space-y-3 rounded-lg border border-line p-4">
          <p className="text-sm text-muted">Confirming completion marks this reminder complete and attempts to add a service dated {calendarDate(new Date().toISOString().slice(0, 10))} with PHP 0 cost and the recorded vehicle mileage (or the reminder threshold, then 0 if unavailable). It may generate a next reminder. Review the service entry afterwards.</p>
          <label className="flex min-h-11 items-start gap-3 text-sm"><input type="checkbox" className="mt-1 h-5 w-5 shrink-0" checked={confirmed} disabled={pending} onChange={e => setConfirmed(e.target.checked)} />I confirm this service was performed and accept these recorded details.</label>
          <div className="flex flex-wrap gap-3"><Button disabled={!confirmed || pending} onClick={complete}>{pending ? 'Updating...' : 'Confirm service completion'}</Button>{details.vehicle && !pending && <Button variant="secondary" href={'/vehicles/' + details.vehicle.id + '/maintenance/add'}>Log service with actual details</Button>}</div>
        </div>}
        <Button variant="secondary" onClick={close} disabled={pending}>Close</Button>
      </div>}
    </Dialog>
    {selected && <AddReminderModal isOpen={adding} onClose={() => setAdding(false)} onSuccess={() => setFeedback('Reminder created.')} vehicleId={selected.id} vehicleName={vehicleName(selected)} />}
  </>;
}
