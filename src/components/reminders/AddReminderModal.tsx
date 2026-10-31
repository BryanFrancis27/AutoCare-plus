'use client';
import { useState } from 'react';
import { Dialog } from '@/components/ui';
import { ReminderForm } from './ReminderForm';
export function AddReminderModal({ isOpen, onClose, vehicleId, vehicleName, onSuccess }: { isOpen: boolean; onClose: () => void; vehicleId: string; vehicleName?: string; onSuccess?: () => void }) {
  const [pending, setPending] = useState(false);
  const close = () => { if (!pending) onClose(); };
  return <Dialog isOpen={isOpen} onClose={close} showCloseButton={!pending} title="Add Reminder" size="lg">{isOpen && <ReminderForm key={vehicleId} vehicleId={vehicleId} vehicleName={vehicleName} onPendingChange={setPending} onCancel={close} onSuccess={() => { onSuccess?.(); onClose(); }} />}</Dialog>;
}
