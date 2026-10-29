'use client';

import { Car, Wrench, Bell, Plus, ArrowRight } from 'lucide-react';

const steps = [
  { icon: Car, title: 'Add your first vehicle', description: 'Keep its details together in your personal garage.' },
  { icon: Wrench, title: 'Track maintenance and service history', description: 'Record services, mileage and costs as they happen.' },
  { icon: Bell, title: 'Stay informed about upcoming maintenance', description: 'Set reminders for service dates and mileage milestones.' },
];
export function DashboardOnboarding({ onAdd }: { onAdd: () => void }) {
  return <section className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card" aria-labelledby="onboarding-title">
    <div className="grid gap-6 p-6 sm:p-8 xl:grid-cols-[1.3fr_1fr] xl:items-center">
      <div>
        <span className="inline-flex items-center gap-2 rounded-full bg-accentSoft px-3 py-1 text-sm leading-5 font-semibold text-accent"><Car className="h-4 w-4" aria-hidden="true" />Your garage starts here</span>
        <h2 id="onboarding-title" className="mt-5 max-w-xl text-2xl font-semibold tracking-tight text-ink sm:text-3xl">A little care. More peace of mind.</h2>
        <p className="mt-3 max-w-lg text-base leading-relaxed text-muted">Bring your vehicle details, service history and maintenance reminders together. Start with the vehicle you drive.</p>
        <button type="button" onClick={onAdd} className="button-primary mt-6 min-h-12 gap-2"><Plus className="h-5 w-5" aria-hidden="true" />Add Your First Vehicle<ArrowRight className="h-4 w-4" aria-hidden="true" /></button>
        <p className="mt-3 text-sm leading-5 text-muted">Add a vehicle first to log maintenance or set a reminder.</p>
      </div>
      <ol className="space-y-3 rounded-xl bg-canvas p-4 sm:p-5" aria-label="Getting started">
        {steps.map(({ icon: Icon, title, description }, index) => <li key={title} className="flex gap-3 rounded-lg border border-line bg-surface px-4 py-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accentSoft text-accent"><Icon className="h-5 w-5" aria-hidden="true" /></div>
          <div><p className="text-sm leading-5 font-medium text-muted">Step {index + 1}</p><h3 className="mt-1 text-sm font-semibold text-ink">{title}</h3><p className="mt-1 text-sm text-muted">{description}</p></div>
        </li>)}
      </ol>
    </div>
  </section>;
}
