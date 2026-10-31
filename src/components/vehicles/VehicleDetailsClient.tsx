'use client';

import { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button, Card } from '@/components/ui';
import { VehicleImage } from './VehicleImage';
import { ReminderSchedule } from '@/components/reminders/ReminderSchedule';
import { AddReminderModal } from '@/components/reminders/AddReminderModal';
import { LogMaintenanceModal } from '@/components/maintenance/LogMaintenanceModal';
import { formatCurrencyPHP } from '@/lib/currency';
import { calendarDate } from '@/lib/vehicles/vehicle-model';
import { classificationLabel, formatRecordedMileage, vehicleIdentity, type GarageVehicle } from '@/lib/vehicles/garage-model';
import type { getVehicleOverview } from '../../services/vehicleService';

type Props = Awaited<ReturnType<typeof getVehicleOverview>> & { vehicle: GarageVehicle };
export function VehicleDetailsClient({ vehicle, stats, maintenanceError, upcomingReminders, remindersError }: Props) {
  const router = useRouter();
  const search = useSearchParams();
  const [pending, start] = useTransition();
  const [addingReminder, setAddingReminder] = useState(false);
  const [logging, setLogging] = useState(false);
  const [feedback, setFeedback] = useState('');
  const identity = vehicleIdentity(vehicle);
  const specs = [
    ['Make', vehicle.make || 'Not recorded'], ['Model', vehicle.model || 'Not recorded'],
    ['Model year', vehicle.year ?? 'Not recorded'], ['License plate', vehicle.plate_number || 'Not recorded'],
    ['Vehicle type', classificationLabel(vehicle.vehicle_type)], ['Powertrain', classificationLabel(vehicle.powertrain)],
    ['Transmission', vehicle.transmission || 'Not recorded'], ['Color', vehicle.color || 'Not recorded'],
    ['Current mileage', formatRecordedMileage(vehicle.current_mileage)], ['Purchase date', calendarDate(vehicle.purchase_date)],
    ['Purchase price', vehicle.purchase_price != null ? formatCurrencyPHP(vehicle.purchase_price) : 'Not recorded'],
  ];
  const retry = <Button variant="secondary" onClick={() => start(() => router.refresh())} disabled={pending}>{pending ? 'Reloading...' : 'Try again'}</Button>;
  return <>
    <main className="application-workspace space-y-6 py-6 sm:py-8">
      <Button variant="secondary" href="/vehicles">Back to My Garage</Button>
      {(feedback || search.get('saved') === '1') && <p role="status" className="rounded-lg border border-line bg-surface p-4 text-ink">{feedback || 'Vehicle saved successfully.'}</p>}
      <section className="grid overflow-hidden rounded-card border border-line bg-surface shadow-card lg:grid-cols-2" aria-label="Vehicle profile">
        <VehicleImage src={vehicle.image_url} name={identity} />
        <div className="flex min-w-0 flex-col justify-center p-5 sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-muted">Your vehicle</p>
          <h1 className="mt-2 break-words text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{identity}</h1>
          <p className="mt-2 break-words text-muted">{vehicle.plate_number || 'License plate not recorded'}</p>
          <div className="mt-4 flex flex-wrap gap-2 text-sm text-ink">{[vehicle.vehicle_type, vehicle.powertrain, vehicle.transmission].filter(Boolean).map((value, index) => <span key={index} className="rounded-lg border border-line bg-canvas px-3 py-2">{classificationLabel(value)}</span>)}</div>
          <p className="mt-6 text-sm text-muted">Current recorded mileage</p><p className="mt-1 text-2xl font-semibold text-ink">{formatRecordedMileage(vehicle.current_mileage)}</p>
          <div className="mt-6 flex flex-wrap gap-3"><Button variant="secondary" href={`/vehicles/${vehicle.id}/edit`}>Edit Vehicle</Button><Button onClick={() => setLogging(true)}>Log Maintenance</Button></div>
        </div>
      </section>
      <section className="card p-4 sm:p-6" aria-labelledby="specifications-title">
        <h2 id="specifications-title" className="text-xl font-semibold text-ink">Vehicle specifications</h2>
        <dl className="mt-5 grid gap-x-6 gap-y-5 sm:grid-cols-2 xl:grid-cols-4">{specs.map(([label, value]) => <div key={label} className="min-w-0"><dt className="text-sm text-muted">{label}</dt><dd className="mt-1 break-words font-medium text-ink">{value}</dd></div>)}<div className="min-w-0 sm:col-span-2"><dt className="text-sm text-muted">Notes</dt><dd className="mt-1 whitespace-pre-wrap break-words text-ink">{vehicle.notes || 'No notes recorded'}</dd></div></dl>
      </section>
      <div className="grid items-start gap-6 xl:grid-cols-2">
        <Card className="min-w-0 p-4 sm:p-6">
          <h2 className="text-xl font-semibold text-ink">Maintenance overview</h2>
          {maintenanceError || !stats ? <div className="mt-4 space-y-3"><p role="alert" className="text-muted">Maintenance information could not be loaded.</p>{retry}</div> : <>
            <dl className="mt-5 grid gap-4 sm:grid-cols-2"><div><dt className="text-sm text-muted">Maintenance records</dt><dd className="mt-1 text-2xl font-semibold text-ink">{stats.totalRecords}</dd></div><div><dt className="text-sm text-muted">Recorded spending</dt><dd className="mt-1 break-words text-2xl font-semibold text-ink">{formatCurrencyPHP(stats.totalCost)}</dd></div><div><dt className="text-sm text-muted">Last recorded service</dt><dd className="mt-1 text-ink">{calendarDate(stats.lastServiceDate)}</dd></div></dl>
            {stats.totalRecords === 0 && <p className="mt-4 text-sm text-muted">No maintenance records yet. Log a service to start this vehicle&apos;s history.</p>}
          </>}
          <div className="mt-5 flex flex-wrap gap-3"><Button variant="secondary" href={`/vehicles/${vehicle.id}/maintenance`}>View Maintenance History</Button><Button onClick={() => setLogging(true)}>Log Maintenance</Button></div>
        </Card>
        <Card className="min-w-0 p-4 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-semibold text-ink">Vehicle reminders</h2><Button variant="secondary" onClick={() => setAddingReminder(true)}>Add Reminder</Button></div>
          <p className="mt-3 text-sm text-muted">Priority is the reminder&apos;s importance. Due dates, mileage thresholds and recorded status are shown separately.</p>
          {remindersError ? <div className="mt-4 space-y-3"><p role="alert" className="text-muted">Reminders could not be loaded.</p>{retry}</div> : upcomingReminders.length ? <ul className="mt-4 space-y-3">{upcomingReminders.slice(0, 5).map(reminder => <li key={reminder.id} className="rounded-lg border border-line bg-canvas p-4">
            <h3 className="break-words font-semibold text-ink">{reminder.title || reminder.reminderType || 'Maintenance reminder'}</h3>
            <p className="mt-1 text-sm text-muted">Priority: {classificationLabel(reminder.priority)} · Recorded status: {classificationLabel(reminder.status)}</p>
            <ReminderSchedule reminder={reminder} mileage={vehicle.current_mileage} /><p className="mt-2 text-sm text-ink">Due date: {calendarDate(reminder.dueDate)}</p><p className="mt-1 text-sm text-ink">Due mileage: {reminder.dueMileage != null ? formatRecordedMileage(reminder.dueMileage) : 'Not recorded'}</p>
          </li>)}</ul> : <p className="mt-4 text-sm text-muted">No open reminders for this vehicle.</p>}
          {!remindersError && upcomingReminders.length > 5 && <p className="mt-3 text-sm text-muted">Showing 5 of {upcomingReminders.length} open reminders.</p>}
          <Button variant="secondary" href="/reminders" className="mt-5">View All Reminders</Button>
        </Card>
      </div>
    </main>
    <AddReminderModal isOpen={addingReminder} onClose={() => setAddingReminder(false)} onSuccess={() => setFeedback('Reminder created.')} vehicleId={vehicle.id} vehicleName={identity} />
    <LogMaintenanceModal isOpen={logging} onClose={() => setLogging(false)} vehicle={{ id: vehicle.id, label: identity, currentMileage: vehicle.current_mileage }} onSuccess={() => { setLogging(false); setFeedback('Maintenance record saved.'); router.refresh(); }} />
  </>;
}
