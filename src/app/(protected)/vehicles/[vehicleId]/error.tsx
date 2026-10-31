'use client';
import { Button } from '@/components/ui';
export default function VehicleError({ reset }: { reset: () => void; error: Error & { digest?: string } }) {
  return <main className="application-workspace space-y-4 py-8"><h1 className="text-2xl font-semibold text-ink">Vehicle unavailable</h1><p role="alert" className="text-muted">We could not load this vehicle. Please try again.</p><div className="flex flex-wrap gap-3"><Button onClick={reset}>Try again</Button><Button variant="secondary" href="/vehicles">Back to My Garage</Button></div></main>;
}
