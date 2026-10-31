import { notFound } from 'next/navigation';
import { getVehicleById } from '@/app/actions/vehicles';
import { getVehicleOverview } from '../../../../services/vehicleService';
import { VehicleDetailsClient } from '@/components/vehicles/VehicleDetailsClient';
import { VehicleReadError } from '@/components/vehicles/VehicleReadError';

type Props = { params: { vehicleId: string } };
export default async function VehicleDetailsPage({ params }: Props) {
  const result = await getVehicleById(params.vehicleId);
  if ('status' in result && result.status === 'missing') notFound();
  if (result.error || !result.data) return <VehicleReadError />;
  const overview = await getVehicleOverview(result.data.id);
  return <VehicleDetailsClient vehicle={result.data} {...overview} />;
}
