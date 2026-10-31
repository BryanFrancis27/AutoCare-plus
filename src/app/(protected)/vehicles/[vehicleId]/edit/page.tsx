import { notFound } from 'next/navigation';
import { getVehicleById } from '@/app/actions/vehicles';
import { EditVehicleClient } from '@/components/vehicles/EditVehicleClient';
import { VehicleReadError } from '@/components/vehicles/VehicleReadError';
export default async function EditVehiclePage({ params }: { params: { vehicleId: string } }) {
  const result = await getVehicleById(params.vehicleId);
  if ('status' in result && result.status === 'missing') notFound();
  if (result.error || !result.data) return <VehicleReadError />;
  return <EditVehicleClient key={result.data.id} vehicle={result.data} />;
}
