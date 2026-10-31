'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, LoadingState } from '@/components/ui';
import { getUserVehicles } from '@/app/actions/vehicles';
import { MaintenanceForm, type ServiceVehicle } from './MaintenanceForm';
export function LogMaintenanceModal({ isOpen, onClose, onSuccess, vehicle, title }: { isOpen: boolean; onClose: () => void; onSuccess?: () => void; vehicle?: ServiceVehicle | null; title?: string }) {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<ServiceVehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!isOpen || vehicle) return;
    let active = true; setLoading(true); setError(null);
    getUserVehicles().then(result => {
      if (!active) return;
      if (result.error || !result.data) throw new Error('Vehicles could not be loaded.');
      setVehicles(result.data.map(v => ({ id: v.id, label: [v.year, v.make, v.model, v.plate_number].filter(Boolean).join(' '), currentMileage: v.current_mileage })));
    }).catch(() => { if (active) setError('Vehicles could not be loaded. Please retry.'); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [isOpen, vehicle, attempt]);
  const close = () => { if (!pending) onClose(); };
  return <Dialog isOpen={isOpen} onClose={close} showCloseButton={!pending} title={title ?? 'Log Maintenance'} size="lg">
    {loading && !vehicle ? <LoadingState mode="inline" label="Loading vehicles..." /> : error && !vehicle ? <div role="alert"><p>{error}</p><button className="min-h-11 text-accent" onClick={() => setAttempt(v => v + 1)}>Retry</button></div> : <>
      {!(vehicle || vehicles.length) && <p className="mb-4 text-muted">Add a vehicle to record maintenance.</p>}
      {isOpen && <MaintenanceForm vehicles={vehicle ? [vehicle] : vehicles} vehicleId={vehicle?.id} onPendingChange={setPending} onCancel={close} onSuccess={() => { router.refresh(); onSuccess?.(); onClose(); }} />}
    </>}
  </Dialog>;
}
