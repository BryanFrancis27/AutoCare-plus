import { PageHeader } from '@/components/layout';
import { getVehicleById } from '@/app/actions/vehicles';
import { AddMaintenanceForm } from './AddMaintenanceForm';
export default async function AddMaintenancePage({ params }: { params: { vehicleId: string } }) {
  const { data: vehicle, error } = await getVehicleById(params.vehicleId);
  return <main className="application-workspace space-y-6"><PageHeader title="Log Maintenance" description="Record a completed service or maintenance task" />{error || !vehicle ? <p role="alert">Vehicle could not be loaded. Return to My Garage and try again.</p> : <AddMaintenanceForm vehicleId={vehicle.id} vehicle={{ id: vehicle.id, label: [vehicle.year, vehicle.make, vehicle.model, vehicle.plate_number].filter(Boolean).join(' '), currentMileage: vehicle.current_mileage }} />}</main>;
}
