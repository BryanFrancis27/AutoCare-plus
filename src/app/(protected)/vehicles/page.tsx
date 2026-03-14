import { getUserVehicles } from '@/app/actions/vehicles';
import { VehiclesListClient } from '@/components/vehicles/VehiclesListClient';

export const dynamic = 'force-dynamic';

export default async function VehiclesListPage() {
  const { data, error } = await getUserVehicles();
  const vehicles = data ?? [];

  return <VehiclesListClient vehicles={vehicles} error={error} />;
}
