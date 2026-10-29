'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, Car, PhilippinePeso, Wrench } from 'lucide-react';
import { Dialog, LoadingState } from '@/components/ui';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { loadServiceExpenses, withDeadline, type VehicleSummary } from '../../services/dashboardService';
import { formatCurrencyPHP } from '@/lib/currency';

interface ServiceExpensesModalProps { isOpen: boolean; onClose: () => void }
function displayDate(date: string) {
  return new Date(date.slice(0, 10) + 'T12:00:00').toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function ServiceExpensesModal({ isOpen, onClose }: ServiceExpensesModalProps) {
  const [summaries, setSummaries] = useState<VehicleSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [status, setStatus] = useState<'loading' | 'error' | 'ready'>('loading');
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (!isOpen) return;
    const controller = new AbortController();
    setStatus('loading');
    void withDeadline(signal => loadServiceExpenses(createSupabaseBrowserClient(), signal), controller.signal)
      .then(results => {
        if (controller.signal.aborted) return;
        setSummaries(results);
        setSelectedId(results[0]?.id || null);
        setStatus('ready');
      }).catch(reason => {
        if (controller.signal.aborted) return;
        setError(reason instanceof Error ? reason.message : 'Could not load service and expense records.');
        setStatus('error');
      });
    return () => controller.abort();
  }, [isOpen, retry]);

  const selected = summaries.find(item => item.id === selectedId);
  return <Dialog isOpen={isOpen} onClose={onClose} title="Service & Expenses" size="lg">
    <p className="mb-5 text-sm text-muted">Maintenance history and recorded costs across your vehicles.</p>
    {status === 'loading' ? <LoadingState mode="container" label="Loading service and expense records..." /> : status === 'error' ? <div role="alert" className="rounded-xl border border-accent/30 bg-accentSoft p-4">
      <p className="flex items-start gap-2 text-sm text-accent"><AlertCircle className="h-5 w-5 shrink-0" aria-hidden="true" />{error}</p>
      <button type="button" onClick={() => setRetry(value => value + 1)} className="button-secondary mt-4 min-h-11">Try again</button>
    </div> : !summaries.length ? <div className="rounded-xl bg-canvas p-5 text-center">
      <Car className="mx-auto h-8 w-8 text-muted" aria-hidden="true" /><p className="mt-3 font-medium text-ink">No vehicles found</p><p className="mt-1 text-sm text-muted">Add a vehicle to start tracking service expenses.</p>
    </div> : <div className="space-y-5">
      <div className="flex items-center gap-3 rounded-xl border border-line bg-canvas p-4">
        <PhilippinePeso className="h-6 w-6 shrink-0 text-accent" aria-hidden="true" />
        <div className="min-w-0"><p className="text-sm text-muted">Total recorded maintenance cost · all time</p><p className="mt-1 break-words text-2xl font-semibold text-ink">{formatCurrencyPHP(summaries.reduce((sum, item) => sum + item.totalCost, 0))}</p></div>
      </div>
      {summaries.length > 1 && <div className="flex flex-wrap gap-2" aria-label="Choose a vehicle">
        {summaries.map(item => <button type="button" key={item.id} onClick={() => setSelectedId(item.id)} aria-pressed={item.id === selectedId} className={`min-h-11 rounded-lg border px-3 py-2 text-left text-sm font-medium ${item.id === selectedId ? 'border-accent bg-accentSoft text-accent' : 'border-line text-ink hover:bg-canvas'}`}>{item.label}</button>)}
      </div>}
      {selected && <section className="space-y-4" aria-label={`Service details for ${selected.label}`}>
        <h3 className="break-words font-semibold text-ink">{selected.label}</h3>
        <dl className="grid gap-3 sm:grid-cols-3">
          {[['Services', selected.totalRecords], ['Total cost', formatCurrencyPHP(selected.totalCost)], ['Last service', selected.lastService ? displayDate(selected.lastService) : 'None recorded']].map(([label, value]) => <div key={label} className="min-w-0 rounded-lg border border-line p-3"><dt className="text-xs text-muted">{label}</dt><dd className="mt-1 break-words text-base font-semibold text-ink">{value}</dd></div>)}
        </dl>
        <h4 className="text-sm font-semibold text-ink">Recent services</h4>
        {selected.recentServices.length ? <ul className="divide-y divide-line">
          {selected.recentServices.map((service, index) => <li key={index} className="flex flex-wrap items-start justify-between gap-3 py-3">
            <div className="flex min-w-0 items-start gap-3"><Wrench className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" /><div className="min-w-0"><p className="break-words text-sm font-medium text-ink">{service.serviceType}</p><p className="mt-1 text-xs text-muted">{displayDate(service.serviceDate)}</p></div></div><span className="text-sm font-semibold text-ink">{formatCurrencyPHP(service.cost)}</span>
          </li>)}
        </ul> : <p className="text-sm text-muted">No service records yet.</p>}
      </section>}
    </div>}
  </Dialog>;
}
