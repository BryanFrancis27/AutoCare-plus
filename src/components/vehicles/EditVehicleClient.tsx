'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Car, Gauge, CalendarDays, Camera, Save, Circle, Check } from 'lucide-react';
import { Dialog } from '@/components/ui/Dialog';
import { useNavigationGuard } from '@/components/layout/NavigationGuard';
import { classificationLabel, formatRecordedMileage, vehicleIdentity, type GarageVehicle } from '@/lib/vehicles/garage-model';
import { STEP_FIELDS } from '@/lib/vehicles/vehicle-model';
import { useVehicleForm } from '@/lib/vehicles/use-vehicle-form';
import { VehicleFormFields } from './VehicleFormFields';
import { VehiclePhotoField } from './VehiclePhotoField';

function EditorSection({ title, description, icon, children }: { title: string; description: string; icon: ReactNode; children: ReactNode }) {
  return <section className="card min-w-0 p-4 sm:p-6">
    <div className="mb-6 flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-line bg-canvas text-muted">{icon}</span><div className="min-w-0"><h2 className="text-lg font-semibold text-ink">{title}</h2><p className="mt-1 text-sm leading-5 text-muted">{description}</p></div></div>
    {children}
  </section>;
}
export function EditVehicleClient({ vehicle }: { vehicle: GarageVehicle }) {
  const router = useRouter();
  const navigation = useNavigationGuard();
  const confirmed = useRef(false);
  const pendingNavigation = useRef<(() => void) | null>(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const editor = useRef<HTMLFormElement>(null);
  const errorSummary = useRef<HTMLDivElement>(null);
  const controller = useVehicleForm({ vehicle, onSaved: saved => {
    confirmed.current = true;
    router.push(`/vehicles/${saved.id}?saved=1`);
  } });
  const { form, dirty, blocked, saving, processing, retry, message } = controller;
  const detailUrl = `/vehicles/${vehicle.id}`;
  const draftIdentity = [form.year, form.make.trim(), form.model.trim()].filter(Boolean).join(' ') || 'Your vehicle';
  const validMileage = /^\d+(\.\d+)?$/.test(form.currentMileage) ? Number(form.currentMileage) : null;
  const status = saving ? 'Saving changes...' : controller.processing ? 'Preparing photo...' : dirty ? 'Unsaved changes' : 'No unsaved changes';

  function requestLeave(navigate: () => void) {
    if (controller.isBusy()) return;
    if (!confirmed.current && dirty) {
      pendingNavigation.current = navigate;
      setConfirmDiscard(true);
    } else navigate();
  }
  useEffect(() => navigation.register(requestLeave));
  useEffect(() => {
    if (!dirty && !saving && !processing) return;
    const warn = (event: BeforeUnloadEvent) => {
      if (confirmed.current) return;
      event.preventDefault(); event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty, saving, processing]);
  async function save() {
    if (controller.isBusy()) return;
    await controller.submit();
    requestAnimationFrame(() => {
      const invalid = editor.current?.querySelector<HTMLElement>('[aria-invalid="true"]');
      if (invalid) invalid.focus(); else errorSummary.current?.focus();
    });
  }
  function keepEditing() { pendingNavigation.current = null; setConfirmDiscard(false); }
  function discard() {
    if (controller.isBusy()) return;
    const navigate = pendingNavigation.current;
    pendingNavigation.current = null; setConfirmDiscard(false);
    // Only the destination changes. No Supabase write is performed on Cancel.
    if (navigate) navigate();
  }
  const saveButton = <button type="submit" form="vehicle-editor" disabled={blocked || (!dirty && !retry)} className="button-primary min-h-11 gap-2"><Save className="h-4 w-4" aria-hidden="true" />{saving ? 'Saving Changes...' : 'Save Changes'}</button>;
  const cancelButton = <button type="button" disabled={blocked} onClick={() => requestLeave(() => router.push(detailUrl))} className="button-secondary min-h-11">Cancel</button>;
  return <>
    <div className="application-workspace space-y-6 py-6 sm:py-8">
      <a href={detailUrl} onClick={event => { if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return; event.preventDefault(); requestLeave(() => router.push(detailUrl)); }} aria-disabled={blocked} className="inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-medium text-muted hover:bg-surfaceHover hover:text-ink"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Back to Vehicle Details</a>
      <header className="flex flex-wrap items-start justify-between gap-5">
        <div className="min-w-0"><p className="text-sm font-semibold uppercase tracking-wide text-muted">Vehicle workspace</p><h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">Edit Vehicle</h1><p className="mt-2 break-words font-medium text-ink">{vehicleIdentity(vehicle)}</p><p className="mt-1 max-w-prose text-sm leading-6 text-muted">Update your vehicle details in one place. Changes are saved when you choose Save Changes.</p></div>
        <div className="flex flex-wrap items-center gap-3">{cancelButton}{saveButton}</div>
      </header>
      <div role="status" aria-live="polite" className={`flex items-center gap-2 text-sm ${dirty ? 'text-caution' : 'text-muted'}`}>{dirty ? <Circle className="h-3 w-3 fill-current" aria-hidden="true" /> : <Check className="h-4 w-4" aria-hidden="true" />}{status}</div>
      <form id="vehicle-editor" ref={editor} noValidate aria-label="Edit vehicle" aria-busy={blocked} onSubmit={event => { event.preventDefault(); void save(); }} className="space-y-6">
        {message && <div ref={errorSummary} tabIndex={-1} role="alert" className="rounded-lg border border-accent bg-accentSoft p-4 text-sm text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">{message}</div>}
        <div className="vehicle-editor-grid">
          <div className="min-w-0 space-y-6">
            <EditorSection title="Basic Information" description="The details that identify your vehicle. Fields marked * are required." icon={<Car className="h-5 w-5" aria-hidden="true" />}><VehicleFormFields controller={controller} fields={STEP_FIELDS[0]} prefix="vehicle-edit" /></EditorSection>
            <EditorSection title="Technical Information" description="Powertrain, transmission and the current recorded odometer reading." icon={<Gauge className="h-5 w-5" aria-hidden="true" />}><VehicleFormFields controller={controller} fields={STEP_FIELDS[1]} prefix="vehicle-edit" /></EditorSection>
            <EditorSection title="Ownership Information" description="Optional purchase details and notes for your own records." icon={<CalendarDays className="h-5 w-5" aria-hidden="true" />}><VehicleFormFields controller={controller} fields={STEP_FIELDS[2]} prefix="vehicle-edit" /></EditorSection>
          </div>
          <div className="min-w-0 space-y-6">
            <EditorSection title="Vehicle Photo" description="Choose a clear photo to recognize your vehicle at a glance." icon={<Camera className="h-5 w-5" aria-hidden="true" />}><VehiclePhotoField controller={controller} name={draftIdentity} /></EditorSection>
            <section aria-labelledby="draft-summary-title" className="card min-w-0 p-4 sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Live draft preview</p><h2 id="draft-summary-title" className="mt-2 break-words text-xl font-semibold text-ink">{draftIdentity}</h2><p className="mt-1 break-words text-sm text-muted">{form.licensePlate || 'License plate not recorded'}</p>
              <dl className="mt-5 grid gap-4 border-t border-line pt-5 text-sm"><div><dt className="text-muted">Recorded mileage</dt><dd className="mt-1 break-words font-medium text-ink">{formatRecordedMileage(validMileage)}</dd></div><div><dt className="text-muted">Vehicle type</dt><dd className="mt-1 break-words text-ink">{classificationLabel(form.vehicleType)}</dd></div><div><dt className="text-muted">Powertrain / transmission</dt><dd className="mt-1 break-words text-ink">{classificationLabel(form.powertrain)} / {form.transmission || 'Not recorded'}</dd></div><div><dt className="text-muted">Color</dt><dd className="mt-1 break-words text-ink">{form.color || 'Not recorded'}</dd></div></dl>
              <p className="mt-5 text-sm leading-5 text-muted">This preview reflects your entries. Saved information changes only after confirmation from the server.</p>
            </section>
          </div>
        </div>
        <footer className="sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-3 rounded-card border border-line bg-surface p-3 shadow-card sm:p-4">
          <p className="text-sm text-muted">{saving ? 'Please wait for saving to finish.' : dirty ? 'Your changes have not been saved.' : 'No changes to save.'}</p><div className="flex flex-wrap gap-3">{cancelButton}{saveButton}</div>
        </footer>
      </form>
    </div>
    <Dialog isOpen={confirmDiscard} onClose={keepEditing} title="Discard unsaved changes?">
      <p className="text-sm leading-6 text-muted">Your vehicle details and photo changes have not been saved. Discard them to leave this editor, or keep editing.</p>
      <div className="mt-6 flex flex-wrap justify-end gap-3"><button type="button" onClick={keepEditing} className="button-secondary min-h-11">Keep Editing</button><button type="button" onClick={discard} className="button-primary min-h-11">Discard Changes</button></div>
    </Dialog>
  </>;
}
