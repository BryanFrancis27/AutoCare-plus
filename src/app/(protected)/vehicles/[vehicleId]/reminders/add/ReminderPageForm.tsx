'use client';
import { useRouter } from 'next/navigation';
import { ReminderForm } from '@/components/reminders/ReminderForm';
export function ReminderPageForm({ vehicleId, name }: { vehicleId: string; name: string }) {
  const router = useRouter();
  return <div className="card p-4 sm:p-6"><ReminderForm vehicleId={vehicleId} vehicleName={name} onCancel={() => router.push('/reminders')} onSuccess={() => router.push('/reminders?created=1')} /></div>;
}
