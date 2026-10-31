'use client';

import { useRef } from 'react';
import { Upload, RotateCcw, Trash2 } from 'lucide-react';
import { VehicleImage } from './VehicleImage';
import { VEHICLE_PHOTO_TYPES, VEHICLE_PHOTO_MAX_MB, VEHICLE_PHOTO_MAX_RAW_MB, type VehicleFormController } from '@/lib/vehicles/use-vehicle-form';

export function VehiclePhotoField({ controller, name }: { controller: VehicleFormController; name: string }) {
  const input = useRef<HTMLInputElement>(null);
  return <div className="space-y-4">
    <div className="overflow-hidden rounded-lg border border-line"><VehicleImage src={controller.preview} name={name} allowLocalPreview contained /></div>
    <p role="status" className={`text-sm ${controller.photoChanged ? 'text-caution' : 'text-muted'}`}>{controller.processing ? 'Preparing photo preview...' : controller.photoChanged ? controller.preview ? 'Replacement photo — not saved yet.' : 'Photo will be removed when you save.' : controller.preview ? 'Current saved photo' : 'No photo saved'}</p>
    <div className="flex flex-wrap gap-2">
      <button type="button" disabled={controller.blocked} className="button-secondary min-h-11 gap-2 text-sm" onClick={() => input.current?.click()}><Upload className="h-4 w-4" aria-hidden="true" />{controller.preview ? 'Replace Photo' : 'Choose Photo'}</button>
      {controller.preview && <button type="button" disabled={controller.blocked} className="button-secondary min-h-11 gap-2 text-sm" onClick={controller.removePhoto}><Trash2 className="h-4 w-4" aria-hidden="true" />Remove Photo</button>}
      {controller.photoChanged && <button type="button" disabled={controller.blocked} className="flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm text-muted hover:bg-canvas" onClick={controller.restorePhoto}><RotateCcw className="h-4 w-4" aria-hidden="true" />Undo Photo Change</button>}
    </div>
    <input ref={input} type="file" accept={VEHICLE_PHOTO_TYPES.join(',')} onChange={controller.choosePhoto} aria-label="Choose vehicle photo" className="sr-only" tabIndex={-1} disabled={controller.blocked} />
    <p className="text-sm leading-5 text-muted">JPEG, PNG, WebP or GIF. Up to {VEHICLE_PHOTO_MAX_RAW_MB} MB before compression, {VEHICLE_PHOTO_MAX_MB} MB after optimization.</p>
  </div>;
}
