'use client';

import { useEffect, useRef, useState } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import type { GarageVehicle } from '@/lib/vehicles/garage-model';
import { STEP_FIELDS, VEHICLE_STEPS, validateVehicleForm } from '@/lib/vehicles/vehicle-model';
import { useVehicleForm } from '@/lib/vehicles/use-vehicle-form';
import { VehicleFormFields } from './VehicleFormFields';
import { VehiclePhotoField } from './VehiclePhotoField';

type Props = { isOpen: boolean; onClose: () => void; onSaved?: (vehicle: GarageVehicle) => void };

// Creation retains its guided presentation; editing lives at the canonical route.
export function AddVehicleModal({ isOpen, onClose, onSaved }: Props) {
  const [step, setStep] = useState(0);
  const region = useRef<HTMLDivElement>(null);
  const controller = useVehicleForm({ enabled: isOpen, onSaved: vehicle => { onSaved?.(vehicle); onClose(); } });
  useEffect(() => { if (isOpen) setStep(0); }, [isOpen]);
  useEffect(() => { if (isOpen) region.current?.focus(); }, [step, isOpen]);
  function close() { if (!controller.isBusy()) onClose(); }
  function next() {
    if (controller.isBusy()) return;
    if (controller.validate(STEP_FIELDS[step])) setStep(previous => Math.min(previous + 1, 2));
    else requestAnimationFrame(() => region.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
  }
  async function submit() {
    if (controller.isBusy()) return;
    if (!controller.validate()) {
      // All steps are checked on Save, including values supplied by autofill.
      const errors = validateVehicleForm(controller.form);
      setStep(STEP_FIELDS.findIndex(fields => fields.some(field => errors[field])));
      requestAnimationFrame(() => region.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
      return;
    }
    await controller.submit();
  }
  return <Dialog isOpen={isOpen} onClose={close} title="Add Vehicle" size="xl" showCloseButton={!controller.blocked}>
    <div aria-busy={controller.blocked}>
      <ol aria-label="Vehicle setup progress" className="mb-6 grid gap-2 sm:grid-cols-3">{VEHICLE_STEPS.map((label, index) => <li key={label} aria-current={step === index ? 'step' : undefined} className={`rounded-lg border p-3 text-sm ${step === index ? 'border-accent bg-accentSoft text-accent' : 'border-line text-muted'}`}>{index + 1}. {label}</li>)}</ol>
      <div ref={region} tabIndex={-1} className="rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">
        <h2 className="text-xl font-semibold text-ink">{VEHICLE_STEPS[step]}</h2>
        <p className="mt-1 text-sm text-muted">Step {step + 1} of 3. Fields marked * are required. Your entries stay with you between steps.</p>
        {controller.message && <p role="alert" className="mt-4 rounded-lg border border-accent bg-accentSoft p-3 text-sm text-accent">{controller.message}</p>}
        <form noValidate onSubmit={event => { event.preventDefault(); if (step < 2) next(); else void submit(); }} className="mt-5 space-y-5">
          <VehicleFormFields controller={controller} fields={STEP_FIELDS[step]} prefix="vehicle-create" />
          {step === 2 && <section aria-label="Vehicle photograph"><VehiclePhotoField controller={controller} name="your vehicle" /></section>}
          <div className="flex flex-wrap justify-between gap-3 border-t border-line pt-5">
            <button type="button" onClick={close} disabled={controller.blocked} className="button-secondary min-h-11">Cancel</button>
            <div className="flex flex-wrap gap-3">
              {step > 0 && <button type="button" onClick={() => { if (!controller.isBusy()) setStep(step - 1); }} disabled={controller.blocked} className="button-secondary min-h-11">Back</button>}
              <button type="submit" disabled={controller.blocked} className="button-primary min-h-11">{controller.saving ? 'Saving vehicle...' : step < 2 ? 'Next' : 'Add Vehicle'}</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  </Dialog>;
}
