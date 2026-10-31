import { Button } from '@/components/ui';
export default function VehicleNotFound() {
  return <main className="application-workspace space-y-4 py-8"><h1 className="text-2xl font-semibold text-ink">Vehicle not found</h1><p className="text-muted">This vehicle is unavailable or is not in your garage.</p><Button href="/vehicles">Back to My Garage</Button></main>;
}
