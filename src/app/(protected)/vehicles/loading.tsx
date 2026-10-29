import { LoadingState } from '@/components/ui';

export default function GarageLoading() {
  return <div className="application-workspace space-y-6 py-6 sm:py-8">
    <h1 className="text-2xl font-semibold text-ink sm:text-3xl">My Garage</h1>
    <LoadingState mode="container" label="Loading your vehicles..." />
  </div>;
}
