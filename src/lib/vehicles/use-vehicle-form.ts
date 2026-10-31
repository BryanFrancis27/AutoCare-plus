'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createVehicle, updateVehicle, uploadVehicleImage } from '@/app/actions/vehicles';
import { optimizeImageForUpload } from '@/lib/vehicles/image-processing';
import type { GarageVehicle } from './garage-model';
import { confirmedVehicleSave, vehicleDraftIsDirty, vehicleFormValues, validateVehicleForm, vehicleSubmission, type VehicleFormData, type VehicleFormErrors } from './vehicle-model';

export const VEHICLE_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
export const VEHICLE_PHOTO_MAX_RAW_MB = Number(process.env.NEXT_PUBLIC_VEHICLE_IMAGE_RAW_MAX_SIZE_MB ?? 30);
export const VEHICLE_PHOTO_MAX_MB = Number(process.env.NEXT_PUBLIC_VEHICLE_IMAGE_MAX_SIZE_MB ?? 5);

type Options = { vehicle?: GarageVehicle; enabled?: boolean; onSaved: (vehicle: GarageVehicle) => void };

// State, validation, photos and persistence shared by two distinct presentations.
export function useVehicleForm({ vehicle, enabled = true, onSaved }: Options) {
  const router = useRouter();
  const [form, setForm] = useState(() => vehicleFormValues(vehicle));
  const [original, setOriginal] = useState(() => vehicleFormValues(vehicle));
  const [errors, setErrors] = useState<VehicleFormErrors>({});
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [retry, setRetry] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(vehicle?.image_url ?? null);
  const [removed, setRemoved] = useState(false);
  const busy = useRef(false);
  const processingRef = useRef(false);
  const completed = useRef(false);
  const mounted = useRef(true);
  const photoRequest = useRef<symbol | null>(null);
  const objectUrl = useRef<string | null>(null);
  const persistedVehicle = useRef(vehicle);
  const latestVehicle = useRef(vehicle);
  latestVehicle.current = vehicle;

  function releasePreview() {
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    objectUrl.current = null;
  }
  useEffect(() => {
    mounted.current = true;
    const current = latestVehicle.current;
    persistedVehicle.current = current;
    const values = vehicleFormValues(current);
    setForm(values); setOriginal(values); setErrors({}); setMessage(''); setRetry(false);
    setFile(null); setPreview(current?.image_url ?? null); setRemoved(false);
    busy.current = false; processingRef.current = false; completed.current = false;
    setSaving(false); setProcessing(false);
    return () => { mounted.current = false; photoRequest.current = null; releasePreview(); };
  }, [enabled, vehicle?.id]);

  const photoChanged = Boolean(file) || (removed && Boolean(persistedVehicle.current?.image_url));
  const dirty = vehicleDraftIsDirty(form, original, photoChanged);
  const blocked = saving || processing;
  function isBusy() { return busy.current || processingRef.current; }
  function setField(field: keyof VehicleFormData, value: string) {
    if (isBusy()) return;
    setForm(previous => ({ ...previous, [field]: value }));
    setErrors(previous => ({ ...previous, [field]: undefined }));
  }
  function validate(fields?: (keyof VehicleFormData)[]) {
    const all = validateVehicleForm(form);
    const next = fields ? Object.fromEntries(Object.entries(all).filter(([key]) => fields.includes(key as keyof VehicleFormData))) : all;
    setErrors(next);
    if (Object.keys(next).length) { setMessage('Please check the highlighted fields.'); return false; }
    setMessage(''); return true;
  }
  async function choosePhoto(event: React.ChangeEvent<HTMLInputElement>) {
    const chosen = event.target.files?.[0];
    event.target.value = '';
    if (!chosen || isBusy() || !enabled) return;
    if (!VEHICLE_PHOTO_TYPES.includes(chosen.type)) { setMessage('Choose a JPEG, PNG, WebP or GIF image.'); return; }
    if (chosen.size > VEHICLE_PHOTO_MAX_RAW_MB * 1024 * 1024) { setMessage(`Choose an image under ${VEHICLE_PHOTO_MAX_RAW_MB} MB before optimization.`); return; }
    const request = Symbol();
    photoRequest.current = request;
    processingRef.current = true; setProcessing(true); setMessage('');
    try {
      const optimized = await optimizeImageForUpload(chosen);
      if (!mounted.current || request !== photoRequest.current) return;
      if (optimized.size > VEHICLE_PHOTO_MAX_MB * 1024 * 1024) throw new Error();
      releasePreview();
      objectUrl.current = URL.createObjectURL(optimized);
      setFile(optimized); setPreview(objectUrl.current); setRemoved(false);
    } catch {
      if (mounted.current && request === photoRequest.current) setMessage('Could not process this photo. Choose a smaller JPEG, PNG, WebP or GIF image.');
    } finally {
      if (mounted.current && request === photoRequest.current) { processingRef.current = false; setProcessing(false); }
    }
  }
  function removePhoto() {
    if (isBusy()) return;
    releasePreview(); setFile(null); setPreview(null); setRemoved(true);
  }
  function restorePhoto() {
    if (isBusy()) return;
    releasePreview(); setFile(null); setPreview(persistedVehicle.current?.image_url ?? null); setRemoved(false);
  }
  async function submit() {
    if (!enabled || isBusy() || completed.current || (vehicle && !dirty && !retry) || !validate()) return;
    busy.current = true; setSaving(true); setMessage('');
    let uploading = false;
    try {
      const current = persistedVehicle.current;
      let imageUrl = removed ? null : current?.image_url;
      if (file) {
        uploading = true;
        const body = new FormData(); body.set('file', file);
        const upload = await uploadVehicleImage(body);
        if (upload.error || !upload.data?.displayUrl) throw new Error();
        imageUrl = upload.data.displayUrl;
        uploading = false;
      }
      const payload = { ...vehicleSubmission(form), imageUrl };
      const saved = await confirmedVehicleSave(() => current ? updateVehicle({ ...payload, id: current.id }) : createVehicle(payload));
      if (!mounted.current) return;
      completed.current = true;
      releasePreview(); setFile(null); setRemoved(false); setPreview(saved.image_url ?? null);
      const values = vehicleFormValues(saved);
      persistedVehicle.current = saved; setForm(values); setOriginal(values); setRetry(false);
      router.refresh();
      onSaved(saved);
    } catch {
      if (!mounted.current) return;
      setRetry(true);
      setMessage(uploading
        ? 'The photo could not be uploaded. Your entries are retained. Retry, choose another photo, or remove the photo to save without it.'
        : 'We could not save this vehicle. It may no longer be available. Your entries are retained; please try again.');
    } finally {
      busy.current = false;
      if (mounted.current) setSaving(false);
    }
  }
  return { form, errors, message, saving, processing, blocked, dirty, retry, photoChanged, preview,
    isBusy, setField, validate, choosePhoto, removePhoto, restorePhoto, submit };
}

export type VehicleFormController = ReturnType<typeof useVehicleForm>;
