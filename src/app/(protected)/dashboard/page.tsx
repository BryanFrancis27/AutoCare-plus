'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Car, Wrench, Bell, PhilippinePeso, Plus, RefreshCw, AlertCircle } from 'lucide-react';
import { MetricCard, ActivityFeed, UpcomingReminders, QuickActionButton, ServiceExpensesModal } from '@/components/dashboard';
import { DashboardOnboarding } from '@/components/dashboard/DashboardOnboarding';
import { GarageOverview } from '@/components/dashboard/GarageOverview';
import { LogMaintenanceModal } from '@/components/maintenance/LogMaintenanceModal';
import { AddVehicleModal } from '@/components/vehicles/AddVehicleModal';
import { LoadingState } from '@/components/ui';
import { useDashboard } from '@/lib/dashboard/use-dashboard';
import { formatCurrencyPHP } from '@/lib/currency';

export default function DashboardPage() {
  const { state, refresh } = useDashboard();
  const [addVehicleOpen, setAddVehicleOpen] = useState(false);
  const [logMaintenanceOpen, setLogMaintenanceOpen] = useState(false);
  const [serviceExpensesOpen, setServiceExpensesOpen] = useState(false);
  const data = state.status === 'ready' ? state.data : null;

  return <>
    <AddVehicleModal isOpen={addVehicleOpen} onClose={() => setAddVehicleOpen(false)} onSaved={() => { setAddVehicleOpen(false); void refresh(true); }} />
    <LogMaintenanceModal isOpen={logMaintenanceOpen} onClose={() => setLogMaintenanceOpen(false)} onSuccess={() => { void refresh(true); }} />
    <ServiceExpensesModal isOpen={serviceExpensesOpen} onClose={() => setServiceExpensesOpen(false)} />

    <div className="application-workspace space-y-6 py-6 sm:py-8">
    <div className="workspace-header flex flex-col justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-semibold uppercase tracking-wide text-muted">Your AutoCare+ dashboard</p>
        <h1 className="mt-2 break-words text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{data ? `Welcome${data.totalVehicles > 0 ? ' back' : ''}, ${data.name}` : 'Your vehicle care, together'}</h1>
        <p className="mt-2 max-w-prose text-base leading-6 text-muted">{data?.totalVehicles ? 'Keep track of your garage and plan your next service.' : 'A clear place to start, and an easier way to keep up with maintenance.'}</p>
      </div>
      {data && <div className="flex shrink-0 flex-wrap gap-2">
        <button type="button" onClick={() => { void refresh(); }} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-controlBorder bg-surface px-3 text-sm font-medium text-ink hover:bg-canvas"><RefreshCw className="h-4 w-4" aria-hidden="true" />Refresh</button>
        {data.totalVehicles > 0 && <button type="button" onClick={() => setAddVehicleOpen(true)} className="button-primary min-h-11 gap-2"><Plus className="h-4 w-4" aria-hidden="true" />Add Vehicle</button>}
      </div>}
    </div>

    {state.status === 'loading' && <LoadingState mode="container" label="Loading your garage and maintenance overview..." />}
    {state.status === 'error' && <section role="alert" className="card flex flex-col items-start gap-4 p-6 sm:flex-row">
      <AlertCircle className="h-6 w-6 shrink-0 text-accent" aria-hidden="true" />
      <div><h2 className="text-lg font-semibold text-ink">We couldn&apos;t load your dashboard</h2><p className="mt-2 text-sm text-muted">{state.message}</p>
        {state.sessionExpired ? <Link href="/login" className="button-primary mt-4 min-h-11">Sign in again</Link> : <button type="button" onClick={() => { void refresh(); }} className="button-primary mt-4 min-h-11">Try again</button>}
      </div>
    </section>}

    {data && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }} className="space-y-6">
      <p role="status" className="sr-only">Dashboard loaded. {data.totalVehicles === 0 ? 'Add your first vehicle to get started.' : `${data.totalVehicles} vehicles in your garage.`}</p>
      {data.totalVehicles === 0 ? <DashboardOnboarding onAdd={() => setAddVehicleOpen(true)} /> : <>
        <div className="dashboard-metric-grid">
          <MetricCard label="Total vehicles" value={data.totalVehicles} icon={Car} description="In your garage" />
          <MetricCard label="Maintenance records" value={data.maintenanceRecords} icon={Wrench} description="All recorded services" />
          <MetricCard label="Active reminders" value={data.activeReminders} icon={Bell} description="Not yet completed" />
          <MetricCard label="Monthly maintenance expenses" value={formatCurrencyPHP(data.monthlyExpenses)} icon={PhilippinePeso} description={`${data.monthLabel} · PHP`} />
        </div>
        <GarageOverview vehicles={data.vehicles} total={data.totalVehicles} />
        <section aria-labelledby="quick-actions-title">
          <h2 id="quick-actions-title" className="text-lg font-semibold text-ink">What would you like to do?</h2>
          {data.maintenanceRecords === 0 && <p className="mt-1 text-sm leading-5 text-muted">Your garage is ready. Log your first service to start building its maintenance history.</p>}
          <div className="dashboard-action-grid mt-3">
            <QuickActionButton label="Add Vehicle" description="Grow your garage" icon={Plus} onClick={() => setAddVehicleOpen(true)} />
            <QuickActionButton label={data.maintenanceRecords === 0 ? "Log Your First Service" : "Log Maintenance"} description={data.maintenanceRecords === 0 ? "Start your service history" : "Record your latest service"} icon={Wrench} onClick={() => setLogMaintenanceOpen(true)} />
            <QuickActionButton label="Set Reminder" description="Plan upcoming maintenance" icon={Bell} href="/reminders" />
            <QuickActionButton label="View Service & Expenses" description="Review your service costs" icon={PhilippinePeso} onClick={() => setServiceExpensesOpen(true)} />
          </div>
        </section>
        <div className="dashboard-detail-grid">
          <UpcomingReminders reminders={data.reminders} />
          <ActivityFeed activities={data.activities} />
        </div>
      </>}
    </motion.div>}
    </div>
  </>;
}
