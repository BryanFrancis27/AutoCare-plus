'use client';

import { VEHICLE_TYPE_OPTIONS, POWERTRAIN_OPTIONS } from '@/lib/maintenance';
import { VEHICLE_FIELD_LABELS, REQUIRED_VEHICLE_FIELDS, type VehicleFormData } from '@/lib/vehicles/vehicle-model';
import type { VehicleFormController } from '@/lib/vehicles/use-vehicle-form';

const choices: Partial<Record<keyof VehicleFormData, { value: string; label: string }[]>> = {
  vehicleType: VEHICLE_TYPE_OPTIONS, powertrain: POWERTRAIN_OPTIONS,
  transmission: ['Automatic', 'Manual', 'CVT', 'Semi-Automatic'].map(value => ({ value, label: value })),
};
export function VehicleFormFields({ controller, fields, prefix }: { controller: VehicleFormController; fields: (keyof VehicleFormData)[]; prefix: string }) {
  return <div className="grid min-w-0 gap-5 sm:grid-cols-2">
    {fields.map(field => {
      const id = `${prefix}-${field}`;
      const error = controller.errors[field];
      const options = choices[field];
      const shared = {
        id, name: field, value: controller.form[field], required: REQUIRED_VEHICLE_FIELDS.has(field), disabled: controller.blocked,
        'aria-invalid': Boolean(error), 'aria-describedby': [error ? `${id}-error` : '', field === 'currentMileage' ? `${id}-help` : ''].filter(Boolean).join(' ') || undefined,
        onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => controller.setField(field, event.target.value),
        className: `w-full min-w-0 rounded-lg border bg-surface px-3 py-3 text-ink focus:outline-none focus:ring-2 focus:ring-accent disabled:bg-canvas ${error ? 'border-accent' : 'border-controlBorder'}`,
      };
      return <div key={field} className={field === 'notes' ? 'min-w-0 sm:col-span-2' : 'min-w-0'}>
        <label htmlFor={id} className="mb-2 block text-sm font-medium text-ink">{VEHICLE_FIELD_LABELS[field]}{REQUIRED_VEHICLE_FIELDS.has(field) ? ' *' : <span className="font-normal text-muted"> (optional)</span>}</label>
        {options ? <select {...shared}><option value="">Select {VEHICLE_FIELD_LABELS[field].toLowerCase()}</option>{controller.form[field] && !options.some(option => option.value === controller.form[field]) && <option value={controller.form[field]}>{controller.form[field]}</option>}{options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select> : field === 'notes' ? <textarea {...shared} rows={4} /> : <input {...shared} type={field === 'purchaseDate' ? 'date' : 'text'} inputMode={['currentMileage', 'purchasePrice'].includes(field) ? 'decimal' : field === 'year' ? 'numeric' : undefined} />}
        {field === 'currentMileage' && <p id={`${id}-help`} className="mt-2 text-sm leading-5 text-muted">Use the recorded odometer value in kilometers. Zero is valid.</p>}
        {error && <p id={`${id}-error`} className="mt-2 text-sm text-accent">{error}</p>}
      </div>;
    })}
  </div>;
}
