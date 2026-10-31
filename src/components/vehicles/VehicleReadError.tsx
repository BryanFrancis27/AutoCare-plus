'use client';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { Button } from '@/components/ui';
export function VehicleReadError() {
  const router = useRouter();
  const [pending, start] = useTransition();
  return <main className="application-workspace space-y-4 py-8"><h1 className="text-2xl font-semibold text-ink">Vehicle unavailable</h1><p role="alert" className="text-muted">We could not load this vehicle. Check your connection and try again, or return to your garage.</p><div className="flex flex-wrap gap-3"><Button onClick={() => start(() => router.refresh())} disabled={pending}>{pending ? 'Reloading...' : 'Try again'}</Button><Button variant="secondary" href="/vehicles">Back to My Garage</Button></div></main>;
}
